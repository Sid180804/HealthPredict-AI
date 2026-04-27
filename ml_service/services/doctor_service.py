"""
Dynamic Doctor Discovery & Appointment Service v3.0
Day-based availability, Sunday priority slots, severity-based booking,
timeline integration, full CRUD appointment management.
"""

import json
import os
import uuid
from pathlib import Path
from datetime import datetime, timedelta

DATA_DIR = Path(__file__).parent.parent / "data"
BOOKINGS_FILE = DATA_DIR / "bookings.json"

# Path to Node backend's appointments.json for cross-server sync
NODE_BACKEND_APPTS = Path(__file__).parent.parent.parent / "backend-node" / "data" / "appointments.json"

# ── Load doctors from JSON ─────────────────────────────────────────────────────
def _load_doctors():
    path = DATA_DIR / "doctors.json"
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return []


def _load_bookings():
    if BOOKINGS_FILE.exists():
        with open(BOOKINGS_FILE) as f:
            return json.load(f)
    return {}


def _save_bookings(bookings):
    BOOKINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(BOOKINGS_FILE, 'w') as f:
        json.dump(bookings, f, indent=2)
    # Sync to Node backend so /api/doctor/appointments works
    _sync_to_node_backend(bookings)


def _sync_to_node_backend(bookings):
    """Write bookings as a list to the Node backend's appointments.json.
    The Node doctorController reads appointments by doctorId (user.id),
    so we include both doctor_name and user_id fields for flexible matching.
    """
    try:
        appts_list = list(bookings.values()) if isinstance(bookings, dict) else bookings
        # Map booking fields to Node backend format
        node_appts = []
        for b in appts_list:
            node_appts.append({
                **b,
                # Node backend filters by doctorId — use doctor_name as fallback ID
                "doctorId": b.get("doctor_name", ""),
                "patientId": b.get("user_id") or b.get("user_email", ""),
                "appointment_date": b.get("date", ""),
            })
        NODE_BACKEND_APPTS.parent.mkdir(parents=True, exist_ok=True)
        with open(NODE_BACKEND_APPTS, 'w') as f:
            json.dump({"appointments": node_appts}, f, indent=2)
    except Exception:
        pass  # Don't break booking if Node sync fails


# ── Expanded Disease → Specialist mapping ─────────────────────────────────────
DISEASE_SPECIALIST_MAP = {
    "cardiologist": [
        "heart attack", "angina", "hypertension", "variceal", "cardiac",
        "heart disease", "heart failure", "arrhythmia", "coronary", "myocardial",
        "chest pain", "palpitations", "high blood pressure"
    ],
    "pulmonologist": [
        "asthma", "tuberculosis", "pneumonia", "respiratory", "breathing",
        "bronchitis", "copd", "lung", "pulmonary", "wheezing",
        "shortness of breath", "sleep apnea"
    ],
    "pediatrician": [
        "child", "infant", "pediatric", "neonatal", "childhood"
    ],
    "dermatologist": [
        "fungal", "acne", "psoriasis", "impetigo", "skin",
        "eczema", "dermatitis", "rash", "hives", "warts",
        "skin allergy", "ringworm", "vitiligo"
    ],
    "gastroenterologist": [
        "gerd", "gastroenteritis", "peptic", "hepatitis", "jaundice",
        "alcoholic", "liver", "ulcer", "ibs", "crohn",
        "colitis", "acid reflux", "gallstone", "pancreatitis"
    ],
    "endocrinologist": [
        "diabetes", "hypothyroid", "hyperthyroid", "hypoglycemia", "thyroid",
        "pcos", "hormonal", "metabolic", "insulin", "obesity",
        "cushing", "addison", "growth hormone"
    ],
    "neurologist": [
        "migraine", "paralysis", "vertigo", "epilepsy", "cervical spondylosis",
        "headache", "seizure", "stroke", "parkinson", "alzheimer",
        "neuropathy", "multiple sclerosis", "tremor", "brain"
    ],
    "orthopedist": [
        "arthritis", "osteoarthritis", "bone", "joint pain", "fracture",
        "back pain", "spondylitis", "knee pain", "sports injury",
        "spinal", "disc", "ligament", "tendon", "shoulder pain"
    ],
    "allergist": [
        "allergy", "drug reaction", "allergic", "anaphylaxis",
        "food allergy", "hay fever", "sinusitis", "urticaria"
    ],
    "general physician": [
        "cold", "flu", "dengue", "typhoid", "malaria", "chicken pox", "viral",
        "fever", "cough", "common cold", "infection", "weakness",
        "fatigue", "body ache", "dehydration", "food poisoning"
    ],
    "urologist": [
        "urinary tract infection", "bladder", "kidney stone",
        "prostate", "uti", "kidney", "renal"
    ],
    "gynecologist": [
        "period pain", "menstrual", "pcos", "pregnancy", "ovarian",
        "uterine", "cervical", "menopause", "endometriosis",
        "irregular periods", "vaginal", "breast", "fertility"
    ],
    "psychologist": [
        "mental stress", "anxiety", "depression", "panic",
        "ptsd", "ocd", "phobia", "insomnia", "burnout",
        "emotional", "counseling", "therapy"
    ],
    "psychiatrist": [
        "bipolar", "schizophrenia", "psychosis", "severe depression",
        "suicidal", "mania", "delusional", "personality disorder"
    ],
}

# Severity keywords that trigger priority booking
SEVERITY_PRIORITY_KEYWORDS = {
    "high": ["heart attack", "stroke", "severe", "critical", "emergency", "acute"],
    "critical": ["cardiac arrest", "anaphylaxis", "seizure", "unconscious"],
    "urgent": ["bleeding", "fracture", "high fever", "chest pain", "breathing difficulty"],
}

HOSPITALS_NEARBY = [
    {"name": "City General Hospital", "phone": "1800-123-456", "address": "100 Medical Drive", "distance_km": 1.5, "emergency": True},
    {"name": "Apollo Hospital", "phone": "1860-500-1066", "address": "200 Health Road", "distance_km": 2.8, "emergency": True},
    {"name": "AIIMS Emergency", "phone": "011-26588500", "address": "Ansari Nagar, New Delhi", "distance_km": 3.0, "emergency": True},
    {"name": "Max Super Speciality Hospital", "phone": "011-26515050", "address": "Saket, New Delhi", "distance_km": 3.5, "emergency": True},
    {"name": "Fortis Hospital", "phone": "1800-103-4720", "address": "Vasant Kunj, New Delhi", "distance_km": 4.0, "emergency": True},
]


def recommend_specialist(disease_name: str) -> dict:
    """Map disease name to recommended specialist type with priority info."""
    disease_lower = disease_name.lower()
    specialist = "General Physician"
    is_priority = False
    severity_level = "normal"

    for spec, keywords in DISEASE_SPECIALIST_MAP.items():
        if any(kw in disease_lower for kw in keywords):
            specialist = spec.title()
            break

    # Check severity
    for level, keywords in SEVERITY_PRIORITY_KEYWORDS.items():
        if any(kw in disease_lower for kw in keywords):
            is_priority = True
            severity_level = level
            break

    return {
        "specialist": specialist,
        "is_priority": is_priority,
        "severity_level": severity_level,
        "message": f"Recommended: {specialist}" + (" (Priority consultation recommended)" if is_priority else ""),
    }


def get_doctors(specialty: str = None, max_distance: float = None,
                min_rating: float = None, language: str = None,
                video_only: bool = False, location: str = None,
                min_experience: int = None) -> list:
    """Get filtered list of doctors."""
    doctors = _load_doctors()

    if specialty:
        spec_lower = specialty.lower()
        doctors = [d for d in doctors if spec_lower in d.get("specialization", "").lower()]

    if max_distance is not None:
        doctors = [d for d in doctors if d.get("distance_km", 99) <= max_distance]

    if min_rating is not None:
        doctors = [d for d in doctors if d.get("rating", 0) >= min_rating]

    if language:
        doctors = [d for d in doctors if language in d.get("languages", [])]

    if video_only:
        doctors = [d for d in doctors if d.get("video_consultation", False)]

    if location:
        loc_lower = location.lower()
        doctors = [d for d in doctors if loc_lower in d.get("location", "").lower()
                   or loc_lower in d.get("address", "").lower()]

    if min_experience is not None:
        doctors = [d for d in doctors if d.get("experience_years", 0) >= min_experience]

    doctors.sort(key=lambda x: (-x.get("rating", 0), x.get("distance_km", 99)))
    return doctors


def get_doctor_by_id(doctor_id: int) -> dict:
    """Get specific doctor by ID."""
    doctors = _load_doctors()
    return next((d for d in doctors if d["id"] == doctor_id), None)


def get_available_slots(doctor_id: int, date: str = None) -> dict:
    """Get available slots for a doctor, filtered by booked slots."""
    doctor = get_doctor_by_id(doctor_id)
    if not doctor:
        return {"error": "Doctor not found"}

    all_slots = doctor.get("available_slots", {})

    # Load bookings and filter out booked slots
    bookings = _load_bookings()
    booked = {}
    for bk in bookings.values():
        if bk.get("doctor_id") == doctor_id and bk.get("status") != "cancelled":
            d = bk.get("date", "")
            t = bk.get("time", "")
            if d not in booked:
                booked[d] = []
            booked[d].append(t)

    available = {}
    for d, slots in all_slots.items():
        if date and d != date:
            continue
        booked_times = booked.get(d, [])
        free = [s for s in slots if s not in booked_times]
        if free:
            available[d] = free

    return {"doctor_id": doctor_id, "doctor_name": doctor.get("name"), "available_slots": available}


def generate_future_slots(doctor_id: int, days_ahead: int = 7) -> dict:
    """Generate available slots for the next N days from day-based availability schedule."""
    doctor = get_doctor_by_id(doctor_id)
    if not doctor:
        return {}

    availability = doctor.get("availability", {})
    if not availability:
        # Fallback to old available_slots format
        existing = doctor.get("available_slots", {})
        template = None
        for slots in existing.values():
            if slots:
                template = slots
                break
        if not template:
            template = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
                        "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM"]

        today = datetime.now().date()
        generated = {}
        for i in range(days_ahead):
            d = today + timedelta(days=i)
            if d.weekday() < 6:
                date_str = d.isoformat()
                generated[date_str] = template[:]
        return _filter_booked_slots(doctor_id, generated)

    # Day name mapping
    DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    today = datetime.now().date()
    generated = {}

    for i in range(days_ahead):
        d = today + timedelta(days=i)
        day_name = DAY_NAMES[d.weekday()]
        date_str = d.isoformat()

        day_schedule = availability.get(day_name)
        if day_schedule is None:
            continue

        if isinstance(day_schedule, dict):
            # Sunday-style special slots
            slots = day_schedule.get("special_slots", [])
            slot_type = day_schedule.get("slot_type", "normal")
            generated[date_str] = {
                "slots": slots[:],
                "slot_type": slot_type,
                "is_sunday": day_name == "Sunday",
                "day_name": day_name,
            }
        elif isinstance(day_schedule, list):
            generated[date_str] = {
                "slots": day_schedule[:],
                "slot_type": "normal",
                "is_sunday": False,
                "day_name": day_name,
            }

    # Remove booked slots
    return _filter_booked_slots_v2(doctor_id, generated)


def _filter_booked_slots(doctor_id, generated):
    """Remove booked slots from simple generated dict."""
    bookings = _load_bookings()
    for bk in bookings.values():
        if bk.get("doctor_id") == doctor_id and bk.get("status") != "cancelled":
            bd = bk.get("date", "")
            bt = bk.get("time", "")
            if bd in generated and bt in generated[bd]:
                generated[bd].remove(bt)
    return generated


def _filter_booked_slots_v2(doctor_id, generated):
    """Remove booked slots from v2 generated dict (with metadata)."""
    bookings = _load_bookings()
    for bk in bookings.values():
        if bk.get("doctor_id") == doctor_id and bk.get("status") != "cancelled":
            bd = bk.get("date", "")
            bt = bk.get("time", "")
            if bd in generated and bt in generated[bd].get("slots", []):
                generated[bd]["slots"].remove(bt)
    # Remove dates with no available slots
    return {d: v for d, v in generated.items() if v.get("slots")}


def book_appointment(data: dict) -> dict:
    """Book an appointment slot with timeline integration."""
    doctor_id = data.get("doctor_id")
    user_name = data.get("user_name", "Patient")
    user_email = data.get("user_email", "")
    user_id = data.get("user_id", user_email or "default")
    date = data.get("date", "")
    time = data.get("time", "")
    symptoms = data.get("symptoms", [])
    disease = data.get("disease", "")
    consultation_type = data.get("consultation_type", "in_person")
    appointment_type = data.get("appointment_type", "normal")
    severity = data.get("severity", "")

    doctor = get_doctor_by_id(doctor_id)
    if not doctor:
        return {"success": False, "error": "Doctor not found"}

    # Check slot availability via future slots
    future = generate_future_slots(doctor_id, 14)
    available_day = future.get(date, {})
    available_slots = available_day.get("slots", []) if isinstance(available_day, dict) else available_day
    if time and time not in available_slots:
        return {"success": False, "error": f"Slot {time} on {date} is not available"}

    booking_id = str(uuid.uuid4())[:8].upper()
    bookings = _load_bookings()
    bookings[booking_id] = {
        "booking_id": booking_id,
        "doctor_id": doctor_id,
        "doctor_name": doctor.get("name"),
        "specialization": doctor.get("specialization"),
        "clinic": doctor.get("clinic"),
        "address": doctor.get("address"),
        "user_name": user_name,
        "user_email": user_email,
        "user_id": user_id,
        "date": date,
        "time": time,
        "symptoms": symptoms,
        "disease": disease,
        "consultation_type": consultation_type,
        "appointment_type": appointment_type,
        "severity": severity,
        "consultation_fee": doctor.get("consultation_fee", 0),
        "status": "confirmed",
        "created_at": datetime.now().isoformat(),
        "video_link": f"https://meet.healthassist.ai/{booking_id}" if consultation_type == "video" else None,
    }
    _save_bookings(bookings)

    # Auto-add to health timeline
    try:
        from services import timeline_service
        timeline_service.add_event(
            user_id,
            "appointment",
            f"Appointment booked with {doctor.get('name')}",
            f"{doctor.get('specialization')} · {date} at {time} · "
            f"{'Video' if consultation_type == 'video' else 'Clinic'} · "
            f"{'For: ' + disease if disease else 'General consultation'}",
            {"booking_id": booking_id, "doctor_id": doctor_id}
        )
    except Exception:
        pass  # Timeline integration is optional, don't block booking

    return {
        "success": True,
        "booking_id": booking_id,
        "appointment": bookings[booking_id],
        "message": f"Appointment confirmed with {doctor.get('name')} on {date} at {time}",
        "reminder": "Please arrive 10 minutes early. Bring valid ID and previous prescriptions.",
    }


def get_user_appointments(user_name: str = None, user_email: str = None, status: str = None) -> list:
    """Get all appointments for a user (match by name OR email)."""
    bookings = _load_bookings()
    results = []
    for b in bookings.values():
        name_match = user_name and b.get("user_name", "").lower() == user_name.lower()
        email_match = user_email and b.get("user_email", "").lower() == user_email.lower()
        if name_match or email_match:
            results.append(b)
    if status:
        results = [b for b in results if b.get("status") == status]
    results.sort(key=lambda x: x.get("date", "") + x.get("time", ""), reverse=True)
    return results


def get_doctor_appointments(doctor_id: int = None, doctor_name: str = None,
                            date: str = None, status: str = None) -> list:
    """Get appointments for a doctor (for doctor dashboard)."""
    bookings = _load_bookings()
    results = []
    for b in bookings.values():
        id_match = doctor_id is not None and b.get("doctor_id") == doctor_id
        name_match = doctor_name and doctor_name.lower() in b.get("doctor_name", "").lower()
        if id_match or name_match:
            results.append(b)
    if date:
        results = [b for b in results if b.get("date") == date]
    if status:
        results = [b for b in results if b.get("status") == status]
    results.sort(key=lambda x: x.get("date", "") + x.get("time", ""))
    return results


def update_appointment_status(booking_id: str, status: str, notes: str = None) -> dict:
    """Update appointment status (confirmed/completed/cancelled) and add doctor notes."""
    bookings = _load_bookings()
    if booking_id not in bookings:
        return {"success": False, "error": "Booking not found"}

    bookings[booking_id]["status"] = status
    if notes:
        bookings[booking_id]["doctor_notes"] = notes
    bookings[booking_id]["updated_at"] = datetime.now().isoformat()
    _save_bookings(bookings)

    # Add timeline event for status change
    try:
        from services import timeline_service
        bk = bookings[booking_id]
        uid = bk.get("user_id", bk.get("user_email", "default"))
        if status == "completed":
            timeline_service.add_event(
                uid, "appointment",
                f"Appointment completed with {bk.get('doctor_name')}",
                f"{bk.get('specialization')} · {'Notes: ' + notes if notes else 'No notes added'}",
                {"booking_id": booking_id}
            )
        elif status == "cancelled":
            timeline_service.add_event(
                uid, "appointment",
                f"Appointment cancelled — {bk.get('doctor_name')}",
                f"Originally scheduled for {bk.get('date')} at {bk.get('time')}",
                {"booking_id": booking_id}
            )
    except Exception:
        pass

    return {"success": True, "appointment": bookings[booking_id]}


def get_nearby_hospitals(max_distance: float = 10) -> list:
    return [h for h in HOSPITALS_NEARBY if h.get("distance_km", 99) <= max_distance]
