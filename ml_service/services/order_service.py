"""
Prescription Order Service
Handles medicine ordering - ONLY with valid prescription.
Order tracking and pharmacy simulation.
"""

import uuid
from datetime import datetime

# Order storage (in-memory - use DB in production)
orders_db = {}
prescriptions_db = {}  # prescription_id -> extracted data


def create_order_from_prescription(user_id, prescription_id, medicines, address=None):
    """
    Create order only when valid prescription exists.
    No medicine without prescription.
    """
    if prescription_id not in prescriptions_db:
        return {"error": "Invalid prescription. Please upload a valid doctor prescription first."}
    
    prescription = prescriptions_db[prescription_id]
    if not prescription.get("extracted", {}).get("medicines"):
        return {"error": "Prescription could not be read. Please upload a clear prescription image."}
    
    order_id = f"ORD{str(uuid.uuid4())[:8].upper()}"
    order = {
        "id": order_id,
        "user_id": user_id,
        "prescription_id": prescription_id,
        "medicines": medicines,
        "status": "order_placed",
        "timeline": [
            {"stage": "order_placed", "time": datetime.now().isoformat(), "message": "Order placed successfully"}
        ],
        "address": address or "Default delivery address",
        "platform": "HealthPredict Pharmacy",
        "created_at": datetime.now().isoformat()
    }
    orders_db[order_id] = order
    return {"order": order, "message": "Order placed. Medicine delivery requires valid prescription."}


def get_order_status(order_id, user_id):
    """Get order status and timeline."""
    order = orders_db.get(order_id)
    if not order or order["user_id"] != user_id:
        return {"error": "Order not found"}
    return order


def get_user_orders(user_id):
    """Get all orders for user."""
    user_orders = [o for o in orders_db.values() if o["user_id"] == user_id]
    user_orders.sort(key=lambda x: x["created_at"], reverse=True)
    return user_orders


def simulate_pharmacy_progress(order_id, user_id):
    """Simulate pharmacy processing stages (demo)."""
    order = orders_db.get(order_id)
    if not order or order["user_id"] != user_id:
        return {"error": "Order not found"}
    
    stages = [
        ("pharmacy_confirmed", "Pharmacy confirmed prescription"),
        ("medicines_packed", "Medicines packed"),
        ("dispatched", "Order dispatched for delivery"),
        ("delivered", "Order delivered")
    ]
    current = order["status"]
    stage_map = {s[0]: i for i, s in enumerate(stages)}
    idx = stage_map.get(current, -1)
    if idx < len(stages) - 1:
        new_stage, msg = stages[idx + 1]
        order["status"] = new_stage
        order["timeline"].append({"stage": new_stage, "time": datetime.now().isoformat(), "message": msg})
    return order


def register_prescription(extracted_data, user_id):
    """Register extracted prescription for later ordering."""
    prescription_id = str(uuid.uuid4())
    prescriptions_db[prescription_id] = {
        "id": prescription_id,
        "user_id": user_id,
        "extracted": extracted_data,
        "created_at": datetime.now().isoformat()
    }
    return prescription_id
