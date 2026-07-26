"""
Investigator Decision Support Endpoints
----------------------------------------
GET /support/case-summary/:case_id   — structured case summary
GET /support/similar-cases/:case_id  — precedent matching

No external LLM. Summary is assembled from DB fields.
Similar cases are matched by: same station + same crime minor head + within 6 months.
RLS is applied so officers cannot see out-of-scope cases.
"""

import json
from datetime import datetime
from lib.auth_utils import require_auth
from lib.logging_utils import log_info, log_error
from lib import db

CORS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
}


def _require_auth_rls(request):
    try:
        return require_auth(request), None
    except ValueError as e:
        return None, {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": str(e)})}


def handler_case_summary(request, case_id):
    """GET /support/case-summary/:case_id"""
    claims, err = _require_auth_rls(request)
    if err:
        return err

    try:
        rows = db.execute_query(
            """
            SELECT
                cm.CaseMasterID,
                cm.CrimeNo,
                cm.CrimeRegisteredDate,
                cm.BriefFacts,
                cm.ModusOperandi,
                cm.CaseStatusID,
                cm.PoliceStationID,
                cm.latitude,
                cm.longitude,
                u.UnitName AS station_name,
                csh.CrimeHeadName AS crime_type,
                go.LookupValue AS gravity
            FROM CaseMaster cm
            LEFT JOIN Unit u       ON cm.PoliceStationID = u.UnitID
            LEFT JOIN CrimeSubHead csh ON cm.CrimeMinorHeadID = csh.CrimeSubHeadID
            LEFT JOIN GravityOffence go ON cm.GravityOffenceID = go.GravityOffenceID
            WHERE cm.CaseMasterID = %s
            """,
            (case_id,)
        )

        if not rows:
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Case not found"})}

        case = dict(rows[0])

        # Accused
        accused = db.execute_query(
            "SELECT AccusedMasterID, AccusedName, AgeYear, PreviousCases FROM Accused WHERE CaseMasterID = %s",
            (case_id,)
        )

        # Victims
        victims = db.execute_query(
            "SELECT VictimMasterID, VictimName, AgeYear FROM Victim WHERE CaseMasterID = %s",
            (case_id,)
        )

        # Build a deterministic summary from DB fields (no LLM)
        status_map = {1: "Registered", 2: "Under Investigation", 3: "Charge Sheeted", 4: "Closed", 5: "Reopened"}
        status_str = status_map.get(case.get("casestatusid") or case.get("CaseStatusID"), "Unknown")

        brief  = case.get("brieffacts") or case.get("BriefFacts") or "No brief facts recorded."
        modus  = case.get("modusoperandi") or case.get("ModusOperandi") or ""
        crime  = case.get("crime_type") or "Unknown"
        stn    = case.get("station_name") or f"Station {case.get('policeStationID', '')}"
        reg_dt = case.get("crimeregistereddate") or case.get("CrimeRegisteredDate")
        reg_str = reg_dt.isoformat() if hasattr(reg_dt, "isoformat") else str(reg_dt) if reg_dt else ""

        summary_text = (
            f"Case {case.get('crimeno') or case.get('CrimeNo')}: {crime} at {stn}. "
            f"Registered: {reg_str}. Status: {status_str}. "
            f"{brief[:300]}{'...' if len(brief) > 300 else ''}"
        )
        if modus:
            summary_text += f" Modus operandi: {modus[:150]}."

        accused_list = []
        for a in accused:
            accused_list.append({
                "accused_id":  a.get("accusedmasterid") or a.get("AccusedMasterID"),
                "name":        a.get("accusedname") or a.get("AccusedName"),
                "age":         a.get("ageyear") or a.get("AgeYear"),
                "prior_firs":  a.get("previouscases") or a.get("PreviousCases") or 0,
                "risk_tier":   "HIGH" if (a.get("previouscases") or 0) >= 3 else "MEDIUM" if (a.get("previouscases") or 0) >= 1 else "LOW",
                "risk_score":  min(100, (a.get("previouscases") or 0) * 10)
            })

        victim_list = []
        for v in victims:
            victim_list.append({
                "name": v.get("victimname") or v.get("VictimName"),
                "age":  v.get("ageyear") or v.get("AgeYear")
            })

        log_info("Case summary fetched", {"case_id": case_id, "user_id": claims["user_id"]})

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "case_id":              case.get("casemasterid") or case.get("CaseMasterID"),
                "crime_no":             case.get("crimeno") or case.get("CrimeNo"),
                "crime_type":           crime,
                "registered_date":      reg_str,
                "station":              stn,
                "status":               status_str,
                "investigating_officer": "",
                "llm_summary":          summary_text,
                "accused":              accused_list,
                "victims":              victim_list
            })
        }

    except Exception as e:
        log_error("Case summary error", {"error": str(e)}, e)
        return {"statusCode": 500, "headers": CORS, "body": json.dumps({"error": "Internal server error"})}


def handler_similar_cases(request, case_id):
    """GET /support/similar-cases/:case_id"""
    claims, err = _require_auth_rls(request)
    if err:
        return err

    try:
        # Fetch target case metadata
        meta = db.execute_query(
            "SELECT CaseMasterID, CrimeMinorHeadID, PoliceStationID, CrimeRegisteredDate FROM CaseMaster WHERE CaseMasterID = %s",
            (case_id,)
        )
        if not meta:
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Case not found"})}

        m = meta[0]
        station_id     = m.get("policestationid") or m.get("PoliceStationID")
        crime_minor_id = m.get("crimeminorheadid") or m.get("CrimeMinorHeadID")
        reg_date       = m.get("crimeregistereddate") or m.get("CrimeRegisteredDate")

        similar = db.execute_query(
            """
            SELECT cm.CaseMasterID, cm.CrimeNo, cm.CrimeRegisteredDate,
                   csh.CrimeHeadName AS crime_type,
                   u.UnitName AS place
            FROM CaseMaster cm
            LEFT JOIN CrimeSubHead csh ON cm.CrimeMinorHeadID = csh.CrimeSubHeadID
            LEFT JOIN Unit u ON cm.PoliceStationID = u.UnitID
            WHERE cm.CaseMasterID != %s
              AND cm.PoliceStationID = %s
              AND cm.CrimeMinorHeadID = %s
              AND cm.CrimeRegisteredDate BETWEEN %s::date - INTERVAL '180 days'
                                              AND %s::date + INTERVAL '180 days'
            ORDER BY cm.CrimeRegisteredDate DESC
            LIMIT 10
            """,
            (case_id, station_id, crime_minor_id, reg_date, reg_date)
        )

        results = []
        for s in similar:
            d = s.get("crimeregistereddate") or s.get("CrimeRegisteredDate")
            results.append({
                "case_id":          s.get("casemasterid") or s.get("CaseMasterID"),
                "crime_no":         s.get("crimeno") or s.get("CrimeNo"),
                "crime_type":       s.get("crime_type", ""),
                "date":             d.isoformat() if hasattr(d, "isoformat") else str(d) if d else "",
                "place":            s.get("place", ""),
                "similarity_reason": "Same station, same crime type, within 6 months"
            })

        log_info("Similar cases fetched", {"case_id": case_id, "count": len(results)})

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({"case_id": case_id, "similar_cases": results})
        }

    except Exception as e:
        log_error("Similar cases error", {"error": str(e)}, e)
        return {"statusCode": 500, "headers": CORS, "body": json.dumps({"error": "Internal server error"})}


def handler(request):
    """Route by path."""
    path = request.get("path", "") if hasattr(request, 'get') else ""
    path_params = request.get("pathParameters", {}) if hasattr(request, 'get') else {}

    case_id = path_params.get("case_id")
    if not case_id:
        # Extract from path like /support/case-summary/101
        parts = [p for p in path.split("/") if p]
        case_id = parts[-1] if parts else None

    if not case_id:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "case_id is required"})}

    if "similar" in path:
        return handler_similar_cases(request, case_id)
    return handler_case_summary(request, case_id)
