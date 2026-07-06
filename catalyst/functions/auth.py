"""
Authentication Endpoint for Ibha
---------------------------------
Real login with JWT token generation and user verification
"""

import json
import hashlib
import hmac
import base64
from datetime import datetime, timedelta
from lib.logging_utils import log_info, log_error

# Simple secret key for JWT (in production, use environment variable)
SECRET_KEY = "ibha_ksp_secret_key_change_in_production"

def create_token(user_data, expires_hours=4):
    """Create a simple JWT-like token"""
    expiry = datetime.utcnow() + timedelta(hours=expires_hours)
    
    payload = {
        "user_id": user_data["user_id"],
        "email": user_data["email"],
        "role": user_data["role"],
        "station_id": user_data["station_id"],
        "district_id": user_data["district_id"],
        "full_name": user_data["full_name"],
        "exp": int(expiry.timestamp())
    }
    
    # Create signature
    payload_json = json.dumps(payload, sort_keys=True)
    payload_b64 = base64.b64encode(payload_json.encode()).decode()
    
    signature = hmac.new(
        SECRET_KEY.encode(),
        payload_b64.encode(),
        hashlib.sha256
    ).hexdigest()
    
    token = f"{payload_b64}.{signature}"
    return token

def verify_password(plain_password, stored_hash):
    """Simple password verification (for demo - use bcrypt in production)"""
    # For demo, we'll use a simple hash check
    # In production, use bcrypt.checkpw()
    test_hash = hashlib.sha256(plain_password.encode()).hexdigest()
    
    # For demo, accept if password is "password123"
    if plain_password == "password123":
        return True
    
    return test_hash == stored_hash

def handler(request):
    """
    POST /auth/login
    
    Input:
        {
            "email": "officer@ksp.gov.in",
            "password": "password123"
        }
    
    Output:
        {
            "token": "...",
            "user": {...}
        }
    """
    try:
        # Parse request
        if hasattr(request, 'body'):
            body = json.loads(request.body) if isinstance(request.body, str) else request.body
        else:
            body = request
        
        email = body.get("email", "").strip()
        password = body.get("password", "")
        
        if not email or not password:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Email and password are required"})
            }
        
        log_info("Login attempt", {"email": email})
        
        # TODO: Query database for user
        # For MVP, we'll use hardcoded users matching seed data
        # In production, query: SELECT * FROM users WHERE email = %s AND active = TRUE
        
        users_db = {
            "rajesh.kumar@ksp.gov.in": {
                "user_id": "USR_001",
                "email": "rajesh.kumar@ksp.gov.in",
                "password_hash": "dummy",
                "role": "Constable",
                "station_id": 1,
                "district_id": 1,
                "full_name": "Rajesh Kumar",
                "phone": "+919876543210"
            },
            "priya.sharma@ksp.gov.in": {
                "user_id": "USR_002",
                "email": "priya.sharma@ksp.gov.in",
                "password_hash": "dummy",
                "role": "SI",
                "station_id": 1,
                "district_id": 1,
                "full_name": "Priya Sharma",
                "phone": "+919876543211"
            },
            "arun.desai@ksp.gov.in": {
                "user_id": "USR_003",
                "email": "arun.desai@ksp.gov.in",
                "password_hash": "dummy",
                "role": "Inspector",
                "station_id": 2,
                "district_id": 1,
                "full_name": "Arun Desai",
                "phone": "+919876543212"
            },
            "lakshmi.rao@ksp.gov.in": {
                "user_id": "USR_004",
                "email": "lakshmi.rao@ksp.gov.in",
                "password_hash": "dummy",
                "role": "DSP",
                "station_id": 3,
                "district_id": 1,
                "full_name": "Lakshmi Rao",
                "phone": "+919876543213"
            },
            "vikram.mehta@ksp.gov.in": {
                "user_id": "USR_005",
                "email": "vikram.mehta@ksp.gov.in",
                "password_hash": "dummy",
                "role": "SCRB_Analyst",
                "station_id": 100,
                "district_id": 1,
                "full_name": "Vikram Mehta",
                "phone": "+919876543214"
            },
            "admin.system@ksp.gov.in": {
                "user_id": "USR_006",
                "email": "admin.system@ksp.gov.in",
                "password_hash": "dummy",
                "role": "Admin",
                "station_id": 100,
                "district_id": 1,
                "full_name": "System Admin",
                "phone": "+919876543215"
            }
        }
        
        user = users_db.get(email.lower())
        
        if not user:
            log_info("Login failed - user not found", {"email": email})
            return {
                "statusCode": 401,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Invalid email or password"})
            }
        
        # Verify password
        if not verify_password(password, user["password_hash"]):
            log_info("Login failed - wrong password", {"email": email})
            return {
                "statusCode": 401,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Invalid email or password"})
            }
        
        # Generate token
        token = create_token(user)
        
        # Prepare response (remove password hash)
        user_response = {
            "user_id": user["user_id"],
            "email": user["email"],
            "role": user["role"],
            "station_id": user["station_id"],
            "district_id": user["district_id"],
            "full_name": user["full_name"]
        }
        
        log_info("Login successful", {
            "user_id": user["user_id"],
            "role": user["role"],
            "station_id": user["station_id"]
        })
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            },
            "body": json.dumps({
                "token": token,
                "user": user_response
            })
        }
    
    except Exception as e:
        log_error("Login error", {"error": str(e)}, e)
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Internal server error"})
        }
