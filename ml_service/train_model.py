"""
ML Model Training Script — Dynamic Disease Prediction
Trains Random Forest, XGBoost, and Logistic Regression on real symptom-disease dataset.
Creates ensemble model and saves to models/ directory.

Run: python train_model.py
"""

import os
import sys
import json
import pickle
import warnings
import numpy as np
import pandas as pd
from pathlib import Path

warnings.filterwarnings('ignore')

DATA_DIR = Path(__file__).parent / "data"
MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

# ── Try to import ML libraries ────────────────────────────────────────────────
try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.svm import SVC
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.preprocessing import LabelEncoder
    from sklearn.metrics import accuracy_score, classification_report
    SKLEARN_OK = True
except ImportError:
    SKLEARN_OK = False

try:
    from xgboost import XGBClassifier
    XGB_OK = True
except ImportError:
    XGB_OK = False

try:
    import joblib
    JOBLIB_OK = True
except ImportError:
    JOBLIB_OK = False


def load_datasets():
    """Load CSV datasets and extract features/labels."""
    csv_path = DATA_DIR / "symptom_disease.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"Dataset not found: {csv_path}")

    df = pd.read_csv(csv_path)
    print(f"✅ Loaded dataset: {df.shape[0]} diseases, {df.shape[1]-1} symptom features")

    diseases = df["Disease"].tolist()
    X = df.drop("Disease", axis=1).values.astype(float)
    symptom_columns = df.drop("Disease", axis=1).columns.tolist()

    # Expand dataset: create multiple samples per disease with realistic symptom subsets
    X_expanded = []
    y_expanded = []

    for i, row in enumerate(X):
        disease = diseases[i]
        nonzero_idx = np.where(row > 0)[0]

        if len(nonzero_idx) == 0:
            continue

        # Original sample
        X_expanded.append(row)
        y_expanded.append(disease)

        # Generate augmented samples (partial symptom subsets)
        for _ in range(20):  # 20 augmented samples per disease
            aug = np.zeros(len(row))
            n_symptoms = max(1, int(len(nonzero_idx) * np.random.uniform(0.5, 1.0)))
            chosen = np.random.choice(nonzero_idx, size=n_symptoms, replace=False)
            aug[chosen] = 1.0
            X_expanded.append(aug)
            y_expanded.append(disease)

    X_aug = np.array(X_expanded)
    y_aug = np.array(y_expanded)
    print(f"✅ Augmented dataset: {len(X_aug)} samples, {len(set(y_aug))} classes")

    return X_aug, y_aug, symptom_columns, list(set(y_aug))


def train_models(X, y):
    """Train RF, XGBoost, and Logistic Regression models."""
    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
    )

    models = {}
    accuracies = {}

    # 1. Random Forest
    print("\n🌲 Training Random Forest...")
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=2,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)
    rf_acc = accuracy_score(y_test, rf.predict(X_test))
    print(f"   Random Forest Accuracy: {rf_acc*100:.1f}%")
    models['random_forest'] = rf
    accuracies['random_forest'] = rf_acc

    # 2. XGBoost
    if XGB_OK:
        print("\n⚡ Training XGBoost...")
        xgb = XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            use_label_encoder=False,
            eval_metric='mlogloss',
            random_state=42
        )
        xgb.fit(X_train, y_train)
        xgb_acc = accuracy_score(y_test, xgb.predict(X_test))
        print(f"   XGBoost Accuracy: {xgb_acc*100:.1f}%")
        models['xgboost'] = xgb
        accuracies['xgboost'] = xgb_acc
    else:
        print("   ⚠️ XGBoost not available, skipping")

    # 3. Logistic Regression
    print("\n📊 Training Logistic Regression...")
    lr = LogisticRegression(
        max_iter=2000,
        solver='lbfgs',
        C=1.0,
        random_state=42
    )
    lr.fit(X_train, y_train)
    lr_acc = accuracy_score(y_test, lr.predict(X_test))
    print(f"   Logistic Regression Accuracy: {lr_acc*100:.1f}%")
    models['logistic_regression'] = lr
    accuracies['logistic_regression'] = lr_acc

    # Ensemble accuracy (weighted voting)
    print("\n🎯 Computing Ensemble accuracy...")
    rf_prob = rf.predict_proba(X_test)
    lr_prob = lr.predict_proba(X_test)

    if XGB_OK and 'xgboost' in models:
        xgb_prob = xgb.predict_proba(X_test)
        ensemble_prob = 0.5 * rf_prob + 0.3 * xgb_prob + 0.2 * lr_prob
    else:
        ensemble_prob = 0.6 * rf_prob + 0.4 * lr_prob

    ens_pred = np.argmax(ensemble_prob, axis=1)
    ens_acc = accuracy_score(y_test, ens_pred)
    print(f"   Ensemble Accuracy: {ens_acc*100:.1f}%")
    accuracies['ensemble'] = ens_acc

    return models, le, accuracies


def save_models(models, le, symptom_columns, all_diseases, accuracies):
    """Save trained models and metadata."""
    saver = joblib if JOBLIB_OK else pickle

    for name, model in models.items():
        fpath = MODELS_DIR / f"{name}.pkl"
        if JOBLIB_OK:
            joblib.dump(model, fpath)
        else:
            with open(fpath, 'wb') as f:
                pickle.dump(model, f)
        print(f"💾 Saved {name} → {fpath}")

    # Save label encoder
    le_path = MODELS_DIR / "label_encoder.pkl"
    if JOBLIB_OK:
        joblib.dump(le, le_path)
    else:
        with open(le_path, 'wb') as f:
            pickle.dump(le, f)
    print(f"💾 Saved label encoder → {le_path}")

    # Save metadata
    meta = {
        "symptom_columns": symptom_columns,
        "diseases": sorted(all_diseases),
        "accuracies": {k: round(v, 4) for k, v in accuracies.items()},
        "models_available": list(models.keys()),
        "version": "2.0.0"
    }
    meta_path = MODELS_DIR / "metadata.json"
    with open(meta_path, 'w') as f:
        json.dump(meta, f, indent=2)
    print(f"💾 Saved metadata → {meta_path}")


def main():
    print("=" * 60)
    print("🏥 HealthPredict AI — Model Training Pipeline v2.0")
    print("=" * 60)

    if not SKLEARN_OK:
        print("❌ scikit-learn not installed. Run: pip install scikit-learn")
        sys.exit(1)

    if not JOBLIB_OK:
        print("⚠️  joblib not installed, using pickle as fallback")

    # Load data
    X, y, symptom_columns, all_diseases = load_datasets()

    # Train
    models, le, accuracies = train_models(X, y)

    # Save
    save_models(models, le, symptom_columns, all_diseases, accuracies)

    print("\n" + "=" * 60)
    print("✅ Training complete!")
    print(f"   Diseases: {len(all_diseases)}")
    print(f"   Symptoms: {len(symptom_columns)}")
    print(f"   Best accuracy: {max(accuracies.values())*100:.1f}%")
    print("=" * 60)


if __name__ == "__main__":
    main()
