"""
Financial Test Data Endpoint — Ibha KSP Focus 7 (Test)
=======================================================
Returns accounts and transactions linked to cases.
TEST DATA only — marked in UI.
"""

import json
from lib.auth_utils import require_auth
from lib.logging_utils import log_error
from lib import db

def _safe(q, p=None):
    try:
        return db.execute_query(q, p or ())
    except Exception as e:
        log_error("financial query failed", {"error": str(e)}, e)
        return []

def handler(request):
    try:
        require_auth(request)
    except ValueError as e:
        return {"statusCode": 401, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": str(e)})}

    path = request.get("path","") if hasattr(request,'get') else ""
    qp = request.get("queryStringParameters",{}) if hasattr(request,'get') else {}

    case_id = qp.get("case_id") or qp.get("caseId")
    if "accounts" in path:
        rows = _safe("SELECT * FROM accounts ORDER BY id")
        # serialize decimals/dates
        clean=[]
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
            clean.append(c)
        return {"statusCode":200,"headers":{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"},"body":json.dumps({"accounts":clean, "test_data":True})}

    # transactions
    if case_id:
        try:
            cid = int(case_id)
            rows = _safe("SELECT ft.*, a1.holder_name as from_holder, a2.holder_name as to_holder FROM financial_transactions ft LEFT JOIN accounts a1 ON ft.from_account=a1.id LEFT JOIN accounts a2 ON ft.to_account=a2.id WHERE ft.case_id=%s ORDER BY ft.ts DESC", (cid,))
        except:
            rows = _safe("SELECT ft.*, a1.holder_name as from_holder, a2.holder_name as to_holder FROM financial_transactions ft LEFT JOIN accounts a1 ON ft.from_account=a1.id LEFT JOIN accounts a2 ON ft.to_account=a2.id WHERE ft.case_id::text=%s ORDER BY ft.ts DESC", (case_id,))
    else:
        rows = _safe("SELECT ft.*, a1.holder_name as from_holder, a2.holder_name as to_holder FROM financial_transactions ft LEFT JOIN accounts a1 ON ft.from_account=a1.id LEFT JOIN accounts a2 ON ft.to_account=a2.id ORDER BY ft.ts DESC LIMIT 50")

    clean=[]
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
        clean.append(c)

    return {"statusCode":200,"headers":{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"},"body":json.dumps({"transactions":clean, "count":len(clean), "test_data":True, "note":"TEST DATA - synthetic transactions for case IDs 14,21,29,31"})}
