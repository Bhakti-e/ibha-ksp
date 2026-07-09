"""
Investigator Decision Support — Ibha KSP Focus 6
================================================
Case summarization (OpenRouter), similar cases (embeddings), timeline, leads.
"""

import json
from datetime import datetime
from lib.auth_utils import require_auth
from lib.logging_utils import log_info, log_error
from lib import db
from lib.embeddings import get_embedding, cosine_similarity

try:
    from lib.openrouter_client import summarize_case_openrouter, decision_support_openrouter, is_configured as or_configured
    HAS_OR = True
except:
    HAS_OR = False
    def summarize_case_openrouter(*a, **k): return None
    def decision_support_openrouter(*a, **k): return None
    def or_configured(): return False

def _safe_query(sql, params=None):
    try:
        return db.execute_query(sql, params or ())
    except Exception as e:
        log_error("DS query failed", {"error": str(e)}, e)
        return []

def _ser_row(row):
    return {k: (v.isoformat() if hasattr(v, 'isoformat') else float(v) if isinstance(v, (type(1.2),)) and str(type(v))=="<class 'decimal.Decimal'>" else v) for k,v in row.items()}

def _serialize_decimals(rows):
    out=[]
    for r in rows:
        clean={}
        for k,v in r.items():
            if hasattr(v,'isoformat'):
                clean[k]=v.isoformat()
            else:
                try:
                    import decimal
                    if isinstance(v, decimal.Decimal):
                        clean[k]=float(v)
                    else:
                        clean[k]=v
                except:
                    clean[k]=v
        out.append(clean)
    return out

def _fallback_summary(case):
    bf = case.get("brieffacts", "") or "No facts"
    return {
        "incident": f"FIR {case.get('crimeno','Unknown')} records: {bf[:180]}",
        "suspects": "Review linked accused and co-accused records for this case.",
        "status": f"Registered on {case.get('crimeregistereddate','Unknown')} with gravity ID {case.get('gravityoffenceid','-')}.",
        "next_steps": [
            "Verify witness statements and incident location evidence.",
            "Review linked accused history and similar modus operandi cases.",
            "Check available financial or digital trails for supporting evidence.",
        ],
    }

def _summary_to_text(summary):
    if isinstance(summary, dict):
        steps = summary.get("next_steps") or []
        return "\n".join([
            f"Incident: {summary.get('incident','')}",
            f"Suspects: {summary.get('suspects','')}",
            f"Status: {summary.get('status','')}",
            "Next steps: " + "; ".join(steps),
        ]).strip()
    return str(summary or "")

def _case_context(case):
    cid = case.get("casemasterid")
    accused = _safe_query("SELECT accusedmasterid, accusedname, ageyear FROM accused WHERE casemasterid = %s", (cid,))
    financial = _safe_query("SELECT amount, from_account, to_account, notes, flagged FROM financial_transactions WHERE case_id = %s ORDER BY amount DESC LIMIT 8", (cid,))
    similar = _similar_cases_for_id(cid)[:5]
    return _serialize_decimals(accused), _serialize_decimals(financial), similar

def _similar_cases_for_id(case_id):
    rows = _safe_query("SELECT embedding FROM case_embeddings WHERE case_id = %s", (case_id,))
    if not rows or not rows[0].get("embedding"):
        return []
    target_emb = rows[0]["embedding"]
    if isinstance(target_emb, str):
        try:
            target_emb = json.loads(target_emb)
        except:
            return []
    all_embs = _safe_query("SELECT case_id, embedding FROM case_embeddings")
    similar = []
    for r in all_embs:
        if str(r["case_id"]) == str(case_id):
            continue
        emb = r.get("embedding")
        if isinstance(emb, str):
            try:
                emb = json.loads(emb)
            except:
                continue
        if emb:
            similar.append({"case_id": r["case_id"], "similarity": cosine_similarity(target_emb, emb)})
    similar = sorted(similar, key=lambda x: x["similarity"], reverse=True)[:5]
    detailed = []
    for s in similar:
        cr = _safe_query("SELECT casemasterid, crimeno, crimeregistereddate, brieffacts, gravityoffenceid FROM casemaster WHERE casemasterid = %s", (s["case_id"],))
        if cr:
            c = _serialize_decimals(cr)[0]
            c["similarity"] = s["similarity"]
            detailed.append(c)
    return detailed

def handler_case_summary(request, case_id):
    # Get case
    rows = _safe_query("SELECT * FROM casemaster WHERE casemasterid = %s OR crimeno = %s", (case_id, case_id) if str(case_id).isdigit() else (case_id, case_id))
    if not rows:
        # try as crimeno string
        rows = _safe_query("SELECT * FROM casemaster WHERE crimeno = %s", (str(case_id),))
    if not rows:
        return {"statusCode": 404, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "Case not found"})}

    case = rows[0]
    language = request.get("queryStringParameters",{}).get("language","en") if hasattr(request,'get') else "en"

    structured = None
    source = "template"
    if HAS_OR and or_configured():
        accused, financial, similar = _case_context(case)
        structured = decision_support_openrouter(case, accused, financial, similar)
        source = "openrouter" if structured else "template"

    summary_obj = structured.get("summary") if structured else _fallback_summary(case)

    case_clean = _serialize_decimals([case])[0]
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({
            "case": case_clean,
            "summary": _summary_to_text(summary_obj),
            "summary_structured": summary_obj,
            "leads_generated": structured.get("leads", []) if structured else [],
            "source": source,
            "language": language,
        })
    }

def handler_similar(request, case_id):
    try:
        cid = int(case_id) if str(case_id).isdigit() else None
    except:
        cid = None

    if cid:
        detailed = _similar_cases_for_id(cid)
        if detailed:
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"similar_cases": detailed})
            }

    target_emb = None

    # If no embedding, try to get facts and embed on fly
    if not target_emb:
        case_rows = _safe_query("SELECT brieffacts FROM casemaster WHERE casemasterid = %s OR crimeno = %s", (case_id, case_id))
        if case_rows:
            facts = case_rows[0].get("brieffacts","")
            from lib.embeddings import get_embedding
            target_emb = get_embedding(facts)

    if not target_emb:
        return {"statusCode": 404, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "No embedding for case"})}

    # Compare against all
    all_embs = _safe_query("SELECT case_id, embedding FROM case_embeddings")
    similar = []
    for r in all_embs:
        if str(r["case_id"]) == str(case_id):
            continue
        emb = r.get("embedding")
        if not emb:
            continue
        if isinstance(emb, str):
            try:
                emb = json.loads(emb)
            except:
                continue
        score = cosine_similarity(target_emb, emb)
        similar.append({"case_id": r["case_id"], "similarity": score})

    similar = sorted(similar, key=lambda x: x["similarity"], reverse=True)[:5]

    # Fetch case details for similar
    detailed = []
    for s in similar:
        cr = _safe_query("SELECT casemasterid, crimeno, crimeregistereddate, brieffacts, gravityoffenceid FROM casemaster WHERE casemasterid = %s", (s["case_id"],))
        if cr:
            c = _serialize_decimals(cr)[0]
            c["similarity"] = s["similarity"]
            detailed.append(c)

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"similar_cases": detailed})
    }

def handler_timeline(request, case_id):
    # Timeline: registered date, status changes (mock), audit logs mentioning case
    case_rows = _safe_query("SELECT casemasterid, crimeno, crimeregistereddate, casestatusid, created_at FROM casemaster WHERE casemasterid = %s OR crimeno = %s", (case_id, case_id))
    if not case_rows:
        return {"statusCode": 404, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "Case not found"})}

    case = case_rows[0]
    cid = case.get("casemasterid")
    cno = case.get("crimeno")

    events = []
    if case.get("crimeregistereddate"):
        events.append({"date": str(case.get("crimeregistereddate")), "type": "registered", "title": f"FIR {cno} registered"})
    if case.get("created_at"):
        events.append({"date": str(case.get("created_at")), "type": "created", "title": "Case record created"})

    # Audit logs mentioning case
    audits = _safe_query("SELECT query_text, ts, user_id FROM audit_logs WHERE query_text ILIKE %s ORDER BY ts DESC LIMIT 20", (f"%{cno}%",))
    for a in audits:
        events.append({"date": str(a.get("ts")), "type": "query", "title": f"Queried by {a.get('user_id')}: {a.get('query_text')[:60]}"})

    # Accused linked
    accused = _safe_query("SELECT accusedname, created_at FROM accused WHERE casemasterid = %s", (cid,))
    for ac in accused:
        events.append({"date": str(ac.get("created_at") or case.get("crimeregistereddate")), "type": "accused", "title": f"Accused linked: {ac.get('accusedname')}"})

    # Sort by date
    def _parse_date(e):
        try:
            return e["date"] or ""
        except:
            return ""
    events = sorted(events, key=lambda x: x["date"])

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"case_id": cid, "crimeno": cno, "timeline": events})
    }

def handler_leads(request, case_id):
    case_rows = _safe_query("SELECT * FROM casemaster WHERE casemasterid = %s OR crimeno = %s", (case_id, case_id))
    if not case_rows:
        return {"statusCode": 404, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "Case not found"})}
    cid = case_rows[0]["casemasterid"]
    case = case_rows[0]

    # Co-accused not yet in all cases? For demo, list co-accused of this case who have other cases
    co_other = _safe_query("""
        SELECT a2.accusedmasterid, a2.accusedname, COUNT(a2c.casemasterid) as other_cases
        FROM accused a1
        JOIN accused a2 ON a1.casemasterid = a2.casemasterid AND a2.accusedmasterid != a1.accusedmasterid
        JOIN accused a2c ON a2.accusedmasterid = a2c.accusedmasterid
        WHERE a1.casemasterid = %s
        GROUP BY a2.accusedmasterid, a2.accusedname
        ORDER BY other_cases DESC
    """, (cid,))

    leads = []
    for row in co_other:
        leads.append({"type": "co_accused_repeat", "description": f"{row.get('accusedname')} involved in {row.get('other_cases')} cases including this", "priority": "HIGH" if row.get("other_cases",0)>1 else "MEDIUM", "accused_id": row.get("accusedmasterid")})

    # Financial flagged txns
    fin = _safe_query("SELECT * FROM financial_transactions WHERE case_id = %s AND flagged = true", (cid,))
    for f in fin:
        leads.append({"type": "financial", "description": f"Flagged transaction ₹{f.get('amount')} from acc {f.get('from_account')} to {f.get('to_account')} - {f.get('notes','')[:80]}", "priority": "HIGH"})

    # Similar MO cases leads
    leads.append({"type": "investigation", "description": "Verify incident-location evidence and alibi of linked accused against the case timeline", "priority": "MEDIUM"})

    if HAS_OR and or_configured():
        accused, financial, similar = _case_context(case)
        generated = decision_support_openrouter(case, accused, financial, similar)
        if generated and generated.get("leads"):
            leads = generated["leads"] + leads

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"case_id": cid, "leads": _serialize_decimals(leads)})
    }

def handler(request):
    try:
        require_auth(request)
    except ValueError as e:
        return {"statusCode": 401, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": str(e)})}

    path = request.get("path","") if hasattr(request,'get') else ""
    qp = request.get("queryStringParameters",{}) if hasattr(request,'get') else {}
    pp = request.get("pathParameters",{}) if hasattr(request,'get') else {}

    # Extract case id from path: /decision-support/case/31/summary, /decision-support/31/summary etc
    case_id = None
    for key in ["case_id", "id", "crimeno"]:
        if qp.get(key):
            case_id = qp.get(key)
            break
    if not case_id:
        # From path
        parts = path.strip("/").split("/")
        # Expect .../case/<id>/<action> or .../<id>/<action>
        for i, p in enumerate(parts):
            if p == "case" and i+1 < len(parts):
                case_id = parts[i+1]
                break
        if not case_id:
            # last numeric part before action
            for p in reversed(parts):
                if p.isdigit() or (len(p)>5 and p.startswith("10443")):
                    case_id = p
                    break

    if not case_id:
        return {"statusCode": 400, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "case_id required, e.g. /decision-support/case/31/summary"})}

    if "similar" in path:
        return handler_similar(request, case_id)
    elif "timeline" in path:
        return handler_timeline(request, case_id)
    elif "leads" in path:
        return handler_leads(request, case_id)
    else:
        return handler_case_summary(request, case_id)
