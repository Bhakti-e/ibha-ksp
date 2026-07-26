"""
Document Review Endpoints — Controlled Knowledge Ingestion
-----------------------------------------------------------
POST /ingest/approve  — approve a pending document for indexing
POST /ingest/reject   — reject a pending document

Both endpoints require SCRB_Analyst or Admin role.
On approval the document row is copied to `documents` and
`documents_pending.status` is set to APPROVED.
On rejection only the status is updated.
All actions are recorded in `ingestion_audit`.
"""

import json
import uuid
from datetime import datetime
from lib.logging_utils import log_info, log_error
from lib.auth_utils import require_auth
from lib import db

CORS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
}


def _parse_body(request):
    if hasattr(request, 'body'):
        return json.loads(request.body) if isinstance(request.body, str) else request.body
    if isinstance(request, dict) and 'body' in request:
        return request['body']
    return request


def _auth_check(request):
    """Authenticate and verify reviewer role. Returns (claims, error_response)."""
    try:
        claims = require_auth(request)
    except ValueError as e:
        return None, {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": str(e)})}
    if claims.get("role") not in ("SCRB_Analyst", "Admin"):
        return None, {"statusCode": 403, "headers": CORS,
                      "body": json.dumps({"error": "Only SCRB_Analyst or Admin may review documents"})}
    return claims, None


def approve_handler(request):
    """Approve a document and move it to the `documents` table for nightly indexing."""
    claims, err = _auth_check(request)
    if err:
        return err

    body        = _parse_body(request)
    document_id = body.get("document_id", "")
    reviewed_by = body.get("reviewed_by", "") or claims.get("user_id", "")
    notes       = body.get("notes", "")

    if not document_id or not reviewed_by:
        return {"statusCode": 400, "headers": CORS,
                "body": json.dumps({"error": "document_id and reviewed_by are required"})}

    log_info("Document approval initiated", {"document_id": document_id, "reviewed_by": reviewed_by})

    try:
        # 1. Fetch pending document
        rows = db.execute_query(
            "SELECT * FROM documents_pending WHERE document_id = %s",
            (document_id,)
        )
        if not rows:
            return {"statusCode": 404, "headers": CORS,
                    "body": json.dumps({"error": "Document not found"})}

        doc = rows[0]

        # 2. Update status in documents_pending
        db.execute_insert(
            "UPDATE documents_pending SET status = 'APPROVED' WHERE document_id = %s",
            (document_id,)
        )

        # 3. Insert into documents table for batch indexing
        now = datetime.utcnow()
        db.execute_insert(
            """
            INSERT INTO documents (
                document_id, fir_number, station_id, district_id,
                sensitivity, uploaded_by, approved_by, approved_at,
                indexed, file_name, file_type, file_path, text_content,
                created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, FALSE, %s, %s, %s, %s, %s)
            ON CONFLICT (document_id) DO UPDATE
                SET approved_by = EXCLUDED.approved_by,
                    approved_at = EXCLUDED.approved_at
            """,
            (
                doc["document_id"],
                doc.get("fir_number"),
                doc["station_id"],
                doc["district_id"],
                doc["sensitivity"],
                doc["uploaded_by"],
                reviewed_by,
                now,
                doc.get("file_name"),
                doc.get("file_type"),
                doc.get("file_path"),
                doc.get("text_content"),
                now
            )
        )

        # 4. Ingestion audit record
        db.execute_insert(
            "INSERT INTO ingestion_audit (id, document_id, action, performed_by, details_json) VALUES (%s,%s,'APPROVED',%s,%s)",
            (str(uuid.uuid4()), document_id, reviewed_by, json.dumps({"notes": notes}))
        )

        log_info("Document approved", {"document_id": document_id, "reviewed_by": reviewed_by})

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "status": "approved",
                "document_id": document_id,
                "message": "Document approved and queued for indexing"
            })
        }

    except Exception as e:
        log_error("Document approval error", {"error": str(e)}, e)
        return {"statusCode": 500, "headers": CORS,
                "body": json.dumps({"error": "Internal server error"})}


def reject_handler(request):
    """Reject a pending document. The document will not be indexed."""
    claims, err = _auth_check(request)
    if err:
        return err

    body        = _parse_body(request)
    document_id = body.get("document_id", "")
    reviewed_by = body.get("reviewed_by", "") or claims.get("user_id", "")
    notes       = body.get("notes", "")

    if not document_id or not reviewed_by or not notes:
        return {"statusCode": 400, "headers": CORS,
                "body": json.dumps({"error": "document_id, reviewed_by, and notes are required"})}

    log_info("Document rejection initiated", {"document_id": document_id, "reviewed_by": reviewed_by})

    try:
        # Check document exists
        rows = db.execute_query(
            "SELECT document_id FROM documents_pending WHERE document_id = %s",
            (document_id,)
        )
        if not rows:
            return {"statusCode": 404, "headers": CORS,
                    "body": json.dumps({"error": "Document not found"})}

        # Update status
        db.execute_insert(
            "UPDATE documents_pending SET status = 'REJECTED' WHERE document_id = %s",
            (document_id,)
        )

        # Ingestion audit
        db.execute_insert(
            "INSERT INTO ingestion_audit (id, document_id, action, performed_by, details_json) VALUES (%s,%s,'REJECTED',%s,%s)",
            (str(uuid.uuid4()), document_id, reviewed_by, json.dumps({"reason": notes}))
        )

        log_info("Document rejected", {"document_id": document_id, "reviewed_by": reviewed_by})

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "status": "rejected",
                "document_id": document_id,
                "message": "Document rejected and will not be indexed"
            })
        }

    except Exception as e:
        log_error("Document rejection error", {"error": str(e)}, e)
        return {"statusCode": 500, "headers": CORS,
                "body": json.dumps({"error": "Internal server error"})}


def handler_pending(request):
    """
    GET /ingest/pending

    Returns pending documents for review.
    Query params: limit (default 50), offset (default 0)
    """
    try:
        claims, err = _auth_check(request)
        if err:
            return err

        params = request.get("queryStringParameters", {}) if hasattr(request, 'get') else {}
        limit  = min(int(params.get("limit", 50)), 200)
        offset = int(params.get("offset", 0))

        rows = db.execute_query(
            """
            SELECT document_id, fir_number, station_id, district_id,
                   sensitivity, uploaded_by, uploaded_at, status,
                   file_name, file_type, file_size_bytes, ocr_done
            FROM documents_pending
            WHERE status = 'PENDING'
            ORDER BY uploaded_at DESC
            LIMIT %s OFFSET %s
            """,
            (limit, offset)
        )

        count_row = db.execute_query(
            "SELECT COUNT(*) AS total FROM documents_pending WHERE status = 'PENDING'"
        )
        total = count_row[0]["total"] if count_row else 0

        # Serialize timestamps
        docs = []
        for r in rows:
            d = dict(r)
            if hasattr(d.get("uploaded_at"), "isoformat"):
                d["uploaded_at"] = d["uploaded_at"].isoformat()
            docs.append(d)

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({"documents": docs, "total": total})
        }

    except Exception as e:
        log_error("Pending documents error", {"error": str(e)}, e)
        return {"statusCode": 500, "headers": CORS,
                "body": json.dumps({"error": "Internal server error"})}


def handler(request):
    """Route approve / reject based on path or body action field."""
    if hasattr(request, 'body'):
        body = json.loads(request.body) if isinstance(request.body, str) else request.body
    elif isinstance(request, dict) and 'body' in request:
        body = request['body']
    else:
        body = request

    path   = request.get("path", "") if hasattr(request, 'get') else ""
    action = body.get("action", "")

    if "approve" in path or action == "approve":
        return approve_handler(request)
    elif "reject" in path or action == "reject":
        return reject_handler(request)
    elif "pending" in path:
        return handler_pending(request)
    else:
        return {"statusCode": 400, "headers": CORS,
                "body": json.dumps({"error": "action must be approve, reject, or pending"})}
