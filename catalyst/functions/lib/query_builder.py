"""
SQL Query Builder
-----------------
Build safe, parameterized SQL queries from intents and entities.
All queries use %s placeholders to prevent SQL injection.
Row-Level Security (RLS) is applied based on user role.
"""

from typing import Tuple, List, Optional


def apply_rls_filters(user_claims: dict, sql: str, params: list) -> Tuple[str, list]:
    """
    Apply Row-Level Security filters based on user role.
    
    Args:
        user_claims: Dict with role, station_id, district_id
        sql: SQL query string
        params: List of query parameters
    
    Returns:
        (modified_sql, modified_params)
    """
    role = user_claims.get("role", "")
    station_id = user_claims.get("station_id")
    district_id = user_claims.get("district_id")
    
    if role in ["Constable", "SI", "Inspector"]:
        # Station-level access only
        sql += " AND cm.PoliceStationID = %s"
        params.append(station_id)
        
        # Exclude heinous crimes for Constables
        if role == "Constable":
            sql += " AND cm.GravityOffenceID != 1"
    
    elif role == "DSP":
        # District-level access
        # Need to join with Unit table to filter by district
        if "FROM CaseMaster cm" in sql and "JOIN Unit" not in sql:
            sql = sql.replace(
                "FROM CaseMaster cm",
                "FROM CaseMaster cm JOIN Unit u ON cm.PoliceStationID = u.UnitID"
            )
        sql += " AND u.DistrictID = %s"
        params.append(district_id)
    
    elif role in ["SCRB_Analyst", "Admin"]:
        # State-wide access - no additional filters
        pass
    
    else:
        # Unknown role - deny access
        sql += " AND 1=0"  # Returns no results
    
    return sql, params


def build_search_query(
    user_claims: dict,
    crime_type_ids: Optional[List[int]],
    date_from: Optional[str],
    date_to: Optional[str]
) -> Tuple[str, tuple]:
    """
    Build search query for cases.
    
    Args:
        user_claims: User authentication claims
        crime_type_ids: List of CrimeMinorHeadID or None for all
        date_from: Start date (YYYY-MM-DD) or None
        date_to: End date (YYYY-MM-DD) or None
    
    Returns:
        (sql_query, params_tuple)
    """
    sql = """
        SELECT 
            cm.CaseMasterID,
            cm.CrimeNo,
            cm.CrimeRegisteredDate,
            cm.BriefFacts,
            cm.ModusOperandi,
            csh.CrimeHeadName,
            u.UnitName AS StationName,
            cm.latitude,
            cm.longitude,
            CASE cm.CaseStatusID
                WHEN 1 THEN 'Registered'
                WHEN 2 THEN 'Under Investigation'
                WHEN 3 THEN 'Charge Sheeted'
                WHEN 4 THEN 'Closed'
                ELSE 'Unknown'
            END AS Status
        FROM CaseMaster cm
        LEFT JOIN CrimeSubHead csh ON cm.CrimeMinorHeadID = csh.CrimeSubHeadID
        LEFT JOIN Unit u ON cm.PoliceStationID = u.UnitID
        WHERE 1=1
    """
    
    params = []
    
    # Filter by crime type
    if crime_type_ids:
        placeholders = ",".join(["%s"] * len(crime_type_ids))
        sql += f" AND cm.CrimeMinorHeadID IN ({placeholders})"
        params.extend(crime_type_ids)
    
    # Filter by date range
    if date_from:
        sql += " AND cm.CrimeRegisteredDate >= %s"
        params.append(date_from)
    
    if date_to:
        sql += " AND cm.CrimeRegisteredDate <= %s"
        params.append(date_to)
    
    # Apply RLS filters
    sql, params = apply_rls_filters(user_claims, sql, params)
    
    # Order and limit
    sql += " ORDER BY cm.CrimeRegisteredDate DESC LIMIT 50"
    
    return sql, tuple(params)


def build_count_query(
    user_claims: dict,
    crime_type_ids: Optional[List[int]],
    date_from: Optional[str],
    date_to: Optional[str]
) -> Tuple[str, tuple]:
    """
    Build count query for cases.
    
    Returns count instead of full case details.
    """
    sql = """
        SELECT COUNT(*) AS case_count
        FROM CaseMaster cm
    """
    
    # Add JOIN for DSP role
    if user_claims.get("role") == "DSP":
        sql += " JOIN Unit u ON cm.PoliceStationID = u.UnitID"
    
    sql += " WHERE 1=1"
    
    params = []
    
    # Filter by crime type
    if crime_type_ids:
        placeholders = ",".join(["%s"] * len(crime_type_ids))
        sql += f" AND cm.CrimeMinorHeadID IN ({placeholders})"
        params.extend(crime_type_ids)
    
    # Filter by date range
    if date_from:
        sql += " AND cm.CrimeRegisteredDate >= %s"
        params.append(date_from)
    
    if date_to:
        sql += " AND cm.CrimeRegisteredDate <= %s"
        params.append(date_to)
    
    # Apply RLS filters
    sql, params = apply_rls_filters(user_claims, sql, params)
    
    return sql, tuple(params)


def build_hotspots_query(
    user_claims: dict,
    days: int = 30
) -> Tuple[str, tuple]:
    """
    Build query for crime hotspots (stations with most crimes).
    
    Args:
        user_claims: User claims
        days: Number of days to look back
    
    Returns:
        (sql_query, params_tuple)
    """
    sql = """
        SELECT 
            u.UnitID AS station_id,
            u.UnitName AS station_name,
            COUNT(*) AS crime_count,
            COUNT(CASE WHEN cm.GravityOffenceID = 1 THEN 1 END) AS heinous_count
        FROM CaseMaster cm
        JOIN Unit u ON cm.PoliceStationID = u.UnitID
        WHERE cm.CrimeRegisteredDate >= CURRENT_DATE - INTERVAL '%s days'
    """
    
    params = [days]
    
    # Apply RLS
    role = user_claims.get("role", "")
    
    if role in ["Constable", "SI", "Inspector"]:
        sql += " AND cm.PoliceStationID = %s"
        params.append(user_claims.get("station_id"))
    elif role == "DSP":
        sql += " AND u.DistrictID = %s"
        params.append(user_claims.get("district_id"))
    
    sql += """
        GROUP BY u.UnitID, u.UnitName
        ORDER BY crime_count DESC
        LIMIT 10
    """
    
    return sql, tuple(params)


def build_trends_query(
    user_claims: dict,
    months: int = 12
) -> Tuple[str, tuple]:
    """
    Build query for monthly crime trends.
    
    Args:
        user_claims: User claims
        months: Number of months to look back
    
    Returns:
        (sql_query, params_tuple)
    """
    sql = """
        SELECT 
            DATE_TRUNC('month', cm.CrimeRegisteredDate) AS month,
            COUNT(*) AS case_count,
            csh.CrimeHeadName AS crime_type,
            COUNT(DISTINCT cm.CrimeNo) AS unique_crimes
        FROM CaseMaster cm
        LEFT JOIN CrimeSubHead csh ON cm.CrimeMinorHeadID = csh.CrimeSubHeadID
    """
    
    # Add JOIN for DSP
    if user_claims.get("role") == "DSP":
        sql += " JOIN Unit u ON cm.PoliceStationID = u.UnitID"
    
    sql += " WHERE cm.CrimeRegisteredDate >= CURRENT_DATE - INTERVAL '%s months'"
    
    params = [months]
    
    # Apply RLS
    role = user_claims.get("role", "")
    
    if role in ["Constable", "SI", "Inspector"]:
        sql += " AND cm.PoliceStationID = %s"
        params.append(user_claims.get("station_id"))
    elif role == "DSP":
        sql += " AND u.DistrictID = %s"
        params.append(user_claims.get("district_id"))
    
    sql += """
        GROUP BY DATE_TRUNC('month', cm.CrimeRegisteredDate), csh.CrimeHeadName
        ORDER BY month DESC, case_count DESC
    """
    
    return sql, tuple(params)


def build_network_query(person_id: str) -> Tuple[str, tuple]:
    """
    Build query for criminal network (accused and their connections).
    
    Args:
        person_id: AccusedMasterID to center the network on
    
    Returns:
        (sql_query, params_tuple)
    """
    sql = """
        SELECT 
            a.AccusedMasterID AS accused_id,
            a.AccusedName AS name,
            a.AgeYear AS age,
            cm.CaseMasterID AS case_id,
            cm.CrimeNo AS case_number,
            cm.BriefFacts AS case_description,
            csh.CrimeHeadName AS crime_type
        FROM Accused a
        JOIN CaseMaster cm ON a.CaseMasterID = cm.CaseMasterID
        LEFT JOIN CrimeSubHead csh ON cm.CrimeMinorHeadID = csh.CrimeSubHeadID
        WHERE a.CaseMasterID IN (
            SELECT DISTINCT CaseMasterID 
            FROM Accused 
            WHERE AccusedMasterID = %s
        )
        ORDER BY cm.CrimeRegisteredDate DESC
        LIMIT 100
    """
    
    return sql, (person_id,)
