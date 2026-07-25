"""Handler unit tests — run without a live database."""
import sys, os, json, hmac, hashlib, base64
sys.path.insert(0, 'catalyst/functions')
os.environ.setdefault('DB_HOST','localhost')
os.environ.setdefault('DB_PORT','5432')
os.environ.setdefault('DB_NAME','ibha')
os.environ.setdefault('DB_USER','postgres')
os.environ.setdefault('DB_PASSWORD','yeet')

results = []
failures = []

def check(label, condition, detail=""):
    if condition:
        results.append(f"PASS  {label}")
    else:
        failures.append(f"FAIL  {label}  {detail}")

# ── Health ────────────────────────────────────────────────────────────────────
from health import handler as h_health
r = h_health({})
check("health/200-ok", r['statusCode'] == 200)
check("health/body-status", json.loads(r['body'])['status'] == 'ok')

# ── Auth ──────────────────────────────────────────────────────────────────────
from auth import handler as h_auth, create_token
r = h_auth({'body':{'email':'','password':''}})
check("auth/400-empty-fields", r['statusCode'] == 400)

r = h_auth({'body':{'email':'bademail','password':'password123'}})
check("auth/400-bad-email", r['statusCode'] == 400)

r = h_auth({'body':{'email':'nobody@ksp.gov.in','password':'password123'}})
check("auth/401-not-found", r['statusCode'] == 401)

r = h_auth({'body':{'email':'arun.desai@ksp.gov.in','password':'password123'}})
check("auth/200-valid-inspector", r['statusCode'] == 200)
body = json.loads(r['body'])
token_inspector = body['token']
check("auth/role-inspector", body['user']['role'] == 'Inspector')

r = h_auth({'body':{'email':'arun.desai@ksp.gov.in','password':'wrongpw12'}})
check("auth/401-wrong-password", r['statusCode'] == 401)

r = h_auth({'body':{'email':'admin.system@ksp.gov.in','password':'password123'}})
check("auth/200-admin", r['statusCode'] == 200)
token_admin = json.loads(r['body'])['token']

r = h_auth({'body':{'email':'vikram.mehta@ksp.gov.in','password':'password123'}})
check("auth/200-scrb", r['statusCode'] == 200)
token_scrb = json.loads(r['body'])['token']

# Create constable token
constable_user = {'user_id':'USR_001','email':'rajesh.kumar@ksp.gov.in','role':'Constable','station_id':1,'district_id':1,'full_name':'Rajesh Kumar'}
token_constable = create_token(constable_user)

def auth_hdr(t): return {'Authorization': f'Bearer {t}'}

# ── Chat ──────────────────────────────────────────────────────────────────────
from chat import handler as h_chat
r = h_chat({'body':{'query':'theft cases','mode':'text'},'headers':{}})
check("chat/401-no-auth", r['statusCode'] == 401)

r = h_chat({'body':{'query':'','mode':'text'},'headers':auth_hdr(token_inspector)})
check("chat/400-empty-query", r['statusCode'] == 400)

r = h_chat({'body':{'query':'theft','mode':'badmode'},'headers':auth_hdr(token_inspector)})
check("chat/400-bad-mode", r['statusCode'] == 400)

# ── Audit ─────────────────────────────────────────────────────────────────────
from audit import handler as h_audit
r = h_audit({'body':{'user_id':'','query':''},'headers':{}})
check("audit/400-missing", r['statusCode'] == 400)

r = h_audit({'body':{'user_id':'USR_003','query':'test','answer_hash':'x','tool_trail':[],'citations':[]},'headers':{}})
b = json.loads(r['body'])
check("audit/200-graceful", r['statusCode'] == 200 and b['status'] in ('logged','error'))

# ── NLP ───────────────────────────────────────────────────────────────────────
from lib.nlp_simple import extract_entities
e = extract_entities('show theft cases last 30 days')
check("nlp/search-intent", e['intent'] == 'search_cases')
check("nlp/theft-id", 1 in (e['crime_type_ids'] or []))

e2 = extract_entities('how many murder cases this month')
check("nlp/count-intent", e2['intent'] == 'count_cases')

e3 = extract_entities('ಕಳ್ಳತನ ಪ್ರಕರಣ')
check("nlp/kannada-detect", e3['language'] == 'kn')

# ── Query Builder / RLS ───────────────────────────────────────────────────────
from lib.query_builder import build_search_query, build_count_query
claims_insp = {'role':'Inspector','station_id':2,'district_id':1,'user_id':'USR_003'}
sql, params = build_search_query(claims_insp, [1], '2026-01-01', None)
check("qb/inspector-rls-station-in-params", 2 in params)
check("qb/interval-safe", "INTERVAL '1 day'" in sql or "1 day" in sql or "INTERVAL" not in sql)

claims_dsp = {'role':'DSP','station_id':3,'district_id':1,'user_id':'USR_004'}
sql2, params2 = build_search_query(claims_dsp, None, None, None)
check("qb/dsp-rls-district-in-params", 1 in params2)

claims_admin = {'role':'Admin','station_id':100,'district_id':1,'user_id':'USR_006'}
sql3, params3 = build_search_query(claims_admin, None, None, None)
check("qb/admin-no-rls", len(params3) == 0)

claims_const = {'role':'Constable','station_id':1,'district_id':1,'user_id':'USR_001'}
sql4, _ = build_search_query(claims_const, None, None, None)
check("qb/constable-heinous-excluded", 'GravityOffenceID != 1' in sql4)

sql5, _ = build_count_query(claims_insp, [5], None, None)
check("qb/count-query", 'COUNT' in sql5)

# ── Admin RBAC ────────────────────────────────────────────────────────────────
from admin import handler_audit_logs, handler_stats
r = handler_audit_logs({'headers':auth_hdr(token_constable),'queryStringParameters':{},'path':'/admin/audit-logs'})
check("admin/403-constable-denied", r['statusCode'] == 403)

r = handler_stats({'headers':{},'queryStringParameters':{},'path':'/admin/stats'})
check("admin/401-no-auth", r['statusCode'] == 401)

# ── Ingest Auth ───────────────────────────────────────────────────────────────
from ingest_review import approve_handler, reject_handler, handler_pending
r = approve_handler({'body':{},'headers':{}})
check("ingest/approve-401", r['statusCode'] in (400,401))

r = reject_handler({'body':{},'headers':{}})
check("ingest/reject-401", r['statusCode'] in (400,401))

from ingest_upload import handler as h_upload
r = h_upload({'body':{},'headers':{}})
check("ingest/upload-401", r['statusCode'] in (400,401))

# ── Insights Auth ─────────────────────────────────────────────────────────────
from insights import handler as h_ins
r = h_ins({'headers':{},'queryStringParameters':{},'path':'/insights/socio'})
check("insights/401-noauth", r['statusCode'] == 401)

# ── Support Auth ──────────────────────────────────────────────────────────────
from support import handler as h_sup
r = h_sup({'headers':{},'queryStringParameters':{},'pathParameters':{},'path':'/support/case-summary/'})
check("support/400-no-caseid", r['statusCode'] in (400,401))

# ── Forecast Auth ─────────────────────────────────────────────────────────────
from trends import handler_forecast
r = handler_forecast({'headers':{},'queryStringParameters':{},'path':'/trends/forecast'})
check("forecast/401-noauth", r['statusCode'] == 401)

# ── Ingest Index graceful ─────────────────────────────────────────────────────
from ingest_index import handler as h_idx
r = h_idx({})
b = json.loads(r['body'])
check("ingest_index/graceful", r['statusCode'] in (200,500) and ('indexed_count' in b or 'message' in b))

# ── Network Auth ──────────────────────────────────────────────────────────────
from network import handler as h_net
r = h_net({'headers':{},'pathParameters':{},'queryStringParameters':{},'path':'/network/accused/1'})
check("network/401-noauth", r['statusCode'] == 401)

# ── JSON serialisable responses ────────────────────────────────────────────────
for name, resp in [
    ('health', h_health({})),
    ('auth-valid', h_auth({'body':{'email':'arun.desai@ksp.gov.in','password':'password123'}})),
    ('chat-empty', h_chat({'body':{'query':'','mode':'text'},'headers':auth_hdr(token_inspector)})),
]:
    try:
        json.loads(resp['body'])
        check(f"json/{name}", True)
    except Exception as ex:
        check(f"json/{name}", False, str(ex))

# ── Summary ───────────────────────────────────────────────────────────────────
print()
for r in results:  print(r)
if failures:
    print()
    for f in failures: print(f)
print(f"\n{'='*50}")
print(f"PASSED: {len(results)}  FAILED: {len(failures)}")
sys.exit(0 if not failures else 1)
