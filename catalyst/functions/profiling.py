"""
Offender Profiling Endpoint — Ibha KSP Focus 5
===============================================
Risk scoring, repeat offender analysis, MO similarity.
"""

import json
import math
from datetime import datetime, timedelta
from lib.auth_utils import require_auth
from lib.logging_utils import log_info, log_error
from lib import db
from lib.embeddings import get_embedding, cosine_similarity

def _safe_query(sql, params=None):
    try:
        return db.execute_query(sql, params or ())
    except Exception as e:
        log_error("Profiling query failed", {"error": str(e)}, e)
        return []

def _calculate_risk(accused_row, repeat_count, co_accused_count, gravity_id, last_date):
    # Recency: more recent = higher risk
    recency_score = 50
    try:
        if last_date:
            if isinstance(last_date, str):
                last_date = datetime.fromisoformat(last_date.split('T')[0])
            elif hasattr(last_date, 'year'):
                pass
            days_ago = (datetime.now().date() - last_date).days if hasattr(last_date, 'year') else 100
            # Linear decay: 0 days = 100, 365 days = 0
            recency_score = max(0, 100 - (days_ago / 365.0 * 100))
    except:
        recency_score = 50

    gravity_score = 100 if gravity_id == 1 else 70 if gravity_id == 2 else 40
    repeat_score = min(100, repeat_count * 35)
    degree_score = min(100, co_accused_count * 30)

    final = 0.3 * recency_score + 0.3 * gravity_score + 0.2 * degree_score + 0.2 * repeat_score
    return int(max(0, min(100, final)))

def handler_profile(request):
    try:
        user_claims = require_auth(request)
    except ValueError as e:
        return {"statusCode": 401, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": str(e)})}

    path = request.get("path","") if hasattr(request,'get') else ""
    params = request.get("pathParameters", {}) if hasattr(request,'get') else {}
    qp = request.get("queryStringParameters",{}) if hasattr(request,'get') else {}

    # Extract accused id from path or query
    accused_id = None
    sub = params.get("subpath") or params.get("person_id") or params.get("accused_id") or ""
    if sub:
        # sub can be "accused/13" or "13" or "accused/13/..."
        for token in reversed(str(sub).split("/")):
            if token.isdigit():
                accused_id = token
                break
        if not accused_id and str(sub).isdigit():
            accused_id = str(sub)

    if not accused_id:
        if "/accused/" in path:
            accused_id = path.split("/accused/")[-1].split("/")[0].split("?")[0]
        else:
            parts = path.strip("/").split("/")
            if parts and parts[-1].isdigit():
                accused_id = parts[-1]
            else:
                accused_id = qp.get("accused_id") or qp.get("id")

    if not accused_id or not str(accused_id).isdigit():
        return {"statusCode": 400, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "accused_id required, e.g. /profiling/accused/13"})}

    accused_id = int(accused_id)

    try:
        accused_rows = db.execute_query("SELECT * FROM accused WHERE accusedmasterid = %s", (accused_id,))
        if not accused_rows:
            return {"statusCode": 404, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "Accused not found"})}
        acc = accused_rows[0]

        # Cases for this accused
        cases = db.execute_query("""
            SELECT cm.casemasterid, cm.crimeno, cm.crimeregistereddate, cm.brieffacts, cm.gravityoffenceid, cm.crimemajorheadid
            FROM casemaster cm JOIN accused a ON cm.casemasterid = a.casemasterid
            WHERE a.accusedmasterid = %s ORDER BY cm.crimeregistereddate DESC
        """, (accused_id,))

        repeat_count = len(cases)
        last_date = cases[0].get("crimeregistereddate") if cases else None
        gravity_id = cases[0].get("gravityoffenceid", 2) if cases else 2

        # Co-accused count (degree)
        co_accused = db.execute_query("""
            SELECT COUNT(DISTINCT a2.accusedmasterid) as cnt
            FROM accused a1 JOIN accused a2 ON a1.casemasterid = a2.casemasterid
            WHERE a1.accusedmasterid = %s AND a2.accusedmasterid != %s
        """, (accused_id, accused_id))
        co_cnt = co_accused[0]["cnt"] if co_accused else 0

        risk = _calculate_risk(acc, repeat_count, co_cnt, gravity_id, last_date)

        # Co-accused details
        co_details = db.execute_query("""
            SELECT DISTINCT a2.accusedmasterid, a2.accusedname, a2.ageyear
            FROM accused a1 JOIN accused a2 ON a1.casemasterid = a2.casemasterid
            WHERE a1.accusedmasterid = %s AND a2.accusedmasterid != %s
        """, (accused_id, accused_id))

        # MO similarity: find cases with similar BriefFacts embedding
        try:
            main_facts = cases[0].get("brieffacts","") if cases else acc.get("accusedname","")
            q_emb = get_embedding(main_facts)
            all_embs = db.execute_query("SELECT case_id, embedding FROM case_embeddings")
            similar = []
            for row in all_embs:
                emb = row.get("embedding")
                if not emb:
                    continue
                # pg may return string representation for float[]
                if isinstance(emb, str):
                    try:
                        emb = json.loads(emb)
                    except:
                        continue
                score = cosine_similarity(q_emb, emb)
                if score > 0.5 and row["case_id"] != (cases[0].get("casemasterid") if cases else None):
                    similar.append({"case_id": row["case_id"], "similarity": score})
            similar = sorted(similar, key=lambda x: x["similarity"], reverse=True)[:5]
        except Exception as e:
            log_error("MO similarity failed", {"error": str(e)}, e)
            similar = []

        # Risk level
        if risk >= 70:
            level = "HIGH"
        elif risk >= 40:
            level = "MEDIUM"
        else:
            level = "LOW"

        # Cache risk
        try:
            db.execute_insert("""
                INSERT INTO offender_risk_cache (accusedmasterid, risk_score, factors, updated_at)
                VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (accusedmasterid) DO UPDATE SET risk_score=EXCLUDED.risk_score, factors=EXCLUDED.factors, updated_at=CURRENT_TIMESTAMP
            """, (accused_id, risk, json.dumps({"repeat": repeat_count, "co": co_cnt, "gravity": gravity_id})))
        except:
            pass

        # Serialize dates
        def _ser(v):
            if hasattr(v, 'isoformat'):
                return v.isoformat()
            return v

        acc_clean = {k: _ser(v) for k,v in acc.items()}
        cases_clean = [{k: _ser(v) for k,v in c.items()} for c in cases]
        co_clean = [{k: _ser(v) for k,v in c.items()} for c in co_details]

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({
                "accused": acc_clean,
                "risk_score": risk,
                "risk_level": level,
                "repeat_count": repeat_count,
                "co_accused_count": co_cnt,
                "co_accused": co_clean,
                "cases": cases_clean,
                "mo_similar_cases": similar,
                "factors": {"repeat": repeat_count, "co_accused": co_cnt, "gravity_id": gravity_id, "recency": str(last_date)[:10] if last_date else None}
            })
        }

    except Exception as e:
        log_error("Profiling error", {"error": str(e)}, e)
        return {"statusCode": 500, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "Internal error", "detail": str(e)})}

def handler(request):
    return handler_profile(request)
