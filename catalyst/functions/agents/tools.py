"""Safe agent tool registry for Ibha.

LLMs may request these tools by name, but only this module executes them.
Every handler uses fixed, parameterized SQL or existing endpoint logic.
"""

import json
import re
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from lib import db, nlp_simple, query_builder, templates


def _jsonable(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value) if value.is_finite() else None
    if isinstance(value, list):
        return [_jsonable(v) for v in value]
    if isinstance(value, dict):
        return {str(k).lower(): _jsonable(v) for k, v in value.items()}
    return value


def _ok(name: str, data: Any, record_count: Optional[int] = None, citations: Optional[List[str]] = None) -> Dict:
    if record_count is None:
        record_count = len(data) if isinstance(data, list) else 1 if data else 0
    return {
        "tool": name,
        "ok": True,
        "record_count": record_count,
        "citations": citations or [],
        "data": _jsonable(data),
    }


def _err(name: str, message: str) -> Dict:
    return {"tool": name, "ok": False, "record_count": 0, "citations": [], "error": message, "data": None}


def _int_list(value: Any) -> Optional[List[int]]:
    if value in (None, "", []):
        return None
    if not isinstance(value, list):
        value = [value]
    out = []
    for item in value:
        try:
            out.append(int(item))
        except Exception:
            continue
    return out or None


def _date_or_none(value: Any) -> Optional[str]:
    if not value:
        return None
    text = str(value)
    return text if re.match(r"^\d{4}-\d{2}-\d{2}$", text) else None


def _case_citations(rows: List[Dict]) -> List[str]:
    return [str(r.get("crimeno") or r.get("CrimeNo")) for r in rows if r.get("crimeno") or r.get("CrimeNo")]


def search_cases(user_claims: Dict, args: Dict) -> Dict:
    sql, params = query_builder.build_search_query(
        user_claims,
        _int_list(args.get("crime_type_ids")),
        _date_or_none(args.get("date_from")),
        _date_or_none(args.get("date_to")),
    )
    rows = db.execute_query(sql, params)
    return _ok("search_cases", rows, citations=_case_citations(rows))


def lookup_case(user_claims: Dict, args: Dict) -> Dict:
    case_id = str(args.get("case_id") or args.get("fir_no") or args.get("crime_no") or "").strip()
    if not case_id:
        return _err("lookup_case", "case_id or fir_no is required")
    sql, params = query_builder.build_case_lookup_query(user_claims, case_id)
    rows = db.execute_query(sql, params)
    return _ok("lookup_case", rows, citations=_case_citations(rows))


def count_cases(user_claims: Dict, args: Dict) -> Dict:
    sql, params = query_builder.build_count_query(
        user_claims,
        _int_list(args.get("crime_type_ids")),
        _date_or_none(args.get("date_from")),
        _date_or_none(args.get("date_to")),
    )
    rows = db.execute_query(sql, params)
    return _ok("count_cases", rows, record_count=int(rows[0].get("case_count", 0)) if rows else 0)


def get_hotspots(user_claims: Dict, args: Dict) -> Dict:
    days = int(args.get("days") or 30)
    days = max(1, min(days, 365))
    sql, params = query_builder.build_hotspots_query(user_claims, days)
    rows = db.execute_query(sql, params)
    return _ok("get_hotspots", rows)


def get_trends(user_claims: Dict, args: Dict) -> Dict:
    months = int(args.get("months") or 12)
    months = max(1, min(months, 36))
    sql, params = query_builder.build_trends_query(user_claims, months)
    rows = db.execute_query(sql, params)
    return _ok("get_trends", rows)


def get_accused_network(user_claims: Dict, args: Dict) -> Dict:
    accused_id = str(args.get("accused_id") or args.get("person_id") or "").strip()
    if not accused_id.isdigit():
        return _err("get_accused_network", "numeric accused_id is required")
    sql, params = query_builder.build_network_query(accused_id)
    rows = db.execute_query(sql, params)
    return _ok("get_accused_network", rows)


def get_accused_profile(user_claims: Dict, args: Dict) -> Dict:
    accused_id = str(args.get("accused_id") or "").strip()
    if not accused_id.isdigit():
        return _err("get_accused_profile", "numeric accused_id is required")
    accused = db.execute_query("SELECT * FROM accused WHERE accusedmasterid = %s LIMIT 1", (accused_id,))
    cases = db.execute_query("""
        SELECT cm.casemasterid, cm.crimeno, cm.crimeregistereddate, cm.brieffacts, csh.crimeheadname
        FROM accused a
        JOIN casemaster cm ON a.casemasterid = cm.casemasterid
        LEFT JOIN crimesubhead csh ON cm.crimeminorheadid = csh.crimesubheadid
        WHERE a.accusedmasterid = %s
        ORDER BY cm.crimeregistereddate DESC
    """, (accused_id,))
    return _ok("get_accused_profile", {"accused": accused[0] if accused else None, "cases": cases}, record_count=len(cases), citations=_case_citations(cases))


def get_case_summary(user_claims: Dict, args: Dict) -> Dict:
    case_id = str(args.get("case_id") or args.get("fir_no") or "").strip()
    if not case_id:
        return _err("get_case_summary", "case_id or fir_no is required")
    rows = db.execute_query("SELECT * FROM casemaster WHERE casemasterid::text = %s OR crimeno::text = %s LIMIT 1", (case_id, case_id))
    if not rows:
        return _err("get_case_summary", "case not found")
    case = rows[0]
    facts = case.get("brieffacts") or "No facts recorded"
    summary = {
        "incident": f"FIR {case.get('crimeno')} records: {facts[:220]}",
        "status": f"Registered on {case.get('crimeregistereddate')} with gravity ID {case.get('gravityoffenceid')}",
        "case": case,
    }
    return _ok("get_case_summary", summary, citations=[str(case.get("crimeno"))])


def get_rag_context(user_claims: Dict, args: Dict) -> Dict:
    query = str(args.get("query") or "").strip()
    if not query:
        return _err("rag_search_knowledge", "query is required")
    # Local schema may not have document tables loaded. Probe safely.
    try:
        rows = db.execute_query("""
            SELECT document_id, fir_number, text_content, source_type
            FROM documents
            WHERE text_content ILIKE %s OR fir_number ILIKE %s
            ORDER BY approved_at DESC NULLS LAST
            LIMIT 5
        """, (f"%{query}%", f"%{query}%"))
        return _ok("rag_search_knowledge", rows, citations=[str(r.get("document_id")) for r in rows if r.get("document_id")])
    except Exception:
        return _ok("rag_search_knowledge", [], record_count=0)


def ocr_extract_document(user_claims: Dict, args: Dict) -> Dict:
    return _err("ocr_extract_document", "OCR requires a file upload through /api/v1/ocr/extract; chat can use already extracted OCR text from conversation.")


TOOLS = {
    "search_cases": search_cases,
    "lookup_case": lookup_case,
    "count_cases": count_cases,
    "get_hotspots": get_hotspots,
    "get_trends": get_trends,
    "get_case_summary": get_case_summary,
    "get_accused_network": get_accused_network,
    "get_accused_profile": get_accused_profile,
    "rag_search_knowledge": get_rag_context,
    "ocr_extract_document": ocr_extract_document,
}


TOOL_DESCRIPTIONS = [
    {"name": "search_cases", "description": "Search FIR/case rows by crime_type_ids/date range", "args": {"crime_type_ids": "number[]|null", "date_from": "YYYY-MM-DD|null", "date_to": "YYYY-MM-DD|null"}},
    {"name": "lookup_case", "description": "Lookup one case by CaseMasterID or FIR/CrimeNo", "args": {"case_id": "string"}},
    {"name": "count_cases", "description": "Count cases by crime_type_ids/date range", "args": {"crime_type_ids": "number[]|null", "date_from": "YYYY-MM-DD|null", "date_to": "YYYY-MM-DD|null"}},
    {"name": "get_hotspots", "description": "Get station hotspots for a day window", "args": {"days": "number"}},
    {"name": "get_trends", "description": "Get monthly trend rows", "args": {"months": "number"}},
    {"name": "get_case_summary", "description": "Get grounded case summary facts", "args": {"case_id": "string"}},
    {"name": "get_accused_network", "description": "Get raw accused/case network rows", "args": {"accused_id": "string"}},
    {"name": "get_accused_profile", "description": "Get accused record and cases", "args": {"accused_id": "string"}},
    {"name": "rag_search_knowledge", "description": "Search indexed approved documents when available", "args": {"query": "string"}},
    {"name": "ocr_extract_document", "description": "Guarded OCR upload tool; use OCR endpoint for files", "args": {}},
]


def execute_tool(user_claims: Dict, name: str, args: Optional[Dict] = None) -> Dict:
    if name not in TOOLS:
        return _err(name, "unknown tool")
    try:
        return TOOLS[name](user_claims, args or {})
    except Exception as e:
        return _err(name, str(e))


def execute_tools(user_claims: Dict, calls: List[Dict]) -> List[Dict]:
    results = []
    for call in calls[:6]:
        name = call.get("name")
        args = call.get("args") or {}
        results.append(execute_tool(user_claims, name, args))
    return results


def fallback_tool_calls(query: str, entities: Dict, case_identifier: Optional[str] = None) -> List[Dict]:
    q = query.lower()
    calls: List[Dict] = []
    if case_identifier:
        calls.append({"name": "lookup_case", "args": {"case_id": case_identifier}})
        if any(k in q for k in ["investigate", "summary", "lead", "more"]):
            calls.append({"name": "get_case_summary", "args": {"case_id": case_identifier}})
        return calls
    accused = re.search(r"\b(?:accused|person|profile)\s*(?:id)?\s*(\d{1,7})\b", q)
    if accused:
        aid = accused.group(1)
        calls.append({"name": "get_accused_profile", "args": {"accused_id": aid}})
        if any(k in q for k in ["network", "graph", "connection", "link"]):
            calls.append({"name": "get_accused_network", "args": {"accused_id": aid}})
        return calls
    if "hotspot" in q:
        calls.append({"name": "get_hotspots", "args": {"days": 30}})
    elif "trend" in q:
        calls.append({"name": "get_trends", "args": {"months": 12}})
    elif any(k in q for k in ["how many", "count", "total"]):
        calls.append({"name": "count_cases", "args": {"crime_type_ids": entities.get("crime_type_ids"), "date_from": entities.get("date_from"), "date_to": entities.get("date_to")}})
    else:
        calls.append({"name": "search_cases", "args": {"crime_type_ids": entities.get("crime_type_ids"), "date_from": entities.get("date_from"), "date_to": entities.get("date_to")}})
    if any(k in q for k in ["document", "sop", "manual", "knowledge", "rag"]):
        calls.append({"name": "rag_search_knowledge", "args": {"query": query}})
    return calls


def format_tool_answer(tool_results: List[Dict], language: str = "en") -> Dict:
    primary = next((r for r in tool_results if r.get("ok") and r.get("record_count", 0) > 0), tool_results[0] if tool_results else None)
    if not primary:
        return {"answer_text": "No tool was executed.", "data_rows": [], "citations": []}
    name = primary.get("tool")
    data = primary.get("data")
    if name in ("search_cases", "lookup_case"):
        rows = data if isinstance(data, list) else []
        answer = "Found matching case records." if rows else "No matching case records found."
        if name == "lookup_case" and rows:
            answer = "Found the requested case. Details are shown below."
        return {"answer_text": answer, "data_rows": rows, "citations": primary.get("citations", [])}
    if name == "count_cases":
        return {"answer_text": f"Count result: {primary.get('record_count', 0)} cases.", "data_rows": [], "citations": []}
    if name == "get_case_summary":
        summary = data or {}
        return {"answer_text": f"{summary.get('incident', 'Case summary unavailable')}\n{summary.get('status', '')}".strip(), "data_rows": [summary.get("case")] if summary.get("case") else [], "citations": primary.get("citations", [])}
    if name == "get_accused_profile":
        accused = (data or {}).get("accused") or {}
        cases = (data or {}).get("cases") or []
        return {"answer_text": f"Profile for {accused.get('accusedname', 'accused')} found with {len(cases)} linked case(s).", "data_rows": cases, "citations": primary.get("citations", [])}
    if name in ("get_hotspots", "get_trends", "get_accused_network", "rag_search_knowledge"):
        return {"answer_text": f"Executed {name}; returned {primary.get('record_count', 0)} record(s).", "data_rows": data if isinstance(data, list) else [], "citations": primary.get("citations", [])}
    return {"answer_text": primary.get("error") or f"Executed {name}.", "data_rows": [], "citations": []}
