"""
Database connection diagnostic script.
Usage:
    python scripts/test_db_connection.py

Reads environment variables from .env.backend (if present), then tests
the PostgreSQL connection.  Prints a safe status message.
Never prints DB_PASSWORD.
"""

import sys
import os

# ── Load .env.backend from project root ───────────────────────────────────
_root = os.path.join(os.path.dirname(__file__), "..")
_env_file = os.path.join(_root, ".env.backend")

try:
    from dotenv import load_dotenv
    if os.path.exists(_env_file):
        load_dotenv(_env_file, override=False)
        print(f"📄 Loaded {_env_file}")
    else:
        print("📄 No .env.backend found — using system environment variables")
except ImportError:
    print("⚠️  python-dotenv not installed. Run: pip install python-dotenv")

# ── Make lib importable ───────────────────────────────────────────────────
sys.path.insert(0, os.path.join(_root, "catalyst", "functions"))

# ── Connection details (never print password) ─────────────────────────────
db_host  = os.getenv("DB_HOST",    "localhost")
db_port  = os.getenv("DB_PORT",    "5432")
db_name  = os.getenv("DB_NAME",    "ibha")
db_user  = os.getenv("DB_USER",    "postgres")
ssl_mode = os.getenv("DB_SSLMODE", "prefer")
password_set = bool(os.getenv("DB_PASSWORD"))

print()
print("Database connection settings:")
print(f"  Host:     {db_host}")
print(f"  Port:     {db_port}")
print(f"  Database: {db_name}")
print(f"  User:     {db_user}")
print(f"  SSL mode: {ssl_mode}")
print(f"  Password: {'[SET]' if password_set else '[NOT SET]'}")
print()

# ── Attempt connection ────────────────────────────────────────────────────
try:
    import psycopg2
    conn = psycopg2.connect(
        host=db_host,
        port=int(db_port),
        dbname=db_name,
        user=db_user,
        password=os.getenv("DB_PASSWORD", ""),
        sslmode=ssl_mode,
        connect_timeout=10,
    )
    cursor = conn.cursor()
    cursor.execute("SELECT 1 AS test")
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if row and row[0] == 1:
        print("✅  Connection successful — PostgreSQL is reachable.")
        print()

        # ── Schema probe ──────────────────────────────────────────────────
        try:
            conn2 = psycopg2.connect(
                host=db_host, port=int(db_port), dbname=db_name,
                user=db_user, password=os.getenv("DB_PASSWORD", ""),
                sslmode=ssl_mode, connect_timeout=10,
            )
            import psycopg2.extras
            cur2 = conn2.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur2.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
            tables = [r["table_name"] for r in cur2.fetchall()]
            cur2.close()
            conn2.close()

            required = {"casemaster", "accused", "unit", "users", "audit_logs"}
            present  = {t.lower() for t in tables}
            missing  = required - present

            print(f"   Tables found: {len(tables)}")
            if tables:
                print(f"   Sample: {', '.join(tables[:8])}" + (" …" if len(tables) > 8 else ""))
            if missing:
                print(f"\n⚠️  Required tables missing: {', '.join(sorted(missing))}")
                print("   Run: psql -U postgres -d ibha -f catalyst/datastore/init_db.sql")
            else:
                print("   All required tables present ✅")
        except Exception as schema_err:
            print(f"   Schema probe failed: {schema_err}")
        sys.exit(0)
    else:
        print("❌  Connection returned unexpected result.")
        sys.exit(1)

except ImportError:
    print("❌  psycopg2 is not installed.")
    print("   Install it with: pip install psycopg2-binary")
    sys.exit(2)

except Exception as err:
    # Mask password from error messages just in case psycopg2 echoes it
    err_str = str(err)
    pw = os.getenv("DB_PASSWORD", "")
    if pw:
        err_str = err_str.replace(pw, "[REDACTED]")
    print(f"❌  Connection failed: {err_str}")
    print()
    print("Troubleshooting:")
    print("  1. Is PostgreSQL running?")
    print(f"  2. Does the database '{db_name}' exist?")
    print(f"  3. Does user '{db_user}' have access?")
    print(f"  4. Is DB_PASSWORD set correctly? (currently: {'[SET]' if password_set else '[NOT SET]'})")
    if ssl_mode == "require":
        print("  5. Does the server support SSL? (DB_SSLMODE=require)")
    sys.exit(1)
