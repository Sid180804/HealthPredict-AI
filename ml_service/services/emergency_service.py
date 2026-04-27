"""
Emergency Service
Provides emergency contacts, nearby hospitals, and ambulance numbers.
"""

# Indian emergency numbers
EMERGENCY_CONTACTS = [
    {'name': 'National Emergency', 'number': '112', 'icon': '🚨', 'description': 'Single emergency number for police, fire, ambulance'},
    {'name': 'Ambulance', 'number': '108', 'icon': '🚑', 'description': 'Free ambulance service across India'},
    {'name': 'Women Helpline', 'number': '1091', 'icon': '👩', 'description': '24/7 women safety helpline'},
    {'name': 'Police', 'number': '100', 'icon': '👮', 'description': 'Police emergency'},
    {'name': 'Fire', 'number': '101', 'icon': '🔥', 'description': 'Fire brigade'},
    {'name': 'Child Helpline', 'number': '1098', 'icon': '👶', 'description': 'Child safety & welfare'},
    {'name': 'Mental Health', 'number': '9152987821', 'icon': '🧠', 'description': 'iCall — Psychosocial helpline'},
    {'name': 'Poison Control', 'number': '1800-11-6117', 'icon': '☠️', 'description': 'National Poison Information Centre (AIIMS)'},
    {'name': 'Blood Bank', 'number': '1910', 'icon': '🩸', 'description': 'Central blood bank helpline'},
    {'name': 'Senior Citizen', 'number': '14567', 'icon': '👴', 'description': 'Elder abuse & help'},
]

NEARBY_HOSPITALS = [
    {
        'name': 'AIIMS Emergency',
        'distance': '3.2 km',
        'address': 'Sri Aurobindo Marg, Ansari Nagar, New Delhi',
        'phone': '011-26588500',
        'type': 'Government',
        'has_icu': True,
        'has_ambulance': True,
        'rating': 4.5,
        'open_24h': True,
        'icon': '🏥',
    },
    {
        'name': 'Apollo Hospital',
        'distance': '4.8 km',
        'address': 'Sarita Vihar, Delhi Mathura Road, New Delhi',
        'phone': '011-71791090',
        'type': 'Private',
        'has_icu': True,
        'has_ambulance': True,
        'rating': 4.3,
        'open_24h': True,
        'icon': '🏥',
    },
    {
        'name': 'Safdarjung Hospital',
        'distance': '5.1 km',
        'address': 'Ring Road, Safdarjung, New Delhi',
        'phone': '011-26707444',
        'type': 'Government',
        'has_icu': True,
        'has_ambulance': True,
        'rating': 4.0,
        'open_24h': True,
        'icon': '🏥',
    },
    {
        'name': 'Max Super Speciality Hospital',
        'distance': '6.3 km',
        'address': 'Press Enclave Road, Saket, New Delhi',
        'phone': '011-26515050',
        'type': 'Private',
        'has_icu': True,
        'has_ambulance': True,
        'rating': 4.4,
        'open_24h': True,
        'icon': '🏥',
    },
    {
        'name': 'Fortis Hospital',
        'distance': '7.5 km',
        'address': 'Sector B, Pocket 1, Aruna Asaf Ali Marg, Vasant Kunj',
        'phone': '011-42776222',
        'type': 'Private',
        'has_icu': True,
        'has_ambulance': True,
        'rating': 4.2,
        'open_24h': True,
        'icon': '🏥',
    },
]

FIRST_AID = [
    {
        'title': 'Heart Attack',
        'icon': '💔',
        'steps': [
            'Call 108 immediately',
            'Have the person sit or lie down in a comfortable position',
            'Give 300mg aspirin (chew, do not swallow whole) if not allergic',
            'Loosen tight clothing',
            'Begin CPR if person becomes unresponsive and stops breathing',
        ],
    },
    {
        'title': 'Choking',
        'icon': '😤',
        'steps': [
            'Encourage coughing if person can still breathe',
            'Give 5 back blows between shoulder blades',
            'Perform 5 abdominal thrusts (Heimlich manoeuvre)',
            'Alternate back blows and thrusts until object is expelled',
            'Call 108 if not resolved quickly',
        ],
    },
    {
        'title': 'Severe Bleeding',
        'icon': '🩸',
        'steps': [
            'Apply direct pressure with clean cloth',
            'Do NOT remove the cloth — add more layers if needed',
            'Elevate the injured limb above heart level',
            'Call 108 for emergency help',
            'Keep the person warm and calm',
        ],
    },
    {
        'title': 'Burns',
        'icon': '🔥',
        'steps': [
            'Cool the burn under running water for 10-20 minutes',
            'Do NOT apply ice, butter, or toothpaste',
            'Cover with a clean, non-sticky bandage',
            'Take paracetamol for pain if needed',
            'Seek medical help for burns larger than your palm',
        ],
    },
    {
        'title': 'Stroke (FAST)',
        'icon': '🧠',
        'steps': [
            'Face: Ask to smile — is one side drooping?',
            'Arms: Ask to raise both — does one drift down?',
            'Speech: Ask to repeat a sentence — is it slurred?',
            'Time: Call 108 IMMEDIATELY — every minute matters',
            'Note the time symptoms started — this affects treatment',
        ],
    },
    {
        'title': 'Allergic Reaction',
        'icon': '⚠️',
        'steps': [
            'Use epinephrine auto-injector (EpiPen) if available',
            'Call 108 immediately',
            'Lay person flat with legs elevated (unless breathing is difficult)',
            'Give antihistamine if conscious and can swallow',
            'Monitor breathing — begin CPR if needed',
        ],
    },
]


def get_emergency_data():
    return {
        'contacts': EMERGENCY_CONTACTS,
        'hospitals': NEARBY_HOSPITALS,
        'first_aid': FIRST_AID,
    }
