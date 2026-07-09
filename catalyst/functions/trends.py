"""
Trends Endpoint for Ibha
-------------------------
Provides crime trend analysis and hotspot identification.
Supports district/station-level filtering based on user role.
"""

import json
from datetime import datetime, timedelta
from lib.auth_utils import require_auth
from lib.logging_utils import log_info, log_error
from lib import db
from lib import query_builder


def handler_hotspots(request):
    """
    GET /trends/hotspots
    
    Returns top 10 stations by crime count with risk levels.
    
    Query params:
        - days: Number of days to look back (default: 30)
    
    Returns:
        {
            "hotspots": [
                {
                    "station_id": int,
                    "station_name": str,
                    "crime_count": int,
                    "heinous_count": int,
                    "risk_level": "HIGH"|"MEDIUM"|"LOW",
                    "reason": str,
                    "change_percentage": float
                }
            ],
            "period_days": int
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
        
        log_info("Hotspots request", {
            "user_id": user_claims["user_id"],
            "role": user_claims["role"]
        })
        
        # Get query params
        params = request.get("queryStringParameters", {}) if hasattr(request, 'get') else {}
        days = int(params.get("days", 30))
        
        # Build and execute query
        sql, query_params = query_builder.build_hotspots_query(user_claims, days)
        
        try:
            hotspots = db.execute_query(sql, query_params)
        except Exception as db_error:
            log_error("Failed to fetch hotspots", {"error": str(db_error)}, db_error)
            return {
                "statusCode": 500,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Database error"})
            }
        
        # Calculate risk levels and reasons
        enriched_hotspots = []
        
        for hotspot in hotspots:
            crime_count = hotspot.get("crime_count", 0)
            heinous_count = hotspot.get("heinous_count", 0)
            
            # Determine risk level based on crime count
            if crime_count >= 15:
                risk_level = "HIGH"
                reason = f"{crime_count} cases reported (well above average)"
            elif crime_count >= 8:
                risk_level = "MEDIUM"
                reason = f"{crime_count} cases reported (above average)"
            else:
                risk_level = "LOW"
                reason = f"{crime_count} cases reported (below average)"
            
            # Add heinous crime note
            if heinous_count > 0:
                reason += f", including {heinous_count} heinous crime(s)"
            
            enriched_hotspots.append({
                "station_id": hotspot.get("station_id"),
                "station_name": hotspot.get("station_name", "Unknown"),
                "crime_count": crime_count,
                "heinous_count": heinous_count,
                "latitude": float(hotspot.get("latitude")) if hotspot.get("latitude") is not None else None,
                "longitude": float(hotspot.get("longitude")) if hotspot.get("longitude") is not None else None,
                "risk_level": risk_level,
                "reason": reason,
                "change_percentage": 0  # TODO: Calculate from historical data
            })
        
        log_info("Hotspots retrieved", {"count": len(enriched_hotspots)})
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "hotspots": enriched_hotspots,
                "period_days": days,
                "timestamp": datetime.utcnow().isoformat()
            })
        }
    
    except Exception as e:
        log_error("Hotspots endpoint error", {"error": str(e)}, e)
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Internal server error"})
        }


def handler_summary(request):
    """
    GET /trends/summary
    
    Returns monthly crime trends for the last N months.
    
    Query params:
        - months: Number of months to look back (default: 12)
    
    Returns:
        {
            "trends": [
                {
                    "month": "2026-01",
                    "case_count": int,
                    "crime_type": str,
                    "unique_crimes": int
                }
            ],
            "period_months": int,
            "summary": {
                "total_cases": int,
                "trend_direction": "INCREASING"|"DECREASING"|"STABLE",
                "top_crime_type": str
            }
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
        
        log_info("Trends summary request", {
            "user_id": user_claims["user_id"],
            "role": user_claims["role"]
        })
        
        # Get query params
        params = request.get("queryStringParameters", {}) if hasattr(request, 'get') else {}
        months = int(params.get("months", 12))
        
        # Build and execute query
        sql, query_params = query_builder.build_trends_query(user_claims, months)
        
        try:
            trends = db.execute_query(sql, query_params)
        except Exception as db_error:
            log_error("Failed to fetch trends", {"error": str(db_error)}, db_error)
            return {
                "statusCode": 500,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Database error"})
            }
        
        # Format month as YYYY-MM
        formatted_trends = []
        for trend in trends:
            month_value = trend.get("month")
            if month_value:
                if hasattr(month_value, "strftime"):
                    month_str = month_value.strftime("%Y-%m")
                else:
                    month_str = str(month_value)[:7]  # Take first 7 chars (YYYY-MM)
            else:
                month_str = "Unknown"
            
            formatted_trends.append({
                "month": month_str,
                "case_count": trend.get("case_count", 0),
                "crime_type": trend.get("crime_type", "Unknown"),
                "unique_crimes": trend.get("unique_crimes", 0)
            })
        
        # Calculate summary statistics
        total_cases = sum(t["case_count"] for t in formatted_trends)
        
        # Determine trend direction (compare first and last month)
        if len(formatted_trends) >= 2:
            recent_count = formatted_trends[0]["case_count"]
            older_count = formatted_trends[-1]["case_count"]
            
            if recent_count > older_count * 1.2:
                trend_direction = "INCREASING"
            elif recent_count < older_count * 0.8:
                trend_direction = "DECREASING"
            else:
                trend_direction = "STABLE"
        else:
            trend_direction = "INSUFFICIENT_DATA"
        
        # Find top crime type
        crime_type_counts = {}
        for trend in formatted_trends:
            crime_type = trend["crime_type"]
            if crime_type not in crime_type_counts:
                crime_type_counts[crime_type] = 0
            crime_type_counts[crime_type] += trend["case_count"]
        
        top_crime_type = max(crime_type_counts.items(), key=lambda x: x[1])[0] if crime_type_counts else "None"
        
        log_info("Trends retrieved", {"count": len(formatted_trends), "total_cases": total_cases})
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "trends": formatted_trends,
                "period_months": months,
                "summary": {
                    "total_cases": total_cases,
                    "trend_direction": trend_direction,
                    "top_crime_type": top_crime_type
                },
                "timestamp": datetime.utcnow().isoformat()
            })
        }
    
    except Exception as e:
        log_error("Trends summary endpoint error", {"error": str(e)}, e)
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
    
    if "hotspots" in path:
        return handler_hotspots(request)
    elif "summary" in path:
        return handler_summary(request)
    else:
        # Default to hotspots
        return handler_hotspots(request)
