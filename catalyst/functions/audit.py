"""
Audit Logging Endpoint for Ibha
--------------------------------
POST /audit — logs a chat interaction (query + answer hash + tool trail + citations).
This endpoint is called by the frontend after receiving a chat response.
The chat pipeline also writes directly via chat.py::log_audit(); this endpoint
provides a secondary path for the frontend to enrich the record with the
answer hash and citation list that are computed client-side.
"""

import json
import hashlib
import uuid
from datetime import datetime
from lib.logging_utils import log_info, log_error
from lib import db


def handler(request):
    """
    POST /audit

    Input (JSON):
        {
            "user_id":     str,
            "query":       str,
            "answer_hash": str,   # SHA-256 of the answer text
            "tool_trail":  [str],
            "citations":   [obj]
        }

    Returns:
        {"status": "logged"}
    """
    try:
        if hasattr(request, 'body'):
            body = json.loads(request.body) if isinstance(request.body, str) else request.body
        elif isinstance(request, dict) and 'body' in request:
            body = request['body']
        else:
            body = request

        user_id     = body.get("user_id", "")
        query       = body.get("query", "")
        answer_hash = body.get("answer_hash", "")
        tool_trail  = body.get("tool_trail", [])
        citations   = body.get("citations", [])

        if not user_id or not query:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "user_id and query are required"})
            }

        # Compute query hash for integrity
        query_hash = hashlib.sha256(query.encode()).hexdigest()

        log_info("Audit record created", {
            "user_id":        user_id,
            "query_length":   len(query),
            "query_preview":  query[:100],
            "answer_hash":    answer_hash,
            "citations_count": len(citations)
        })

        # Insert into audit_logs — matches init_db.sql schema
        sql = """
            INSERT INTO audit_logs (
                user_id, role, station_id, district_id,
                query_text, intent, filters_applied, result_count
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            user_id,
            body.get("role", ""),
            body.get("station_id"),
            body.get("district_id"),
            query,
            "external",                          # logged externally (not from chat pipeline)
            json.dumps({"tool_trail": tool_trail, "citations_count": len(citations)}),
            0
        )

        try:
            db.execute_insert(sql, params)
        except Exception as db_err:
            # Audit failure must not block caller
            log_error("Audit DB insert failed", {"error": str(db_err)}, db_err)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            },
            "body": json.dumps({"status": "logged"})
        }

    except Exception as e:
        log_error("Audit logging error", {"error": str(e)}, e)
        # Return 200 so the frontend is never blocked by audit failures
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"status": "error", "message": "Audit logging failed"})
        }
