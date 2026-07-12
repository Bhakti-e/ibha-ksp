"""
Sociological Insights Endpoint — Ibha KSP Focus 4
================================================
Provides demographic breakdowns: age buckets, gender proxy, unit type, hourly.
"""

import json
from lib.auth_utils import require_auth
from lib.logging_utils import log_info, log_error
from lib import db

def _safe_query(sql, params=None):
    try:
        return db.execute_query(sql, params or ())
    except Exception as e:
        log_error("Sociological query failed", {"sql": sql, "error": str(e)}, e)
        return []

def _serializable(rows):
    out=[]
    for r in rows:
        c={}
        for k,v in r.items():
            if hasattr(v,'isoformat'):
                c[k]=v.isoformat()
            else:
                try:
                    import decimal
                    if isinstance(v, decimal.Decimal):
                        c[k]=float(v)
                    else:
                        c[k]=v
                except:
                    c[k]=v
        out.append(c)
    return out

def handler_demographics(request):
    try:
        user_claims = require_auth(request)
    except ValueError as e:
        return {"statusCode": 401, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": str(e)})}

    age = _safe_query("SELECT * FROM vw_age_buckets")
    # If views don't exist yet, return a clear setup message
    if age is None or (not age and _safe_query("SELECT 1 FROM information_schema.views WHERE table_name = 'vw_age_buckets'") == []):
        return {
            "statusCode": 503,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({
                "error": "Sociological views not yet initialized on this database.",
                "fix": "Run: psql -d ibha -f catalyst/datastore/extensions_4-5-6.sql",
                "age_buckets": [], "gender": [], "unit_type": [], "hourly": [],
                "total_accused": 0, "age_stats": {}
            })
        }
    gender = _safe_query("SELECT COALESCE(genderid, 0) as gender_id, COUNT(*) as count FROM accused GROUP BY genderid")
    unit_type = _safe_query("SELECT * FROM vw_crime_by_unit_type")
    hourly = _safe_query("SELECT * FROM vw_hourly_crime ORDER BY hour_of_day")
    
    # Additional breakdowns
    total_accused = _safe_query("SELECT COUNT(*) as count FROM accused")[0].get("count",0) if _safe_query("SELECT COUNT(*) as count FROM accused") else 0
    # Recalc safely
    try:
        r = db.execute_query("SELECT COUNT(*) as count FROM accused")
        total_accused = r[0]["count"] if r else 0
    except:
        total_accused = 0

    # Age stats
    try:
        age_stats = db.execute_query("SELECT AVG(ageyear) as avg_age, MIN(ageyear) as min_age, MAX(ageyear) as max_age FROM accused WHERE ageyear IS NOT NULL")
        age_stats = age_stats[0] if age_stats else {}
    except:
        age_stats = {}

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({
            "age_buckets": _serializable(age),
            "gender": _serializable(gender),
            "unit_type": _serializable(unit_type),
            "hourly": _serializable(hourly),
            "total_accused": total_accused,
            "age_stats": _serializable([age_stats])[0] if age_stats else {},
        })
    }

def handler(request):
    path = request.get("path","") if hasattr(request,'get') else ""
    if "demographics" in path or "sociological" in path:
        return handler_demographics(request)
    return handler_demographics(request)
