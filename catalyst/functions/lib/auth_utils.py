"""
Authentication and Authorization Utilities
-------------------------------------------
These utilities enforce Role-Based Access Control (RBAC) and Row-Level Security (RLS)
for Karnataka State Police data.

CRITICAL: Every query must be filtered based on user role and station/district assignment.
"""

import json


def get_user_claims(token: str) -> dict:
    """
    Extract user claims from JWT token.
    
    Args:
        token: JWT token from Authorization header
    
    Returns:
        dict: User claims including:
            - user_id: unique identifier
            - role: Constable, SI, Inspector, DSP, SCRB_Analyst, Admin
            - station_id: assigned police station
            - district_id: assigned district
            - email: user email
    
    TODO: Implement real JWT validation using Catalyst Auth SDK
    - Verify token signature
    - Check expiration
    - Extract claims from payload
    - Handle refresh tokens
    """
    # Demo claims for scaffold testing
    return {
        "user_id": "USR_DEMO_001",
        "role": "Constable",
        "station_id": "STN_001",
        "district_id": "DIST_BANGALORE_NORTH",
        "email": "constable.demo@ksp.gov.in"
    }


def enforce_rls(claims: dict, base_query: dict) -> dict:
    """
    Apply Row-Level Security filters based on user role.
    
    Role-based data access:
    - Constable: own station only
    - SI/Inspector: own station + nearby stations (can be district in production)
    - DSP: district-wide
    - SCRB_Analyst: state-wide (for analytics)
    - Admin: full access
    
    Args:
        claims: user claims from get_user_claims()
        base_query: base query dict to be filtered
    
    Returns:
        dict: filtered query with RLS conditions added
    
    TODO: Integrate with Data Store query builder
    - Add WHERE clauses for station_id/district_id
    - Handle JOIN queries with multiple tables
    - Support nested queries and subqueries
    """
    role = claims.get("role", "")
    station_id = claims.get("station_id", "")
    district_id = claims.get("district_id", "")
    
    filtered_query = base_query.copy()
    
    if role == "Constable":
        # Constable: only data from their assigned station
        filtered_query["station_id"] = station_id
    
    elif role in ["SI", "Inspector"]:
        # SI/Inspector: own station + nearby (for now, same as Constable)
        # TODO: In production, fetch nearby stations from a configuration table
        filtered_query["station_id"] = station_id
    
    elif role == "DSP":
        # DSP: district-wide access
        filtered_query["district_id"] = district_id
    
    elif role in ["SCRB_Analyst", "Admin"]:
        # SCRB_Analyst and Admin: no RLS filters (state-wide access)
        pass
    
    else:
        # Unknown role: deny access by setting impossible filter
        filtered_query["station_id"] = "INVALID_STATION"
    
    return filtered_query


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
