"""
Authentication Endpoint — Ibha KSP
------------------------------------
POST /auth/login

Production path:  Catalyst Auth (zcatalyst_sdk) — validates OAuth token issued
                  by Zoho Accounts and maps the Zoho user to an Ibha `users` row.

Local dev path:   Password check against the `users` table (or hardcoded fallback
                  when DB is offline).  All demo users share password "password123".

Token format: base64(payload_json).hmac_sha256_signature
The same secret must be used in auth_utils.py::verify_token().
"""

import json
import hashlib
import hmac
import base64
import os
import re
from datetime import datetime, timedelta
from lib.logging_utils import log_info, log_error

# Read secret from env; falls back to dev default
SECRET_KEY = os.getenv("IBHA_JWT_SECRET", "ibha_ksp_secret_key_change_in_production")

# Hardcoded users — used as fallback when DB is offline OR in local dev
# Matches seed data in init_db.sql
_FALLBACK_USERS = {
    "rajesh.kumar@ksp.gov.in":  {"user_id": "USR_001", "role": "Constable",     "station_id": 1,   "district_id": 1, "full_name": "Rajesh Kumar"},
    "priya.sharma@ksp.gov.in":  {"user_id": "USR_002", "role": "SI",            "station_id": 1,   "district_id": 1, "full_name": "Priya Sharma"},
    "arun.desai@ksp.gov.in":    {"user_id": "USR_003", "role": "Inspector",     "station_id": 2,   "district_id": 1, "full_name": "Arun Desai"},
    "lakshmi.rao@ksp.gov.in":   {"user_id": "USR_004", "role": "DSP",           "station_id": 3,   "district_id": 1, "full_name": "Lakshmi Rao"},
    "vikram.mehta@ksp.gov.in":  {"user_id": "USR_005", "role": "SCRB_Analyst",  "station_id": 100, "district_id": 1, "full_name": "Vikram Mehta"},
    "admin.system@ksp.gov.in":  {"user_id": "USR_006", "role": "Admin",         "station_id": 100, "district_id": 1, "full_name": "System Admin"},
}


def validate_email(email: str) -> bool:
    return bool(re.match(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$', email))


def create_token(user_data: dict, expires_hours: int = 8) -> str:
    """Create a signed JWT-like token (base64 payload + HMAC-SHA256 signature)."""
    expiry = datetime.utcnow() + timedelta(hours=expires_hours)
    payload = {
        "user_id":    user_data["user_id"],
        "email":      user_data["email"],
        "role":       user_data["role"],
        "station_id": user_data["station_id"],
        "district_id": user_data["district_id"],
        "full_name":  user_data["full_name"],
        "exp":        int(expiry.timestamp()),
    }
    payload_b64 = base64.b64encode(
        json.dumps(payload, sort_keys=True).encode()
    ).decode()
    sig = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{sig}"


def _lookup_user_db(email: str) -> dict | None:
    """Query the users table. Returns None if DB is unavailable."""
    try:
        from lib import db
        rows = db.execute_query(
            "SELECT user_id, email, password_hash, role, station_id, district_id, full_name "
            "FROM users WHERE email = %s AND active = TRUE LIMIT 1",
            (email,)
        )
        if rows:
            return dict(rows[0])
        return None
    except Exception:
        return None  # DB offline — caller will fall back to hardcoded dict


def _verify_password(plain: str, stored_hash: str) -> bool:
    """
    Constant-time password check.
    - If stored_hash starts with '$2' it is a bcrypt hash (production).
    - Otherwise fall back to demo password comparison.
    """
    if stored_hash and stored_hash.startswith("$2"):
        try:
            import bcrypt
            return bcrypt.checkpw(plain.encode(), stored_hash.encode())
        except ImportError:
            pass
    # Demo: all users share "password123"
    return hmac.compare_digest(plain, "password123")


def _try_catalyst_auth(token: str) -> dict | None:
    """
    Validate a Catalyst OAuth access token and return user info.
    Returns None if SDK is not available or token is invalid.
    """
    try:
        import zcatalyst_sdk
        app  = zcatalyst_sdk.initialize()
        user = app.authentication().get_current_user()
        return {
            "email":     user.get("email_id", ""),
            "full_name": user.get("display_name", ""),
            "user_id":   str(user.get("user_id", "")),
        }
    except Exception:
        return None


def handler(request):
    """
    POST /auth/login

    Accepts:
        { "email": str, "password": str }
        OR
        { "catalyst_token": str }  — when using Catalyst OAuth flow
    """
    CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }

    try:
        if hasattr(request, 'body'):
            body = json.loads(request.body) if isinstance(request.body, str) else request.body
        elif isinstance(request, dict) and 'body' in request:
            body = request['body']
        else:
            body = request

        # ── Catalyst OAuth path ────────────────────────────────────────────
        catalyst_token = body.get("catalyst_token", "")
        if catalyst_token:
            cat_user = _try_catalyst_auth(catalyst_token)
            if not cat_user:
                return {"statusCode": 401, "headers": CORS,
                        "body": json.dumps({"error": "Invalid Catalyst token"})}
            email = cat_user["email"].lower()
            # Map to Ibha user record
            db_user = _lookup_user_db(email) or _FALLBACK_USERS.get(email)
            if not db_user:
                return {"statusCode": 401, "headers": CORS,
                        "body": json.dumps({"error": "User not registered in Ibha"})}
            user = {**db_user, "email": email}
            token = create_token(user)
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"token": token, "user": {k: v for k, v in user.items() if k != "password_hash"}})}

        # ── Password path ─────────────────────────────────────────────────
        email    = body.get("email", "").strip().lower()
        password = body.get("password", "")

        if not email or not password:
            return {"statusCode": 400, "headers": CORS,
                    "body": json.dumps({"error": "Email and password are required"})}

        if not validate_email(email):
            return {"statusCode": 400, "headers": CORS,
                    "body": json.dumps({"error": "Invalid email format"})}

        if len(password) < 8:
            return {"statusCode": 400, "headers": CORS,
                    "body": json.dumps({"error": "Password must be at least 8 characters"})}

        log_info("Login attempt", {"email": email})

        # Try DB first, fall back to hardcoded dict
        db_user  = _lookup_user_db(email)
        fallback = _FALLBACK_USERS.get(email)

        if db_user:
            # DB user found — verify against stored hash
            if not _verify_password(password, db_user.get("password_hash", "")):
                log_info("Login failed - wrong password", {"email": email})
                return {"statusCode": 401, "headers": CORS,
                        "body": json.dumps({"error": "Invalid email or password"})}
            user = db_user
        elif fallback:
            # No DB / user not in DB — use fallback with demo password
            if not hmac.compare_digest(password, "password123"):
                log_info("Login failed - wrong password (fallback)", {"email": email})
                return {"statusCode": 401, "headers": CORS,
                        "body": json.dumps({"error": "Invalid email or password"})}
            user = {**fallback, "email": email, "password_hash": ""}
        else:
            log_info("Login failed - user not found", {"email": email})
            return {"statusCode": 401, "headers": CORS,
                    "body": json.dumps({"error": "Invalid email or password"})}

        token = create_token(user)

        user_response = {
            "user_id":    user["user_id"],
            "email":      user.get("email", email),
            "role":       user["role"],
            "station_id": user["station_id"],
            "district_id": user["district_id"],
            "full_name":  user["full_name"],
        }

        log_info("Login successful", {"user_id": user["user_id"], "role": user["role"]})

        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps({"token": token, "user": user_response})}

    except Exception as e:
        log_error("Login error", {"error": str(e)}, e)
        return {"statusCode": 500, "headers": CORS,
                "body": json.dumps({"error": "Internal server error"})}
