"""
World-class Prescription OCR Service v4.0
=========================================
Pipeline:
  1. OpenCV preprocessing — deskew, denoise, CLAHE contrast, sharpen.
  2. Primary extraction — OpenAI GPT-4o vision with strict JSON schema.
  3. Fallback — Tesseract OCR + regex heuristic parser (only if vision
     yields low confidence or no medicines).
  4. Merge strategy — if both methods return partial data, merge.
  5. Drug enrichment — side effects + drug class for known medicines.

Supports: EN / HI / TA / TE / ML / KN / GU / PA / MR / BN / AR / FR / DE
and mixed-language prescriptions. Understands doctor shorthand
(BD / TDS / SOS / HS / OD / AC / PC / Stat) and dose patterns
(500mg, 1-0-1, 1 tab, 2 tsp).
"""

import os
import io
import re
import json
import base64
import logging
from typing import Optional

log = logging.getLogger("ocr_service")

# ─── Dependencies (graceful degradation) ──────────────────────────────────────
try:
    import cv2
    import numpy as np
    CV2_OK = True
except Exception:
    CV2_OK = False

try:
    from PIL import Image
    PIL_OK = True
except Exception:
    PIL_OK = False

try:
    import pytesseract
    pytesseract.get_tesseract_version()
    TESS_OK = True
except Exception:
    TESS_OK = False

try:
    from openai import OpenAI, APIError, RateLimitError
    OPENAI_SDK_OK = True
except Exception:
    OPENAI_SDK_OK = False

# ─── Configuration ────────────────────────────────────────────────────────────
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_VISION_MODEL = os.environ.get("OPENAI_VISION_MODEL", "gpt-4o")
OPENAI_VISION_MAX_TOKENS = int(os.environ.get("OPENAI_VISION_MAX_TOKENS", "1500"))

_client = None
if OPENAI_SDK_OK and OPENAI_API_KEY:
    try:
        _client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception as e:
        log.warning(f"OpenAI client init failed: {e}")
        _client = None


# ═══════════════════════════════════════════════════════════════════════════════
# A. IMAGE PREPROCESSING
# ═══════════════════════════════════════════════════════════════════════════════

MAX_DIM = 2000  # Cap resolution to control vision model cost + latency.


def preprocess_image(image_bytes: bytes) -> bytes:
    """Enhance a prescription image for better OCR/vision extraction.

    Steps: decode → resize → grayscale → denoise → CLAHE contrast →
    deskew → unsharp-mask sharpen → re-encode as PNG.

    Returns the original bytes if OpenCV is unavailable or decoding fails,
    so the pipeline always has something to send downstream.
    """
    if not CV2_OK:
        return image_bytes

    try:
        arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            return image_bytes

        # Cap resolution
        h, w = img.shape[:2]
        if max(h, w) > MAX_DIM:
            scale = MAX_DIM / max(h, w)
            img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)

        # Grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Denoise (preserves edges — good for text)
        denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)

        # Contrast — CLAHE handles uneven lighting well
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        contrasted = clahe.apply(denoised)

        # Deskew
        deskewed = _deskew(contrasted)

        # Sharpen (unsharp mask)
        blurred = cv2.GaussianBlur(deskewed, (0, 0), sigmaX=3)
        sharpened = cv2.addWeighted(deskewed, 1.5, blurred, -0.5, 0)

        ok, buf = cv2.imencode(".png", sharpened)
        return buf.tobytes() if ok else image_bytes
    except Exception as e:
        log.warning(f"preprocess_image failed: {e}")
        return image_bytes


def _deskew(gray):
    """Estimate skew angle via text-pixel minAreaRect and rotate."""
    try:
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
        coords = np.column_stack(np.where(thresh > 0))
        if coords.size == 0:
            return gray
        angle = cv2.minAreaRect(coords)[-1]
        angle = -(90 + angle) if angle < -45 else -angle
        # Only correct modest tilts — avoid accidental 90° flips
        if abs(angle) < 0.5 or abs(angle) > 20:
            return gray
        h, w = gray.shape[:2]
        M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
        return cv2.warpAffine(
            gray, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE,
        )
    except Exception:
        return gray


# ═══════════════════════════════════════════════════════════════════════════════
# B. OPENAI GPT-4o VISION EXTRACTION
# ═══════════════════════════════════════════════════════════════════════════════

VISION_SYSTEM_PROMPT = """You are a world-class pharmacist AI specialised in reading
handwritten and printed medical prescriptions from across the globe.

You fluently read prescriptions written in:
English, Hindi, Tamil, Telugu, Malayalam, Kannada, Gujarati, Punjabi,
Marathi, Bengali, Urdu, Arabic, French, German — and any mixture of scripts.

You understand doctor shorthand and abbreviations:
- OD = once daily
- BD / BID = twice daily
- TDS / TID = three times daily
- QID / QDS = four times daily
- SOS = as needed (when required)
- HS = at bedtime
- AC = before food
- PC / p.c. = after food
- Stat = immediately
- Rx = prescription; Cap = capsule; Tab = tablet; Inj = injection;
  Syp = syrup; Susp = suspension; Oint = ointment; Drops / gtt
- Dose patterns like "1-0-1", "1-1-1", "0-0-1" (morning-noon-night).
- Common Indian and international brand names:
  Crocin, Dolo, Augmentin, Panadol, Combiflam, Pantop, Pan-D, Voveran,
  Calpol, Allegra, Azithral, Meftal, Zerodol, Volini, Bandage etc.

TASK
----
Extract EVERY medicine visible in the prescription. Do not skip any.
Normalise names to a clean, human-readable form with strength if visible
(e.g. "Paracetamol 500mg"). If the name is written in a non-English script
or language, translate it to the standard English / Latin pharmaceutical
name. If useful, include the original form in parentheses.

Also extract: doctor name, hospital/clinic name, date, patient name,
any general notes or advice (follow-up, diet, warnings).

OUTPUT FORMAT (STRICT)
----------------------
Return ONLY a single valid JSON object. No markdown, no prose, no code fences.

{
  "medicines": [
    {
      "name": "Paracetamol 500mg",
      "dosage": "500mg",
      "frequency": "TDS",
      "duration": "5 days",
      "instructions": "After food"
    }
  ],
  "doctor_name": "Dr. Rajesh Kumar",
  "hospital_name": "Apollo Clinic",
  "date": "23/03/2026",
  "patient_name": "Sample Patient",
  "notes": "Review after 1 week",
  "confidence": 0.92
}

RULES
-----
- `confidence` is your self-assessed readability from 0.0 to 1.0.
  Use < 0.3 if the image is unreadable or clearly not a prescription.
- Use empty strings ("") for missing fields. Use [] for an empty medicines list.
- NEVER invent a medicine, dosage, or doctor name. If uncertain, leave blank.
- Keep frequency concise (e.g. "BD", "1-0-1"). Instructions go in `instructions`.
- If the image shows something that is NOT a prescription, still return the
  schema with empty fields and `confidence` below 0.2.
"""


def _extract_with_vision(image_bytes: bytes) -> dict:
    """Call GPT-4o vision and parse its JSON response."""
    if _client is None:
        return {"success": False, "error": "OPENAI_API_KEY is not configured"}

    # Detect mime
    mime = _sniff_mime(image_bytes)
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{mime};base64,{b64}"

    try:
        completion = _client.chat.completions.create(
            model=OPENAI_VISION_MODEL,
            max_tokens=OPENAI_VISION_MAX_TOKENS,
            temperature=0.1,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": VISION_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Extract the prescription below into the JSON schema. "
                                "Translate non-English medicine names to standard English. "
                                "Return JSON only."
                            ),
                        },
                        {"type": "image_url", "image_url": {"url": data_url, "detail": "high"}},
                    ],
                },
            ],
        )
        raw = (completion.choices[0].message.content or "").strip()
        extracted = _parse_json_safely(raw)
        if extracted is None:
            return {"success": False, "error": "Vision returned non-JSON output"}

        extracted = _normalise_extracted(extracted)
        return {"success": True, "extracted": extracted, "source": OPENAI_VISION_MODEL}
    except RateLimitError as e:
        return {"success": False, "error": f"rate_limited: {e}"}
    except APIError as e:
        return {"success": False, "error": f"openai_api_error: {e}"}
    except Exception as e:
        log.exception("vision extraction failed")
        return {"success": False, "error": f"vision_exception: {e}"}


def _sniff_mime(data: bytes) -> str:
    if len(data) >= 3 and data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if len(data) >= 8 and data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if len(data) >= 4 and data[:4] == b"RIFF":
        return "image/webp"
    return "image/png"


def _parse_json_safely(raw: str):
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?", "", raw).strip()
    raw = re.sub(r"```$", "", raw).strip()
    try:
        return json.loads(raw)
    except Exception:
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if not m:
            return None
        try:
            return json.loads(m.group(0))
        except Exception:
            return None


def _normalise_extracted(extracted: dict) -> dict:
    """Ensure every required field exists with the right type."""
    meds = extracted.get("medicines")
    if not isinstance(meds, list):
        meds = []

    clean_meds = []
    for m in meds:
        if not isinstance(m, dict):
            continue
        clean_meds.append({
            "name": str(m.get("name", "") or "").strip(),
            "dosage": str(m.get("dosage", "") or "").strip(),
            "frequency": str(m.get("frequency", "") or "").strip(),
            "duration": str(m.get("duration", "") or "").strip(),
            "instructions": str(m.get("instructions", "") or "").strip(),
        })

    # Drop entries with no name
    clean_meds = [m for m in clean_meds if m["name"]]

    try:
        confidence = float(extracted.get("confidence", 0.0) or 0.0)
    except Exception:
        confidence = 0.0
    confidence = max(0.0, min(1.0, confidence))

    return {
        "medicines": _enrich_medicines(clean_meds),
        "doctor_name": str(extracted.get("doctor_name", "") or "").strip(),
        "hospital_name": str(extracted.get("hospital_name", "") or "").strip(),
        "date": str(extracted.get("date", "") or "").strip(),
        "patient_name": str(extracted.get("patient_name", "") or "").strip(),
        "notes": str(extracted.get("notes", "") or "").strip(),
        "confidence": confidence,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# C. TESSERACT FALLBACK
# ═══════════════════════════════════════════════════════════════════════════════

# Brand/generic name list for the regex fallback. Not used by vision path.
MEDICINE_DB = [
    "Paracetamol", "Amoxicillin", "Ibuprofen", "Cetirizine", "Omeprazole", "Azithromycin",
    "Metformin", "Atorvastatin", "Amlodipine", "Losartan", "Metronidazole", "Ciprofloxacin",
    "Doxycycline", "Pantoprazole", "Ranitidine", "Domperidone", "Ondansetron", "Montelukast",
    "Salbutamol", "Prednisolone", "Atenolol", "Metoprolol", "Ramipril", "Telmisartan",
    "Glimepiride", "Levothyroxine", "Alprazolam", "Sertraline", "Escitalopram", "Acyclovir",
    "Fluconazole", "Albendazole", "Ivermectin", "Diclofenac", "Tramadol", "Furosemide",
    "Ceftriaxone", "Aspirin", "Crocin", "Dolo", "Combiflam", "Augmentin", "Panadol",
    "Pantop", "Pan D", "Voveran", "Calpol", "Allegra", "Azithral", "Meftal", "Zerodol",
]

DOSAGE_RE = re.compile(r"(\d+(?:\.\d+)?\s*(?:mg|mcg|ml|iu|g|%|tab(?:let)?s?|cap(?:sule)?s?))", re.I)
FREQ_RE = re.compile(
    r"\b(OD|BD|BID|TDS|TID|QID|QDS|SOS|HS|AC|PC|Stat|"
    r"once\s*daily|twice\s*daily|thrice\s*daily|four\s*times\s*daily|"
    r"at\s*night|at\s*bedtime|after\s*food|before\s*food|with\s*food|as\s*needed|"
    r"\d[-–]\d[-–]\d)\b",
    re.I,
)
DURATION_RE = re.compile(r"(\d+\s*(?:day[s]?|week[s]?|month[s]?)(?:\s*only)?|till\s*complete|as\s*directed)", re.I)
DOCTOR_RE = re.compile(r"\b(Dr\.?\s*[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})")
PATIENT_RE = re.compile(r"(?:patient\s*(?:name)?|name|pt\.?)\s*[:=\-]\s*([A-Za-z][A-Za-z\s]{1,40})", re.I)
DATE_RE = re.compile(r"\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b")


def _extract_with_tesseract(image_bytes: bytes) -> dict:
    """Text-based OCR fallback. Requires tesseract binary in PATH."""
    if not TESS_OK or not PIL_OK:
        return {"success": False, "error": "tesseract_unavailable", "extracted": {}}
    try:
        img = Image.open(io.BytesIO(image_bytes))
        raw_text = pytesseract.image_to_string(img, lang="eng")
        extracted = _parse_tesseract_text(raw_text)
        return {
            "success": True,
            "extracted": extracted,
            "source": "tesseract",
            "raw_text": raw_text,
        }
    except Exception as e:
        log.warning(f"tesseract failed: {e}")
        return {"success": False, "error": str(e), "extracted": {}}


def _parse_tesseract_text(text: str) -> dict:
    lines = [l.strip() for l in text.split("\n") if len(l.strip()) > 2]

    doctor_name = ""
    for line in lines[:10]:
        m = DOCTOR_RE.search(line)
        if m:
            doctor_name = m.group(1)
            break

    patient_name = ""
    for line in lines[:15]:
        m = PATIENT_RE.search(line)
        if m:
            patient_name = m.group(1).strip()[:50]
            break

    date = ""
    for line in lines[:15]:
        m = DATE_RE.search(line)
        if m:
            date = m.group(1)
            break

    medicines = []
    seen = set()
    upper = text.upper()
    for med in MEDICINE_DB:
        if med.upper() in upper:
            for line in lines:
                if med.upper() in line.upper() and med not in seen:
                    seen.add(med)
                    dosage = (DOSAGE_RE.search(line) or [""])[0] if DOSAGE_RE.search(line) else ""
                    freq = (FREQ_RE.search(line) or [""])[0] if FREQ_RE.search(line) else ""
                    duration = (DURATION_RE.search(line) or [""])[0] if DURATION_RE.search(line) else ""
                    medicines.append({
                        "name": med,
                        "dosage": dosage,
                        "frequency": freq,
                        "duration": duration,
                        "instructions": line[:100],
                    })
                    break

    return {
        "medicines": _enrich_medicines(medicines),
        "doctor_name": doctor_name,
        "hospital_name": "",
        "date": date,
        "patient_name": patient_name,
        "notes": "",
        "confidence": 0.5 if medicines else 0.1,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# D. DRUG KNOWLEDGE ENRICHMENT
# ═══════════════════════════════════════════════════════════════════════════════

DRUG_INFO = {
    "paracetamol": {"side_effects": ["Nausea", "Liver damage at high doses"], "drug_class": "Analgesic / Antipyretic"},
    "ibuprofen":   {"side_effects": ["Stomach upset", "Kidney issues"], "drug_class": "NSAID"},
    "amoxicillin": {"side_effects": ["Diarrhea", "Rash", "Allergic reaction"], "drug_class": "Antibiotic (Penicillin)"},
    "cetirizine":  {"side_effects": ["Drowsiness", "Dry mouth"], "drug_class": "Antihistamine"},
    "omeprazole":  {"side_effects": ["Headache", "Diarrhea"], "drug_class": "Proton Pump Inhibitor"},
    "azithromycin":{"side_effects": ["Nausea", "Diarrhea"], "drug_class": "Antibiotic (Macrolide)"},
    "metformin":   {"side_effects": ["Nausea", "Diarrhea"], "drug_class": "Antidiabetic"},
    "crocin":      {"side_effects": ["Nausea"], "drug_class": "Analgesic / Antipyretic"},
    "dolo":        {"side_effects": ["Nausea"], "drug_class": "Analgesic / Antipyretic"},
    "pantoprazole":{"side_effects": ["Headache", "Diarrhea"], "drug_class": "Proton Pump Inhibitor"},
    "amlodipine":  {"side_effects": ["Ankle swelling", "Flushing"], "drug_class": "Calcium Channel Blocker"},
    "atorvastatin":{"side_effects": ["Muscle pain", "Raised liver enzymes"], "drug_class": "Statin"},
    "ciprofloxacin":{"side_effects": ["Nausea", "Tendon issues"], "drug_class": "Antibiotic (Fluoroquinolone)"},
    "diclofenac":  {"side_effects": ["Stomach upset", "Kidney issues"], "drug_class": "NSAID"},
    "augmentin":   {"side_effects": ["Diarrhea", "Rash"], "drug_class": "Antibiotic (Amox + Clavulanate)"},
}


def _enrich_medicines(medicines: list) -> list:
    """Attach side-effect + drug-class info to known medicines."""
    enriched = []
    for med in medicines:
        name = (med.get("name") or "").strip()
        key = _drug_lookup_key(name)
        info = DRUG_INFO.get(key, {})
        enriched.append({
            **med,
            "side_effects": info.get("side_effects", []),
            "drug_class": info.get("drug_class", ""),
        })
    return enriched


def _drug_lookup_key(name: str) -> str:
    """Turn 'Paracetamol 500mg (Crocin)' → 'paracetamol'."""
    n = name.lower()
    n = re.sub(r"\(.*?\)", " ", n)
    n = re.sub(r"[^a-z\s]", " ", n)
    tokens = [t for t in n.split() if len(t) > 2]
    for t in tokens:
        if t in DRUG_INFO:
            return t
    return tokens[0] if tokens else ""


# ═══════════════════════════════════════════════════════════════════════════════
# E. RESULT MERGING
# ═══════════════════════════════════════════════════════════════════════════════

def _merge_results(primary: dict, secondary: dict) -> dict:
    """Fill primary's empty fields from secondary. Union of medicine lists."""
    merged = dict(primary)
    for key in ("doctor_name", "hospital_name", "date", "patient_name", "notes"):
        if not merged.get(key):
            merged[key] = secondary.get(key, "")

    seen_names = {_drug_lookup_key(m.get("name", "")) for m in merged.get("medicines", []) if m.get("name")}
    for med in secondary.get("medicines", []):
        key = _drug_lookup_key(med.get("name", ""))
        if key and key not in seen_names:
            merged.setdefault("medicines", []).append(med)
            seen_names.add(key)

    merged["medicines"] = _enrich_medicines(merged.get("medicines", []))
    return merged


# ═══════════════════════════════════════════════════════════════════════════════
# F. PUBLIC ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

MIN_ACCEPTABLE_CONFIDENCE = 0.35


def extract_prescription(image_data: bytes, filename: str = "") -> dict:
    """Extract structured prescription data from raw image bytes.

    Strategy:
      1. Preprocess image (OpenCV).
      2. Run GPT-4o vision.
      3. If vision yields medicines and confidence ≥ threshold → return.
      4. Else run Tesseract fallback and merge with whatever vision gave.
      5. If both produce nothing useful → return structured error.
    """
    if not image_data:
        return {
            "success": False,
            "readable": False,
            "error": "No image data received.",
            "extracted": _empty_schema(),
        }

    processed = preprocess_image(image_data)

    vision = _extract_with_vision(processed) if _client else None
    vision_ok = bool(
        vision
        and vision.get("success")
        and vision.get("extracted", {}).get("medicines")
        and vision["extracted"].get("confidence", 0.0) >= MIN_ACCEPTABLE_CONFIDENCE
    )

    if vision_ok:
        return {
            "success": True,
            "readable": True,
            "method_used": vision.get("source", "openai_vision"),
            "extracted": vision["extracted"],
        }

    # Fallback path
    tesseract = _extract_with_tesseract(processed) if TESS_OK else None

    if vision and vision.get("extracted") and tesseract and tesseract.get("success"):
        merged = _merge_results(vision["extracted"], tesseract["extracted"])
        return {
            "success": True,
            "readable": bool(merged.get("medicines")),
            "method_used": "vision+tesseract_merge",
            "extracted": merged,
        }

    if vision and vision.get("success") and vision.get("extracted"):
        return {
            "success": True,
            "readable": bool(vision["extracted"].get("medicines")),
            "method_used": vision.get("source", "openai_vision"),
            "extracted": vision["extracted"],
            "low_confidence": True,
        }

    if tesseract and tesseract.get("success"):
        return {
            "success": True,
            "readable": bool(tesseract["extracted"].get("medicines")),
            "method_used": "tesseract",
            "extracted": tesseract["extracted"],
        }

    err = "OCR extraction failed."
    if vision and vision.get("error"):
        err = f"Vision: {vision['error']}"
        if not _client:
            err = "OPENAI_API_KEY is not configured in ml_service/.env."

    return {
        "success": False,
        "readable": False,
        "error": err,
        "extracted": _empty_schema(),
    }


def _empty_schema() -> dict:
    return {
        "medicines": [],
        "doctor_name": "",
        "hospital_name": "",
        "date": "",
        "patient_name": "",
        "notes": "",
        "confidence": 0.0,
    }
