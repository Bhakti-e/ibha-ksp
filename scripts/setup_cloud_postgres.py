"""
Cloud PostgreSQL Setup Script — Ibha KSP
=========================================
Reads credentials from .env.backend, connects to PostgreSQL, runs the
schema, and imports sample CSV data — all in dependency-safe order.

Usage:
    # Dry-run (validate files, no DB connection required):
    python scripts/setup_cloud_postgres.py --dry-run

    # Full setup (requires .env.backend with real credentials):
    python scripts/setup_cloud_postgres.py

    # Schema only (skip CSV import):
    python scripts/setup_cloud_postgres.py --schema-only

    # Data only (schema already exists):
    python scripts/setup_cloud_postgres.py --data-only
"""

import sys
import os
import csv
import argparse

# ── Resolve project root ────────────────────────────────────────────────────
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def _load_env():
    """Load .env.backend from project root without overwriting existing vars."""
    env_file = os.path.join(ROOT, ".env.backend")
    if not os.path.exists(env_file):
        print(f"⚠️  No .env.backend found at {env_file}")
        print("   Copy .env.backend.example to .env.backend and fill in credentials.")
        return False
    try:
        from dotenv import load_dotenv
        load_dotenv(env_file, override=False)
        print(f"📄 Loaded {env_file}")
        return True
    except ImportError:
        # Manual parse fallback
        with open(env_file, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    if k.strip() not in os.environ:
                        os.environ[k.strip()] = v.strip()
        print(f"📄 Loaded {env_file} (manual parse — install python-dotenv for full support)")
        return True


# ── Schema files in required execution order ────────────────────────────────
SCHEMA_FILES = [
    # init_db.sql creates all tables with proper FK dependencies and seeds lookup data
    os.path.join(ROOT, "catalyst", "datastore", "init_db.sql"),
]

# seed_data.sql inserts users + FIR sample data (references lookup tables from init_db.sql)
SEED_FILES = [
    os.path.join(ROOT, "catalyst", "datastore", "seed_data.sql"),
]

# CSV imports — order matters: CaseMaster before Accused/Victim
CSV_IMPORTS = [
    {
        "file":    os.path.join(ROOT, "data", "samples", "casemaster_sample.csv"),
        "table":   "casemaster",
        # PostgreSQL lowercases all unquoted identifiers — use lowercase here
        "columns": ["casemasterid","crimeno","caseno","crimeregistereddate",
                    "policepersonid","policestationid","casecategoryid",
                    "gravityoffenceid","crimemajorheadid","crimeminorheadid",
                    "casestatusid","courtid","incidentfromdate","incidenttodate",
                    "inforeceivedpsdate","latitude","longitude","brieffacts"],
        "conflict": "casemasterid",
    },
    {
        "file":    os.path.join(ROOT, "data", "samples", "accused_sample.csv"),
        "table":   "accused",
        "columns": ["accusedmasterid","casemasterid","accusedname",
                    "ageyear","genderid","personid"],
        "conflict": "accusedmasterid",
    },
    {
        "file":    os.path.join(ROOT, "data", "samples", "victims_sample.csv"),
        "table":   "victim",
        "columns": ["victimmasterid","casemasterid","victimname",
                    "ageyear","genderid","victimpolice"],
        "conflict": "victimmasterid",
    },
]

# ── Dry-run: validate files only ────────────────────────────────────────────

def dry_run():
    print("\n=== DRY-RUN MODE — no database connection ===\n")
    all_ok = True

    print("Schema files:")
    for f in SCHEMA_FILES + SEED_FILES:
        exists = os.path.exists(f)
        tag    = "✅" if exists else "❌"
        print(f"  {tag}  {os.path.relpath(f, ROOT)}")
        if not exists:
            all_ok = False

    print("\nCSV import files:")
    for entry in CSV_IMPORTS:
        f = entry["file"]
        if not os.path.exists(f):
            print(f"  ⚠️   SKIP  {os.path.relpath(f, ROOT)}  (not found)")
            continue
        # Count data rows (skip comment/blank lines)
        rows = 0
        with open(f, encoding="utf-8") as fh:
            for line in fh:
                s = line.strip()
                if s and not s.startswith("#"):
                    rows += 1
        data_rows = max(0, rows - 1)  # minus header
        print(f"  ✅  {os.path.relpath(f, ROOT)}  →  {entry['table']}  ({data_rows} data rows)")

    print("\nEnvironment variables (values hidden):")
    for var in ["DB_HOST","DB_PORT","DB_NAME","DB_USER","DB_SSLMODE","USE_CATALYST_DS"]:
        val = os.getenv(var, "NOT SET")
        print(f"  {var}={val}")
    pw = "SET" if os.getenv("DB_PASSWORD") else "NOT SET"
    print(f"  DB_PASSWORD=[{pw}]")

    print()
    if all_ok:
        print("✅  All schema files present. Ready to run against a live database.")
    else:
        print("❌  Some schema files are missing.")
    return all_ok


# ── DB helpers ───────────────────────────────────────────────────────────────

def _connect():
    import psycopg2
    host     = os.getenv("DB_HOST", "localhost")
    port     = int(os.getenv("DB_PORT", "5432"))
    dbname   = os.getenv("DB_NAME", "ibha")
    user     = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "")
    sslmode  = os.getenv("DB_SSLMODE", "prefer")

    print(f"\nConnecting to PostgreSQL at {host}:{port}/{dbname} (ssl={sslmode}) …")
    conn = psycopg2.connect(
        host=host, port=port, dbname=dbname,
        user=user, password=password,
        sslmode=sslmode, connect_timeout=10,
    )
    conn.autocommit = False
    print("✅  Connected.")
    return conn


def _run_sql_file(conn, path: str) -> dict:
    """Execute a SQL file. Already-exists errors are treated as success (idempotent)."""
    import psycopg2
    rel = os.path.relpath(path, ROOT)
    if not os.path.exists(path):
        return {"ok": False, "error": f"File not found: {rel}"}

    sql = open(path, encoding="utf-8").read()
    cur = conn.cursor()
    try:
        cur.execute(sql)
        conn.commit()
        print(f"  ✅  {rel}")
        return {"ok": True, "error": None}
    except psycopg2.errors.DuplicateTable:
        conn.rollback()
        print(f"  ✅  {rel}  (tables already exist — skipped)")
        return {"ok": True, "error": None}
    except psycopg2.errors.DuplicateObject:
        conn.rollback()
        print(f"  ✅  {rel}  (indexes already exist — skipped)")
        return {"ok": True, "error": None}
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        print(f"  ✅  {rel}  (seed data already present — skipped)")
        return {"ok": True, "error": None}
    except Exception as e:
        conn.rollback()
        err = str(e)
        # Treat "already exists" variants as success
        if "already exists" in err:
            print(f"  ✅  {rel}  (already exists — skipped)")
            return {"ok": True, "error": None}
        print(f"  ❌  {rel}: {err[:200]}")
        return {"ok": False, "error": err}
    finally:
        cur.close()


def _csv_row_to_params(row: dict, columns: list) -> tuple:
    """Convert a CSV row dict to a params tuple, converting empty strings to None.
    Handles case-insensitive header matching (CSV headers may be mixed-case).
    """
    # Build a lowercase-keyed copy of the row for case-insensitive lookup
    row_lower = {k.lower(): v for k, v in row.items()}
    params = []
    for col in columns:
        val = row_lower.get(col.lower(), "")
        if val is None:
            val = ""
        val = str(val).strip()
        params.append(None if val == "" else val)
    return tuple(params)


def _import_csv(conn, entry: dict) -> dict:
    """Import one CSV into a table using parameterised INSERT ON CONFLICT DO NOTHING."""
    f       = entry["file"]
    table   = entry["table"]
    columns = entry["columns"]
    rel     = os.path.relpath(f, ROOT)

    if not os.path.exists(f):
        print(f"  ⚠️   SKIP  {rel}  (file not found)")
        return {"ok": True, "rows": 0, "skipped": True}

    placeholders = ", ".join(["%s"] * len(columns))
    col_list     = ", ".join(columns)   # lowercase — no quoting needed
    sql          = (
        f'INSERT INTO {table} ({col_list}) VALUES ({placeholders}) '
        f'ON CONFLICT ({entry["conflict"]}) DO NOTHING'
    )

    imported = 0
    skipped  = 0
    errors   = []

    with open(f, encoding="utf-8") as fh:
        # Skip comment lines at top
        lines = [l for l in fh if not l.strip().startswith("#")]

    reader = csv.DictReader(lines)
    cur    = conn.cursor()

    for row in reader:
        try:
            params = _csv_row_to_params(row, columns)
            cur.execute(sql, params)
            if cur.rowcount > 0:
                imported += 1
            else:
                skipped += 1
        except Exception as e:
            conn.rollback()
            errors.append(str(e)[:120])
            # Re-open cursor after rollback
            cur.close()
            cur = conn.cursor()

    try:
        conn.commit()
    except Exception as e:
        conn.rollback()
        errors.append(str(e)[:120])

    cur.close()

    status = "✅" if not errors else "⚠️ "
    print(f"  {status}  {rel}  →  {table}:  {imported} inserted, {skipped} already existed"
          + (f", {len(errors)} errors" if errors else ""))
    if errors:
        for err in errors[:3]:
            print(f"       {err}")

    return {"ok": not errors, "rows": imported, "skipped": skipped, "errors": errors}


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Ibha cloud PostgreSQL setup")
    parser.add_argument("--dry-run",     action="store_true", help="Validate only, no DB connection")
    parser.add_argument("--schema-only", action="store_true", help="Run schema/seed SQL, skip CSV")
    parser.add_argument("--data-only",   action="store_true", help="Run CSV imports only, skip SQL")
    args = parser.parse_args()

    _load_env()

    if args.dry_run:
        ok = dry_run()
        sys.exit(0 if ok else 1)

    try:
        import psycopg2  # noqa: F401
    except ImportError:
        print("❌  psycopg2 not installed. Run: pip install psycopg2-binary")
        sys.exit(1)

    # ── Guard: stop clearly if password is not set ───────────────────────
    if not os.getenv("DB_PASSWORD"):
        print()
        print("❌  DB_PASSWORD is not set.")
        print()
        print("   Add the following to .env.backend:")
        print()
        print(f"     DB_HOST={os.getenv('DB_HOST', 'ep-square-queen-azfj7ad6.c-3.ap-southeast-1.aws.neon.tech')}")
        print(f"     DB_PORT={os.getenv('DB_PORT', '5432')}")
        print(f"     DB_NAME={os.getenv('DB_NAME', 'neondb')}")
        print(f"     DB_USER={os.getenv('DB_USER', 'neondb_owner')}")
        print(f"     DB_PASSWORD=<your Neon password>")
        print(f"     DB_SSLMODE=require")
        print(f"     USE_CATALYST_DS=false")
        print(f"     IBHA_JWT_SECRET=<32-char random string>")
        print()
        print("   Find your Neon password at:")
        print("   Neon Console → Your Project → Connection Details → Password")
        print()
        print("   Then re-run: python scripts/setup_cloud_postgres.py")
        sys.exit(1)

    results = {
        "schema_ok":   [],
        "schema_fail": [],
        "csv_rows":    0,
        "csv_skipped": 0,
        "csv_errors":  [],
    }

    try:
        conn = _connect()
    except Exception as e:
        err = str(e)
        pw  = os.getenv("DB_PASSWORD", "")
        if pw:
            err = err.replace(pw, "[REDACTED]")
        print(f"❌  Connection failed: {err}")
        print("\nCheck DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSLMODE in .env.backend")
        sys.exit(1)

    # ── Schema ──────────────────────────────────────────────────────────────
    if not args.data_only:
        print("\n─── Running schema files ───")
        for f in SCHEMA_FILES:
            r = _run_sql_file(conn, f)
            (results["schema_ok"] if r["ok"] else results["schema_fail"]).append(f)

        print("\n─── Running seed files ───")
        for f in SEED_FILES:
            r = _run_sql_file(conn, f)
            (results["schema_ok"] if r["ok"] else results["schema_fail"]).append(f)

    # ── CSV imports ──────────────────────────────────────────────────────────
    if not args.schema_only:
        print("\n─── Importing CSV sample data ───")
        for entry in CSV_IMPORTS:
            r = _import_csv(conn, entry)
            results["csv_rows"]    += r.get("rows", 0)
            results["csv_skipped"] += r.get("skipped", 0)
            if r.get("errors"):
                results["csv_errors"].extend(r["errors"])

    conn.close()

    # ── Summary ──────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("SETUP SUMMARY")
    print("=" * 60)
    print(f"  Schema files OK:     {len(results['schema_ok'])}")
    print(f"  Schema files FAILED: {len(results['schema_fail'])}")
    print(f"  CSV rows inserted:   {results['csv_rows']}")
    print(f"  CSV rows skipped:    {results['csv_skipped']}")
    print(f"  CSV errors:          {len(results['csv_errors'])}")

    if results["schema_fail"] or results["csv_errors"]:
        print("\n⚠️   Setup completed with errors. Review above output.")
        sys.exit(1)
    else:
        print("\n✅  Setup complete. Database is ready.")
        sys.exit(0)


if __name__ == "__main__":
    main()
