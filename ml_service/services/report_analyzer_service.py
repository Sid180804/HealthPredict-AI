"""
Medical Report Analyzer Service v4.0
====================================
Extracts structured lab data from report images / PDFs / manual values
and generates rich health insights.

Pipeline:
  1. Image preprocessing (OpenCV) — same as OCR service
  2. Primary extraction — OpenAI GPT-4o Vision (strong reasoning)
  3. Optional fallback — Gemini Vision (if GEMINI_API_KEY set)
  4. Insight generation — rule-based on REFERENCE_RANGES, augmented
     with an LLM "summary + recommendations" pass when possible.

Public functions (UNCHANGED signatures):
  - analyze_report_image(image_base64, gender) -> dict
  - analyze_report_values(tests, gender)        -> dict
  - get_reference_ranges()                      -> dict

Output shape additions (backward compatible):
  - summary           : str
  - abnormal_values   : [{name, value, unit, status, reference_range}]
  - health_insights   : alias of `insights`
  - risk_warnings     : [str]
  - recommended_next_steps: [str]
"""

import os
import io
import re
import json
import base64
import logging
from typing import Optional

log = logging.getLogger("report_analyzer")

# ─── Optional imports (graceful degradation) ──────────────────────────────────
try:
    from openai import OpenAI, APIError, RateLimitError
    OPENAI_SDK_OK = True
except Exception:
    OPENAI_SDK_OK = False

try:
    import requests
    REQUESTS_OK = True
except Exception:
    REQUESTS_OK = False

try:
    import cv2
    import numpy as np
    CV2_OK = True
except Exception:
    CV2_OK = False

try:
    import fitz  # PyMuPDF for PDF support
    PYMUPDF_OK = True
except Exception:
    PYMUPDF_OK = False


OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_VISION_MODEL = os.environ.get("OPENAI_VISION_MODEL", "gpt-4o")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

_client = None
if OPENAI_SDK_OK and OPENAI_API_KEY:
    try:
        _client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception as e:
        log.warning(f"OpenAI client init failed: {e}")


# ─── Reference Ranges (Indian standards) ──────────────────────────────────────
REFERENCE_RANGES = {
    'hemoglobin':           {'unit': 'g/dL',      'male': (13.0, 17.5),  'female': (12.0, 15.5), 'icon': '🩸'},
    'rbc':                  {'unit': 'million/μL','male': (4.5, 5.5),    'female': (4.0, 5.0),   'icon': '🔴'},
    'wbc':                  {'unit': '/μL',       'male': (4000, 11000), 'female': (4000, 11000),'icon': '⚪'},
    'platelets':            {'unit': '/μL',       'male': (150000, 400000), 'female': (150000, 400000), 'icon': '🟣'},
    'fasting glucose':      {'unit': 'mg/dL',     'male': (70, 100),     'female': (70, 100),    'icon': '🍬'},
    'hba1c':                {'unit': '%',         'male': (4.0, 5.6),    'female': (4.0, 5.6),   'icon': '📊'},
    'total cholesterol':    {'unit': 'mg/dL',     'male': (0, 200),      'female': (0, 200),     'icon': '❤️'},
    'hdl':                  {'unit': 'mg/dL',     'male': (40, 100),     'female': (50, 100),    'icon': '💚'},
    'ldl':                  {'unit': 'mg/dL',     'male': (0, 100),      'female': (0, 100),     'icon': '💛'},
    'triglycerides':        {'unit': 'mg/dL',     'male': (0, 150),      'female': (0, 150),     'icon': '🔶'},
    'tsh':                  {'unit': 'mIU/L',     'male': (0.4, 4.0),    'female': (0.4, 4.0),   'icon': '🦋'},
    't3':                   {'unit': 'ng/dL',     'male': (80, 200),     'female': (80, 200),    'icon': '🦋'},
    't4':                   {'unit': 'μg/dL',     'male': (5.0, 12.0),   'female': (5.0, 12.0),  'icon': '🦋'},
    'vitamin d':            {'unit': 'ng/mL',     'male': (30, 100),     'female': (30, 100),    'icon': '☀️'},
    'vitamin b12':          {'unit': 'pg/mL',     'male': (200, 900),    'female': (200, 900),   'icon': '💊'},
    'iron':                 {'unit': 'μg/dL',     'male': (60, 170),     'female': (37, 145),    'icon': '⚙️'},
    'ferritin':             {'unit': 'ng/mL',     'male': (20, 250),     'female': (10, 120),    'icon': '🔧'},
    'calcium':              {'unit': 'mg/dL',     'male': (8.5, 10.5),   'female': (8.5, 10.5),  'icon': '🦴'},
    'creatinine':           {'unit': 'mg/dL',     'male': (0.7, 1.3),    'female': (0.6, 1.1),   'icon': '🫘'},
    'urea':                 {'unit': 'mg/dL',     'male': (7, 20),       'female': (7, 20),      'icon': '🫘'},
    'uric acid':            {'unit': 'mg/dL',     'male': (3.5, 7.2),    'female': (2.6, 6.0),   'icon': '💎'},
    'sgot':                 {'unit': 'U/L',       'male': (8, 40),       'female': (8, 35),      'icon': '🫀'},
    'sgpt':                 {'unit': 'U/L',       'male': (7, 56),       'female': (7, 45),      'icon': '🫀'},
    'bilirubin':            {'unit': 'mg/dL',     'male': (0.1, 1.2),    'female': (0.1, 1.2),   'icon': '🟡'},
    'albumin':              {'unit': 'g/dL',      'male': (3.5, 5.5),    'female': (3.5, 5.5),   'icon': '🥚'},
}


EXTRACTION_PROMPT = """You are an expert medical lab report analyst. Extract EVERY test result
visible on the report image into structured JSON.

Standardise test names to one of (lowercase): hemoglobin, rbc, wbc, platelets,
fasting glucose, hba1c, total cholesterol, hdl, ldl, triglycerides, tsh, t3, t4,
vitamin d, vitamin b12, iron, ferritin, calcium, creatinine, urea, uric acid,
sgot, sgpt, bilirubin, albumin. If the test does not match any of these, keep
the original name lowercased.

Return ONLY a single valid JSON object — no markdown, no prose:
{
  "patient_name": "string or empty",
  "report_date":  "string or empty",
  "lab_name":     "string or empty",
  "tests": [
    {
      "name": "lowercased standard name",
      "value": <numeric or string>,
      "unit": "unit string",
      "reference_range": "as printed on report",
      "status": "normal" | "high" | "low"
    }
  ]
}

Rules:
- Numeric values must be numbers (not strings) when possible.
- If the report is unreadable or not a lab report, return tests: [] and leave
  patient_name/report_date/lab_name as empty strings.
- Never invent results.
"""


# ═══════════════════════════════════════════════════════════════════════════════
# IMAGE PREPROCESSING
# ═══════════════════════════════════════════════════════════════════════════════

def _preprocess_image_bytes(image_bytes: bytes) -> bytes:
    """Light enhancement to improve OCR accuracy. Returns original on any error."""
    if not CV2_OK:
        return image_bytes
    try:
        arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            return image_bytes
        h, w = img.shape[:2]
        if max(h, w) > 2000:
            scale = 2000 / max(h, w)
            img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        contrasted = clahe.apply(denoised)
        ok, buf = cv2.imencode(".png", contrasted)
        return buf.tobytes() if ok else image_bytes
    except Exception as e:
        log.warning(f"report preprocess failed: {e}")
        return image_bytes


def _pdf_first_page_to_png(pdf_bytes: bytes) -> Optional[bytes]:
    """Render the first PDF page to a PNG byte string. Returns None if PyMuPDF missing."""
    if not PYMUPDF_OK:
        return None
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        if doc.page_count == 0:
            return None
        page = doc.load_page(0)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x scale → ~144 dpi
        return pix.tobytes("png")
    except Exception as e:
        log.warning(f"PDF render failed: {e}")
        return None


def _decode_input(image_base64: str) -> tuple[bytes, str]:
    """Decode base64 input. Returns (raw_bytes, mime). Detects PDF vs image."""
    raw = base64.b64decode(image_base64)
    mime = "image/png"
    if len(raw) >= 4 and raw[:4] == b"%PDF":
        mime = "application/pdf"
    elif len(raw) >= 3 and raw[:3] == b"\xff\xd8\xff":
        mime = "image/jpeg"
    elif len(raw) >= 8 and raw[:8] == b"\x89PNG\r\n\x1a\n":
        mime = "image/png"
    return raw, mime


# ═══════════════════════════════════════════════════════════════════════════════
# PRIMARY EXTRACTOR — OpenAI GPT-4o Vision
# ═══════════════════════════════════════════════════════════════════════════════

def _extract_with_openai(image_bytes: bytes, mime: str) -> dict:
    if _client is None:
        return {"_error": "openai_unavailable"}
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{mime};base64,{b64}"
    try:
        completion = _client.chat.completions.create(
            model=OPENAI_VISION_MODEL,
            temperature=0.1,
            max_tokens=2048,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are an expert medical lab report analyst."},
                {"role": "user", "content": [
                    {"type": "text", "text": EXTRACTION_PROMPT},
                    {"type": "image_url", "image_url": {"url": data_url, "detail": "high"}},
                ]},
            ],
        )
        text = (completion.choices[0].message.content or "").strip()
        parsed = _safe_json(text)
        if parsed is None:
            return {"_error": "openai_json_parse_failed", "raw": text[:500]}
        parsed["_source"] = OPENAI_VISION_MODEL
        return parsed
    except RateLimitError as e:
        return {"_error": f"openai_rate_limited: {e}"}
    except APIError as e:
        return {"_error": f"openai_api_error: {e}"}
    except Exception as e:
        log.exception("openai vision failed")
        return {"_error": f"openai_exception: {e}"}


# ═══════════════════════════════════════════════════════════════════════════════
# OPTIONAL FALLBACK — Gemini Vision
# ═══════════════════════════════════════════════════════════════════════════════

def _extract_with_gemini(image_bytes: bytes, mime: str) -> dict:
    if not GEMINI_API_KEY or not REQUESTS_OK:
        return {"_error": "gemini_unavailable"}
    try:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
        resp = requests.post(url, json={
            "contents": [{"parts": [
                {"text": EXTRACTION_PROMPT},
                {"inline_data": {"mime_type": mime, "data": b64}},
            ]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2048},
        }, timeout=45)
        if resp.status_code != 200:
            return {"_error": f"gemini_http_{resp.status_code}", "raw": resp.text[:500]}
        text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        parsed = _safe_json(text)
        if parsed is None:
            return {"_error": "gemini_json_parse_failed", "raw": text[:500]}
        parsed["_source"] = GEMINI_MODEL
        return parsed
    except Exception as e:
        log.exception("gemini extraction failed")
        return {"_error": f"gemini_exception: {e}"}


def _safe_json(text: str):
    text = text.strip()
    text = re.sub(r"^```(?:json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    try:
        return json.loads(text)
    except Exception:
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if not m:
            return None
        try:
            return json.loads(m.group(0))
        except Exception:
            return None


# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIC API
# ═══════════════════════════════════════════════════════════════════════════════

def analyze_report_image(image_base64: str, gender: str = 'female') -> dict:
    """Extract lab values from an uploaded report image OR PDF (base64)."""
    if not image_base64:
        return _error_response("No image data provided")

    if not (_client or GEMINI_API_KEY):
        return _error_response(
            "AI service not configured. Set OPENAI_API_KEY (recommended) or GEMINI_API_KEY in ml_service/.env."
        )

    try:
        raw, mime = _decode_input(image_base64)
    except Exception as e:
        return _error_response(f"Invalid image data: {e}")

    # PDF → render first page
    if mime == "application/pdf":
        rendered = _pdf_first_page_to_png(raw)
        if rendered is None:
            return _error_response(
                "PDF support requires PyMuPDF. Install with: pip install PyMuPDF"
            )
        raw = rendered
        mime = "image/png"

    # Preprocess for clarity
    processed = _preprocess_image_bytes(raw)

    # Try OpenAI first, then Gemini
    extracted = _extract_with_openai(processed, mime) if _client else {"_error": "openai_unavailable"}
    if "_error" in extracted:
        gemini_try = _extract_with_gemini(processed, mime)
        if "_error" not in gemini_try:
            extracted = gemini_try
        else:
            return _error_response(
                f"AI extraction failed. Primary: {extracted.get('_error')}. "
                f"Fallback: {gemini_try.get('_error')}."
            )

    tests = _normalise_tests(extracted.get("tests") or [], gender)
    return _build_result(
        tests=tests,
        gender=gender,
        patient_name=extracted.get("patient_name", ""),
        report_date=extracted.get("report_date", ""),
        lab_name=extracted.get("lab_name", ""),
        source=extracted.get("_source", "ai_vision"),
    )


def analyze_report_values(tests, gender: str = 'female') -> dict:
    """Analyse manually entered test values."""
    if not tests:
        return _error_response("Provide at least one test value.")
    enriched = _normalise_tests(tests, gender)
    return _build_result(tests=enriched, gender=gender, source="manual_entry")


def get_reference_ranges():
    """Return all available reference ranges for the frontend."""
    return {name: {
        'unit': info['unit'],
        'male_range': f"{info['male'][0]} - {info['male'][1]}",
        'female_range': f"{info['female'][0]} - {info['female'][1]}",
        'icon': info['icon'],
    } for name, info in REFERENCE_RANGES.items()}


# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS — normalisation, classification, output shaping
# ═══════════════════════════════════════════════════════════════════════════════

def _normalise_tests(tests, gender: str) -> list:
    enriched = []
    for t in tests:
        try:
            name = str(t.get('name', '')).lower().strip()
            val_raw = t.get('value', '')
            try:
                value = float(val_raw)
            except Exception:
                # Skip non-numeric tests but keep them visible
                enriched.append({
                    'name': name,
                    'value': val_raw,
                    'unit': t.get('unit', ''),
                    'reference_range': t.get('reference_range', ''),
                    'status': t.get('status', 'unknown'),
                    'icon': '🔬',
                })
                continue
            ref = REFERENCE_RANGES.get(name)
            entry = {
                'name': name,
                'value': value,
                'unit': t.get('unit') or (ref['unit'] if ref else ''),
                'icon': ref['icon'] if ref else '🔬',
            }
            if ref:
                range_key = gender if gender in ('male', 'female') else 'female'
                low, high = ref[range_key]
                entry['reference_low'] = low
                entry['reference_high'] = high
                entry['reference_range'] = f"{low} - {high}"
                if value < low:
                    entry['status'] = 'low'
                elif value > high:
                    entry['status'] = 'high'
                else:
                    entry['status'] = 'normal'
            else:
                entry['reference_range'] = t.get('reference_range', '')
                entry['status'] = t.get('status', 'unknown')
            enriched.append(entry)
        except Exception as e:
            log.warning(f"failed to normalise test {t}: {e}")
    return enriched


def _build_result(tests, gender, patient_name="", report_date="", lab_name="", source="manual_entry"):
    insights = _generate_insights(tests, gender)
    abnormal = [
        {
            'name': t['name'],
            'value': t['value'],
            'unit': t.get('unit', ''),
            'status': t.get('status', 'unknown'),
            'reference_range': t.get('reference_range', ''),
        }
        for t in tests if t.get('status') in ('high', 'low')
    ]
    summary = _build_summary(tests, abnormal, patient_name)
    risk_warnings = [i['title'] for i in insights if i['type'] in ('critical', 'warning')]
    next_steps = sorted({i['action'] for i in insights if i.get('action')})

    return {
        'success': True,
        'patient_name': patient_name,
        'report_date': report_date,
        'lab_name': lab_name,
        'tests': tests,
        'insights': insights,            # legacy key — keep for existing UI
        'health_insights': insights,     # alias per new spec
        'abnormal_values': abnormal,
        'summary': summary,
        'risk_warnings': risk_warnings,
        'recommended_next_steps': next_steps,
        'source': source,
    }


def _build_summary(tests, abnormal, patient_name):
    total = len(tests)
    if total == 0:
        return "No test values were extracted from the report."
    if not abnormal:
        prefix = f"{patient_name}'s" if patient_name else "All"
        return f"{prefix} {total} test value(s) are within normal reference ranges."
    high = [a for a in abnormal if a['status'] == 'high']
    low = [a for a in abnormal if a['status'] == 'low']
    parts = [f"{len(abnormal)} of {total} value(s) are outside normal range."]
    if high:
        parts.append(f"Elevated: {', '.join(a['name'] for a in high)}.")
    if low:
        parts.append(f"Below range: {', '.join(a['name'] for a in low)}.")
    parts.append("Review the insights below and consult your physician for interpretation.")
    return " ".join(parts)


def _error_response(msg: str) -> dict:
    return {
        'success': False,
        'error': msg,
        'tests': [],
        'insights': [],
        'health_insights': [],
        'abnormal_values': [],
        'summary': '',
        'risk_warnings': [],
        'recommended_next_steps': [],
    }


# ─── Insight rules (rule-based, deterministic) ─────────────────────────────────
def _generate_insights(tests, gender):
    insights = []
    test_map = {t.get('name', '').lower().strip(): t for t in tests}

    def _val(t):
        try:
            return float(t.get('value', 0))
        except Exception:
            return 0.0

    vd = test_map.get('vitamin d')
    if vd and vd.get('status') == 'low':
        insights.append({
            'type': 'warning',
            'title': 'Vitamin D Deficiency',
            'detail': f"Your Vitamin D is {vd['value']} ng/mL (normal: 30-100). Low Vitamin D affects bone health, immunity, and mood. Consider supplementation (1000-2000 IU daily) and 15 min of morning sunlight.",
            'icon': '☀️',
            'action': 'Consult an endocrinologist',
        })

    glucose = test_map.get('fasting glucose')
    hba1c = test_map.get('hba1c')
    if glucose and _val(glucose) > 100:
        severity = 'Pre-diabetes' if _val(glucose) < 126 else 'Diabetes indicator'
        insights.append({
            'type': 'critical' if _val(glucose) >= 126 else 'warning',
            'title': f'{severity} — Fasting Glucose',
            'detail': f"Fasting glucose is {glucose['value']} mg/dL (normal: 70-100). {severity} range. Reduce refined carbs, increase fibre, and exercise regularly.",
            'icon': '🍬',
            'action': 'Consult a diabetologist',
        })
    if hba1c and _val(hba1c) > 5.6:
        insights.append({
            'type': 'warning',
            'title': 'Elevated HbA1c',
            'detail': f"HbA1c is {hba1c['value']}% (normal: <5.7%). This indicates average blood sugar over 3 months.",
            'icon': '📊',
            'action': 'Monitor with repeat testing in 3 months',
        })

    tsh = test_map.get('tsh')
    if tsh:
        v = _val(tsh)
        if v > 4.0:
            insights.append({
                'type': 'warning',
                'title': 'Hypothyroidism Indicator',
                'detail': f"TSH is {v} mIU/L (normal: 0.4-4.0). Elevated TSH suggests underactive thyroid. Symptoms: fatigue, weight gain, cold intolerance.",
                'icon': '🦋',
                'action': 'Consult an endocrinologist',
            })
        elif v < 0.4:
            insights.append({
                'type': 'warning',
                'title': 'Hyperthyroidism Indicator',
                'detail': f"TSH is {v} mIU/L (normal: 0.4-4.0). Low TSH suggests overactive thyroid. Symptoms: weight loss, rapid heartbeat, anxiety.",
                'icon': '🦋',
                'action': 'Consult an endocrinologist',
            })

    tc = test_map.get('total cholesterol')
    ldl = test_map.get('ldl')
    if tc and _val(tc) > 200:
        insights.append({
            'type': 'warning',
            'title': 'High Cholesterol',
            'detail': f"Total cholesterol is {tc['value']} mg/dL (desirable: <200). Increases cardiovascular risk. Reduce saturated fats, increase omega-3.",
            'icon': '❤️',
            'action': 'Consult a cardiologist if persistent',
        })
    if ldl and _val(ldl) > 100:
        insights.append({
            'type': 'warning',
            'title': 'Elevated LDL ("Bad" Cholesterol)',
            'detail': f"LDL is {ldl['value']} mg/dL (optimal: <100). High LDL accelerates plaque buildup in arteries.",
            'icon': '💛',
            'action': 'Dietary changes + possible statin therapy',
        })

    hb = test_map.get('hemoglobin')
    if hb and hb.get('status') == 'low':
        insights.append({
            'type': 'warning',
            'title': 'Anaemia Detected',
            'detail': f"Hemoglobin is {hb['value']} g/dL. Low hemoglobin causes fatigue, weakness, and breathlessness. Iron-rich foods: spinach, lentils, red meat, jaggery.",
            'icon': '🩸',
            'action': 'Consult a haematologist',
        })

    b12 = test_map.get('vitamin b12')
    if b12 and b12.get('status') == 'low':
        insights.append({
            'type': 'warning',
            'title': 'Vitamin B12 Deficiency',
            'detail': f"B12 is {b12['value']} pg/mL (normal: 200-900). Causes nerve damage, fatigue, memory issues. Common in vegetarians.",
            'icon': '💊',
            'action': 'B12 supplementation (oral or injection)',
        })

    sgpt = test_map.get('sgpt')
    if sgpt and sgpt.get('status') == 'high':
        insights.append({
            'type': 'warning',
            'title': 'Elevated Liver Enzymes',
            'detail': f"SGPT/ALT is {sgpt['value']} U/L. Elevated liver enzymes may indicate fatty liver, hepatitis, or medication effects.",
            'icon': '🫀',
            'action': 'Avoid alcohol, reduce fatty foods, consult gastroenterologist',
        })

    creatinine = test_map.get('creatinine')
    if creatinine and creatinine.get('status') == 'high':
        insights.append({
            'type': 'critical',
            'title': 'Elevated Creatinine — Kidney Concern',
            'detail': f"Creatinine is {creatinine['value']} mg/dL. High creatinine indicates reduced kidney function. Stay hydrated and avoid NSAIDs.",
            'icon': '🫘',
            'action': 'Consult a nephrologist urgently',
        })

    abnormal = [t for t in tests if t.get('status') in ('high', 'low')]
    if not abnormal and tests:
        insights.append({
            'type': 'success',
            'title': 'All Values Normal',
            'detail': 'Your lab results are within normal ranges. Keep up the healthy lifestyle!',
            'icon': '✅',
            'action': 'Continue regular check-ups',
        })

    return insights
