"""
Multilingual AI Health Chatbot Service v6.0
Uses OpenAI (gpt-4o-mini) for high-quality, multilingual, medically-safe responses.
Auto-detects language and responds in the same language.
Supports text + optional image (vision) input.
"""

import os
import time
import base64
from openai import OpenAI, APIError, RateLimitError

# ─── Configuration ──────────────────────────────────────────────────────────────
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_MAX_TOKENS = int(os.environ.get("OPENAI_MAX_TOKENS", "900"))
OPENAI_TEMPERATURE = float(os.environ.get("OPENAI_TEMPERATURE", "0.6"))

_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

try:
    from langdetect import detect as detect_lang, DetectorFactory
    DetectorFactory.seed = 0
    LANGDETECT_OK = True
except Exception:
    LANGDETECT_OK = False

# ─── Language Configuration (15+ languages) ─────────────────────────────────────
LANGUAGE_CONFIG = {
    "en": {"name": "English",    "native": "English"},
    "hi": {"name": "Hindi",      "native": "हिन्दी"},
    "ta": {"name": "Tamil",      "native": "தமிழ்"},
    "te": {"name": "Telugu",     "native": "తెలుగు"},
    "ml": {"name": "Malayalam",  "native": "മലയാളം"},
    "kn": {"name": "Kannada",    "native": "ಕನ್ನಡ"},
    "pa": {"name": "Punjabi",    "native": "ਪੰਜਾਬੀ"},
    "gu": {"name": "Gujarati",   "native": "ગુજરાતી"},
    "mr": {"name": "Marathi",    "native": "मराठी"},
    "bn": {"name": "Bengali",    "native": "বাংলা"},
    "ur": {"name": "Urdu",       "native": "اردو"},
    "es": {"name": "Spanish",    "native": "Español"},
    "fr": {"name": "French",     "native": "Français"},
    "de": {"name": "German",     "native": "Deutsch"},
    "ar": {"name": "Arabic",     "native": "العربية"},
    "pt": {"name": "Portuguese", "native": "Português"},
    "ru": {"name": "Russian",    "native": "Русский"},
    "zh-cn": {"name": "Chinese", "native": "中文"},
    "ja": {"name": "Japanese",   "native": "日本語"},
}

# ─── Emergency Detection ────────────────────────────────────────────────────────
EMERGENCY_TERMS = [
    # English
    "chest pain", "heart attack", "stroke", "seizure", "unconscious",
    "not breathing", "can't breathe", "cannot breathe", "severe bleeding",
    "bleeding heavily", "overdose", "suicide", "kill myself", "end my life",
    "poisoning", "paralysis", "collapsed", "severe chest pain",
    "choking", "anaphylaxis", "no pulse",
    # Hindi
    "सीने में दर्द", "दिल का दौरा", "सांस नहीं", "बेहोश", "खून बहना",
    # Spanish / French / German / Arabic (core terms)
    "dolor en el pecho", "infarto", "ataque cardíaco",
    "douleur thoracique", "crise cardiaque",
    "herzinfarkt", "brustschmerz",
    "ألم في الصدر", "نوبة قلبية",
]

EMERGENCY_HELPLINES = {
    "ambulance_india": "108",
    "general_emergency_india": "112",
    "health_helpline_india": "104",
    "mental_health_india": "Vandrevala Foundation: 1860-2662-345",
    "poison_control_india": "1800-116-117",
}


def _detect_language(text):
    """Detect the ISO-639 language code of the text; fall back to English."""
    if not LANGDETECT_OK or not text.strip():
        return "en"
    try:
        code = detect_lang(text)
        # Normalise langdetect codes to our config
        if code == "zh-cn" or code == "zh-tw":
            return "zh-cn"
        return code if code in LANGUAGE_CONFIG else "en"
    except Exception:
        return "en"


def _detect_emergency(message):
    msg_lower = message.lower()
    return any(term.lower() in msg_lower for term in EMERGENCY_TERMS)


# ─── System Prompt ──────────────────────────────────────────────────────────────
def _build_system_prompt(lang_name, lang_native, is_emergency):
    emergency_block = ""
    if is_emergency:
        emergency_block = (
            "\n\nTHIS MESSAGE APPEARS TO DESCRIBE A MEDICAL EMERGENCY.\n"
            "- Open your reply with a clear, calm emergency alert.\n"
            "- Tell the user to call local emergency services IMMEDIATELY "
            "(India: 108 Ambulance / 112 Emergency; US: 911; UK: 999; EU: 112).\n"
            "- Give 2-4 critical first-aid steps for the described situation.\n"
            "- Do NOT delay by asking long clarifying questions first.\n"
        )

    return f"""You are MedAI, a world-class, empathetic, multilingual AI medical assistant.
You help patients understand symptoms, conditions, medicines, precautions, diet,
fitness, and mental wellness — and guide them to the right specialist or care level.

LANGUAGE RULES (CRITICAL):
- The user's language is {lang_name} ({lang_native}).
- Respond ENTIRELY in {lang_name}. Every sentence, every word, including headings.
- If the user mixes languages (e.g. Hinglish), reply in the SAME mixed style.
- Never switch languages mid-reply unless the user does.

MEDICAL SCOPE — answer clearly and helpfully on:
1. Symptoms and what conditions they MIGHT indicate (possibilities, not diagnoses).
2. Diseases: what they are, causes, risk factors, typical course.
3. Medicines: general category, common uses, common side effects, interactions —
   NEVER prescribe a specific drug or dosage. Always defer dosing to a doctor.
4. Precautions, home-care, lifestyle changes, red-flag warning signs.
5. Diet & nutrition tailored to the condition.
6. Fitness & physical activity suitable for the condition.
7. Mental wellness: anxiety, stress, sleep, low mood — with compassion.
8. Which doctor specialty to consult (e.g. cardiologist, dermatologist, ENT).

SAFETY RULES (NON-NEGOTIABLE):
- You are NOT a doctor. You do NOT diagnose. You do NOT prescribe.
- Never invent medicine names, dosages, or brand names.
- Never tell a user to stop prescribed medication.
- For serious, worsening, or red-flag symptoms, advise seeing a doctor urgently.
- For suicidal ideation or self-harm: respond with warmth, do NOT judge, share
  a helpline, and urge them to reach a trusted person or professional now.
- End each substantive reply with a short disclaimer that this is general
  guidance and a real doctor should be consulted for diagnosis or treatment.

STYLE:
- Warm, calm, professional. Plain language. No heavy jargon.
- Structure longer answers with short sections or bullets.
- Keep replies focused — typically 4-10 short sentences unless more detail is asked.
- If the user's message is unclear, ask ONE concise clarifying question.
- If the user asks something unrelated to health, gently steer back to health topics.{emergency_block}"""


# ─── Message Formatting ─────────────────────────────────────────────────────────
def _format_history(conversation_history):
    """Convert incoming history into OpenAI chat-completion message format."""
    formatted = []
    for msg in conversation_history[-10:]:
        role_in = msg.get("role", "user")
        role = "assistant" if role_in in ("bot", "model", "assistant") else "user"
        content = msg.get("content") or msg.get("text") or ""
        if content.strip():
            formatted.append({"role": role, "content": content})
    return formatted


def _build_user_content(user_message, image=None):
    """Build the user content block. Supports text-only or text+image."""
    if not image:
        return user_message

    # image is a dict: {"base64": "...", "mime_type": "image/png"}
    b64 = image.get("base64", "")
    mime = image.get("mime_type", "image/png")
    if not b64:
        return user_message

    data_url = f"data:{mime};base64,{b64}"
    return [
        {"type": "text", "text": user_message or "Please analyse this image."},
        {"type": "image_url", "image_url": {"url": data_url}},
    ]


# ─── Main Chat Function ─────────────────────────────────────────────────────────
def chat_with_ai(user_message, conversation_history=None, language="auto", image=None):
    """
    Args:
        user_message (str): current user message.
        conversation_history (list): prior turns: [{"role": "user"|"bot", "content": "..."}].
        language (str): "auto" to detect, or a language code (e.g. "hi", "es").
        image (dict|None): optional {"base64": str, "mime_type": str} for vision.

    Returns:
        dict with response, detected_language, language_name, source,
        is_emergency, and emergency details if applicable.
    """
    conversation_history = conversation_history or []

    # 1. Language
    detected_lang = _detect_language(user_message) if language == "auto" else language
    lang_info = LANGUAGE_CONFIG.get(detected_lang, LANGUAGE_CONFIG["en"])

    # 2. Emergency
    is_emergency = _detect_emergency(user_message)
    emergency_info = {}
    if is_emergency:
        emergency_info = {
            "is_emergency": True,
            "message": "Possible medical emergency detected. Call 108 (India), 911 (US), or your local emergency number immediately.",
            "helplines": EMERGENCY_HELPLINES,
        }

    # 3. Guard: missing API key
    if _client is None:
        return {
            "response": (
                "The chatbot is not configured. An OpenAI API key is missing. "
                "Please set OPENAI_API_KEY in ml_service/.env and restart the service."
            ),
            "detected_language": detected_lang,
            "language_name": lang_info["name"],
            "source": "config_error",
            "emergency": emergency_info,
            "is_emergency": is_emergency,
        }

    # 4. Messages
    system_prompt = _build_system_prompt(
        lang_info["name"], lang_info["native"], is_emergency
    )
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(_format_history(conversation_history))
    messages.append({"role": "user", "content": _build_user_content(user_message, image)})

    # 5. Call OpenAI with retries on transient failures
    last_error = None
    for attempt in range(3):
        try:
            completion = _client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                temperature=OPENAI_TEMPERATURE,
                max_tokens=OPENAI_MAX_TOKENS,
            )
            text = (completion.choices[0].message.content or "").strip()
            if not text:
                raise RuntimeError("Empty response from OpenAI")

            return {
                "response": text,
                "detected_language": detected_lang,
                "language_name": lang_info["name"],
                "source": f"openai ({OPENAI_MODEL})",
                "emergency": emergency_info,
                "is_emergency": is_emergency,
            }
        except RateLimitError as e:
            last_error = e
            wait = (attempt + 1) * 2
            print(f"[Chatbot] Rate limited — waiting {wait}s")
            time.sleep(wait)
        except APIError as e:
            last_error = e
            print(f"[Chatbot] OpenAI API error: {e}")
            break
        except Exception as e:
            last_error = e
            print(f"[Chatbot] Unexpected error: {e}")
            break

    # 6. Graceful multilingual fallback
    fallbacks = {
        "en": "I'm having trouble reaching the AI service right now. Please try again in a moment.",
        "hi": "क्षमा करें, अभी AI सेवा से कनेक्ट नहीं हो पा रहा। कृपया थोड़ी देर में पुनः प्रयास करें।",
        "es": "Lo siento, no puedo conectar con el servicio de IA ahora mismo. Inténtalo de nuevo en un momento.",
        "fr": "Désolé, impossible de joindre le service IA pour l'instant. Veuillez réessayer dans un instant.",
        "de": "Entschuldigung, der KI-Dienst ist momentan nicht erreichbar. Bitte in Kürze erneut versuchen.",
        "ar": "عذرًا، لا يمكنني الاتصال بخدمة الذكاء الاصطناعي الآن. يرجى المحاولة بعد قليل.",
    }
    fallback = fallbacks.get(detected_lang, fallbacks["en"])
    print(f"[Chatbot] All attempts failed: {last_error}")

    return {
        "response": fallback,
        "detected_language": detected_lang,
        "language_name": lang_info["name"],
        "source": "error_fallback",
        "emergency": emergency_info,
        "is_emergency": is_emergency,
        "error": str(last_error) if last_error else "unknown",
    }
