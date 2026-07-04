"""
Document Review Endpoints for Controlled Knowledge Ingestion
-------------------------------------------------------------
These endpoints allow authorized reviewers (SCRB_Analyst, Admin) to approve or reject
uploaded documents before they are indexed into the RAG system.

This human-in-the-loop review ensures:
- Data quality and relevance
- Security and sensitivity compliance
- Prevention of poisoning attacks or malicious content
"""

import json
from datetime import datetime
from lib.logging_utils import log_info, log_error


def approve_handler(request):
    """
    Approve a document for indexing.
    
    Input (JSON):
        {
            "document_id": str,
            "reviewed_by": str (user_id),
            "notes": str (optional)
        }
    
    Returns:
        {"status": "approved"}
    """
    try:
        # Parse request body
        if hasattr(request, 'body'):
            body = json.loads(request.body) if isinstance(request.body, str) else request.body
        else:
            body = request
        
        document_id = body.get("document_id", "")
        reviewed_by = body.get("reviewed_by", "")
        notes = body.get("notes", "")
        
        # Validate required fields
        if not document_id or not reviewed_by:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({
                    "error": "document_id and reviewed_by are required"
                })
            }
        
        log_info("Document approval initiated", {
            "document_id": document_id,
            "reviewed_by": reviewed_by
        })
        
        # TODO: Update `documents_pending` status to "APPROVED"
        # Example SQL:
        # UPDATE documents_pending
        # SET status = 'APPROVED'
        # WHERE document_id = ?
        
        # TODO: Insert into `documents` table for batch indexing
        # Example SQL:
        # INSERT INTO documents (
        #     document_id, fir_number, station_id, district_id,
        #     sensitivity, uploaded_by, approved_by, approved_at,
        #     indexed, file_path, text_content
        # )
        # SELECT 
        #     document_id, fir_number, station_id, district_id,
        #     sensitivity, uploaded_by, ?, ?,
        #     FALSE, file_path, text_content
        # FROM documents_pending
        # WHERE document_id = ?
        
        # TODO: Insert audit record into `ingestion_audit`
        # Example SQL:
        # INSERT INTO ingestion_audit (id, document_id, action, performed_by, details_json, ts)
        # VALUES (?, ?, 'APPROVED', ?, ?, ?)
        
        # TODO: Trigger Signals event for batch indexing workflow
        # This will be picked up by the nightly cron job or immediate indexing circuit
        
        response_data = {
            "status": "approved",
            "document_id": document_id,
            "message": "Document approved and queued for indexing"
        }
        
        log_info("Document approved", {
            "document_id": document_id,
            "reviewed_by": reviewed_by
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
        log_error("Document approval error", {"error": str(e)}, e)
        
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "error": "Internal server error",
                "message": "Failed to approve document"
            })
        }


def reject_handler(request):
    """
    Reject a document, preventing it from being indexed.
    
    Input (JSON):
        {
            "document_id": str,
            "reviewed_by": str (user_id),
            "notes": str (required - rejection reason)
        }
    
    Returns:
        {"status": "rejected"}
    """
    try:
        # Parse request body
        if hasattr(request, 'body'):
            body = json.loads(request.body) if isinstance(request.body, str) else request.body
        else:
            body = request
        
        document_id = body.get("document_id", "")
        reviewed_by = body.get("reviewed_by", "")
        notes = body.get("notes", "")
        
        # Validate required fields
        if not document_id or not reviewed_by or not notes:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({
                    "error": "document_id, reviewed_by, and notes (rejection reason) are required"
                })
            }
        
        log_info("Document rejection initiated", {
            "document_id": document_id,
            "reviewed_by": reviewed_by
        })
        
        # TODO: Update `documents_pending` status to "REJECTED"
        # Example SQL:
        # UPDATE documents_pending
        # SET status = 'REJECTED'
        # WHERE document_id = ?
        
        # TODO: Insert audit record into `ingestion_audit`
        # Example SQL:
        # INSERT INTO ingestion_audit (id, document_id, action, performed_by, details_json, ts)
        # VALUES (?, ?, 'REJECTED', ?, ?, ?)
        # details_json should include the rejection reason (notes)
        
        # TODO: Optionally, delete file from Stratus to save storage
        # Or move it to a "rejected" folder for audit purposes
        
        response_data = {
            "status": "rejected",
            "document_id": document_id,
            "message": "Document rejected and will not be indexed"
        }
        
        log_info("Document rejected", {
            "document_id": document_id,
            "reviewed_by": reviewed_by,
            "reason": notes[:100]
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
        log_error("Document rejection error", {"error": str(e)}, e)
        
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "error": "Internal server error",
                "message": "Failed to reject document"
            })
        }


# Main handler for API Gateway routing
def handler(request):
    """
    Route to approve or reject handlers based on path.
    """
    # TODO: Parse request path from API Gateway
    # For scaffold, check a "action" field in body
    if hasattr(request, 'body'):
        body = json.loads(request.body) if isinstance(request.body, str) else request.body
    else:
        body = request
    
    action = body.get("action", "")
    
    if action == "approve":
        return approve_handler(request)
    elif action == "reject":
        return reject_handler(request)
    else:
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "action must be 'approve' or 'reject'"})
        }
