"""
AI Lifestyle Coach Service
Generates personalized lifestyle recommendations based on health data.
"""
import os, json, re, requests

GEMINI_KEY = os.getenv('GEMINI_API_KEY', '')


def generate_lifestyle_plan(profile):
    """
    profile: { age, gender, weight, height, bmi, sleep_hours, exercise_days,
               stress_level, diet_quality, conditions, symptoms, mood_trend }
    Returns structured lifestyle recommendations.
    """
    bmi = profile.get('bmi', 0)
    sleep = profile.get('sleep_hours', 7)
    exercise = profile.get('exercise_days', 0)
    stress = profile.get('stress_level', 'moderate')
    diet = profile.get('diet_quality', 'moderate')
    conditions = profile.get('conditions', [])
    mood = profile.get('mood_trend', 'neutral')

    recommendations = []

    # ── Sleep Recommendations ────────────────────────────────────────
    if sleep < 6:
        recommendations.append({
            'category': 'sleep',
            'icon': '🌙',
            'title': 'Improve Sleep Quality',
            'priority': 'high',
            'color': '#7c3aed',
            'tips': [
                'Set a consistent bedtime alarm — go to bed at the same time every night',
                'No screens (phone, TV, laptop) 1 hour before bed',
                'Keep bedroom cool (18-22°C) and completely dark',
                'Try chamomile tea or warm milk 30 minutes before sleep',
                'Avoid caffeine after 2 PM',
                'If you cannot sleep within 20 minutes, get up and read until drowsy',
            ],
            'target': 'Aim for 7-8 hours per night',
        })
    elif sleep > 9:
        recommendations.append({
            'category': 'sleep',
            'icon': '🌙',
            'title': 'Optimize Sleep Duration',
            'priority': 'moderate',
            'color': '#7c3aed',
            'tips': [
                'Oversleeping can indicate depression or sleep disorders',
                'Set a morning alarm and expose yourself to sunlight within 15 min of waking',
                'Avoid napping longer than 20 minutes during the day',
            ],
            'target': 'Aim for 7-8 hours — quality over quantity',
        })

    # ── Exercise Recommendations ─────────────────────────────────────
    if exercise < 2:
        recommendations.append({
            'category': 'exercise',
            'icon': '🏃',
            'title': 'Start Moving More',
            'priority': 'high',
            'color': '#f59e0b',
            'tips': [
                'Start with just 15 minutes of walking daily — build up gradually',
                'Take stairs instead of lifts whenever possible',
                'Set hourly reminders to stand and stretch for 2 minutes',
                'Try a 7-minute bodyweight workout (planks, squats, jumping jacks)',
                'Walk after meals for 10 minutes — it improves digestion and blood sugar',
            ],
            'target': 'Work up to 150 minutes of moderate exercise per week',
        })
    elif exercise < 4:
        recommendations.append({
            'category': 'exercise',
            'icon': '🏃',
            'title': 'Increase Activity Level',
            'priority': 'moderate',
            'color': '#f59e0b',
            'tips': [
                'Add 1-2 more exercise days — mix cardio and strength training',
                'Try yoga or Pilates for flexibility and stress relief',
                'Walk or cycle for short commutes instead of driving',
            ],
            'target': 'Aim for 5 days/week of 30+ minutes activity',
        })

    # ── Diet Recommendations ─────────────────────────────────────────
    if diet in ('poor', 'moderate'):
        recommendations.append({
            'category': 'nutrition',
            'icon': '🥗',
            'title': 'Improve Your Diet',
            'priority': 'high' if diet == 'poor' else 'moderate',
            'color': '#059669',
            'tips': [
                'Eat 5 servings of fruits and vegetables daily',
                'Replace refined grains (white rice, maida) with whole grains (brown rice, ragi, oats)',
                'Include a protein source in every meal (dal, paneer, eggs, fish)',
                'Reduce processed food, packaged snacks, and sugary drinks',
                'Cook at home at least 5 days a week',
                'Drink 2-3 litres of water daily',
            ],
            'target': '80% whole, unprocessed foods',
        })

    # ── BMI-Based Recommendations ────────────────────────────────────
    if bmi > 0:
        if bmi < 18.5:
            recommendations.append({
                'category': 'weight',
                'icon': '⚖️',
                'title': 'Healthy Weight Gain',
                'priority': 'moderate',
                'color': '#0ea5e9',
                'tips': [
                    'Eat calorie-dense nutritious foods: nuts, ghee, avocado, banana shakes',
                    'Add an extra meal or snack between meals',
                    'Include strength training to build muscle mass',
                    'Consult a nutritionist if underweight is persistent',
                ],
                'target': f'Current BMI: {bmi:.1f} — aim for 18.5-24.9',
            })
        elif bmi >= 25:
            recommendations.append({
                'category': 'weight',
                'icon': '⚖️',
                'title': 'Weight Management',
                'priority': 'high' if bmi >= 30 else 'moderate',
                'color': '#ef4444',
                'tips': [
                    'Create a small daily calorie deficit (300-500 kcal) — do not crash diet',
                    'Practice portion control: use smaller plates',
                    'Eat slowly — it takes 20 minutes for satiety signals to reach the brain',
                    'Cut liquid calories: sodas, juices, sweetened tea/coffee',
                    'Increase fibre intake for fullness (vegetables, beans, oats)',
                ],
                'target': f'Current BMI: {bmi:.1f} — aim for 18.5-24.9',
            })

    # ── Stress Management ────────────────────────────────────────────
    if stress == 'high' or mood in ('stressed', 'anxious'):
        recommendations.append({
            'category': 'stress',
            'icon': '🧘',
            'title': 'Stress Management',
            'priority': 'high',
            'color': '#8b5cf6',
            'tips': [
                'Practice deep breathing: 5 minutes of box breathing (4-4-4-4 seconds)',
                'Schedule 30 minutes of "worry-free" time each day doing something you enjoy',
                'Limit news and social media to 30 minutes per day',
                'Connect with friends or family — social support is a powerful stress buffer',
                'Try progressive muscle relaxation before bed',
                'Consider journaling — writing down worries reduces their cognitive load',
            ],
            'target': 'Aim for stress awareness and at least 1 daily de-stress activity',
        })

    # ── Hydration ────────────────────────────────────────────────────
    recommendations.append({
        'category': 'hydration',
        'icon': '💧',
        'title': 'Stay Hydrated',
        'priority': 'moderate',
        'color': '#0ea5e9',
        'tips': [
            'Drink a glass of water first thing in the morning',
            'Keep a water bottle visible at your desk',
            'Set reminders every 2 hours to drink water',
            'Eat water-rich foods: cucumber, watermelon, oranges',
        ],
        'target': f'Aim for {max(2.0, round(profile.get("weight", 60) * 0.033, 1))} litres/day',
    })

    # ── Condition-specific ───────────────────────────────────────────
    for cond in conditions:
        cond_lower = cond.lower()
        if 'diabetes' in cond_lower:
            recommendations.append({
                'category': 'condition',
                'icon': '🍬',
                'title': 'Diabetes Management',
                'priority': 'high',
                'color': '#ef4444',
                'tips': [
                    'Monitor fasting blood glucose regularly',
                    'Eat small, frequent meals to avoid blood sugar spikes',
                    'Choose low glycemic index foods (whole grains, legumes, non-starchy vegetables)',
                    'Walk for 15 minutes after every meal',
                    'Never skip medications',
                ],
                'target': 'Keep HbA1c below 7%',
            })
        elif 'hypertension' in cond_lower or 'blood pressure' in cond_lower:
            recommendations.append({
                'category': 'condition',
                'icon': '🩺',
                'title': 'Blood Pressure Control',
                'priority': 'high',
                'color': '#3b82f6',
                'tips': [
                    'Reduce sodium intake to under 2g/day (avoid processed foods, pickles, papad)',
                    'DASH diet: fruits, vegetables, whole grains, lean protein',
                    'Exercise 30 minutes daily — walking counts',
                    'Monitor BP at home regularly',
                    'Limit alcohol and quit smoking',
                ],
                'target': 'Aim for BP below 130/80 mmHg',
            })

    return {
        'recommendations': recommendations,
        'summary': {
            'total': len(recommendations),
            'high_priority': sum(1 for r in recommendations if r['priority'] == 'high'),
            'moderate_priority': sum(1 for r in recommendations if r['priority'] == 'moderate'),
        }
    }
