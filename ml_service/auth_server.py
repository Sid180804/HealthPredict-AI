"""
Flask Auth Server — port 5002
Provides role-based authentication for Patient, Doctor, Admin.
"""

import os
import uuid
import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

# Load .env (silent no-op if dotenv missing)
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"), override=True)
except Exception:
    pass

# Optional JWT support — falls back to uuid tokens if PyJWT not installed
try:
    import jwt as pyjwt
    JWT_OK = True
except Exception:
    JWT_OK = False

JWT_SECRET = os.environ.get("JWT_SECRET", "supersecretkey")
ADMIN_EMAIL_ENV = (os.environ.get("ADMIN_EMAIL") or "").strip().lower()
ADMIN_PASSWORD_ENV = os.environ.get("ADMIN_PASSWORD") or ""

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:5173", "http://localhost:5174", "http://localhost:5175",
    "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175",
])

# ── Mock database ──────────────────────────────────────────────────────────────
# In production replace with a real DB (MongoDB / PostgreSQL).

USERS = {}          # email -> user record
SESSIONS = {}       # token -> email

# ── Allowed admin accounts — only these emails can ever access admin panel ─────
# Passwords start as None; admins must use /api/admin/set-password to create one.
allowed_admins = {
    "tomarsiddhanttomar@gmail.com": {
        "password": None,
        "role": "admin",
    },
    "shivanshthakra0311@gmail.com": {
        "password": None,
        "role": "admin",
    },
}

# Pre-seed admin password from environment if provided (so first-time login works)
if ADMIN_EMAIL_ENV and ADMIN_PASSWORD_ENV and ADMIN_EMAIL_ENV in allowed_admins:
    allowed_admins[ADMIN_EMAIL_ENV]["password"] = generate_password_hash(ADMIN_PASSWORD_ENV)
    print(f"[+] Seeded password for admin: {ADMIN_EMAIL_ENV}")


def _issue_jwt(email: str, role: str = "admin") -> str:
    """Issue a JWT if PyJWT installed, else fall back to uuid session token."""
    if JWT_OK:
        payload = {
            "email": email,
            "role": role,
            "iat": datetime.datetime.utcnow(),
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12),
        }
        token = pyjwt.encode(payload, JWT_SECRET, algorithm="HS256")
        if isinstance(token, bytes):
            token = token.decode("utf-8")
        SESSIONS[token] = email
        return token
    return _make_token(email)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _make_token(email: str) -> str:
    token = str(uuid.uuid4())
    SESSIONS[token] = email
    return token


def _user_dict(user: dict, token: str | None = None) -> dict:
    """Return safe user payload (no password hash)."""
    d = {k: v for k, v in user.items() if k != "password_hash"}
    if token:
        d["token"] = token
    return d


def _bad(msg: str, code: int = 400):
    return jsonify({"success": False, "error": msg}), code


def _ok(data: dict):
    return jsonify({"success": True, **data}), 200


# ── Patient endpoints ──────────────────────────────────────────────────────────

@app.route("/api/patient/signup", methods=["POST"])
def patient_signup():
    data = request.get_json(silent=True) or {}
    name     = (data.get("name") or "").strip()
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return _bad("Name, email, and password are required.")
    if len(password) < 6:
        return _bad("Password must be at least 6 characters.")
    if email in USERS:
        return _bad("An account with this email already exists.")

    uid = str(uuid.uuid4())
    USERS[email] = {
        "id": uid,
        "name": name,
        "email": email,
        "password_hash": generate_password_hash(password),
        "role": "patient",
        "created_at": datetime.datetime.utcnow().isoformat(),
        "is_verified": True,
    }
    token = _make_token(email)
    return jsonify({"success": True, "user": _user_dict(USERS[email]), "token": token}), 201


@app.route("/api/patient/login", methods=["POST"])
def patient_login():
    data = request.get_json(silent=True) or {}
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = USERS.get(email)
    if not user or not check_password_hash(user["password_hash"], password):
        return _bad("Invalid email or password.", 401)
    if user["role"] != "patient":
        return _bad("This account is not a patient account.", 403)

    token = _make_token(email)
    return _ok({"user": _user_dict(user), "token": token, "role": user["role"]})


# ── Doctor endpoints ───────────────────────────────────────────────────────────

@app.route("/api/doctor/signup", methods=["POST"])
def doctor_signup():
    data = request.get_json(silent=True) or {}
    name           = (data.get("name") or "").strip()
    email          = (data.get("email") or "").strip().lower()
    password       = data.get("password") or ""
    specialization = (data.get("specialization") or "").strip()
    experience     = data.get("experience")
    hospital_name  = (data.get("hospital_name") or "").strip()

    if not name or not email or not password:
        return _bad("Name, email, and password are required.")
    if not specialization:
        return _bad("Specialization is required.")
    if len(password) < 6:
        return _bad("Password must be at least 6 characters.")
    if email in USERS:
        return _bad("An account with this email already exists.")

    uid = str(uuid.uuid4())
    USERS[email] = {
        "id": uid,
        "name": name,
        "email": email,
        "password_hash": generate_password_hash(password),
        "role": "doctor",
        "specialization": specialization,
        "experience": int(experience) if experience else None,
        "hospital_name": hospital_name,
        "created_at": datetime.datetime.utcnow().isoformat(),
        "is_verified": False,       # requires admin approval
        "verification_status": "pending",
    }
    token = _make_token(email)
    return jsonify({"success": True, "user": _user_dict(USERS[email]), "token": token}), 201


@app.route("/api/doctor/login", methods=["POST"])
def doctor_login():
    data = request.get_json(silent=True) or {}
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = USERS.get(email)
    if not user or not check_password_hash(user["password_hash"], password):
        return _bad("Invalid email or password.", 401)
    if user["role"] != "doctor":
        return _bad("This account is not a doctor account.", 403)

    token = _make_token(email)
    return _ok({
        "user": _user_dict(user),
        "token": token,
        "role": user["role"],
        "verification_status": user.get("verification_status", "pending"),
    })


# ── Admin endpoints ────────────────────────────────────────────────────────────

@app.route("/api/admin/set-password", methods=["POST"])
def admin_set_password():
    """Create or update the password for an allowed admin email."""
    data     = request.get_json(silent=True) or {}
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if email not in allowed_admins:
        return jsonify({"message": "Unauthorized admin email"}), 403
    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters."}), 400

    allowed_admins[email]["password"] = generate_password_hash(password)
    return jsonify({"message": "Password created successfully"}), 200


@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data     = request.get_json(silent=True) or {}
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if email not in allowed_admins:
        return jsonify({"message": "Unauthorized admin email"}), 403

    admin = allowed_admins[email]

    if admin["password"] is None:
        return jsonify({"message": "Please create password first"}), 401

    if not check_password_hash(admin["password"], password):
        return jsonify({"success": False, "message": "Invalid password"}), 401

    token = _issue_jwt(email, "admin")
    return jsonify({
        "success": True,
        "message": "Admin login successful",
        "role": "admin",
        "token": token,
        "admin": {"email": email, "role": "admin"},
    }), 200


# ── Token verify (used by frontend AuthContext) ────────────────────────────────

@app.route("/api/auth/verify", methods=["GET"])
def verify_token():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    if not token or token not in SESSIONS:
        return _bad("Invalid or expired token.", 401)
    email = SESSIONS[token]
    user  = USERS.get(email)
    if not user:
        return _bad("User not found.", 404)
    return _ok({"user": _user_dict(user)})


# ── Admin: list + verify doctors ──────────────────────────────────────────────

@app.route("/api/admin/doctors", methods=["GET"])
def list_doctors():
    doctors = [_user_dict(u) for u in USERS.values() if u["role"] == "doctor"]
    return _ok({"doctors": doctors, "total": len(doctors)})


@app.route("/api/admin/doctors/<uid>/verify", methods=["PUT"])
def verify_doctor(uid):
    data   = request.get_json(silent=True) or {}
    action = data.get("action", "approve")   # "approve" | "reject"

    user = next((u for u in USERS.values() if u["id"] == uid), None)
    if not user:
        return _bad("Doctor not found.", 404)

    user["verification_status"] = "approved" if action == "approve" else "rejected"
    user["is_verified"]         = action == "approve"
    return _ok({"user": _user_dict(user)})


# ── Health check ───────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "auth-server", "port": 5002}), 200


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("[+] HealthPredict Auth Server starting on port 5002...")
    print("[+] Allowed admins: tomarsiddhanttomar@gmail.com, shivanshthakra0311@gmail.com")
    print("[+] Use POST /api/admin/set-password to create admin passwords.")
    app.run(host="0.0.0.0", port=5002, debug=True)
