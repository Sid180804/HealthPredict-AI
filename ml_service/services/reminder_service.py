"""
Smart Reminder Service
Medicine, appointment, period, water, and exercise reminders.
"""
import json, os
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
REMINDER_FILE = os.path.join(DATA_DIR, 'reminders.json')

REMINDER_TYPES = {
    'medicine':    {'icon': '💊', 'color': '#059669', 'label': 'Medicine'},
    'appointment': {'icon': '🗓️', 'color': '#3b82f6', 'label': 'Appointment'},
    'period':      {'icon': '🌸', 'color': '#ec4899', 'label': 'Period'},
    'water':       {'icon': '💧', 'color': '#0ea5e9', 'label': 'Water'},
    'exercise':    {'icon': '🏃', 'color': '#f59e0b', 'label': 'Exercise'},
    'mental':      {'icon': '🧘', 'color': '#8b5cf6', 'label': 'Mental Wellness'},
    'sleep':       {'icon': '🌙', 'color': '#7c3aed', 'label': 'Sleep'},
    'custom':      {'icon': '🔔', 'color': '#64748b', 'label': 'Custom'},
}


def _load():
    if os.path.exists(REMINDER_FILE):
        with open(REMINDER_FILE) as f:
            return json.load(f)
    return {}

def _save(data):
    with open(REMINDER_FILE, 'w') as f:
        json.dump(data, f, indent=2)


def add_reminder(user_id, reminder_type, title, description='', time='', repeat='none', days=None):
    """
    repeat: none | daily | weekly | monthly
    days: list of weekday indices [0-6] for weekly reminders
    """
    data = _load()
    if user_id not in data:
        data[user_id] = []

    type_info = REMINDER_TYPES.get(reminder_type, REMINDER_TYPES['custom'])

    reminder = {
        'id': f"rem_{int(datetime.now().timestamp()*1000)}",
        'type': reminder_type,
        'title': title,
        'description': description,
        'time': time,
        'repeat': repeat,
        'days': days or [],
        'icon': type_info['icon'],
        'color': type_info['color'],
        'active': True,
        'created': datetime.now().isoformat(),
        'last_triggered': None,
    }

    data[user_id].append(reminder)
    _save(data)
    return reminder


def get_reminders(user_id, active_only=True):
    data = _load()
    reminders = data.get(user_id, [])
    if active_only:
        reminders = [r for r in reminders if r.get('active', True)]
    return reminders


def update_reminder(user_id, reminder_id, updates):
    data = _load()
    reminders = data.get(user_id, [])
    for r in reminders:
        if r['id'] == reminder_id:
            for k, v in updates.items():
                if k != 'id':
                    r[k] = v
            _save(data)
            return r
    return None


def delete_reminder(user_id, reminder_id):
    data = _load()
    if user_id in data:
        data[user_id] = [r for r in data[user_id] if r['id'] != reminder_id]
        _save(data)
    return True


def toggle_reminder(user_id, reminder_id):
    data = _load()
    reminders = data.get(user_id, [])
    for r in reminders:
        if r['id'] == reminder_id:
            r['active'] = not r.get('active', True)
            _save(data)
            return r
    return None


def get_todays_reminders(user_id):
    """Get reminders that should fire today."""
    today = datetime.now()
    weekday = today.weekday()
    reminders = get_reminders(user_id, active_only=True)

    todays = []
    for r in reminders:
        if r['repeat'] == 'daily':
            todays.append(r)
        elif r['repeat'] == 'weekly' and weekday in r.get('days', []):
            todays.append(r)
        elif r['repeat'] == 'monthly':
            todays.append(r)
        elif r['repeat'] == 'none':
            todays.append(r)

    return todays


def get_reminder_types():
    return REMINDER_TYPES
