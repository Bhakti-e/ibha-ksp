"""Verify Neon DB row counts and FK integrity."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'catalyst', 'functions'))

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.backend'), override=False)
except Exception:
    pass

from lib.db import execute_query, test_connection

print("Connection test...")
ok = test_connection()
print(f"  {'OK' if ok else 'FAIL'}")
if not ok:
    sys.exit(1)

tables = [
    'casemaster', 'accused', 'victim',
    'unit', 'users', 'audit_logs',
    'crimesubhead', 'crimehead', 'district', 'state',
    'casestatusmaster', 'gravityoffence', 'casecategory',
    'rank', 'designation',
]

print("\nTable                    Rows")
print("-" * 38)
total = 0
for tbl in tables:
    try:
        r = execute_query("SELECT COUNT(*) AS n FROM " + tbl)
        n = r[0]['n'] if r else 0
        print(f"  {tbl:<24} {n}")
        total += int(n)
    except Exception as e:
        print(f"  {tbl:<24} ERROR: {str(e)[:60]}")
print(f"  {'TOTAL':<24} {total}")

# FK spot-check: accused rows should all have valid casemasterid
print("\nFK integrity check:")
try:
    r = execute_query("""
        SELECT COUNT(*) AS orphans
        FROM accused a
        LEFT JOIN casemaster cm ON a.casemasterid = cm.casemasterid
        WHERE cm.casemasterid IS NULL
    """)
    orphans = r[0]['orphans'] if r else '?'
    print(f"  accused orphan rows (should be 0): {orphans}")
except Exception as e:
    print(f"  FK check error: {e}")

try:
    r = execute_query("""
        SELECT COUNT(*) AS orphans
        FROM victim v
        LEFT JOIN casemaster cm ON v.casemasterid = cm.casemasterid
        WHERE cm.casemasterid IS NULL
    """)
    orphans = r[0]['orphans'] if r else '?'
    print(f"  victim orphan rows  (should be 0): {orphans}")
except Exception as e:
    print(f"  FK check error: {e}")
