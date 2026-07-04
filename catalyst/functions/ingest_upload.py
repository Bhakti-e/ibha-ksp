"""
Document Upload Endpoint for Controlled Knowledge Ingestion
------------------------------------------------------------
This endpoint allows authorized users (SCRB_Analyst, Admin) to upload new FIR documents,
case files, and investigation reports for review and eventual indexing into the RAG system.

CRITICAL: Documents are NOT immediately indexed. They go through:
1. Upload → 2. Validation → 3. OCR (if needed) → 4. Human Review → 5. Batch Indexing (nightly)

This ensures data quality, security, and prevents the AI from "retraining" itself continuously.
"""

import json
import hashlib
import uuid
from datetime import datetime
from lib.logging_utils import log_info, log_error


# Allowed file types and max size
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE_MB = 10


def handler(request):
    """
    Document upload handler for knowledge ingestion.
    
    Input (multipart/form-data):
        - file: the document file
        - metadata (JSON string):
            {
                "fir_number": str (optional),
                "station_id": str,
                "district_id": str,
                "sensitivity": "NORMAL" | "CONFIDENTIAL" | "RESTRICTED",
                "uploaded_by": str (user_id)
            }
    
    Returns:
        {
            "status": "pending_review",
            "document_id": str
        }
    """
    try:
        # TODO: Parse multipart form data
        # For scaffold, we'll simulate with JSON input
        if hasattr(request, 'body'):
            body = json.loads(request.body) if isinstance(request.body, str) else request.body
        else:
            body = request
        
        # Extract metadata
        metadata = body.get("metadata", {})
        fir_number = metadata.get("fir_number", "")
        station_id = metadata.get("station_id", "")
        district_id = metadata.get("district_id", "")
        sensitivity = metadata.get("sensitivity", "NORMAL")
        uploaded_by = metadata.get("uploaded_by", "")
        
        # Simulate file data
        file_data = body.get("file", {})
        filename = file_data.get("name", "")
        file_size_mb = file_data.get("size", 0) / (1024 * 1024)
        
        # Validate required fields
        if not station_id or not district_id or not uploaded_by:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({
                    "error": "station_id, district_id, and uploaded_by are required"
                })
            }
        
        # Validate file type
        file_ext = filename[filename.rfind("."):].lower() if "." in filename else ""
        if file_ext not in ALLOWED_EXTENSIONS:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({
                    "error": f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
                })
            }
        
        # Validate file size
        if file_size_mb > MAX_FILE_SIZE_MB:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({
                    "error": f"File size exceeds {MAX_FILE_SIZE_MB}MB limit"
                })
            }
        
        # Validate sensitivity level
        if sensitivity not in ["NORMAL", "CONFIDENTIAL", "RESTRICTED"]:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({
                    "error": "sensitivity must be NORMAL, CONFIDENTIAL, or RESTRICTED"
                })
            }
        
        # Generate unique document ID
        document_id = f"DOC_{uuid.uuid4().hex[:12].upper()}"
        
        log_info("Document upload initiated", {
            "document_id": document_id,
            "filename": filename,
            "station_id": station_id,
            "sensitivity": sensitivity,
            "uploaded_by": uploaded_by
        })
        
        # TODO: Save file to Catalyst Stratus (object storage)
        # file_path = f"documents/pending/{document_id}/{filename}"
        # stratus_client.upload(file_data, file_path)
        
        # TODO: If file is image or scanned PDF, trigger Zia OCR via Circuits workflow
        # This will extract text and store it in documents_pending.text_content
        
        # TODO: Insert metadata into Data Store `documents_pending` table
        # Example SQL:
        # INSERT INTO documents_pending (
        #     document_id, fir_number, station_id, district_id,
        #     sensitivity, uploaded_by, uploaded_at, status,
        #     file_path, ocr_done, indexed
        # ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, FALSE, FALSE)
        
        # TODO: Trigger Circuits workflow for document processing:
        # - Virus scan (if available)
        # - OCR extraction (if image/scanned PDF)
        # - Text extraction (if PDF/DOCX)
        # - Notification to reviewers
        
        response_data = {
            "status": "pending_review",
            "document_id": document_id,
            "message": "Document uploaded successfully and queued for review"
        }
        
        log_info("Document upload completed", {
            "document_id": document_id,
            "status": "pending_review"
        })
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            },
            "body": json.dumps(response_data)
        }
    
    except Exception as e:
        log_error("Document upload error", {"error": str(e)}, e)
        
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "error": "Internal server error",
                "message": "Failed to upload document"
            })
        }
