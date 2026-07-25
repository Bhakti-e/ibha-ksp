"""Check users table — show hash prefix only, never the full hash."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'catalyst', 'functions'))
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.backend'), override=False)
except Exception:
    pass
from lib.db import execute_query

rows = execute_query("SELECT user_id, email, role, active, LEFT(password_hash,7) AS hash_prefix FROM users ORDER BY user_id")
print(f"{'user_id':<10} {'email':<35} {'role':<15} {'active':<8} hash_prefix")
print("-" * 80)
for r in rows:
    print(f"  {r['user_id']:<10} {r['email']:<35} {r['role']:<15} {str(r['active']):<8} {r['hash_prefix']}")
