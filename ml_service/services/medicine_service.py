"""
Medicine Recommendation Service
Provides personalized medicine recommendations based on disease, user profile, and medical history.
This service can be enhanced with real drug databases and interaction checkers.
"""

import json
import os

# Load medicine mapping
MEDS_PATH = os.path.join(os.path.dirname(__file__), "..", "utils", "disease_to_meds.json")

if os.path.exists(MEDS_PATH):
    with open(MEDS_PATH, "r") as f:
        DISEASE_TO_MEDS_BASE = json.load(f)
else:
    DISEASE_TO_MEDS_BASE = {}


def calculate_dosage(medicine_name, base_dosage, user_profile):
    """
    Calculate personalized dosage based on age, weight, and conditions.
    
    Args:
        medicine_name: Name of the medicine
        base_dosage: Base dosage string (e.g., "500mg")
        user_profile: User profile dict
        
    Returns:
        str: Adjusted dosage recommendation
    """
    if not user_profile:
        return base_dosage
    
    age = user_profile.get("age", 30)
    weight = user_profile.get("weight", 70)
    
    # Extract numeric value from dosage string
    try:
        dosage_value = int(''.join(filter(str.isdigit, base_dosage)))
    except:
        return base_dosage
    
    # Pediatric dosage (typically 50-75% of adult)
    if age < 12:
        if "Paracetamol" in medicine_name or "Acetaminophen" in medicine_name:
            # Pediatric paracetamol: 10-15mg/kg
            if weight:
                pediatric_dose = int(weight * 12)  # mg
                return f"{pediatric_dose}mg"
        return f"{int(dosage_value * 0.6)}mg (pediatric)"
    
    # Elderly dosage (may need reduction)
    if age > 65:
        if "Ibuprofen" in medicine_name:
            return f"{int(dosage_value * 0.75)}mg (elderly - reduced)"
        return base_dosage
    
    return base_dosage


def check_contraindications(medicine, user_profile):
    """
    Check if medicine has contraindications for the user.
    
    Args:
        medicine: Medicine dict
        user_profile: User profile dict
        
    Returns:
        list: List of warnings/contraindications
    """
    warnings = []
    
    if not user_profile:
        return warnings
    
    age = user_profile.get("age", 30)
    allergies = user_profile.get("allergies", [])
    conditions = user_profile.get("existing_conditions", [])
    is_smoker = user_profile.get("is_smoker", False)
    
    med_name = medicine.get("name", "").lower()
    
    # Age-based warnings
    if age < 18:
        if "aspirin" in med_name:
            warnings.append("Aspirin not recommended for children under 18")
        if "ibuprofen" in med_name and age < 6:
            warnings.append("Ibuprofen not recommended for children under 6")
    
    if age > 65:
        if "ibuprofen" in med_name:
            warnings.append("Use with caution in elderly - monitor kidney function")
    
    # Condition-based warnings
    if "diabetes" in conditions:
        if "corticosteroid" in med_name:
            warnings.append("May affect blood sugar levels - monitor glucose")
    
    if "hypertension" in conditions or "high blood pressure" in conditions:
        if "decongestant" in med_name or "pseudoephedrine" in med_name:
            warnings.append("May increase blood pressure - use with caution")
    
    if "asthma" in conditions:
        if "aspirin" in med_name or "nsaid" in med_name:
            warnings.append("May trigger asthma - consult doctor")
    
    if "kidney" in str(conditions).lower() or "renal" in str(conditions).lower():
        if "ibuprofen" in med_name or "nsaid" in med_name:
            warnings.append("Avoid if kidney disease - can cause further damage")
    
    # Allergy checks
    for allergy in allergies:
        if allergy.lower() in med_name:
            warnings.append(f"CONTRANDICATED: Patient has allergy to {allergy}")
    
    # Smoking interactions
    if is_smoker:
        if "oral contraceptive" in med_name:
            warnings.append("Smoking increases risk of blood clots with oral contraceptives")
    
    return warnings


def get_medicines_for_disease(disease_name, user_profile=None):
    """
    Get personalized medicine recommendations for a disease.
    
    Args:
        disease_name: Name of the disease
        user_profile: Optional user profile for personalization
        
    Returns:
        list: List of medicine recommendations with dosages and warnings
    """
    base_meds = DISEASE_TO_MEDS_BASE.get(disease_name, [])
    
    if not base_meds:
        # Fallback medicines
        base_meds = [
            {
                "name": "Paracetamol",
                "dosage": "500mg",
                "frequency": "Every 6 hours as needed",
                "warning": "Do not exceed 4g per day"
            }
        ]
    
    personalized_meds = []
    
    for med in base_meds:
        # Calculate personalized dosage
        adjusted_dosage = calculate_dosage(
            med.get("name", ""),
            med.get("dosage", ""),
            user_profile
        )
        
        # Check contraindications
        contraindications = check_contraindications(med, user_profile)
        
        # Build medicine recommendation
        med_rec = {
            "name": med.get("name", ""),
            "dosage": adjusted_dosage,
            "frequency": med.get("frequency", ""),
            "warning": med.get("warning", ""),
            "contraindications": contraindications,
            "suitable": len(contraindications) == 0 or not any("CONTRANDICATED" in w for w in contraindications)
        }
        
        personalized_meds.append(med_rec)
    
    return personalized_meds
