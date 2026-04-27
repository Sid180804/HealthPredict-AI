"""
Family Health Profiles Service
Manage health profiles for family members (mother, father, children, etc.)
"""
import json, os
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
FAMILY_FILE = os.path.join(DATA_DIR, 'family_profiles.json')

RELATIONS = ['mother', 'father', 'spouse', 'son', 'daughter', 'brother', 'sister', 'grandfather', 'grandmother', 'other']


def _load():
    if os.path.exists(FAMILY_FILE):
        with open(FAMILY_FILE) as f:
            return json.load(f)
    return {}

def _save(data):
    with open(FAMILY_FILE, 'w') as f:
        json.dump(data, f, indent=2)


def add_member(user_id, name, relation, age, gender, blood_group='', conditions=None, medications=None, allergies=None):
    data = _load()
    if user_id not in data:
        data[user_id] = []

    member = {
        'id': f"fam_{int(datetime.now().timestamp()*1000)}",
        'name': name,
        'relation': relation,
        'age': age,
        'gender': gender,
        'blood_group': blood_group,
        'conditions': conditions or [],
        'medications': medications or [],
        'allergies': allergies or [],
        'health_records': [],
        'created': datetime.now().isoformat(),
        'updated': datetime.now().isoformat(),
    }

    data[user_id].append(member)
    _save(data)
    return member


def update_member(user_id, member_id, updates):
    data = _load()
    members = data.get(user_id, [])
    for m in members:
        if m['id'] == member_id:
            for k, v in updates.items():
                if k != 'id':
                    m[k] = v
            m['updated'] = datetime.now().isoformat()
            _save(data)
            return m
    return None


def delete_member(user_id, member_id):
    data = _load()
    if user_id in data:
        data[user_id] = [m for m in data[user_id] if m['id'] != member_id]
        _save(data)
    return True


def get_members(user_id):
    data = _load()
    return data.get(user_id, [])


def add_health_record(user_id, member_id, record_type, title, detail, meta=None):
    """Add a health record (lab report, visit note, etc.) to a family member."""
    data = _load()
    members = data.get(user_id, [])
    for m in members:
        if m['id'] == member_id:
            record = {
                'id': f"rec_{int(datetime.now().timestamp()*1000)}",
                'type': record_type,
                'title': title,
                'detail': detail,
                'meta': meta or {},
                'date': datetime.now().strftime('%Y-%m-%d'),
                'timestamp': datetime.now().isoformat(),
            }
            m.setdefault('health_records', []).append(record)
            m['updated'] = datetime.now().isoformat()
            _save(data)
            return record
    return None


def get_available_relations():
    return RELATIONS
