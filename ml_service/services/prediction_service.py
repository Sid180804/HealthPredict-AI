"""
Dynamic Disease Prediction Service v2.0
Loads trained ML ensemble model and predicts disease from symptoms.
Uses real 41-disease × 132-symptom dataset.
"""

import os
import json
import pickle
import warnings
import numpy as np
import pandas as pd
from pathlib import Path

warnings.filterwarnings('ignore')

BASE_DIR = Path(__file__).parent.parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"

# ── Load models and metadata ───────────────────────────────────────────────────
_rf_model = None
_xgb_model = None
_lr_model = None
_label_encoder = None
_symptom_columns = []
_diseases = []
_metadata = {}
_desc_df = None
_prec_df = None
_med_df = None
_MODELS_LOADED = False

def _load_models():
    global _rf_model, _xgb_model, _lr_model, _label_encoder
    global _symptom_columns, _diseases, _metadata, _MODELS_LOADED
    global _desc_df, _prec_df, _med_df

    meta_path = MODELS_DIR / "metadata.json"
    if not meta_path.exists():
        print("[WARN] Models not trained yet. Using rule-based fallback.")
        return False

    with open(meta_path) as f:
        _metadata = json.load(f)
    _symptom_columns = _metadata.get("symptom_columns", [])
    _diseases = _metadata.get("diseases", [])

    try:
        import joblib
        loader = joblib.load
    except ImportError:
        def loader(p):
            with open(p, 'rb') as f:
                return pickle.load(f)

    for name, var_name in [('random_forest', '_rf_model'), ('xgboost', '_xgb_model'),
                            ('logistic_regression', '_lr_model')]:
        p = MODELS_DIR / f"{name}.pkl"
        if p.exists():
            globals()[var_name] = loader(p)
            print(f"[OK] Loaded model: {name}")

    le_path = MODELS_DIR / "label_encoder.pkl"
    if le_path.exists():
        _label_encoder = loader(le_path)

    # Load data CSVs
    try:
        _desc_df = pd.read_csv(DATA_DIR / "disease_description.csv",
                               on_bad_lines='skip').set_index("Disease")
        _prec_df = pd.read_csv(DATA_DIR / "disease_precaution.csv",
                               on_bad_lines='skip').set_index("Disease")
        _med_df  = pd.read_csv(DATA_DIR / "medicine_dataset.csv",
                               on_bad_lines='skip').set_index("Disease")
        print(f"[OK] Loaded data CSVs: {len(_desc_df)} diseases")
    except Exception as e:
        print(f"[WARN] Could not load data CSVs: {e}")

    _MODELS_LOADED = True
    return True

# Load on import
_load_models()


def get_all_symptoms():
    """Return full list of symptoms from dataset."""
    if _symptom_columns:
        return [s.replace("_", " ").title() for s in _symptom_columns]
    # Fallback
    return [
        "Fever", "Cough", "Headache", "Fatigue", "Vomiting", "Nausea",
        "Chest Pain", "Breathlessness", "Joint Pain", "Skin Rash",
        "Dizziness", "Back Pain", "Abdominal Pain", "Diarrhoea",
        "Weight Loss", "High Fever", "Chills", "Sweating", "Dehydration",
        "Itching", "Constipation", "Neck Pain", "Muscle Weakness"
    ]


def _symptoms_to_vector(symptoms):
    """Convert symptom list to binary feature vector."""
    vector = np.zeros(len(_symptom_columns))
    symptom_map = {col.replace("_", " ").lower(): i for i, col in enumerate(_symptom_columns)}

    for s in symptoms:
        key = s.lower().strip()
        # Direct match
        if key in symptom_map:
            vector[symptom_map[key]] = 1.0
            continue
        # Underscore variant
        key_u = key.replace(" ", "_")
        if key_u in {col.lower() for col in _symptom_columns}:
            col_idx = next((i for i, c in enumerate(_symptom_columns) if c.lower() == key_u), None)
            if col_idx is not None:
                vector[col_idx] = 1.0
            continue
        # Partial match
        for symptom_key, idx in symptom_map.items():
            if key in symptom_key or symptom_key in key:
                vector[idx] = 1.0
                break

    return vector


def _get_disease_info(disease_name):
    """Get disease description, precautions, medicines, and specialist."""
    info = {"description": "", "precautions": [], "medicines": [], "specialist": "General Physician"}

    if _desc_df is not None and disease_name in _desc_df.index:
        info["description"] = str(_desc_df.loc[disease_name, "Description"])

    if _prec_df is not None and disease_name in _prec_df.index:
        row = _prec_df.loc[disease_name]
        info["precautions"] = [str(row.get(f"Precaution_{i}", "")) for i in range(1, 5) if row.get(f"Precaution_{i}")]

    if _med_df is not None and disease_name in _med_df.index:
        row = _med_df.loc[disease_name]
        meds = [str(row.get(f"Medicine_{i}", "")) for i in range(1, 5) if row.get(f"Medicine_{i}") and str(row.get(f"Medicine_{i}")) not in ['nan', '']]
        info["medicines"] = meds
        spec = row.get("Specialist", "General Physician")
        info["specialist"] = str(spec) if str(spec) != 'nan' else "General Physician"

    return info


def predict_disease(symptoms, user_profile=None):
    """
    Predict disease from symptoms using ML ensemble.
    Returns top-3 predictions with confidence, descriptions, medicines, specialist.
    """
    if not symptoms:
        return {"error": "No symptoms provided"}

    # Emergency detection
    emergency_keywords = ["chest pain", "severe chest", "unconscious", "difficulty breathing",
                          "stroke", "heart attack", "coma", "paralysis", "blood in sputum",
                          "stomach bleeding", "can't breathe", "not breathing"]
    symptoms_lower = [s.lower() for s in symptoms]
    has_emergency = any(any(ek in s for ek in emergency_keywords) for s in symptoms_lower)

    # ML Prediction path
    if _MODELS_LOADED and _rf_model is not None and _label_encoder is not None and _symptom_columns:
        vector = _symptoms_to_vector(symptoms).reshape(1, -1)
        predictions = []

        # Collect probabilities from available models
        probs_list = []
        weights = []

        if _rf_model:
            probs_list.append(_rf_model.predict_proba(vector)[0])
            weights.append(0.5)
        if _xgb_model:
            probs_list.append(_xgb_model.predict_proba(vector)[0])
            weights.append(0.3)
        if _lr_model:
            probs_list.append(_lr_model.predict_proba(vector)[0])
            weights.append(0.2)

        # Normalize weights
        total_w = sum(weights)
        weights = [w / total_w for w in weights]

        # Weighted ensemble
        ensemble_prob = np.zeros(len(_label_encoder.classes_))
        for prob, weight in zip(probs_list, weights):
            ensemble_prob += weight * prob

        # Top 3 predictions
        top_indices = np.argsort(ensemble_prob)[::-1][:3]
        for idx in top_indices:
            disease = _label_encoder.inverse_transform([idx])[0]
            prob = float(ensemble_prob[idx])
            if prob < 0.001:
                continue
            info = _get_disease_info(disease)
            predictions.append({
                "disease": disease,
                "prob": round(prob, 4),
                "confidence_pct": round(prob * 100, 1),
                "severity": "high" if prob > 0.7 else "medium" if prob > 0.3 else "low",
                "description": info["description"],
                "medicines": info["medicines"],
                "precautions": info["precautions"],
                "specialist": info["specialist"]
            })

        # Feature importance
        feature_importance = []
        if _rf_model and hasattr(_rf_model, 'feature_importances_'):
            importances = _rf_model.feature_importances_
            # Only include symptoms actually entered
            for s in symptoms:
                key = s.lower().replace(" ", "_")
                for i, col in enumerate(_symptom_columns):
                    if col.lower() == key or col.lower() == s.lower():
                        feature_importance.append({
                            "symptom": s,
                            "importance": round(float(importances[i]), 4)
                        })
            feature_importance.sort(key=lambda x: x["importance"], reverse=True)

        urgency = "emergency" if has_emergency else ("consult_doctor" if predictions else "normal")
        top_disease = predictions[0]["disease"] if predictions else "Unknown"
        specialist = predictions[0].get("specialist", "General Physician") if predictions else "General Physician"

        return {
            "predictions": predictions[:3],
            "has_emergency": has_emergency,
            "top_disease": top_disease,
            "urgency": urgency,
            "specialist_recommended": specialist,
            "feature_importance": feature_importance[:5],
            "model_used": "ensemble",
            "explainable_reason": _generate_reason(predictions, symptoms, has_emergency),
            "symptoms_matched": len([s for s in symptoms if any(s.lower() in c.lower() for c in _symptom_columns)])
        }

    # ── Fallback: rule-based (when models not trained) ────────────────────────
    return _rule_based_predict(symptoms, user_profile, has_emergency)


def _rule_based_predict(symptoms, user_profile, has_emergency):
    """Legacy rule-based fallback when ML models not available."""
    symptoms_lower = [s.lower() for s in symptoms]
    predictions = []

    if any("chest" in s or "heart" in s for s in symptoms_lower):
        predictions = [
            {"disease": "Angina", "prob": 0.82, "confidence_pct": 82.0, "severity": "high",
             "medicines": ["Aspirin", "Nitroglycerin"], "specialist": "Cardiologist", "precautions": ["Rest", "Call doctor"], "description": "Chest pain condition."},
        ]
    elif any("fever" in s or "cough" in s for s in symptoms_lower):
        predictions = [
            {"disease": "Influenza", "prob": 0.78, "confidence_pct": 78.0, "severity": "medium",
             "medicines": ["Paracetamol", "Cetirizine"], "specialist": "General Physician", "precautions": ["Rest", "Stay hydrated"], "description": "Viral respiratory infection."},
        ]
    else:
        predictions = [
            {"disease": "General Viral Infection", "prob": 0.60, "confidence_pct": 60.0, "severity": "low",
             "medicines": ["Paracetamol"], "specialist": "General Physician", "precautions": ["Rest", "Hydrate"], "description": "Non-specific viral illness."},
        ]

    urgency = "emergency" if has_emergency else "consult_doctor"
    return {
        "predictions": predictions,
        "has_emergency": has_emergency,
        "top_disease": predictions[0]["disease"],
        "urgency": urgency,
        "specialist_recommended": predictions[0].get("specialist", "General Physician"),
        "feature_importance": [],
        "model_used": "rule_based_fallback",
        "explainable_reason": _generate_reason(predictions, symptoms, has_emergency),
        "symptoms_matched": len(symptoms)
    }


def _generate_reason(predictions, symptoms, has_emergency):
    if has_emergency:
        return "WARNING: Your symptoms indicate a potential medical EMERGENCY. Please call emergency services or go to the nearest hospital immediately. Do not delay seeking help."
    if not predictions:
        return "Could not determine a specific condition. Please consult a doctor for proper evaluation."
    top = predictions[0]
    disease = top.get("disease", "condition")
    prob = top.get("confidence_pct", 0)
    syms_str = ", ".join(symptoms[:4])
    return (
        f"Based on your symptoms ({syms_str}), the AI model suggests a possible risk of "
        f"**{disease}** with {prob:.0f}% confidence. "
        f"This is NOT a medical diagnosis — please consult a qualified {top.get('specialist', 'doctor')} "
        f"for proper evaluation and treatment."
    )


def parse_free_text_symptoms(text):
    """Parse free-text into structured symptom list using dataset vocabulary."""
    text_lower = text.lower()
    found = []
    all_symptoms = get_all_symptoms()

    for s in all_symptoms:
        if s.lower() in text_lower or s.lower().replace(" ", "") in text_lower.replace(" ", ""):
            if s not in found:
                found.append(s)

    # Extra NLP: common aliases
    aliases = {
        "temperature": "High Fever", "temp": "Mild Fever", "runny": "Runny Nose",
        "throwing up": "Vomiting", "throw up": "Vomiting", "puke": "Vomiting",
        "dizzy": "Dizziness", "spin": "Spinning Movements", "tired": "Fatigue",
        "ache": "Body Ache", "sore": "Muscle Pain", "short of breath": "Breathlessness",
        "can't breathe": "Breathlessness", "tummy": "Abdominal Pain",
        "tummy ache": "Stomach Pain", "stomach ache": "Stomach Pain"
    }
    for alias, symptom in aliases.items():
        if alias in text_lower and symptom not in found:
            found.append(symptom)

    return found
