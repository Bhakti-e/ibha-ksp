"""
Audit Logging Endpoint for Ibha
--------------------------------
This endpoint logs all chat interactions for compliance, investigation, and quality assurance.
Critical for police data: every query and answer must be auditable and traceable.
"""

import json
import hashlib
from datetime import datetime
from lib.logging_utils import log_info, log_error


def handler(request):
    """
    Audit logging handler for all chat interactions.
    
    Input (JSON):
        {
            "user_id": str,
            "query": str,
            "answer_hash": str,  # SHA-256 hash of the answer for integrity
            "tool_trail": [str],
            "citations": [obj]
        }
    
    Returns:
        {"status": "logged"}
    """
    try:
        # Parse request body
        if hasattr(request, 'body'):
            body = json.loads(request.body) if isinstance(request.body, str) else request.body
        else:
            body = request
        
        # Extract audit data
        user_id = body.get("user_id", "")
        query = body.get("query", "")
        answer_hash = body.get("answer_hash", "")
        tool_trail = body.get("tool_trail", [])
        citations = body.get("citations", [])
        
        # Validate required fields
        if not user_id or not query:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "user_id and query are required"})
            }
        
        # Create audit record (for now, just log to console)
        audit_record = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "user_id": user_id,
            "query_length": len(query),
            "query_preview": query[:100],  # Don't log full query to console (may have sensitive data)
            "answer_hash": answer_hash,
            "tool_trail": tool_trail,
            "citations_count": len(citations)
        }
        
        log_info("Audit record created", audit_record)
        
        # TODO: Insert into Data Store `audit_logs` table
        # Example SQL:
        # INSERT INTO audit_logs (id, user_id, query, tool_trail_json, citations_json, answer_hash, ts)
        # VALUES (?, ?, ?, ?, ?, ?, ?)
        #
        # This provides:
        # - Full query text (encrypted at rest in production)
        # - Tool trail for debugging and quality analysis
        # - Citations for verifying answer sources
        # - Answer hash for integrity verification
        # - Timestamp for temporal analysis and retention policies
        
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
        
        # Even if audit fails, we return 200 to avoid blocking the chat flow
        # But we log the error for investigation
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"status": "error", "message": "Audit logging failed"})
        }
