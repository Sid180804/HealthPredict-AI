"""
Health Intelligence Service v2.0
BMI calculator, health risk scoring, 7-day diet planner, fitness routine generator.
"""

import json
from datetime import datetime


# ── BMI & Health Score ─────────────────────────────────────────────────────────

def calculate_bmi(weight_kg: float, height_cm: float) -> dict:
    """Calculate BMI and category."""
    if height_cm <= 0 or weight_kg <= 0:
        return {"bmi": 0, "category": "Invalid input"}
    height_m = height_cm / 100
    bmi = weight_kg / (height_m ** 2)
    bmi = round(bmi, 1)

    if bmi < 18.5:
        category = "Underweight"
        color = "#3b82f6"
    elif bmi < 25:
        category = "Normal weight"
        color = "#22c55e"
    elif bmi < 30:
        category = "Overweight"
        color = "#f59e0b"
    else:
        category = "Obese"
        color = "#ef4444"

    return {"bmi": bmi, "category": category, "color": color}


def calculate_health_score(data: dict) -> dict:
    """
    Calculate a 0-100 health score based on user profile.
    Factors: BMI, age, exercise, sleep, diet, smoking, conditions.
    """
    age = data.get("age", 30)
    weight = data.get("weight_kg", 70)
    height = data.get("height_cm", 170)
    exercise_days = data.get("exercise_days_per_week", 0)
    sleep_hours = data.get("sleep_hours", 7)
    is_smoker = data.get("is_smoker", False)
    alcohol = data.get("alcohol_units_per_week", 0)
    diet_quality = data.get("diet_quality", "moderate")  # poor/moderate/good/excellent
    conditions = data.get("conditions", [])
    stress_level = data.get("stress_level", "moderate")  # low/moderate/high

    score = 100

    # BMI factor
    bmi_info = calculate_bmi(weight, height)
    bmi = bmi_info["bmi"]
    if bmi < 18.5 or bmi >= 30:
        score -= 20
    elif bmi >= 25:
        score -= 10

    # Exercise
    if exercise_days == 0:
        score -= 15
    elif exercise_days < 3:
        score -= 7
    elif exercise_days >= 5:
        score += 5

    # Sleep
    if sleep_hours < 6:
        score -= 15
    elif sleep_hours > 9:
        score -= 5
    elif 7 <= sleep_hours <= 8:
        score += 5

    # Smoking
    if is_smoker:
        score -= 20

    # Alcohol
    if alcohol > 14:
        score -= 15
    elif alcohol > 7:
        score -= 7

    # Diet
    diet_adjustments = {"poor": -15, "moderate": 0, "good": 5, "excellent": 10}
    score += diet_adjustments.get(diet_quality, 0)

    # Chronic conditions (subtract 5 per condition, max 25)
    score -= min(len(conditions) * 5, 25)

    # Stress
    stress_adj = {"low": 5, "moderate": 0, "high": -10}
    score += stress_adj.get(stress_level, 0)

    # Age baseline
    if age > 60:
        score -= 5
    elif age < 30:
        score += 5

    score = max(0, min(100, score))

    # Risk level
    if score >= 80:
        risk = "Low Risk"
        risk_color = "#22c55e"
    elif score >= 60:
        risk = "Moderate Risk"
        risk_color = "#f59e0b"
    elif score >= 40:
        risk = "High Risk"
        risk_color = "#f97316"
    else:
        risk = "Very High Risk"
        risk_color = "#ef4444"

    # Recommendations
    recommendations = _generate_recommendations(data, bmi, score)

    return {
        "health_score": score,
        "risk_level": risk,
        "risk_color": risk_color,
        "bmi": bmi_info,
        "recommendations": recommendations,
        "breakdown": {
            "bmi_score": "Good" if 18.5 <= bmi < 25 else "Needs attention",
            "exercise_score": "Good" if exercise_days >= 3 else "Needs improvement",
            "sleep_score": "Good" if 7 <= sleep_hours <= 8 else "Needs improvement",
            "diet_score": diet_quality.title(),
            "lifestyle_score": "Good" if not is_smoker and alcohol < 7 else "Needs improvement"
        }
    }


def _generate_recommendations(data: dict, bmi: float, score: int) -> list:
    recs = []
    if bmi >= 25:
        recs.append("🏃 Aim to increase physical activity and reduce caloric intake to reach a healthy BMI.")
    if data.get("exercise_days_per_week", 0) < 3:
        recs.append("💪 Try to exercise at least 3-5 days per week (30 mins of moderate activity).")
    if data.get("sleep_hours", 7) < 7:
        recs.append("😴 Aim for 7-8 hours of quality sleep per night.")
    if data.get("is_smoker"):
        recs.append("🚭 Quitting smoking is the single most impactful change for your health.")
    if data.get("alcohol_units_per_week", 0) > 7:
        recs.append("🍷 Reduce alcohol consumption to fewer than 7 units per week.")
    if data.get("stress_level") == "high":
        recs.append("🧘 Practice stress management techniques: meditation, yoga, or deep breathing.")
    if not recs:
        recs.append("✅ You're doing great! Keep maintaining your healthy lifestyle.")
    return recs


# ── Diet Planner ───────────────────────────────────────────────────────────────

DIET_PLANS = {
    "vegetarian": {
        "low_calorie": {
            "Monday": {"breakfast": "Oats porridge with banana", "lunch": "Dal rice with salad", "dinner": "Vegetable soup + 2 rotis", "snack": "Apple + almonds"},
            "Tuesday": {"breakfast": "Upma with coconut chutney", "lunch": "Rajma chawal + curd", "dinner": "Grilled paneer + roti + salad", "snack": "Buttermilk"},
            "Wednesday": {"breakfast": "Poha with peas", "lunch": "Sambar rice + papad", "dinner": "Mixed vegetable curry + 2 rotis", "snack": "Guava"},
            "Thursday": {"breakfast": "Dalia with milk", "lunch": "Chole + 2 rotis + raita", "dinner": "Vegetable khichdi + curd", "snack": "Roasted chana"},
            "Friday": {"breakfast": "Idli sambar", "lunch": "Palak paneer + roti", "dinner": "Tomato soup + roti + salad", "snack": "Banana"},
            "Saturday": {"breakfast": "Besan cheela + chutney", "lunch": "Pulao + raita + salad", "dinner": "Dal makhani + 2 rotis", "snack": "Mixed nuts (small handful)"},
            "Sunday": {"breakfast": "Paratha + curd", "lunch": "Aloo gobi + rice + dal", "dinner": "Vegetable biryani + raita", "snack": "Fresh fruit salad"},
        }
    },
    "non_vegetarian": {
        "balanced": {
            "Monday": {"breakfast": "Eggs (2) + whole wheat toast + fruit", "lunch": "Chicken curry + rice + salad", "dinner": "Grilled fish + vegetables + roti", "snack": "Greek yogurt"},
            "Tuesday": {"breakfast": "Omelette + milk", "lunch": "Egg rice + dal + salad", "dinner": "Chicken soup + 2 rotis", "snack": "Boiled egg + apple"},
            "Wednesday": {"breakfast": "Poha + buttermilk", "lunch": "Fish curry + rice", "dinner": "Chicken stir fry + chapati", "snack": "Nuts"},
            "Thursday": {"breakfast": "Dalia + egg", "lunch": "Mutton curry + rice (occasional)", "dinner": "Fish tikka + roti + raita", "snack": "Banana"},
            "Friday": {"breakfast": "Idli + coconut chutney + egg", "lunch": "Chicken biryani + raita", "dinner": "Grilled chicken + salad", "snack": "Fruit"},
            "Saturday": {"breakfast": "Paratha + egg bhurji", "lunch": "Prawn curry + rice", "dinner": "Chicken soup + roti", "snack": "Mixed nuts"},
            "Sunday": {"breakfast": "Eggs + toast + juice", "lunch": "Special chicken curry + rice", "dinner": "Mixed vegetables + fish + roti", "snack": "Yogurt"},
        }
    },
    "diabetic": {
        "low_glycemic": {
            "Monday": {"breakfast": "Oats + nuts (no sugar)", "lunch": "Brown rice + dal + vegetables", "dinner": "2 rotis + sabzi + salad", "snack": "Cucumber + lemon"},
            "Tuesday": {"breakfast": "Eggs (2) + vegetables", "lunch": "Bajra roti + vegetable curry", "dinner": "Grilled protein + salad", "snack": "Small apple"},
            "Wednesday": {"breakfast": "Moong dal cheela", "lunch": "Jowar roti + dal + salad", "dinner": "Vegetable soup + 1 roti", "snack": "Roasted chana"},
            "Thursday": {"breakfast": "Upma (less rice semolina)", "lunch": "Brown rice + rajma", "dinner": "Grilled paneer + 2 rotis", "snack": "Guava"},
            "Friday": {"breakfast": "Besan cheela", "lunch": "Multi-grain roti + dal", "dinner": "Fish curry + salad", "snack": "Handful of nuts"},
            "Saturday": {"breakfast": "Dalia (broken wheat)", "lunch": "Chole + whole wheat roti", "dinner": "Vegetable khichdi", "snack": "Buttermilk"},
            "Sunday": {"breakfast": "Sprouts salad + milk", "lunch": "Vegetable pulao (brown rice)", "dinner": "Dal + 2 rotis + salad", "snack": "Small seasonal fruit"},
        }
    }
}


def generate_diet_plan(data: dict) -> dict:
    """Generate 7-day personalized diet plan."""
    weight = data.get("weight_kg", 70)
    height = data.get("height_cm", 170)
    age = data.get("age", 30)
    diet_pref = data.get("diet_preference", "vegetarian").lower()
    conditions = [c.lower() for c in data.get("conditions", [])]
    goal = data.get("goal", "balanced").lower()

    # Calculate calorie target
    bmi_info = calculate_bmi(weight, height)
    bmi = bmi_info["bmi"]

    # Harris-Benedict BMR
    if data.get("gender", "male").lower() == "female":
        bmr = 447.6 + (9.2 * weight) + (3.1 * height * 10) - (4.3 * age)
    else:
        bmr = 88.4 + (13.4 * weight) + (4.8 * height * 10) - (5.7 * age)

    activity_mult = {"sedentary": 1.2, "light": 1.375, "moderate": 1.55, "active": 1.725}.get(
        data.get("activity_level", "moderate"), 1.55)
    tdee = int(bmr * activity_mult)

    if bmi >= 25 or goal == "weight_loss":
        calorie_target = tdee - 300
    elif bmi < 18.5 or goal == "weight_gain":
        calorie_target = tdee + 300
    else:
        calorie_target = tdee

    # Choose appropriate plan
    if "diabetes" in conditions:
        plan_key = "diabetic"
        sub_key = "low_glycemic"
    elif diet_pref in ["veg", "vegetarian"]:
        plan_key = "vegetarian"
        sub_key = "low_calorie"
    else:
        plan_key = "non_vegetarian"
        sub_key = "balanced"

    meal_plan = DIET_PLANS.get(plan_key, DIET_PLANS["vegetarian"]).get(sub_key, {})

    return {
        "calorie_target": calorie_target,
        "bmi": bmi_info,
        "diet_type": plan_key.replace("_", " ").title(),
        "goal": goal.replace("_", " ").title(),
        "meal_plan": meal_plan,
        "tips": [
            "🥤 Drink 8-10 glasses of water daily",
            "🌙 Avoid eating 2 hours before sleep",
            "🍽️ Eat slowly and chew well",
            "🛑 Avoid processed and fried foods",
            "🥗 Include a salad with every main meal",
            "🌾 Choose whole grains over refined grains"
        ]
    }


def generate_fitness_plan(data: dict) -> dict:
    """Generate weekly workout plan based on fitness level."""
    fitness_level = data.get("fitness_level", "beginner")
    goal = data.get("goal", "general_fitness")
    conditions = [c.lower() for c in data.get("conditions", [])]
    age = data.get("age", 30)

    # Condition-based restrictions
    restrictions = []
    if "arthritis" in conditions or "osteoarthritis" in conditions:
        restrictions.append("Avoid high-impact exercises. Prefer swimming or walking.")
    if "heart" in str(conditions) or "hypertension" in conditions:
        restrictions.append("Keep heart rate moderate. Avoid very intense workouts.")
    if age > 60:
        restrictions.append("Focus on low-impact exercises. Balance and flexibility are key.")

    plans = {
        "beginner": {
            "Monday": {"exercises": ["15 min brisk walk", "10 squats (3 sets)", "10 push-ups (wall)"], "duration": "30 min"},
            "Tuesday": {"exercises": ["Rest or light yoga"], "duration": "20 min"},
            "Wednesday": {"exercises": ["20 min walk", "Stretching", "Core exercises (plank 20s x3)"], "duration": "35 min"},
            "Thursday": {"exercises": ["Rest or deep breathing"], "duration": "15 min"},
            "Friday": {"exercises": ["20 min walk", "20 lunges", "15 push-ups (3 sets)"], "duration": "40 min"},
            "Saturday": {"exercises": ["30 min cycling or swimming", "Light stretching"], "duration": "40 min"},
            "Sunday": {"exercises": ["Rest day — gentle walk optional"], "duration": "0-20 min"},
        },
        "intermediate": {
            "Monday": {"exercises": ["30 min jogging", "3 sets of 20 squats", "3 sets of 15 push-ups"], "duration": "50 min"},
            "Tuesday": {"exercises": ["Yoga/stretching", "Core workout (plank, bicycle crunches)"], "duration": "30 min"},
            "Wednesday": {"exercises": ["HIIT: 20 min", "Strength training (home weights)"], "duration": "45 min"},
            "Thursday": {"exercises": ["Active rest: walking", "Foam rolling"], "duration": "25 min"},
            "Friday": {"exercises": ["30 min run", "Upper body strength training"], "duration": "50 min"},
            "Saturday": {"exercises": ["45 min cycling or swimming"], "duration": "45 min"},
            "Sunday": {"exercises": ["Complete rest or gentle yoga"], "duration": "0-20 min"},
        }
    }

    plan = plans.get(fitness_level, plans["beginner"])

    return {
        "fitness_level": fitness_level.title(),
        "goal": goal.replace("_", " ").title(),
        "weekly_plan": plan,
        "restrictions": restrictions,
        "general_tips": [
            "🌅 Morning exercise boosts metabolism",
            "💧 Stay hydrated before, during, and after exercise",
            "😴 Rest days are essential for recovery",
            "📈 Progress gradually — increase intensity weekly by 10%",
            "⚠️ Stop if you feel chest pain or dizziness — consult a doctor"
        ]
    }
