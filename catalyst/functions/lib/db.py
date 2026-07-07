"""
Database Connection Helper
--------------------------
Provides simple interface for executing SQL queries.
Supports both Catalyst Data Store and local PostgreSQL.
"""

import os
import json

# Detect environment
USE_CATALYST = os.getenv("USE_CATALYST_DS", "false").lower() == "true"

if USE_CATALYST:
    # TODO: Import Catalyst SDK when available
    # from catalyst import datastore
    pass
else:
    # Use PostgreSQL
    try:
        import psycopg2
        import psycopg2.extras
        HAS_PSYCOPG2 = True
    except ImportError:
        HAS_PSYCOPG2 = False


def get_connection():
    """
    Get database connection.
    
    Returns:
        Database connection object
    """
    if USE_CATALYST:
        # TODO: Return Catalyst connection
        # return datastore.get_connection()
        raise NotImplementedError("Catalyst Data Store not yet configured")
    else:
        if not HAS_PSYCOPG2:
            raise RuntimeError("psycopg2 not installed. Run: pip install psycopg2-binary")
        
        # Get connection from environment variables
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            database=os.getenv("DB_NAME", "ibha"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "postgres")
        )
        return conn


def execute_query(sql: str, params: tuple = None) -> list:
    """
    Execute SQL query and return results as list of dicts.
    
    Args:
        sql: SQL query with %s placeholders
        params: Tuple of parameters for placeholders
    
    Returns:
        List of dicts, where each dict is a row
    
    Example:
        results = execute_query(
            "SELECT * FROM CaseMaster WHERE PoliceStationID = %s",
            (1,)
        )
    """
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cursor.execute(sql, params or ())
        results = cursor.fetchall()
        
        # Convert to list of dicts
        return [dict(row) for row in results]
    
    except Exception as e:
        print(f"Database query error: {e}")
        print(f"SQL: {sql}")
        print(f"Params: {params}")
        raise
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def execute_insert(sql: str, params: tuple = None) -> int:
    """
    Execute INSERT query and return inserted row ID.
    
    Args:
        sql: INSERT SQL query
        params: Tuple of parameters
    
    Returns:
        Inserted row ID (or affected row count)
    """
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute(sql, params or ())
        conn.commit()
        
        # Try to get last inserted ID
        if cursor.lastrowid:
            return cursor.lastrowid
        else:
            return cursor.rowcount
    
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Database insert error: {e}")
        raise
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def test_connection() -> bool:
    """
    Test database connection.
    
    Returns:
        True if connection successful
    """
    try:
        results = execute_query("SELECT 1 AS test")
        return len(results) > 0 and results[0].get("test") == 1
    except:
        return False
