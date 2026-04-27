"""
Health Timeline Service
Aggregates all health events into a chronological timeline.
Sources: predictions, appointments, symptoms, medications, reports, cycle data, mental check-ins.
"""
import json, os
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
TIMELINE_FILE = os.path.join(DATA_DIR, 'timeline.json')

def _load():
    if os.path.exists(TIMELINE_FILE):
        with open(TIMELINE_FILE) as f:
            return json.load(f)
    return {}

def _save(data):
    with open(TIMELINE_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def add_event(user_id, event_type, title, detail, meta=None):
    """
    event_type: prediction | appointment | symptom | medication | report | cycle | mental | reminder
    """
    data = _load()
    if user_id not in data:
        data[user_id] = []

    entry = {
        'id': f"{event_type}_{int(datetime.now().timestamp()*1000)}",
        'type': event_type,
        'title': title,
        'detail': detail,
        'meta': meta or {},
        'timestamp': datetime.now().isoformat(),
        'date': datetime.now().strftime('%Y-%m-%d'),
    }
    data[user_id].append(entry)
    _save(data)
    return entry

def get_timeline(user_id, event_type=None, limit=50, offset=0):
    data = _load()
    events = data.get(user_id, [])

    if event_type:
        events = [e for e in events if e['type'] == event_type]

    # sort newest first
    events.sort(key=lambda e: e['timestamp'], reverse=True)

    total = len(events)
    events = events[offset:offset + limit]

    # Group by date for frontend
    grouped = {}
    for e in events:
        date = e['date']
        if date not in grouped:
            grouped[date] = []
        grouped[date].append(e)

    return {
        'events': events,
        'grouped': grouped,
        'total': total,
        'has_more': total > offset + limit
    }

def delete_event(user_id, event_id):
    data = _load()
    if user_id in data:
        data[user_id] = [e for e in data[user_id] if e['id'] != event_id]
        _save(data)
    return True
