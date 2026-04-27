"""
HealthPredict AI Microservice v3.0
Flask backend serving ML prediction, OCR, multilingual chatbot, doctor booking,
health scoring, diet planning, AI health report generation, medical report analysis,
medicine interaction checking, mental wellness, health timeline, emergency info,
family health profiles, smart reminders, and AI lifestyle coaching.
Port: 5001
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import subprocess
import sys
import uuid
from datetime import datetime, timedelta

# Load .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'), override=True)
except Exception:
    pass

# ── Import services ────────────────────────────────────────────────────────────
from services import prediction_service, ocr_service, chatbot_service, doctor_service
from services import health_service, report_service
from services import interaction_service, mental_service, report_analyzer_service
from services import emergency_service, family_service, reminder_service, lifestyle_service
from services import timeline_service

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ═══════════════════════════════════════════════════════════════════════════════
# ROOT
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "message": "HealthPredict AI Microservice v3.0",
        "status": "running",
        "version": "3.0.0",
        "endpoints": [
            "/predict", "/symptoms", "/retrain",
            "/ocr", "/chat", "/languages",
            "/doctors", "/doctors/slots", "/book-appointment", "/appointments",
            "/hospitals", "/health-score", "/diet-plan", "/fitness-plan",
            "/generate-report", "/vaccination-schedule",
            "/analyze-report", "/reference-ranges",
            "/check-interactions",
            "/mental/check-in", "/mental/history", "/mental/moods",
            "/timeline", "/timeline/add",
            "/emergency",
            "/family", "/family/add", "/family/update", "/family/delete", "/family/record",
            "/reminders", "/reminders/add", "/reminders/delete", "/reminders/toggle", "/reminders/today",
            "/lifestyle-plan",
        ]
    }), 200


# ═══════════════════════════════════════════════════════════════════════════════
# PREDICTION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/predict", methods=["POST"])
def predict():
    """Predict diseases from symptoms using ML ensemble."""
    print("Incoming request:", request.json)
    try:
        data = request.get_json(force=True)
        symptoms = data.get("symptoms", [])
        user_profile = data.get("user_profile", {})
        free_text = data.get("free_text", "")

        # Parse free text into symptoms if provided
        if free_text and not symptoms:
            symptoms = prediction_service.parse_free_text_symptoms(free_text)

        if not symptoms:
            return jsonify({"error": "Provide 'symptoms' list or 'free_text'"}), 400

        result = prediction_service.predict_disease(symptoms, user_profile)

        # Add prediction to patient timeline
        try:
            user_id = data.get("user_id") or data.get("user_email") or "default"
            top_disease = ""
            if result.get("predictions"):
                top = result["predictions"][0] if isinstance(result["predictions"], list) else {}
                top_disease = top.get("disease") or top.get("name", "")
            if top_disease:
                timeline_service.add_event(
                    user_id, "prediction",
                    f"AI Diagnosis: {top_disease}",
                    f"Symptoms: {', '.join(symptoms[:5])}{'...' if len(symptoms) > 5 else ''}",
                    {"symptoms": symptoms, "disease": top_disease}
                )
        except Exception:
            pass

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/symptoms", methods=["GET"])
def get_symptoms():
    """Return full list of recognizable symptoms from dataset."""
    try:
        symptoms = prediction_service.get_all_symptoms()
        return jsonify({"symptoms": symptoms, "count": len(symptoms)}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/retrain", methods=["POST"])
def retrain_model():
    """Trigger model retraining from dataset."""
    try:
        train_script = os.path.join(os.path.dirname(__file__), "train_model.py")
        result = subprocess.run(
            [sys.executable, train_script],
            capture_output=True, text=True, timeout=300
        )
        if result.returncode == 0:
            # Reload models
            prediction_service._load_models()
            return jsonify({
                "success": True,
                "message": "Model retrained successfully",
                "output": result.stdout[-2000:]
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": "Training failed",
                "stderr": result.stderr[-1000:]
            }), 500
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Training timed out (>5 min)"}), 408
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# OCR ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/ocr", methods=["POST"])
def ocr():
    """Extract structured data from prescription image."""
    print("Incoming request:", "File uploaded")
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        img_data = file.read()
        result = ocr_service.extract_prescription(img_data, file.filename)

        if not result.get("success"):
            return jsonify(result), 400
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# CHATBOT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/chat", methods=["POST"])
def chat():
    """Multilingual AI health chatbot."""
    print("Incoming request:", request.json)
    try:
        data = request.get_json(force=True)
        message = data.get("message", "")
        history = data.get("history", [])
        language = data.get("language", "auto")
        image = data.get("image")  # optional {"base64": "...", "mime_type": "..."}

        if not message and not image:
            return jsonify({"error": "Message or image required"}), 400

        result = chatbot_service.chat_with_ai(message, history, language, image=image)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/languages", methods=["GET"])
def get_languages():
    """Return supported languages."""
    return jsonify({
        "languages": list(chatbot_service.LANGUAGE_CONFIG.values()),
        "count": len(chatbot_service.LANGUAGE_CONFIG)
    }), 200


# ═══════════════════════════════════════════════════════════════════════════════
# DOCTOR & APPOINTMENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/recommend-specialist", methods=["POST"])
def recommend_specialist():
    """Map a disease to recommended specialist with severity/priority info."""
    try:
        data = request.get_json(force=True)
        disease = data.get("disease", "")
        if not disease:
            return jsonify({"error": "disease field required"}), 400
        result = doctor_service.recommend_specialist(disease)
        # Also return top 3 matching doctors
        docs = doctor_service.get_doctors(specialty=result["specialist"])[:3]
        result["top_doctors"] = docs
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/doctors", methods=["GET"])
def get_doctors():
    """Get filtered list of doctors."""
    specialty = request.args.get("specialty")
    max_distance = request.args.get("max_distance", type=float)
    min_rating = request.args.get("min_rating", type=float)
    language = request.args.get("language")
    video_only = request.args.get("video_only", "false").lower() == "true"
    location = request.args.get("location")
    min_experience = request.args.get("min_experience", type=int)

    doctors = doctor_service.get_doctors(
        specialty, max_distance, min_rating, language, video_only,
        location, min_experience)
    return jsonify({"doctors": doctors, "count": len(doctors)}), 200


@app.route("/doctors/<int:doctor_id>", methods=["GET"])
def get_doctor(doctor_id):
    """Get specific doctor details."""
    doctor = doctor_service.get_doctor_by_id(doctor_id)
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404
    return jsonify(doctor), 200


@app.route("/doctors/slots", methods=["GET"])
def get_slots():
    """Get available appointment slots for a doctor."""
    doctor_id = request.args.get("doctor_id", type=int)
    date = request.args.get("date")
    if not doctor_id:
        return jsonify({"error": "doctor_id required"}), 400
    result = doctor_service.get_available_slots(doctor_id, date)
    return jsonify(result), 200


@app.route("/book-appointment", methods=["POST"])
def book_appointment():
    """Book an appointment slot."""
    try:
        data = request.get_json(force=True)
        result = doctor_service.book_appointment(data)
        status = 200 if result.get("success") else 400
        return jsonify(result), status
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/appointments", methods=["GET"])
def get_appointments():
    """Get appointments for a user (by name or email) or for a doctor."""
    user_name = request.args.get("user_name", "")
    user_email = request.args.get("user_email", "")
    doctor_id = request.args.get("doctor_id", type=int)
    doctor_name = request.args.get("doctor_name", "")
    date = request.args.get("date", "")
    status = request.args.get("status", "")

    if doctor_id or doctor_name:
        appointments = doctor_service.get_doctor_appointments(
            doctor_id=doctor_id, doctor_name=doctor_name,
            date=date or None, status=status or None)
    else:
        appointments = doctor_service.get_user_appointments(
            user_name=user_name or None, user_email=user_email or None,
            status=status or None)
    return jsonify({"appointments": appointments, "count": len(appointments)}), 200


@app.route("/appointments/<booking_id>/status", methods=["PUT"])
def update_appointment_status(booking_id):
    """Update appointment status and add notes (for doctor panel)."""
    try:
        data = request.get_json(force=True)
        status = data.get("status", "")
        notes = data.get("notes", "")
        if status not in ("confirmed", "completed", "cancelled"):
            return jsonify({"error": "Invalid status"}), 400
        result = doctor_service.update_appointment_status(booking_id, status, notes)
        return jsonify(result), 200 if result.get("success") else 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/doctors/<int:doctor_id>/future-slots", methods=["GET"])
def get_future_slots(doctor_id):
    """Get dynamically generated slots for the next 7 days."""
    days = request.args.get("days", 7, type=int)
    slots = doctor_service.generate_future_slots(doctor_id, days)
    doctor = doctor_service.get_doctor_by_id(doctor_id)
    return jsonify({
        "doctor_id": doctor_id,
        "doctor_name": doctor.get("name") if doctor else "",
        "slots": slots
    }), 200


@app.route("/hospitals", methods=["GET"])
def get_hospitals():
    """Get nearby hospitals for emergency."""
    max_km = request.args.get("max_km", 10, type=float)
    hospitals = doctor_service.get_nearby_hospitals(max_km)
    return jsonify({
        "hospitals": hospitals,
        "emergency_number": "108",
        "general_emergency": "112"
    }), 200


# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH INTELLIGENCE ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/health-score", methods=["POST"])
def health_score():
    """Calculate personalized health score (0-100)."""
    try:
        data = request.get_json(force=True)
        result = health_service.calculate_health_score(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/diet-plan", methods=["POST"])
def diet_plan():
    """Generate personalized 7-day diet plan."""
    try:
        data = request.get_json(force=True)
        result = health_service.generate_diet_plan(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/fitness-plan", methods=["POST"])
def fitness_plan():
    """Generate personalized weekly fitness plan."""
    try:
        data = request.get_json(force=True)
        result = health_service.generate_fitness_plan(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/bmi", methods=["POST"])
def bmi_calc():
    """Calculate BMI."""
    try:
        data = request.get_json(force=True)
        result = health_service.calculate_bmi(data.get("weight_kg", 0), data.get("height_cm", 0))
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH REPORT ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/generate-report", methods=["POST"])
def generate_report():
    """Generate comprehensive AI health report and PDF."""
    try:
        data = request.get_json(force=True)
        result = report_service.generate_health_report(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# PREVENTIVE HEALTHCARE ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

VACCINATION_SCHEDULE = {
    "infant_0_12m": [
        {"name": "BCG", "age": "At birth", "disease": "Tuberculosis"},
        {"name": "Hepatitis B (1st)", "age": "At birth", "disease": "Hepatitis B"},
        {"name": "OPV 0", "age": "At birth", "disease": "Polio"},
        {"name": "DTP (1st)", "age": "6 weeks", "disease": "Diphtheria, Tetanus, Pertussis"},
        {"name": "Hepatitis B (2nd)", "age": "6 weeks", "disease": "Hepatitis B"},
        {"name": "Rotavirus (1st)", "age": "6 weeks", "disease": "Rotavirus Diarrhea"},
        {"name": "MMR (1st)", "age": "9-12 months", "disease": "Measles, Mumps, Rubella"},
    ],
    "child_1_5y": [
        {"name": "MMR (2nd)", "age": "15 months", "disease": "Measles, Mumps, Rubella"},
        {"name": "DTP Booster", "age": "18 months", "disease": "Diphtheria, Tetanus, Pertussis"},
        {"name": "Typhoid", "age": "2 years", "disease": "Typhoid Fever"},
        {"name": "Varicella", "age": "2-3 years", "disease": "Chicken Pox"},
    ],
    "adult_18_plus": [
        {"name": "Tetanus Booster", "age": "Every 10 years", "disease": "Tetanus"},
        {"name": "Influenza", "age": "Annually", "disease": "Seasonal Flu"},
        {"name": "Hepatitis B (if not vaccinated)", "age": "3-dose series", "disease": "Hepatitis B"},
        {"name": "COVID-19", "age": "As recommended", "disease": "COVID-19"},
        {"name": "Pneumococcal (60+)", "age": "60 years+", "disease": "Pneumonia"},
    ]
}


@app.route("/vaccination-schedule", methods=["GET"])
def vaccination_schedule():
    """Get age-appropriate vaccination schedule."""
    age = request.args.get("age", type=int, default=30)
    if age < 1:
        category = "infant_0_12m"
    elif age <= 5:
        category = "child_1_5y"
    else:
        category = "adult_18_plus"

    return jsonify({
        "age": age,
        "category": category.replace("_", " ").title(),
        "vaccines": VACCINATION_SCHEDULE.get(category, []),
        "source": "National Immunization Schedule (India), WHO recommendations"
    }), 200


# ═══════════════════════════════════════════════════════════════════════════════
# MEDICAL REPORT ANALYZER ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/analyze-report", methods=["POST"])
def analyze_report():
    """Analyze a medical/lab report (image or manual values)."""
    try:
        content_type = request.content_type or ''
        if 'multipart' in content_type and 'file' in request.files:
            import base64
            file = request.files['file']
            img_data = base64.b64encode(file.read()).decode('utf-8')
            gender = request.form.get('gender', 'female')
            result = report_analyzer_service.analyze_report_image(img_data, gender)
        else:
            data = request.get_json(force=True)
            tests = data.get('tests', [])
            gender = data.get('gender', 'female')
            if not tests:
                return jsonify({"error": "Provide 'tests' array or upload a report image"}), 400
            result = report_analyzer_service.analyze_report_values(tests, gender)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/reference-ranges", methods=["GET"])
def reference_ranges():
    """Get all available lab test reference ranges."""
    return jsonify(report_analyzer_service.get_reference_ranges()), 200


# ═══════════════════════════════════════════════════════════════════════════════
# MEDICINE INTERACTION CHECKER
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/check-interactions", methods=["POST"])
def check_interactions():
    """Check drug interactions between medicines."""
    try:
        data = request.get_json(force=True)
        medicines = data.get('medicines', [])
        if len(medicines) < 2:
            return jsonify({"error": "Provide at least 2 medicines to check interactions"}), 400
        use_ai = data.get('use_ai', False)
        if use_ai:
            results = interaction_service.ai_check_interactions(medicines)
        else:
            results = interaction_service.check_interactions(medicines)
        return jsonify({"interactions": results, "medicines": medicines}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# MENTAL WELLNESS ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/mental/check-in", methods=["POST"])
def mental_check_in():
    """Record a daily mental wellness check-in."""
    try:
        data = request.get_json(force=True)
        user_id = data.get('user_id', 'default')
        mood = data.get('mood', 'neutral')
        journal = data.get('journal_note', '')
        sleep = data.get('sleep_hours')
        stress = data.get('stress_level')
        result = mental_service.check_in(user_id, mood, journal, sleep, stress)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/mental/history", methods=["GET"])
def mental_history():
    """Get mental wellness history."""
    user_id = request.args.get('user_id', 'default')
    days = request.args.get('days', 30, type=int)
    result = mental_service.get_history(user_id, days)
    return jsonify(result), 200


@app.route("/mental/moods", methods=["GET"])
def available_moods():
    """Get available mood options."""
    return jsonify({"moods": mental_service.get_available_moods()}), 200


# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH TIMELINE ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/timeline", methods=["GET"])
def get_timeline():
    """Get health timeline for a user."""
    user_id = request.args.get('user_id', 'default')
    event_type = request.args.get('type')
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    result = timeline_service.get_timeline(user_id, event_type, limit, offset)
    return jsonify(result), 200


@app.route("/timeline/add", methods=["POST"])
def add_timeline_event():
    """Add a health event to timeline."""
    try:
        data = request.get_json(force=True)
        user_id = data.get('user_id', 'default')
        event_type = data.get('type', 'custom')
        title = data.get('title', '')
        detail = data.get('detail', '')
        meta = data.get('meta', {})
        if not title:
            return jsonify({"error": "Title is required"}), 400
        result = timeline_service.add_event(user_id, event_type, title, detail, meta)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# EMERGENCY ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/emergency", methods=["GET"])
def emergency():
    """Get emergency contacts, hospitals, and first aid guides."""
    return jsonify(emergency_service.get_emergency_data()), 200


# ═══════════════════════════════════════════════════════════════════════════════
# FAMILY HEALTH PROFILES ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/family", methods=["GET"])
def get_family():
    """Get family health profiles."""
    user_id = request.args.get('user_id', 'default')
    members = family_service.get_members(user_id)
    return jsonify({"members": members, "relations": family_service.get_available_relations()}), 200


@app.route("/family/add", methods=["POST"])
def add_family_member():
    """Add a family member profile."""
    try:
        data = request.get_json(force=True)
        user_id = data.get('user_id', 'default')
        result = family_service.add_member(
            user_id, data.get('name',''), data.get('relation','other'),
            data.get('age',0), data.get('gender',''), data.get('blood_group',''),
            data.get('conditions',[]), data.get('medications',[]), data.get('allergies',[])
        )
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/family/update", methods=["PUT"])
def update_family_member():
    """Update a family member profile."""
    try:
        data = request.get_json(force=True)
        user_id = data.get('user_id', 'default')
        member_id = data.get('member_id', '')
        result = family_service.update_member(user_id, member_id, data)
        if not result:
            return jsonify({"error": "Member not found"}), 404
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/family/delete", methods=["DELETE"])
def delete_family_member():
    """Delete a family member profile."""
    user_id = request.args.get('user_id', 'default')
    member_id = request.args.get('member_id', '')
    family_service.delete_member(user_id, member_id)
    return jsonify({"success": True}), 200


@app.route("/family/record", methods=["POST"])
def add_family_record():
    """Add a health record to a family member."""
    try:
        data = request.get_json(force=True)
        user_id = data.get('user_id', 'default')
        member_id = data.get('member_id', '')
        result = family_service.add_health_record(
            user_id, member_id, data.get('record_type','note'),
            data.get('title',''), data.get('detail',''), data.get('meta',{})
        )
        if not result:
            return jsonify({"error": "Member not found"}), 404
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# SMART REMINDERS ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/reminders", methods=["GET"])
def get_reminders():
    """Get all reminders for a user."""
    user_id = request.args.get('user_id', 'default')
    result = reminder_service.get_reminders(user_id)
    return jsonify({"reminders": result, "types": reminder_service.get_reminder_types()}), 200


@app.route("/reminders/today", methods=["GET"])
def todays_reminders():
    """Get today's active reminders."""
    user_id = request.args.get('user_id', 'default')
    result = reminder_service.get_todays_reminders(user_id)
    return jsonify({"reminders": result}), 200


@app.route("/reminders/add", methods=["POST"])
def add_reminder():
    """Create a new reminder."""
    try:
        data = request.get_json(force=True)
        user_id = data.get('user_id', 'default')
        result = reminder_service.add_reminder(
            user_id, data.get('type','custom'), data.get('title',''),
            data.get('description',''), data.get('time',''),
            data.get('repeat','none'), data.get('days',[])
        )
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/reminders/delete", methods=["DELETE"])
def delete_reminder():
    """Delete a reminder."""
    user_id = request.args.get('user_id', 'default')
    reminder_id = request.args.get('reminder_id', '')
    reminder_service.delete_reminder(user_id, reminder_id)
    return jsonify({"success": True}), 200


@app.route("/reminders/toggle", methods=["PUT"])
def toggle_reminder():
    """Toggle a reminder active/inactive."""
    try:
        data = request.get_json(force=True)
        user_id = data.get('user_id', 'default')
        reminder_id = data.get('reminder_id', '')
        result = reminder_service.toggle_reminder(user_id, reminder_id)
        if not result:
            return jsonify({"error": "Reminder not found"}), 404
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# AI LIFESTYLE COACH ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/lifestyle-plan", methods=["POST"])
def lifestyle_plan():
    """Generate AI lifestyle recommendations."""
    try:
        data = request.get_json(force=True)
        result = lifestyle_service.generate_lifestyle_plan(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# DOCTOR DASHBOARD — PRESCRIPTIONS, NOTES, FOLLOW-UPS, ANALYTICS, CHAT, TESTS
# ═══════════════════════════════════════════════════════════════════════════════

_DOCTOR_DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def _load_json(filename, default=None):
    path = os.path.join(_DOCTOR_DATA_DIR, filename)
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return default if default is not None else {}

def _save_json(filename, data):
    os.makedirs(_DOCTOR_DATA_DIR, exist_ok=True)
    with open(os.path.join(_DOCTOR_DATA_DIR, filename), 'w') as f:
        json.dump(data, f, indent=2)


def _load_all_appointments():
    """Load bookings from bookings.json (dict) and return as a flat list.
    This is the single source of truth for ALL appointment data across the app.
    bookings.json is written by doctor_service.book_appointment().
    """
    raw = _load_json("bookings.json", {})
    if isinstance(raw, dict):
        return list(raw.values())
    if isinstance(raw, list):
        return raw
    return []


# ── Prescriptions ──────────────────────────────────────────────────────────────

@app.route("/prescriptions", methods=["POST"])
def create_prescription():
    """Create a digital prescription linked to a booking."""
    try:
        data = request.get_json(force=True)
        prescriptions = _load_json("prescriptions.json", [])
        rx = {
            "id": str(uuid.uuid4())[:8],
            "booking_id": data.get("booking_id", ""),
            "doctor_name": data.get("doctor_name", ""),
            "patient_name": data.get("patient_name", ""),
            "patient_email": data.get("patient_email", ""),
            "disease": data.get("disease", ""),
            "medicines": data.get("medicines", []),
            "notes": data.get("notes", ""),
            "created_at": datetime.now().isoformat(),
        }
        prescriptions.append(rx)
        _save_json("prescriptions.json", prescriptions)
        # Add to timeline
        try:
            timeline_service.add_event(
                rx["patient_email"] or "default", "prescription",
                f"Prescription by {rx['doctor_name']}",
                f"{len(rx['medicines'])} medicine(s) prescribed for {rx['disease']}",
                {"booking_id": rx["booking_id"], "prescription_id": rx["id"]}
            )
        except Exception:
            pass
        return jsonify({"success": True, "prescription": rx}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/prescriptions", methods=["GET"])
def get_prescriptions():
    """Get prescriptions filtered by patient or doctor."""
    prescriptions = _load_json("prescriptions.json", [])
    patient = request.args.get("patient_name", "")
    doctor = request.args.get("doctor_name", "")
    booking = request.args.get("booking_id", "")
    if patient:
        prescriptions = [p for p in prescriptions if p.get("patient_name","").lower() == patient.lower()]
    if doctor:
        prescriptions = [p for p in prescriptions if p.get("doctor_name","").lower() == doctor.lower()]
    if booking:
        prescriptions = [p for p in prescriptions if p.get("booking_id") == booking]
    return jsonify({"prescriptions": prescriptions}), 200


# ── Doctor Private Notes ───────────────────────────────────────────────────────

@app.route("/doctor-notes", methods=["POST"])
def save_doctor_note():
    """Save a private doctor note for a patient."""
    try:
        data = request.get_json(force=True)
        notes = _load_json("doctor_notes.json", [])
        note = {
            "id": str(uuid.uuid4())[:8],
            "doctor_name": data.get("doctor_name", ""),
            "patient_name": data.get("patient_name", ""),
            "booking_id": data.get("booking_id", ""),
            "content": data.get("content", ""),
            "tags": data.get("tags", []),
            "created_at": datetime.now().isoformat(),
        }
        notes.append(note)
        _save_json("doctor_notes.json", notes)
        return jsonify({"success": True, "note": note}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/doctor-notes", methods=["GET"])
def get_doctor_notes():
    """Get doctor notes for a patient."""
    notes = _load_json("doctor_notes.json", [])
    doctor = request.args.get("doctor_name", "")
    patient = request.args.get("patient_name", "")
    if doctor:
        notes = [n for n in notes if n.get("doctor_name","").lower() == doctor.lower()]
    if patient:
        notes = [n for n in notes if n.get("patient_name","").lower() == patient.lower()]
    return jsonify({"notes": notes}), 200


# ── Follow-up Scheduler ───────────────────────────────────────────────────────

@app.route("/followups", methods=["POST"])
def create_followup():
    """Schedule a follow-up reminder for a patient."""
    try:
        data = request.get_json(force=True)
        followups = _load_json("followups.json", [])
        fu = {
            "id": str(uuid.uuid4())[:8],
            "doctor_name": data.get("doctor_name", ""),
            "patient_name": data.get("patient_name", ""),
            "patient_email": data.get("patient_email", ""),
            "booking_id": data.get("booking_id", ""),
            "reason": data.get("reason", ""),
            "follow_up_date": data.get("follow_up_date", ""),
            "status": "scheduled",
            "created_at": datetime.now().isoformat(),
        }
        followups.append(fu)
        _save_json("followups.json", followups)
        # Add reminder to patient
        try:
            reminder_service.add_reminder(
                fu["patient_email"] or "default", "appointment",
                f"Follow-up with Dr. {fu['doctor_name']}",
                fu["reason"], "09:00", "none", []
            )
        except Exception:
            pass
        return jsonify({"success": True, "followup": fu}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/followups", methods=["GET"])
def get_followups():
    """Get follow-ups for a doctor."""
    followups = _load_json("followups.json", [])
    doctor = request.args.get("doctor_name", "")
    if doctor:
        followups = [f for f in followups if f.get("doctor_name","").lower() == doctor.lower()]
    return jsonify({"followups": followups}), 200


# ── Doctor Analytics ───────────────────────────────────────────────────────────

@app.route("/doctor-analytics", methods=["GET"])
def doctor_analytics():
    """Get analytics for a doctor dashboard."""
    doctor_name = request.args.get("doctor_name", "")
    bookings = _load_json("bookings.json", {})
    all_appts = list(bookings.values()) if isinstance(bookings, dict) else bookings
    if doctor_name:
        all_appts = [a for a in all_appts if a.get("doctor_name","").lower() == doctor_name.lower()]

    today = datetime.now().strftime("%Y-%m-%d")
    month_start = datetime.now().strftime("%Y-%m-01")

    completed = [a for a in all_appts if a.get("status") == "completed"]
    this_month = [a for a in all_appts if a.get("date","") >= month_start]
    today_appts = [a for a in all_appts if a.get("date") == today and a.get("status") != "cancelled"]

    # disease breakdown
    disease_counts = {}
    for a in completed:
        d = a.get("disease", "General")
        disease_counts[d] = disease_counts.get(d, 0) + 1
    top_diseases = sorted(disease_counts.items(), key=lambda x: -x[1])[:5]

    total_revenue = sum(a.get("consultation_fee", 0) for a in completed)

    return jsonify({
        "total_patients": len(set(a.get("user_name","") for a in all_appts)),
        "total_appointments": len(all_appts),
        "completed": len(completed),
        "cancelled": len([a for a in all_appts if a.get("status") == "cancelled"]),
        "today_count": len(today_appts),
        "this_month": len(this_month),
        "total_revenue": total_revenue,
        "top_diseases": [{"disease": d, "count": c} for d, c in top_diseases],
        "completion_rate": round(len(completed) / max(len(all_appts), 1) * 100),
    }), 200


# ── Test Recommendations ──────────────────────────────────────────────────────

@app.route("/test-recommendations", methods=["POST"])
def create_test_recommendation():
    """Doctor recommends lab tests for a patient."""
    try:
        data = request.get_json(force=True)
        recs = _load_json("test_recommendations.json", [])
        rec = {
            "id": str(uuid.uuid4())[:8],
            "doctor_name": data.get("doctor_name", ""),
            "patient_name": data.get("patient_name", ""),
            "patient_email": data.get("patient_email", ""),
            "booking_id": data.get("booking_id", ""),
            "tests": data.get("tests", []),
            "urgency": data.get("urgency", "normal"),
            "notes": data.get("notes", ""),
            "created_at": datetime.now().isoformat(),
        }
        recs.append(rec)
        _save_json("test_recommendations.json", recs)
        try:
            timeline_service.add_event(
                rec["patient_email"] or "default", "test",
                f"Tests recommended by Dr. {rec['doctor_name']}",
                ", ".join(rec["tests"]),
                {"booking_id": rec["booking_id"]}
            )
        except Exception:
            pass
        return jsonify({"success": True, "recommendation": rec}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/test-recommendations", methods=["GET"])
def get_test_recommendations():
    """Get test recommendations for a patient."""
    recs = _load_json("test_recommendations.json", [])
    patient = request.args.get("patient_name", "")
    doctor = request.args.get("doctor_name", "")
    if patient:
        recs = [r for r in recs if r.get("patient_name","").lower() == patient.lower()]
    if doctor:
        recs = [r for r in recs if r.get("doctor_name","").lower() == doctor.lower()]
    return jsonify({"recommendations": recs}), 200


# ── Doctor-Patient Chat ───────────────────────────────────────────────────────

@app.route("/doctor-chat", methods=["POST"])
def send_chat_message():
    """Send a chat message between doctor and patient."""
    try:
        data = request.get_json(force=True)
        chats = _load_json("doctor_chats.json", [])
        msg = {
            "id": str(uuid.uuid4())[:8],
            "booking_id": data.get("booking_id", ""),
            "sender": data.get("sender", ""),
            "sender_role": data.get("sender_role", "doctor"),
            "recipient": data.get("recipient", ""),
            "message": data.get("message", ""),
            "timestamp": datetime.now().isoformat(),
        }
        chats.append(msg)
        _save_json("doctor_chats.json", chats)
        return jsonify({"success": True, "message": msg}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/doctor-chat", methods=["GET"])
def get_chat_messages():
    """Get chat messages for a booking."""
    chats = _load_json("doctor_chats.json", [])
    booking_id = request.args.get("booking_id", "")
    doctor = request.args.get("doctor_name", "")
    patient = request.args.get("patient_name", "")
    if booking_id:
        chats = [c for c in chats if c.get("booking_id") == booking_id]
    elif doctor:
        chats = [c for c in chats if c.get("sender") == doctor or c.get("recipient") == doctor]
    elif patient:
        chats = [c for c in chats if c.get("sender") == patient or c.get("recipient") == patient]
    return jsonify({"messages": chats}), 200


# ── Doctor Timeline ────────────────────────────────────────────────────────────

@app.route("/doctor-timeline", methods=["GET"])
def get_doctor_timeline():
    """Get doctor-specific timeline events."""
    events = _load_json("doctor_timeline.json", [])
    doctor = request.args.get("doctor_name", "")
    if doctor:
        events = [e for e in events if e.get("doctor_name") == doctor]
    events.sort(key=lambda e: e.get("date", ""), reverse=True)
    return jsonify({"events": events}), 200


@app.route("/doctor-timeline", methods=["POST"])
def add_doctor_timeline():
    """Add a doctor timeline event."""
    try:
        data = request.get_json(force=True)
        events = _load_json("doctor_timeline.json", [])
        event = {
            "id": str(uuid.uuid4())[:8],
            "doctor_name": data.get("doctor_name", ""),
            "patient_name": data.get("patient_name", ""),
            "patient_email": data.get("patient_email", ""),
            "title": data.get("title", ""),
            "description": data.get("description", ""),
            "date": data.get("date", datetime.now().strftime("%Y-%m-%d")),
            "event_type": data.get("event_type", "custom"),
            "created_at": datetime.now().isoformat(),
        }
        if not event["title"]:
            return jsonify({"error": "Title is required"}), 400
        events.append(event)
        _save_json("doctor_timeline.json", events)
        return jsonify({"success": True, "event": event}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Doctor Messages (standalone, not tied to booking) ──────────────────────────

@app.route("/doctor-messages", methods=["GET"])
def get_doctor_messages():
    """Get all doctor messages (standalone conversations)."""
    messages = _load_json("doctor_messages.json", [])
    doctor = request.args.get("doctor_name", "")
    if doctor:
        messages = [m for m in messages if m.get("doctor_name") == doctor]
    messages.sort(key=lambda m: m.get("timestamp", ""), reverse=True)
    return jsonify({"messages": messages}), 200


@app.route("/doctor-messages", methods=["POST"])
def send_doctor_message():
    """Send a standalone doctor message to a patient."""
    try:
        data = request.get_json(force=True)
        messages = _load_json("doctor_messages.json", [])
        msg = {
            "id": str(uuid.uuid4())[:8],
            "doctor_name": data.get("doctor_name", ""),
            "patient_name": data.get("patient_name", ""),
            "patient_email": data.get("patient_email", ""),
            "message": data.get("message", ""),
            "sender_role": "doctor",
            "timestamp": datetime.now().isoformat(),
        }
        if not msg["message"].strip():
            return jsonify({"error": "Message is required"}), 400
        messages.append(msg)
        _save_json("doctor_messages.json", messages)
        return jsonify({"success": True, "message": msg}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Upload Prescription (file upload) ─────────────────────────────────────────

@app.route("/upload-prescription", methods=["POST"])
def upload_prescription():
    """Upload a prescription PDF/image and link to booking."""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        file = request.files["file"]
        booking_id = request.form.get("booking_id", "unknown")
        doctor_name = request.form.get("doctor_name", "")
        patient_name = request.form.get("patient_name", "")

        upload_dir = os.path.join(_DOCTOR_DATA_DIR, "uploads", "prescriptions")
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"{booking_id}_{file.filename}"
        filepath = os.path.join(upload_dir, filename)
        file.save(filepath)

        uploads = _load_json("uploaded_prescriptions.json", [])
        record = {
            "id": str(uuid.uuid4())[:8],
            "booking_id": booking_id,
            "doctor_name": doctor_name,
            "patient_name": patient_name,
            "filename": filename,
            "original_name": file.filename,
            "uploaded_at": datetime.now().isoformat(),
        }
        uploads.append(record)
        _save_json("uploaded_prescriptions.json", uploads)
        return jsonify({"success": True, "upload": record}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN PANEL ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/admin/appointments", methods=["GET"])
def admin_appointments():
    """Get all appointments for admin monitoring."""
    appts = _load_all_appointments()
    total = len(appts)
    completed_appts = [a for a in appts if a.get("status") == "completed"]
    completed = len(completed_appts)
    cancelled = len([a for a in appts if a.get("status") == "cancelled"])
    confirmed = len([a for a in appts if a.get("status") == "confirmed"])
    emergency = len([a for a in appts if (a.get("severity", "").lower() in ["urgent", "critical", "high"]) or a.get("appointment_type") == "priority"])

    # Revenue and per-doctor earnings from completed appointments
    total_revenue = 0
    doctor_earnings = {}
    for a in completed_appts:
        try:
            fee = float(a.get("consultation_fee") or a.get("fee") or 0)
        except (ValueError, TypeError):
            fee = 0
        total_revenue += fee
        doc = a.get("doctor_name") or "Unknown"
        if doc not in doctor_earnings:
            doctor_earnings[doc] = {"name": doc, "total": 0, "count": 0, "specialization": a.get("specialization", "")}
        doctor_earnings[doc]["total"] += fee
        doctor_earnings[doc]["count"] += 1

    return jsonify({
        "appointments": appts,
        "stats": {
            "total": total,
            "completed": completed,
            "cancelled": cancelled,
            "confirmed": confirmed,
            "emergency": emergency,
            "totalRevenue": total_revenue,
            "doctorEarnings": doctor_earnings,
        }
    }), 200


@app.route("/admin/ai-analytics", methods=["GET"])
def admin_ai_analytics():
    """Get AI prediction analytics for admin panel."""
    appts = _load_all_appointments()
    # Count diseases
    disease_counts = {}
    confidence_scores = []
    for a in appts:
        d = a.get("disease", "").strip()
        if d:
            disease_counts[d] = disease_counts.get(d, 0) + 1
        score = a.get("confidence_score") or a.get("confidence")
        if score:
            try:
                confidence_scores.append(float(score))
            except (ValueError, TypeError):
                pass
    top_diseases = sorted(disease_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    avg_confidence = round(sum(confidence_scores) / len(confidence_scores), 2) if confidence_scores else 0
    # Distribution buckets
    dist = {"0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0}
    for s in confidence_scores:
        if s <= 25: dist["0-25"] += 1
        elif s <= 50: dist["26-50"] += 1
        elif s <= 75: dist["51-75"] += 1
        else: dist["76-100"] += 1
    return jsonify({
        "top_diseases": [{"disease": d, "count": c} for d, c in top_diseases],
        "total_predictions": len([a for a in appts if a.get("disease")]),
        "avg_confidence": avg_confidence,
        "confidence_distribution": dist,
        "total_appointments": len(appts),
    }), 200


@app.route("/admin/emergency", methods=["GET"])
def admin_emergency():
    """Get emergency cases for admin panel."""
    appts = _load_all_appointments()
    emergency = [a for a in appts if (a.get("severity", "").lower() in ["urgent", "critical", "high"]) or a.get("appointment_type") == "priority"]
    emergency.sort(key=lambda a: {"critical": 0, "urgent": 1, "high": 2}.get(a.get("severity", "").lower(), 3))
    return jsonify({"emergency_cases": emergency, "count": len(emergency)}), 200


@app.route("/admin/medicines", methods=["GET"])
def get_medicines():
    """Get all medicines in the database."""
    medicines = _load_json("medicines.json", [])
    return jsonify({"medicines": medicines}), 200


@app.route("/admin/medicines", methods=["POST"])
def add_medicine():
    """Add a new medicine."""
    try:
        data = request.get_json(force=True)
        medicines = _load_json("medicines.json", [])
        med = {
            "id": str(uuid.uuid4())[:8],
            "name": data.get("name", ""),
            "dosage": data.get("dosage", ""),
            "description": data.get("description", ""),
            "side_effects": data.get("side_effects", ""),
            "category": data.get("category", "general"),
            "created_at": datetime.now().isoformat(),
        }
        if not med["name"]:
            return jsonify({"error": "Medicine name is required"}), 400
        medicines.append(med)
        _save_json("medicines.json", medicines)
        return jsonify({"success": True, "medicine": med}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/admin/medicines/<med_id>", methods=["PUT"])
def update_medicine(med_id):
    """Update a medicine."""
    try:
        data = request.get_json(force=True)
        medicines = _load_json("medicines.json", [])
        for m in medicines:
            if m["id"] == med_id:
                m["name"] = data.get("name", m["name"])
                m["dosage"] = data.get("dosage", m["dosage"])
                m["description"] = data.get("description", m["description"])
                m["side_effects"] = data.get("side_effects", m["side_effects"])
                m["category"] = data.get("category", m.get("category", "general"))
                _save_json("medicines.json", medicines)
                return jsonify({"success": True, "medicine": m}), 200
        return jsonify({"error": "Medicine not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/admin/medicines/<med_id>", methods=["DELETE"])
def delete_medicine(med_id):
    """Delete a medicine."""
    medicines = _load_json("medicines.json", [])
    medicines = [m for m in medicines if m["id"] != med_id]
    _save_json("medicines.json", medicines)
    return jsonify({"success": True}), 200


@app.route("/admin/feedback", methods=["GET"])
def get_feedback():
    """Get all feedback and reviews."""
    feedback = _load_json("feedback.json", [])
    feedback.sort(key=lambda f: f.get("created_at", ""), reverse=True)
    return jsonify({"feedback": feedback}), 200


@app.route("/admin/feedback", methods=["POST"])
def add_feedback():
    """Add feedback entry."""
    try:
        data = request.get_json(force=True)
        feedback = _load_json("feedback.json", [])
        entry = {
            "id": str(uuid.uuid4())[:8],
            "patient_name": data.get("patient_name", ""),
            "doctor_name": data.get("doctor_name", ""),
            "rating": data.get("rating", 0),
            "review": data.get("review", ""),
            "type": data.get("type", "review"),
            "created_at": datetime.now().isoformat(),
        }
        feedback.append(entry)
        _save_json("feedback.json", feedback)
        return jsonify({"success": True, "entry": entry}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/admin/security-logs", methods=["GET"])
def get_security_logs():
    """Get security/audit logs."""
    logs = _load_json("security_logs.json", [])
    logs.sort(key=lambda l: l.get("timestamp", ""), reverse=True)
    return jsonify({"logs": logs}), 200


@app.route("/admin/security-logs", methods=["POST"])
def add_security_log():
    """Add a security log entry."""
    try:
        data = request.get_json(force=True)
        logs = _load_json("security_logs.json", [])
        entry = {
            "id": str(uuid.uuid4())[:8],
            "action": data.get("action", ""),
            "user": data.get("user", ""),
            "ip": data.get("ip", "127.0.0.1"),
            "status": data.get("status", "success"),
            "details": data.get("details", ""),
            "timestamp": datetime.now().isoformat(),
        }
        logs.append(entry)
        _save_json("security_logs.json", logs)
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/admin/settings", methods=["GET"])
def get_platform_settings():
    """Get platform settings."""
    settings = _load_json("platform_settings.json", {
        "maintenance_mode": False,
        "ai_prediction_enabled": True,
        "doctor_verification_required": True,
        "max_appointments_per_day": 50,
        "platform_name": "HealthPredict",
    })
    return jsonify({"settings": settings}), 200


@app.route("/admin/settings", methods=["POST"])
def update_platform_settings():
    """Update platform settings."""
    try:
        data = request.get_json(force=True)
        settings = _load_json("platform_settings.json", {
            "maintenance_mode": False,
            "ai_prediction_enabled": True,
            "doctor_verification_required": True,
            "max_appointments_per_day": 50,
            "platform_name": "HealthPredict",
        })
        for key in data:
            settings[key] = data[key]
        _save_json("platform_settings.json", settings)
        return jsonify({"success": True, "settings": settings}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/admin/specializations", methods=["GET"])
def get_specializations():
    """Get all specializations."""
    specs = _load_json("specializations.json", [
        {"id": "1", "name": "General Physician", "description": "Primary care"},
        {"id": "2", "name": "Cardiologist", "description": "Heart specialist"},
        {"id": "3", "name": "Dermatologist", "description": "Skin specialist"},
        {"id": "4", "name": "Neurologist", "description": "Brain & nerve specialist"},
        {"id": "5", "name": "Orthopedic", "description": "Bone & joint specialist"},
        {"id": "6", "name": "Pediatrician", "description": "Child specialist"},
        {"id": "7", "name": "Psychiatrist", "description": "Mental health specialist"},
        {"id": "8", "name": "ENT", "description": "Ear, nose & throat specialist"},
    ])
    return jsonify({"specializations": specs}), 200


@app.route("/admin/specializations", methods=["POST"])
def add_specialization():
    """Add a specialization."""
    try:
        data = request.get_json(force=True)
        specs = _load_json("specializations.json", [])
        spec = {
            "id": str(uuid.uuid4())[:8],
            "name": data.get("name", ""),
            "description": data.get("description", ""),
        }
        if not spec["name"]:
            return jsonify({"error": "Name is required"}), 400
        specs.append(spec)
        _save_json("specializations.json", specs)
        return jsonify({"success": True, "specialization": spec}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/admin/specializations/<spec_id>", methods=["PUT"])
def update_specialization(spec_id):
    """Update a specialization."""
    try:
        data = request.get_json(force=True)
        specs = _load_json("specializations.json", [])
        for s in specs:
            if s["id"] == spec_id:
                s["name"] = data.get("name", s["name"])
                s["description"] = data.get("description", s["description"])
                _save_json("specializations.json", specs)
                return jsonify({"success": True, "specialization": s}), 200
        return jsonify({"error": "Specialization not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/admin/specializations/<spec_id>", methods=["DELETE"])
def delete_specialization(spec_id):
    """Delete a specialization."""
    specs = _load_json("specializations.json", [])
    specs = [s for s in specs if s["id"] != spec_id]
    _save_json("specializations.json", specs)
    return jsonify({"success": True}), 200


# ── Business Analytics endpoints ───────────────────────────────────────────────

@app.route("/admin/business/revenue", methods=["GET"])
def admin_revenue():
    """Revenue analytics computed from appointments."""
    appts = _load_all_appointments()
    from datetime import datetime, timedelta
    today = datetime.now().date()
    month_start = today.replace(day=1)

    total_revenue = 0
    today_revenue = 0
    month_revenue = 0
    daily_map = {}  # last 30 days

    for a in appts:
        fee = 0
        try:
            fee = float(a.get("fee") or a.get("consultation_fee") or a.get("amount") or 500)
        except (ValueError, TypeError):
            fee = 500
        if a.get("status") in ("cancelled", "rejected"):
            continue
        total_revenue += fee
        dt_str = a.get("date") or a.get("created_at") or a.get("booked_at") or ""
        try:
            dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00")).date() if dt_str else None
        except Exception:
            dt = None
        if dt:
            if dt == today:
                today_revenue += fee
            if dt >= month_start:
                month_revenue += fee
            day_key = dt.isoformat()
            daily_map[day_key] = daily_map.get(day_key, 0) + fee

    # Build 30-day trend
    trend = []
    for i in range(29, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        trend.append({"date": d, "revenue": daily_map.get(d, 0)})

    active_appts = [a for a in appts if a.get("status") not in ("cancelled", "rejected")]
    avg_fee = round(total_revenue / max(len(active_appts), 1), 2)

    # Per-doctor earnings breakdown
    doctor_earnings = {}
    for a in active_appts:
        doc = a.get("doctor_name") or "Unknown"
        fee = 0
        try:
            fee = float(a.get("fee") or a.get("consultation_fee") or a.get("amount") or 0)
        except (ValueError, TypeError):
            pass
        if doc not in doctor_earnings:
            doctor_earnings[doc] = {"name": doc, "total": 0, "count": 0, "specialization": a.get("specialization", "")}
        doctor_earnings[doc]["total"] += fee
        doctor_earnings[doc]["count"] += 1

    return jsonify({
        "today": today_revenue,
        "month": month_revenue,
        "total": total_revenue,
        "avg_fee": avg_fee,
        "trend": trend,
        "doctor_earnings": sorted(doctor_earnings.values(), key=lambda x: -x["total"]),
    }), 200


@app.route("/admin/business/user-growth", methods=["GET"])
def admin_user_growth():
    """User growth analytics."""
    appts = _load_all_appointments()
    from datetime import datetime, timedelta
    today = datetime.now().date()
    month_start = today.replace(day=1)

    # Unique patients
    all_patients = set()
    today_patients = set()
    month_patients = set()
    daily_map = {}

    for a in appts:
        email = a.get("user_email") or a.get("patient_email") or ""
        name = a.get("user_name") or a.get("patient_name") or email
        key = email or name
        if not key:
            continue
        all_patients.add(key)
        dt_str = a.get("date") or a.get("created_at") or a.get("booked_at") or ""
        try:
            dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00")).date() if dt_str else None
        except Exception:
            dt = None
        if dt:
            if dt == today:
                today_patients.add(key)
            if dt >= month_start:
                month_patients.add(key)
            day_key = dt.isoformat()
            if day_key not in daily_map:
                daily_map[day_key] = set()
            daily_map[day_key].add(key)

    trend = []
    for i in range(29, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        trend.append({"date": d, "count": len(daily_map.get(d, set()))})

    return jsonify({
        "today": len(today_patients),
        "month": len(month_patients),
        "total": len(all_patients),
        "trend": trend,
    }), 200


@app.route("/admin/business/doctor-growth", methods=["GET"])
def admin_doctor_growth():
    """Doctor growth analytics."""
    appts = _load_all_appointments()
    from datetime import datetime, timedelta
    today = datetime.now().date()
    month_start = today.replace(day=1)

    all_doctors = set()
    today_doctors = set()
    month_doctors = set()
    daily_map = {}

    for a in appts:
        doc = a.get("doctor_name") or a.get("doctor") or ""
        if not doc:
            continue
        all_doctors.add(doc)
        dt_str = a.get("date") or a.get("created_at") or a.get("booked_at") or ""
        try:
            dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00")).date() if dt_str else None
        except Exception:
            dt = None
        if dt:
            if dt == today:
                today_doctors.add(doc)
            if dt >= month_start:
                month_doctors.add(doc)
            day_key = dt.isoformat()
            if day_key not in daily_map:
                daily_map[day_key] = set()
            daily_map[day_key].add(doc)

    trend = []
    for i in range(29, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        trend.append({"date": d, "count": len(daily_map.get(d, set()))})

    return jsonify({
        "today": len(today_doctors),
        "month": len(month_doctors),
        "total": len(all_doctors),
        "trend": trend,
    }), 200


@app.route("/admin/business/appointment-stats", methods=["GET"])
def admin_appointment_stats():
    """Appointment metrics for business analytics."""
    appts = _load_all_appointments()
    from datetime import datetime, timedelta
    today = datetime.now().date()
    month_start = today.replace(day=1)

    total = len(appts)
    today_count = 0
    month_count = 0
    status_map = {}
    daily_map = {}

    for a in appts:
        s = a.get("status", "pending")
        status_map[s] = status_map.get(s, 0) + 1
        dt_str = a.get("date") or a.get("created_at") or a.get("booked_at") or ""
        try:
            dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00")).date() if dt_str else None
        except Exception:
            dt = None
        if dt:
            if dt == today:
                today_count += 1
            if dt >= month_start:
                month_count += 1
            day_key = dt.isoformat()
            daily_map[day_key] = daily_map.get(day_key, 0) + 1

    trend = []
    for i in range(29, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        trend.append({"date": d, "count": daily_map.get(d, 0)})

    completion_rate = round((status_map.get("completed", 0) / max(total, 1)) * 100, 1)
    cancellation_rate = round((status_map.get("cancelled", 0) / max(total, 1)) * 100, 1)

    return jsonify({
        "today": today_count,
        "month": month_count,
        "total": total,
        "completion_rate": completion_rate,
        "cancellation_rate": cancellation_rate,
        "by_status": status_map,
        "trend": trend,
    }), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print("=" * 50)
    print("[+] HealthPredict AI Microservice v3.0")
    print(f"   Port: {port}")
    print("=" * 50)
    app.run(host="0.0.0.0", port=port, debug=False)
