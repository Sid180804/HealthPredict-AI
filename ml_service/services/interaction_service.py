"""
Medicine Interaction Checker Service
Checks drug-drug, drug-food, and drug-condition interactions.
Uses a curated knowledge base + Gemini AI for complex lookups.
"""
import os, json, re, requests

GEMINI_KEY = os.getenv('GEMINI_API_KEY', '')

# ── Curated interaction database ──────────────────────────────────────
INTERACTIONS = [
    # Drug-Drug
    {'drugs': ['warfarin', 'aspirin'],          'severity': 'high',    'warning': 'Increased risk of bleeding. Both are blood thinners — combining them significantly raises haemorrhage risk.', 'category': 'drug-drug'},
    {'drugs': ['metformin', 'alcohol'],          'severity': 'high',    'warning': 'Risk of lactic acidosis. Alcohol impairs the liver and can dangerously lower blood sugar.', 'category': 'drug-food'},
    {'drugs': ['ibuprofen', 'aspirin'],          'severity': 'moderate','warning': 'Ibuprofen may reduce the cardioprotective effect of aspirin. Take ibuprofen at least 30 min after aspirin.', 'category': 'drug-drug'},
    {'drugs': ['paracetamol', 'alcohol'],        'severity': 'high',    'warning': 'Severe liver damage risk. Alcohol + paracetamol is a leading cause of liver failure.', 'category': 'drug-food'},
    {'drugs': ['ciprofloxacin', 'dairy'],        'severity': 'moderate','warning': 'Calcium in dairy binds to ciprofloxacin, reducing absorption by up to 40%. Take 2 hours apart.', 'category': 'drug-food'},
    {'drugs': ['amoxicillin', 'methotrexate'],   'severity': 'high',    'warning': 'Amoxicillin can reduce methotrexate excretion, increasing toxicity risk.', 'category': 'drug-drug'},
    {'drugs': ['lisinopril', 'potassium'],       'severity': 'moderate','warning': 'ACE inhibitors + potassium supplements can cause dangerously high potassium (hyperkalemia).', 'category': 'drug-food'},
    {'drugs': ['simvastatin', 'grapefruit'],     'severity': 'moderate','warning': 'Grapefruit inhibits CYP3A4, increasing statin levels and risk of muscle breakdown (rhabdomyolysis).', 'category': 'drug-food'},
    {'drugs': ['metronidazole', 'alcohol'],      'severity': 'high',    'warning': 'Disulfiram-like reaction: severe nausea, vomiting, flushing, headache. Avoid alcohol for 48 hrs after last dose.', 'category': 'drug-food'},
    {'drugs': ['ssri', 'tramadol'],              'severity': 'high',    'warning': 'Risk of serotonin syndrome — potentially life-threatening. Symptoms: agitation, tremor, hyperthermia.', 'category': 'drug-drug'},
    {'drugs': ['fluoxetine', 'tramadol'],        'severity': 'high',    'warning': 'Risk of serotonin syndrome. Both increase serotonin levels.', 'category': 'drug-drug'},
    {'drugs': ['omeprazole', 'clopidogrel'],     'severity': 'high',    'warning': 'Omeprazole reduces clopidogrel activation. Use pantoprazole instead if a PPI is needed.', 'category': 'drug-drug'},
    {'drugs': ['tetracycline', 'antacid'],       'severity': 'moderate','warning': 'Antacids reduce tetracycline absorption. Separate doses by at least 2 hours.', 'category': 'drug-drug'},
    {'drugs': ['tetracycline', 'dairy'],         'severity': 'moderate','warning': 'Calcium in dairy chelates tetracycline, reducing absorption significantly.', 'category': 'drug-food'},
    {'drugs': ['iron', 'calcium'],               'severity': 'moderate','warning': 'Calcium inhibits iron absorption. Take them at least 2 hours apart.', 'category': 'drug-drug'},
    {'drugs': ['iron', 'tea'],                   'severity': 'low',     'warning': 'Tannins in tea can reduce iron absorption. Take iron 1 hour before or 2 hours after tea.', 'category': 'drug-food'},
    {'drugs': ['blood thinner', 'vitamin k'],    'severity': 'moderate','warning': 'Vitamin K counteracts blood thinners like warfarin. Maintain consistent vitamin K intake.', 'category': 'drug-food'},
    {'drugs': ['amlodipine', 'simvastatin'],     'severity': 'moderate','warning': 'Amlodipine increases simvastatin levels. Max simvastatin dose should be 20mg with amlodipine.', 'category': 'drug-drug'},
    {'drugs': ['lithium', 'ibuprofen'],          'severity': 'high',    'warning': 'NSAIDs reduce lithium excretion, leading to toxicity. Monitor lithium levels closely.', 'category': 'drug-drug'},
    {'drugs': ['diazepam', 'alcohol'],           'severity': 'high',    'warning': 'Both are CNS depressants. Combined use can cause respiratory depression, coma, or death.', 'category': 'drug-food'},
    {'drugs': ['digoxin', 'amiodarone'],         'severity': 'high',    'warning': 'Amiodarone increases digoxin levels by 70-100%. Reduce digoxin dose by 50%.', 'category': 'drug-drug'},
    {'drugs': ['metformin', 'contrast dye'],     'severity': 'high',    'warning': 'Iodinated contrast with metformin can cause lactic acidosis. Stop metformin 48 hrs before contrast procedures.', 'category': 'drug-drug'},
]

# Aliases for common brand/generic name matching
ALIASES = {
    'crocin': 'paracetamol', 'dolo': 'paracetamol', 'tylenol': 'paracetamol', 'acetaminophen': 'paracetamol',
    'advil': 'ibuprofen', 'brufen': 'ibuprofen', 'motrin': 'ibuprofen',
    'ecosprin': 'aspirin', 'disprin': 'aspirin',
    'augmentin': 'amoxicillin', 'mox': 'amoxicillin',
    'azithral': 'azithromycin', 'zithromax': 'azithromycin',
    'flagyl': 'metronidazole',
    'prozac': 'fluoxetine',
    'coumadin': 'warfarin',
    'glucophage': 'metformin',
    'lipitor': 'atorvastatin', 'atorvastatin': 'simvastatin',  # statin class
    'pantop': 'pantoprazole', 'prilosec': 'omeprazole',
    'norvasc': 'amlodipine', 'valium': 'diazepam',
    'milk': 'dairy', 'curd': 'dairy', 'yogurt': 'dairy', 'cheese': 'dairy',
    'wine': 'alcohol', 'beer': 'alcohol', 'whiskey': 'alcohol', 'vodka': 'alcohol', 'rum': 'alcohol',
    'green tea': 'tea', 'black tea': 'tea',
    'vitamin c': 'ascorbic acid', 'folic acid': 'folate',
}


def _normalize(name):
    name = name.strip().lower()
    name = re.sub(r'\s*\d+\s*mg\s*', '', name)  # remove dosage
    name = re.sub(r'\s+', ' ', name).strip()
    return ALIASES.get(name, name)


def check_interactions(medicines):
    """
    medicines: list of medicine name strings
    Returns: list of interaction warnings
    """
    normalized = [_normalize(m) for m in medicines]
    results = []
    checked_pairs = set()

    for i, med1 in enumerate(normalized):
        for j, med2 in enumerate(normalized):
            if i >= j:
                continue
            pair_key = tuple(sorted([med1, med2]))
            if pair_key in checked_pairs:
                continue
            checked_pairs.add(pair_key)

            for interaction in INTERACTIONS:
                drug_set = set(interaction['drugs'])
                if med1 in drug_set and med2 in drug_set:
                    results.append({
                        'medicine_1': medicines[i],
                        'medicine_2': medicines[j],
                        'severity': interaction['severity'],
                        'warning': interaction['warning'],
                        'category': interaction['category'],
                    })

    if not results:
        results.append({
            'medicine_1': None,
            'medicine_2': None,
            'severity': 'safe',
            'warning': 'No known interactions found between the entered medicines.',
            'category': 'info',
        })

    return results


def ai_check_interactions(medicines):
    """
    Uses Gemini for complex interaction analysis beyond the curated DB.
    Falls back to curated DB if Gemini unavailable.
    """
    # First get curated results
    curated = check_interactions(medicines)

    # Then try AI for more analysis
    if not GEMINI_KEY:
        return curated

    try:
        prompt = f"""You are a clinical pharmacist AI. Analyze these medicines for interactions:

Medicines: {', '.join(medicines)}

For each pair, check:
1. Drug-drug interactions
2. Common food interactions
3. Timing conflicts

Return JSON array:
[{{
  "medicine_1": "name",
  "medicine_2": "name or food",
  "severity": "high|moderate|low|safe",
  "warning": "brief clinical explanation",
  "category": "drug-drug|drug-food|drug-condition"
}}]

Only return significant clinical interactions. If all safe, return empty array [].
Return ONLY the JSON array, no other text."""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}"
        resp = requests.post(url, json={
            'contents': [{'parts': [{'text': prompt}]}],
            'generationConfig': {'temperature': 0.2, 'maxOutputTokens': 1024},
        }, timeout=15)

        if resp.status_code == 200:
            text = resp.json()['candidates'][0]['content']['parts'][0]['text']
            text = text.strip()
            if text.startswith('```'):
                text = re.sub(r'^```(?:json)?\s*', '', text)
                text = re.sub(r'\s*```$', '', text)
            ai_results = json.loads(text)
            if ai_results:
                # merge with curated, avoiding duplicates
                seen = set()
                for r in curated:
                    if r['severity'] != 'safe':
                        seen.add((r.get('medicine_1',''), r.get('medicine_2','')))

                for r in ai_results:
                    key = (r.get('medicine_1',''), r.get('medicine_2',''))
                    if key not in seen:
                        curated.append(r)
                        seen.add(key)

                # remove the "no interactions" entry if we found AI results
                curated = [r for r in curated if r['severity'] != 'safe']

        return curated

    except Exception:
        return curated
