"""
Mental Wellness Service
Daily check-ins, mood tracking, AI-powered coping suggestions.
"""
import json, os
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
MENTAL_FILE = os.path.join(DATA_DIR, 'mental_checkins.json')

MOODS = {
    'happy':    {'score': 5, 'emoji': '😊', 'label': 'Happy'},
    'calm':     {'score': 4, 'emoji': '😌', 'label': 'Calm'},
    'neutral':  {'score': 3, 'emoji': '😐', 'label': 'Neutral'},
    'tired':    {'score': 2, 'emoji': '😴', 'label': 'Tired'},
    'stressed': {'score': 2, 'emoji': '😰', 'label': 'Stressed'},
    'anxious':  {'score': 1, 'emoji': '😟', 'label': 'Anxious'},
    'sad':      {'score': 1, 'emoji': '😢', 'label': 'Sad'},
    'angry':    {'score': 1, 'emoji': '😡', 'label': 'Angry'},
}

# Coping suggestions based on mood
SUGGESTIONS = {
    'happy': [
        {'icon': '📝', 'text': 'Journal what made you happy today — revisit it on hard days.'},
        {'icon': '🤝', 'text': 'Share your positivity. Call or text someone you care about.'},
        {'icon': '🎯', 'text': 'Great time to tackle a challenging task — your motivation is high.'},
    ],
    'calm': [
        {'icon': '🧘', 'text': 'Deepen this calm with 10 minutes of mindful meditation.'},
        {'icon': '📖', 'text': 'Read or listen to something enriching while your mind is clear.'},
        {'icon': '🌿', 'text': 'Take a gentle walk in nature to maintain this peace.'},
    ],
    'neutral': [
        {'icon': '🎵', 'text': 'Listen to uplifting music to boost your mood naturally.'},
        {'icon': '🚶', 'text': 'A brisk 15-minute walk can elevate endorphins.'},
        {'icon': '🍎', 'text': 'Have a balanced snack — low blood sugar can dampen your mood.'},
    ],
    'tired': [
        {'icon': '😴', 'text': 'If possible, take a short 20-minute power nap. Set an alarm.'},
        {'icon': '💧', 'text': 'Dehydration causes fatigue. Drink a full glass of water now.'},
        {'icon': '🌬️', 'text': 'Try box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 5 times.'},
        {'icon': '☕', 'text': 'Limit caffeine to before 2 PM to avoid sleep disruption tonight.'},
    ],
    'stressed': [
        {'icon': '🫁', 'text': 'Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s. Activates parasympathetic system.'},
        {'icon': '📋', 'text': 'Write down your stressors. Just externalising them reduces cognitive load.'},
        {'icon': '🧊', 'text': 'Hold ice cubes for 30 seconds — cold sensation interrupts the stress response.'},
        {'icon': '🏥', 'text': 'If stress persists for more than 2 weeks, consider speaking with a counsellor.'},
    ],
    'anxious': [
        {'icon': '🌍', 'text': '5-4-3-2-1 grounding: Name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste.'},
        {'icon': '🫁', 'text': 'Slow diaphragmatic breathing: breathe into your belly, not your chest. 6 breaths per minute.'},
        {'icon': '🧠', 'text': 'Challenge your thoughts: What evidence supports this fear? What evidence contradicts it?'},
        {'icon': '🏥', 'text': 'Frequent anxiety may benefit from CBT (Cognitive Behavioural Therapy). Talk to a professional.'},
    ],
    'sad': [
        {'icon': '☀️', 'text': 'Step outside for 10 minutes. Sunlight boosts serotonin production.'},
        {'icon': '🤗', 'text': 'Reach out to someone you trust. You don\'t have to face this alone.'},
        {'icon': '🎵', 'text': 'Listen to music that matches your mood first, then gradually shift to uplifting tracks.'},
        {'icon': '🏥', 'text': 'If sadness lasts more than 2 weeks, please consult a mental health professional.'},
    ],
    'angry': [
        {'icon': '🧊', 'text': 'Splash cold water on your face — it activates the dive reflex and slows heart rate.'},
        {'icon': '🏃', 'text': 'Physical exercise is the fastest way to process anger. Walk, run, or do pushups.'},
        {'icon': '✍️', 'text': 'Write an unsent letter about what upset you. Getting it out helps.'},
        {'icon': '⏰', 'text': 'HALT check: Are you Hungry, Angry, Lonely, or Tired? Address the root cause.'},
    ],
}


def _load():
    if os.path.exists(MENTAL_FILE):
        with open(MENTAL_FILE) as f:
            return json.load(f)
    return {}

def _save(data):
    with open(MENTAL_FILE, 'w') as f:
        json.dump(data, f, indent=2)


def check_in(user_id, mood, journal_note='', sleep_hours=None, stress_level=None):
    """Record a mental health check-in."""
    data = _load()
    if user_id not in data:
        data[user_id] = []

    mood_info = MOODS.get(mood, MOODS['neutral'])
    today = datetime.now().strftime('%Y-%m-%d')

    entry = {
        'id': f"mental_{int(datetime.now().timestamp()*1000)}",
        'date': today,
        'timestamp': datetime.now().isoformat(),
        'mood': mood,
        'mood_score': mood_info['score'],
        'emoji': mood_info['emoji'],
        'label': mood_info['label'],
        'journal_note': journal_note,
        'sleep_hours': sleep_hours,
        'stress_level': stress_level,
    }

    # Replace if already checked in today
    data[user_id] = [e for e in data[user_id] if e['date'] != today]
    data[user_id].append(entry)
    _save(data)

    # Generate suggestions
    suggestions = SUGGESTIONS.get(mood, SUGGESTIONS['neutral'])
    need_professional = mood in ('sad', 'anxious', 'angry', 'stressed')

    # Check for concerning patterns
    recent = [e for e in data[user_id] if e['mood_score'] <= 2]
    streak_warning = len(recent) >= 5

    return {
        'entry': entry,
        'suggestions': suggestions,
        'need_professional_help': need_professional,
        'streak_warning': streak_warning,
        'streak_message': 'You have been feeling low for several days. Please consider talking to a mental health professional.' if streak_warning else None,
    }


def get_history(user_id, days=30):
    """Get mood history for the last N days."""
    data = _load()
    entries = data.get(user_id, [])

    cutoff = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    entries = [e for e in entries if e['date'] >= cutoff]
    entries.sort(key=lambda e: e['date'])

    # Analytics
    if entries:
        scores = [e['mood_score'] for e in entries]
        avg_score = sum(scores) / len(scores)
        mood_counts = {}
        for e in entries:
            mood_counts[e['mood']] = mood_counts.get(e['mood'], 0) + 1
        most_common = max(mood_counts, key=mood_counts.get) if mood_counts else 'neutral'
        trend = 'improving' if len(scores) >= 3 and scores[-1] > scores[0] else 'declining' if len(scores) >= 3 and scores[-1] < scores[0] else 'stable'
    else:
        avg_score = 0
        mood_counts = {}
        most_common = 'neutral'
        trend = 'no data'

    return {
        'entries': entries,
        'analytics': {
            'average_score': round(avg_score, 1),
            'total_checkins': len(entries),
            'mood_distribution': mood_counts,
            'most_common_mood': most_common,
            'trend': trend,
        }
    }


def get_available_moods():
    return [{'id': k, **v} for k, v in MOODS.items()]
