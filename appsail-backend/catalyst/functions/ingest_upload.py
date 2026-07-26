"""
Document Upload Endpoint — Controlled Knowledge Ingestion
----------------------------------------------------------
POST /ingest/upload

Flow: Upload → Validate → OCR (image/PDF) → DB insert → pending_review
Documents are NOT indexed immediately. Human review is required first.
"""

import json
import uuid
from datetime import datetime
from lib.logging_utils import log_info, log_error
from lib.auth_utils import require_auth
from lib import db

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE_MB = 10
IMAGE_EXTENSIONS  = {".png", ".jpg", ".jpeg"}


def handler(request):
    """
    POST /ingest/upload  (multipart/form-data OR JSON)

    Multipart fields:
        file      — the document
        metadata  — JSON string: {fir_number, station_id, district_id, sensitivity, uploaded_by}

    JSON body (fallback / testing):
        {
            "file":     {"name": str, "size": int},
            "metadata": {fir_number, station_id, district_id, sensitivity, uploaded_by},
            "text_content": str   (optional — pre-extracted text)
        }

    Returns:
        {"status": "pending_review", "document_id": str, "message": str}
    """
    CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }

    try:
        # --- Auth ---
        try:
            user_claims = require_auth(request)
        except ValueError as e:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": str(e)})}

        if user_claims.get("role") not in ("SCRB_Analyst", "Admin"):
            return {"statusCode": 403, "headers": CORS,
                    "body": json.dumps({"error": "Only SCRB_Analyst or Admin may upload documents"})}

        # --- Parse body ---
        if hasattr(request, 'body'):
            body = json.loads(request.body) if isinstance(request.body, str) else request.body
        elif isinstance(request, dict) and 'body' in request:
            body = request['body']
        else:
            body = request

        metadata     = body.get("metadata", {})
        if isinstance(metadata, str):
            metadata = json.loads(metadata)

        fir_number   = metadata.get("fir_number", "") or ""
        station_id   = str(metadata.get("station_id", ""))
        district_id  = str(metadata.get("district_id", ""))
        sensitivity  = metadata.get("sensitivity", "NORMAL")
        uploaded_by  = metadata.get("uploaded_by", "") or user_claims.get("user_id", "")

        file_data    = body.get("file", {})
        filename     = file_data.get("name", "") if isinstance(file_data, dict) else ""
        file_size_b  = file_data.get("size", 0) if isinstance(file_data, dict) else 0
        text_content = body.get("text_content", "") or ""

        # --- Validate ---
        if not station_id or not district_id or not uploaded_by:
            return {"statusCode": 400, "headers": CORS,
                    "body": json.dumps({"error": "station_id, district_id, and uploaded_by are required"})}

        file_ext = ("." + filename.rsplit(".", 1)[-1]).lower() if "." in filename else ""
        if filename and file_ext not in ALLOWED_EXTENSIONS:
            return {"statusCode": 400, "headers": CORS,
                    "body": json.dumps({"error": f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"})}

        if file_size_b > MAX_FILE_SIZE_MB * 1024 * 1024:
            return {"statusCode": 400, "headers": CORS,
                    "body": json.dumps({"error": f"File size exceeds {MAX_FILE_SIZE_MB} MB limit"})}

        if sensitivity not in ("NORMAL", "CONFIDENTIAL", "RESTRICTED"):
            return {"statusCode": 400, "headers": CORS,
                    "body": json.dumps({"error": "sensitivity must be NORMAL, CONFIDENTIAL, or RESTRICTED"})}

        # --- Generate document ID ---
        document_id = f"DOC_{uuid.uuid4().hex[:12].upper()}"
        file_path   = f"documents/pending/{document_id}/{filename}" if filename else ""
        file_type   = file_ext.lstrip(".") if file_ext else ""
        ocr_done    = bool(text_content)

        log_info("Document upload initiated", {
            "document_id": document_id, "filename": filename,
            "station_id": station_id, "sensitivity": sensitivity,
            "uploaded_by": uploaded_by
        })

        # --- Insert into documents_pending ---
        sql = """
            INSERT INTO documents_pending (
                document_id, fir_number, station_id, district_id,
                sensitivity, uploaded_by, uploaded_at, status,
                file_name, file_type, file_size_bytes,
                file_path, text_content, ocr_done, indexed
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, 'PENDING', %s, %s, %s, %s, %s, %s, FALSE)
        """
        params = (
            document_id,
            fir_number or None,
            station_id,
            district_id,
            sensitivity,
            uploaded_by,
            datetime.utcnow(),
            filename or None,
            file_type or None,
            file_size_b or None,
            file_path or None,
            text_content or None,
            ocr_done
        )

        try:
            db.execute_insert(sql, params)
        except Exception as db_err:
            log_error("Failed to insert document_pending", {"error": str(db_err)}, db_err)
            return {"statusCode": 500, "headers": CORS,
                    "body": json.dumps({"error": "Database error saving document"})}

        # --- Audit ---
        try:
            audit_sql = """
                INSERT INTO ingestion_audit (id, document_id, action, performed_by, details_json)
                VALUES (%s, %s, 'UPLOADED', %s, %s)
            """
            db.execute_insert(audit_sql, (
                str(uuid.uuid4()),
                document_id,
                uploaded_by,
                json.dumps({"filename": filename, "sensitivity": sensitivity})
            ))
        except Exception as ae:
            log_error("Ingestion audit insert failed", {"error": str(ae)}, ae)

        log_info("Document upload completed", {"document_id": document_id})

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "status": "pending_review",
                "document_id": document_id,
                "message": "Document uploaded successfully and queued for review"
            })
        }

    except Exception as e:
        log_error("Document upload error", {"error": str(e)}, e)
        return {"statusCode": 500, "headers": CORS,
                "body": json.dumps({"error": "Internal server error"})}
