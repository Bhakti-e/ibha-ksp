"""
Database Layer — Ibha KSP
--------------------------
Unified interface that switches automatically between:
  - Catalyst Data Store  (production — USE_CATALYST_DS=true)
  - PostgreSQL via psycopg2 (local development fallback)

All callers use execute_query() / execute_insert() / test_connection().
The backend implementation is fully transparent to callers.
"""

import os

# ── Runtime switch ─────────────────────────────────────────────────────────
USE_CATALYST = os.getenv("USE_CATALYST_DS", "false").lower() == "true"

# ── PostgreSQL driver (local dev) ──────────────────────────────────────────
if not USE_CATALYST:
    try:
        import psycopg2
        import psycopg2.extras
        HAS_PSYCOPG2 = True
    except ImportError:
        HAS_PSYCOPG2 = False


# ══════════════════════════════════════════════════════════════════════════
# Catalyst Data Store path
# ══════════════════════════════════════════════════════════════════════════

def _get_catalyst_zcql():
    """
    Return a Catalyst ZCQL executor.
    Catalyst Data Store exposes a MySQL-compatible SQL interface via ZCQL.
    Docs: https://docs.catalyst.zoho.com/en/database/data-store/zcql/
    """
    import zcatalyst_sdk
    app    = zcatalyst_sdk.initialize()
    zcql   = app.zcql()
    return zcql


def _catalyst_execute(sql: str, params: tuple = None) -> list:
    """
    Execute a read query via Catalyst ZCQL.
    Catalyst ZCQL does not support parameterized placeholders in the same
    way as psycopg2; we safely interpolate params after escaping them.
    """
    if params:
        safe_params = []
        for p in params:
            if p is None:
                safe_params.append("NULL")
            elif isinstance(p, bool):
                safe_params.append("TRUE" if p else "FALSE")
            elif isinstance(p, (int, float)):
                safe_params.append(str(p))
            else:
                # Escape single quotes
                safe_params.append("'" + str(p).replace("'", "''") + "'")
        # Replace %s placeholders in order
        for sp in safe_params:
            sql = sql.replace("%s", sp, 1)

    zcql  = _get_catalyst_zcql()
    result = zcql.execute_query(sql)
    # ZCQL returns a list of dicts directly
    return result if result else []


def _catalyst_insert(sql: str, params: tuple = None) -> int:
    """Execute a write (INSERT/UPDATE/DELETE) via Catalyst ZCQL."""
    if params:
        safe_params = []
        for p in params:
            if p is None:
                safe_params.append("NULL")
            elif isinstance(p, bool):
                safe_params.append("TRUE" if p else "FALSE")
            elif isinstance(p, (int, float)):
                safe_params.append(str(p))
            else:
                safe_params.append("'" + str(p).replace("'", "''") + "'")
        for sp in safe_params:
            sql = sql.replace("%s", sp, 1)

    zcql   = _get_catalyst_zcql()
    result = zcql.execute_query(sql)
    # ZCQL write returns affected row count or last insert id
    if isinstance(result, dict):
        return result.get("rowsAffected", 1)
    return 1


# ══════════════════════════════════════════════════════════════════════════
# PostgreSQL path (local dev)
# ══════════════════════════════════════════════════════════════════════════

def _pg_connection():
    if not HAS_PSYCOPG2:
        raise RuntimeError("psycopg2 not installed. Run: pip install psycopg2-binary")
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        database=os.getenv("DB_NAME", "ibha"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
    )


def _pg_execute_query(sql: str, params: tuple = None) -> list:
    conn = cursor = None
    try:
        conn   = _pg_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute(sql, params or ())
        return [dict(r) for r in cursor.fetchall()]
    except Exception as e:
        print(f"DB query error: {e}\nSQL: {sql}\nParams: {params}")
        raise
    finally:
        if cursor: cursor.close()
        if conn:   conn.close()


def _pg_execute_insert(sql: str, params: tuple = None) -> int:
    conn = cursor = None
    try:
        conn   = _pg_connection()
        cursor = conn.cursor()
        cursor.execute(sql, params or ())
        conn.commit()
        return cursor.rowcount or 0
    except Exception as e:
        if conn: conn.rollback()
        print(f"DB insert error: {e}\nSQL: {sql}")
        raise
    finally:
        if cursor: cursor.close()
        if conn:   conn.close()


# ══════════════════════════════════════════════════════════════════════════
# Public API
# ══════════════════════════════════════════════════════════════════════════

def execute_query(sql: str, params: tuple = None) -> list:
    """Execute a SELECT query and return list of dicts."""
    if USE_CATALYST:
        return _catalyst_execute(sql, params)
    return _pg_execute_query(sql, params)


def execute_insert(sql: str, params: tuple = None) -> int:
    """Execute an INSERT/UPDATE/DELETE and return affected row count."""
    if USE_CATALYST:
        return _catalyst_insert(sql, params)
    return _pg_execute_insert(sql, params)


def test_connection() -> bool:
    """Return True if the database is reachable."""
    try:
        rows = execute_query("SELECT 1 AS test")
        return bool(rows) and rows[0].get("test") == 1
    except Exception:
        return False
