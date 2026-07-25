"""
Database Layer — Ibha KSP
--------------------------
PostgreSQL is the primary database for ALL application queries.
Catalyst Data Store is available as an optional adapter but is NOT the
default — set USE_CATALYST_DS=true only if you intentionally want it.

Environment variables (set in .env.backend or Catalyst Function env):
    DB_HOST         PostgreSQL host        (default: localhost)
    DB_PORT         PostgreSQL port        (default: 5432)
    DB_NAME         Database name          (default: ibha)
    DB_USER         Database user          (default: postgres)
    DB_PASSWORD     Database password      (no default — must be set)
    DB_SSLMODE      psycopg2 sslmode       (default: prefer)
                    Use "require" for cloud/production PostgreSQL.
    USE_CATALYST_DS Set "true" to route through Catalyst Data Store instead.
                    Default: false — PostgreSQL is always primary.
"""

import os

# ── Runtime switch — PostgreSQL is primary ────────────────────────────────
USE_CATALYST = os.getenv("USE_CATALYST_DS", "false").lower() == "true"

# ── psycopg2 import — required for local and cloud PostgreSQL ─────────────
if not USE_CATALYST:
    try:
        import psycopg2
        import psycopg2.extras
        HAS_PSYCOPG2 = True
    except ImportError:
        HAS_PSYCOPG2 = False


# ══════════════════════════════════════════════════════════════════════════
# PostgreSQL path  (default production path)
# ══════════════════════════════════════════════════════════════════════════

def _pg_connection():
    """
    Open a new psycopg2 connection using environment variables.

    sslmode defaults to "prefer" — works for both local (plain) and cloud
    (SSL-negotiated) PostgreSQL.  Set DB_SSLMODE=require for strict
    cloud deployments (ElephantSQL, Supabase, Render, etc.).

    connect_timeout=10 prevents indefinite hangs on unreachable hosts.
    """
    if not HAS_PSYCOPG2:
        raise RuntimeError(
            "psycopg2-binary is required. Install it with:\n"
            "    pip install psycopg2-binary"
        )
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        dbname=os.getenv("DB_NAME", "ibha"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
        sslmode=os.getenv("DB_SSLMODE", "prefer"),
        connect_timeout=10,
    )


def _pg_execute_query(sql: str, params: tuple = None) -> list:
    """SELECT — returns list of dicts. Cursor and connection always closed."""
    conn = cursor = None
    try:
        conn   = _pg_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute(sql, params or ())
        return [dict(r) for r in cursor.fetchall()]
    except Exception as e:
        # Log SQL fingerprint (never the params, which may contain PII/secrets)
        print(f"[DB] Query error: {e} | SQL: {sql[:120]}")
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def _pg_execute_insert(sql: str, params: tuple = None) -> int:
    """INSERT / UPDATE / DELETE — commits on success, rolls back on error."""
    conn = cursor = None
    try:
        conn   = _pg_connection()
        cursor = conn.cursor()
        cursor.execute(sql, params or ())
        conn.commit()
        return cursor.rowcount or 0
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"[DB] Write error: {e} | SQL: {sql[:120]}")
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ══════════════════════════════════════════════════════════════════════════
# Catalyst Data Store path  (optional — only when USE_CATALYST_DS=true)
# ══════════════════════════════════════════════════════════════════════════

def _catalyst_safe_params(sql: str, params: tuple) -> str:
    """
    Catalyst ZCQL does not support parameterised placeholders.
    Safely substitute %s tokens after escaping each value.
    This path is only reached when USE_CATALYST_DS=true.
    """
    if not params:
        return sql
    safe = []
    for p in params:
        if p is None:
            safe.append("NULL")
        elif isinstance(p, bool):
            safe.append("TRUE" if p else "FALSE")
        elif isinstance(p, (int, float)):
            safe.append(str(p))
        else:
            safe.append("'" + str(p).replace("'", "''") + "'")
    for s in safe:
        sql = sql.replace("%s", s, 1)
    return sql


def _catalyst_execute(sql: str, params: tuple = None) -> list:
    import zcatalyst_sdk
    app  = zcatalyst_sdk.initialize()
    sql  = _catalyst_safe_params(sql, params)
    res  = app.zcql().execute_query(sql)
    return res if isinstance(res, list) else []


def _catalyst_insert(sql: str, params: tuple = None) -> int:
    import zcatalyst_sdk
    app  = zcatalyst_sdk.initialize()
    sql  = _catalyst_safe_params(sql, params)
    res  = app.zcql().execute_query(sql)
    if isinstance(res, dict):
        return res.get("rowsAffected", 1)
    return 1


# ══════════════════════════════════════════════════════════════════════════
# Public API — called by every handler
# ══════════════════════════════════════════════════════════════════════════

def execute_query(sql: str, params: tuple = None) -> list:
    """Execute a SELECT and return a list of dicts."""
    if USE_CATALYST:
        return _catalyst_execute(sql, params)
    return _pg_execute_query(sql, params)


def execute_insert(sql: str, params: tuple = None) -> int:
    """Execute an INSERT / UPDATE / DELETE and return affected row count."""
    if USE_CATALYST:
        return _catalyst_insert(sql, params)
    return _pg_execute_insert(sql, params)


def test_connection() -> bool:
    """
    Probe the database with SELECT 1.
    Returns True on success, False on any error.
    Never raises — safe to call from health checks and startup.
    """
    try:
        rows = execute_query("SELECT 1 AS test")
        return bool(rows) and rows[0].get("test") == 1
    except Exception:
        return False
