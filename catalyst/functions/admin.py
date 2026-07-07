"""
Admin Endpoint for Ibha
------------------------
Provides admin-only functions like viewing audit logs.
Access restricted to Admin and SCRB_Analyst roles only.
"""

import json
from datetime import datetime
from lib.auth_utils import require_auth
from lib.logging_utils import log_info, log_error
from lib import db


def handler_audit_logs(request):
    """
    GET /admin/audit-logs
    
    Returns audit logs with filters.
    Only accessible to Admin and SCRB_Analyst roles.
    
    Query params:
        - limit: Number of logs to return (default: 100, max: 1000)
        - user_id: Filter by specific user (optional)
        - from_date: Start date YYYY-MM-DD (optional)
        - to_date: End date YYYY-MM-DD (optional)
    
    Returns:
        {
            "logs": [
                {
                    "log_id": int,
                    "user_id": str,
                    "role": str,
                    "station_id": int,
                    "query_text": str,
                    "intent": str,
                    "result_count": int,
                    "timestamp": str
                }
            ]
        }
    """
    try:
        # Authenticate
        try:
            user_claims = require_auth(request)
        except ValueError as e:
            return {
                "statusCode": 401,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": str(e)})
            }
        
        # Check permission
        role = user_claims.get("role", "")
        if role not in ["Admin", "SCRB_Analyst"]:
            return {
                "statusCode": 403,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Access denied. Admin or SCRB_Analyst role required."})
            }
        
        log_info("Audit logs request", {
            "user_id": user_claims["user_id"],
            "role": role
        })
        
        # Get query params
        params = request.get("queryStringParameters", {}) if hasattr(request, 'get') else {}
        limit = min(int(params.get("limit", 100)), 1000)
        filter_user_id = params.get("user_id")
        from_date = params.get("from_date")
        to_date = params.get("to_date")
        
        # Build SQL query
        sql = """
            SELECT 
                log_id,
                user_id,
                role,
                station_id,
                district_id,
                query_text,
                intent,
                filters_applied,
                result_count,
                timestamp
            FROM audit_logs
            WHERE 1=1
        """
        
        query_params = []
        
        if filter_user_id:
            sql += " AND user_id = %s"
            query_params.append(filter_user_id)
        
        if from_date:
            sql += " AND timestamp >= %s"
            query_params.append(from_date)
        
        if to_date:
            sql += " AND timestamp <= %s"
            query_params.append(to_date)
        
        sql += " ORDER BY timestamp DESC LIMIT %s"
        query_params.append(limit)
        
        # Execute query
        try:
            logs = db.execute_query(sql, tuple(query_params))
        except Exception as db_error:
            log_error("Failed to fetch audit logs", {"error": str(db_error)}, db_error)
            return {
                "statusCode": 500,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Database error"})
            }
        
        # Format timestamps
        formatted_logs = []
        for log in logs:
            formatted_log = dict(log)
            if "timestamp" in formatted_log and hasattr(formatted_log["timestamp"], "isoformat"):
                formatted_log["timestamp"] = formatted_log["timestamp"].isoformat()
            formatted_logs.append(formatted_log)
        
        log_info("Audit logs retrieved", {"count": len(formatted_logs)})
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "logs": formatted_logs,
                "count": len(formatted_logs),
                "limit": limit
            })
        }
    
    except Exception as e:
        log_error("Admin audit logs error", {"error": str(e)}, e)
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Internal server error"})
        }


def handler_stats(request):
    """
    GET /admin/stats
    
    Returns system statistics.
    Only accessible to Admin and SCRB_Analyst roles.
    
    Returns:
        {
            "total_cases": int,
            "total_users": int,
            "total_queries_today": int,
            "top_querying_users": [...],
            "database_health": "OK"|"WARNING"|"ERROR"
        }
    """
    try:
        # Authenticate
        try:
            user_claims = require_auth(request)
        except ValueError as e:
            return {
                "statusCode": 401,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": str(e)})
            }
        
        # Check permission
        role = user_claims.get("role", "")
        if role not in ["Admin", "SCRB_Analyst"]:
            return {
                "statusCode": 403,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Access denied"})
            }
        
        log_info("Admin stats request", {"user_id": user_claims["user_id"]})
        
        # Query stats
        stats = {}
        
        # Total cases
        try:
            result = db.execute_query("SELECT COUNT(*) AS count FROM CaseMaster")
            stats["total_cases"] = result[0]["count"] if result else 0
        except:
            stats["total_cases"] = 0
        
        # Total users
        try:
            result = db.execute_query("SELECT COUNT(*) AS count FROM users WHERE active = TRUE")
            stats["total_users"] = result[0]["count"] if result else 0
        except:
            stats["total_users"] = 0
        
        # Queries today
        try:
            result = db.execute_query(
                "SELECT COUNT(*) AS count FROM audit_logs WHERE timestamp >= CURRENT_DATE"
            )
            stats["total_queries_today"] = result[0]["count"] if result else 0
        except:
            stats["total_queries_today"] = 0
        
        # Top querying users (last 7 days)
        try:
            result = db.execute_query("""
                SELECT user_id, COUNT(*) AS query_count
                FROM audit_logs
                WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
                GROUP BY user_id
                ORDER BY query_count DESC
                LIMIT 5
            """)
            stats["top_querying_users"] = result
        except:
            stats["top_querying_users"] = []
        
        # Database health check
        try:
            health_ok = db.test_connection()
            stats["database_health"] = "OK" if health_ok else "ERROR"
        except:
            stats["database_health"] = "ERROR"
        
        log_info("Admin stats generated", stats)
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(stats)
        }
    
    except Exception as e:
        log_error("Admin stats error", {"error": str(e)}, e)
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Internal server error"})
        }


# Main handler (routing)
def handler(request):
    """
    Route to appropriate handler based on path.
    """
    path = request.get("path", "") if hasattr(request, 'get') else ""
    
    if "audit-logs" in path or "audit_logs" in path:
        return handler_audit_logs(request)
    elif "stats" in path:
        return handler_stats(request)
    else:
        return {
            "statusCode": 404,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Not found"})
        }
