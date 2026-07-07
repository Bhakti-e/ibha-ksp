"""
Authentication and Authorization Utilities
-------------------------------------------
These utilities enforce Role-Based Access Control (RBAC) and Row-Level Security (RLS)
for Karnataka State Police data.

CRITICAL: Every query must be filtered based on user role and station/district assignment.
"""

import json
import hmac
import hashlib
import base64
from datetime import datetime

# Secret key must match auth.py
SECRET_KEY = "ibha_ksp_secret_key_change_in_production"


def verify_token(token: str) -> dict:
    """
    Verify JWT-like token and extract claims.
    
    Args:
        token: Token string from Authorization header
    
    Returns:
        dict: User claims including user_id, role, station_id, district_id, email
    
    Raises:
        ValueError: If token is invalid or expired
    """
    try:
        parts = token.split(".")
        if len(parts) != 2:
            raise ValueError("Invalid token format")
        
        payload_b64, signature = parts
        
        # Verify signature
        expected_sig = hmac.new(
            SECRET_KEY.encode(),
            payload_b64.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_sig):
            raise ValueError("Invalid signature")
        
        # Decode payload
        payload_json = base64.b64decode(payload_b64).decode()
        claims = json.loads(payload_json)
        
        # Check expiry
        if claims.get("exp", 0) < datetime.utcnow().timestamp():
            raise ValueError("Token expired")
        
        return claims
    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")


def require_auth(request) -> dict:
    """
    Extract and validate token from request.
    
    Args:
        request: Request object or dict with headers
    
    Returns:
        dict: User claims from verified token
    
    Raises:
        ValueError: If Authorization header is missing or token is invalid
    """
    auth_header = ""
    if hasattr(request, 'headers'):
        auth_header = request.headers.get("Authorization", "")
    elif isinstance(request, dict):
        auth_header = request.get("headers", {}).get("Authorization", "")
    
    if not auth_header:
        raise ValueError("Authorization required")
    
    token = auth_header.replace("Bearer ", "").strip()
    return verify_token(token)


def get_user_claims(token: str) -> dict:
    """
    Backward compatible wrapper for verify_token.
    
    Args:
        token: Token string
    
    Returns:
        dict: User claims or None if invalid
    """
    try:
        return verify_token(token)
    except:
        return None


def enforce_rls(claims: dict, base_filters: dict = None) -> dict:
    """
    Apply Row-Level Security filters based on user role.
    
    This function returns SQL WHERE clause filters that MUST be applied to every
    query against CaseMaster, Accused, Victim, and other case-related tables.
    
    Role-based data access:
    - Constable: own station only (PoliceStationID = user.station_id)
    - SI/Inspector: own station only (for MVP; in production, can be extended to nearby stations)
    - DSP: district-wide (all stations in user's district)
    - SCRB_Analyst: state-wide (no filters, for analytics across all districts)
    - Admin: full access (no filters)
    
    Args:
        claims: User claims from verify_token(), must include:
               - role: str (Constable, SI, Inspector, DSP, SCRB_Analyst, Admin)
               - station_id: int (user's assigned police station)
               - district_id: int (user's district)
        base_filters: Optional dict of existing filters to extend
    
    Returns:
        dict: Filters with RLS rules added, format:
              {
                  "station_id": int,  # for station-level roles
                  "district_id": int,  # for district-level roles
                  # ... other base filters preserved
              }
    
    Example:
        user_claims = {"role": "Constable", "station_id": 1, "district_id": 1}
        filters = enforce_rls(user_claims, {"crime_type_ids": [101, 102]})
        # Returns: {"station_id": 1, "crime_type_ids": [101, 102]}
    """
    role = claims.get("role", "")
    station_id = claims.get("station_id")
    district_id = claims.get("district_id")
    
    # Start with base filters or empty dict
    filters = base_filters.copy() if base_filters else {}
    
    # Apply RLS based on role hierarchy
    if role == "Constable":
        # Constable: MOST RESTRICTIVE - only own station
        filters["station_id"] = station_id
        
    elif role in ["SI", "Inspector"]:
        # SI/Inspector: Own station (in production, could be expanded to sub-division)
        # For MVP, same restriction as Constable
        filters["station_id"] = station_id
        
    elif role == "DSP":
        # DSP: District-wide access (all stations in their district)
        # Do NOT set station_id filter, only district_id
        filters["district_id"] = district_id
        
    elif role in ["SCRB_Analyst", "Admin"]:
        # SCRB_Analyst and Admin: State-wide access
        # NO geographic filters - can see all data across Karnataka
        pass
        
    else:
        # Unknown/invalid role: DENY ALL by setting impossible filter
        # This ensures security-by-default for any unexpected role
        filters["station_id"] = -1  # No station has ID -1
    
    return filters


def check_ingestion_permission(claims: dict) -> bool:
    """
    Check if user has permission to upload/review documents.
    
    Only SCRB_Analyst and Admin roles can manage knowledge ingestion.
    
    Args:
        claims: user claims from get_user_claims()
    
    Returns:
        bool: True if user can upload/review documents
    """
    role = claims.get("role", "")
    return role in ["SCRB_Analyst", "Admin"]


def check_admin_permission(claims: dict) -> bool:
    """
    Check if user has admin permissions.
    
    Args:
        claims: user claims from get_user_claims()
    
    Returns:
        bool: True if user is Admin
    """
    role = claims.get("role", "")
    return role == "Admin"
