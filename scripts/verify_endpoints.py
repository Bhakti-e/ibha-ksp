"""Verify all backend endpoints against the running local server."""
import sys, os, json
try:
    import urllib.request as req
    import urllib.error
except ImportError:
    sys.exit("urllib not available")

BASE = "http://localhost:8000/api/v1"

def get(path, token=None):
    r = req.Request(f"{BASE}{path}")
    if token:
        r.add_header("Authorization", f"Bearer {token}")
    try:
        resp = req.urlopen(r, timeout=8)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())
    except Exception as e:
        return 0, {"error": str(e)}

def post(path, body, token=None):
    data = json.dumps(body).encode()
    r = req.Request(f"{BASE}{path}", data=data,
                    headers={"Content-Type": "application/json"})
    if token:
        r.add_header("Authorization", f"Bearer {token}")
    try:
        resp = req.urlopen(r, timeout=8)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())
    except Exception as e:
        return 0, {"error": str(e)}

results = []
def check(label, status, body, expect=200, field=None, field_type=None):
    ok = status == expect
    if ok and field:
        ok = field in body
    if ok and field_type:
        ok = isinstance(body.get(field), field_type)
    tag = "PASS" if ok else "FAIL"
    results.append((tag, label, status, str(body)[:80]))
    print(f"  {tag}  {label}  [{status}]")

# ── Health ────────────────────────────────────────────────────────────────
s, b = get("/health")
check("health", s, b, field="status")

# ── Auth ──────────────────────────────────────────────────────────────────
s, b = post("/auth/login", {"email": "arun.desai@ksp.gov.in", "password": "password123"})
check("auth/login-200", s, b, field="token")
token = b.get("token", "")
print(f"       role={b.get('user',{}).get('role')}  token_len={len(token)}")

s, b = post("/auth/login", {"email": "nobody@ksp.gov.in", "password": "password123"})
check("auth/login-401", s, b, expect=401)

# ── Chat (DB-backed) ──────────────────────────────────────────────────────
s, b = post("/chat", {"query": "show theft cases last 30 days", "mode": "text"}, token)
check("chat/search-cases", s, b, field="answer")
if "answer" in b:
    print(f"       answer_len={len(b['answer'])}  result_count={b.get('metadata',{}).get('result_count','?')}")

s, b = post("/chat", {"query": "how many cases", "mode": "text"}, token)
check("chat/count-cases", s, b, field="answer")

# ── Admin (DB-backed) — need SCRB token ───────────────────────────────────
_, scrb_b = post("/auth/login", {"email": "vikram.mehta@ksp.gov.in", "password": "password123"})
scrb_token = scrb_b.get("token", "")

s, b = get("/admin/stats", scrb_token)
check("admin/stats", s, b, field="total_cases")
if "total_cases" in b:
    print(f"       total_cases={b['total_cases']}  users={b['total_users']}  db_health={b['database_health']}")

s, b = get("/admin/audit-logs", scrb_token)
check("admin/audit-logs", s, b, field="logs")

# ── Trends (DB-backed) ────────────────────────────────────────────────────
s, b = get("/trends/hotspots?days=30", token)
check("trends/hotspots", s, b, field="hotspots")
if "hotspots" in b:
    print(f"       hotspots={len(b['hotspots'])}")

s, b = get("/trends/summary?months=12", token)
check("trends/summary", s, b, field="trends")

s, b = get("/trends/forecast?months=12", token)
check("trends/forecast", s, b, field="historical")

# ── Network (DB-backed) ───────────────────────────────────────────────────
s, b = get("/network/accused/1", token)
check("network/accused", s, b, expect=200)
if "nodes" in b:
    print(f"       nodes={len(b['nodes'])}  edges={len(b['edges'])}")
elif "error" in b:
    print(f"       note: {b['error']}")

# ── Insights (DB-backed) ──────────────────────────────────────────────────
s, b = get("/insights/socio", token)
check("insights/socio", s, b, field="demographic_breakdown")

# ── Support (DB-backed) ───────────────────────────────────────────────────
s, b = get("/support/case-summary/1", token)
check("support/case-summary", s, b, expect=200)

s, b = get("/support/similar-cases/1", token)
check("support/similar-cases", s, b, expect=200)

# ── Summary ───────────────────────────────────────────────────────────────
passed = sum(1 for r in results if r[0] == "PASS")
failed = sum(1 for r in results if r[0] == "FAIL")
print(f"\n{'='*50}")
print(f"PASSED: {passed}  FAILED: {failed}")
if failed:
    print("\nFailed endpoints:")
    for tag, label, status, body in results:
        if tag == "FAIL":
            print(f"  {label} [{status}]: {body}")
sys.exit(0 if failed == 0 else 1)
