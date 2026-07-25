"""
Trends Endpoint for Ibha
-------------------------
Provides crime trend analysis, hotspot identification, and OLS-based forecasting.
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
                "risk_level": risk_level,
                "reason": reason,
                "change_percentage": _calc_change(
                    hotspot.get("station_id"), days, user_claims
                )
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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _calc_change(station_id, days: int, user_claims: dict) -> float:
    """Compare current period vs previous equal period for a station."""
    if not station_id:
        return 0.0
    try:
        sql = """
            SELECT COUNT(*) AS cnt
            FROM CaseMaster
            WHERE PoliceStationID = %s
              AND CrimeRegisteredDate >= CURRENT_DATE - INTERVAL '%s days'
        """ % ('%s', days)
        prev_sql = """
            SELECT COUNT(*) AS cnt
            FROM CaseMaster
            WHERE PoliceStationID = %s
              AND CrimeRegisteredDate >= CURRENT_DATE - INTERVAL '%s days'
              AND CrimeRegisteredDate < CURRENT_DATE - INTERVAL '%s days'
        """ % ('%s', days * 2, days)
        curr = db.execute_query(sql, (station_id,))
        prev = db.execute_query(prev_sql, (station_id,))
        curr_n = curr[0]["cnt"] if curr else 0
        prev_n = prev[0]["cnt"] if prev else 0
        if prev_n == 0:
            return 0.0
        return round(((curr_n - prev_n) / prev_n) * 100, 1)
    except Exception:
        return 0.0


def handler_forecast(request):
    """
    GET /trends/forecast

    OLS linear projection of monthly case counts for the next 3 months.
    No external ML library — uses a simple least-squares formula.

    Query params:
        - months:     historical window in months (default 12)
        - crime_type: optional filter

    Returns:
        {
            "method": "linear_ols_projection",
            "historical": [{"month": str, "case_count": int}],
            "projection": [{"month": str, "case_count": int, "is_projected": true}],
            "early_warning": str | null,
            "trailing_6mo_avg": float
        }
    """
    try:
        try:
            user_claims = require_auth(request)
        except ValueError as e:
            return {
                "statusCode": 401,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": str(e)})
            }

        params = request.get("queryStringParameters", {}) if hasattr(request, 'get') else {}
        months = int(params.get("months", 12))
        crime_type = params.get("crime_type")

        # Build query
        rls_extra = ""
        rls_params = []
        role = user_claims.get("role", "")
        if role in ("Constable", "SI", "Inspector"):
            rls_extra = " AND cm.PoliceStationID = %s"
            rls_params.append(user_claims.get("station_id"))
        elif role == "DSP":
            rls_extra = " AND u.DistrictID = %s"
            rls_params.append(user_claims.get("district_id"))

        ct_extra = ""
        if crime_type:
            ct_extra = " AND csh.CrimeHeadName ILIKE %s"
            rls_params.append(f"%{crime_type}%")

        sql = f"""
            SELECT DATE_TRUNC('month', cm.CrimeRegisteredDate) AS month,
                   COUNT(*) AS case_count
            FROM CaseMaster cm
            LEFT JOIN Unit u ON cm.PoliceStationID = u.UnitID
            LEFT JOIN CrimeSubHead csh ON cm.CrimeMinorHeadID = csh.CrimeSubHeadID
            WHERE cm.CrimeRegisteredDate >= CURRENT_DATE - INTERVAL '{months} months'
            {rls_extra}{ct_extra}
            GROUP BY 1 ORDER BY 1 ASC
        """

        rows = db.execute_query(sql, tuple(rls_params))

        historical = []
        for r in rows:
            m = r.get("month")
            month_str = m.strftime("%Y-%m") if hasattr(m, "strftime") else str(m)[:7]
            historical.append({"month": month_str, "case_count": int(r.get("case_count", 0))})

        # OLS projection: y = a + b*x  (x = 0,1,...n-1)
        n = len(historical)
        projection = []
        early_warning = None
        trailing_6mo_avg = 0.0

        if n >= 3:
            y_vals = [h["case_count"] for h in historical]
            x_vals = list(range(n))
            x_mean = sum(x_vals) / n
            y_mean = sum(y_vals) / n
            ss_xy  = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_vals, y_vals))
            ss_xx  = sum((x - x_mean) ** 2 for x in x_vals)
            b = ss_xy / ss_xx if ss_xx != 0 else 0
            a = y_mean - b * x_mean

            # Last known month for date arithmetic
            last_month_str = historical[-1]["month"]
            last_dt = datetime.strptime(last_month_str + "-01", "%Y-%m-%d")

            for i in range(1, 4):
                proj_x     = n - 1 + i
                proj_count = max(0, round(a + b * proj_x))
                proj_dt    = (last_dt + timedelta(days=32 * i)).replace(day=1)
                projection.append({
                    "month":        proj_dt.strftime("%Y-%m"),
                    "case_count":   proj_count,
                    "is_projected": True
                })

            trailing_6 = y_vals[-6:] if n >= 6 else y_vals
            trailing_6mo_avg = round(sum(trailing_6) / len(trailing_6), 1)

            if projection and projection[0]["case_count"] > trailing_6mo_avg * 1.5:
                early_warning = (
                    f"Projected case volume for {projection[0]['month']} "
                    f"({projection[0]['case_count']} cases) is significantly above the "
                    f"6-month rolling average of {trailing_6mo_avg}. "
                    "Consider reviewing patrol allocation."
                )

        log_info("Trend forecast generated", {
            "user_id": user_claims["user_id"],
            "historical_months": n,
            "projected_months": len(projection)
        })

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({
                "method":           "linear_ols_projection",
                "crime_type":       crime_type or "All",
                "historical":       historical,
                "projection":       projection,
                "early_warning":    early_warning,
                "trailing_6mo_avg": trailing_6mo_avg,
                "timestamp":        datetime.utcnow().isoformat()
            })
        }

    except Exception as e:
        log_error("Forecast endpoint error", {"error": str(e)}, e)
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Internal server error"})
        }


# Main handler (routing)
def handler(request):
    """Route to appropriate handler based on path."""
    path = request.get("path", "") if hasattr(request, 'get') else ""

    if "hotspots" in path:
        return handler_hotspots(request)
    elif "forecast" in path:
        return handler_forecast(request)
    elif "summary" in path:
        return handler_summary(request)
    else:
        return handler_hotspots(request)
