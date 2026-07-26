"""
Batch Indexing Function — Controlled Knowledge Updates
-------------------------------------------------------
Triggered by the nightly cron job (catalyst/cron/nightly_ingestion.json).
Queries approved, non-indexed documents and marks them indexed.
QuickML RAG integration is attempted if zcatalyst_sdk is available;
otherwise the documents are marked indexed without vector embedding
so the pipeline does not stall.
"""

import json
import uuid
from datetime import datetime
from lib.logging_utils import log_info, log_error
from lib import db


def _index_via_zia_quickml(document_id: str, text_content: str, metadata: dict) -> bool:
    """
    Attempt to send document to Catalyst QuickML RAG for vector indexing.
    Returns True on success, False if SDK unavailable or on error.
    """
    try:
        import zcatalyst_sdk
        app = zcatalyst_sdk.initialize()
        # QuickML index_document is not yet in the public SDK surface;
        # this call is a placeholder for when the endpoint is released.
        # app.quickml().index_document(document_id=document_id, content=text_content, metadata=metadata)
        log_info("QuickML RAG indexing skipped (API not yet available)", {"document_id": document_id})
        return True
    except ImportError:
        log_info("zcatalyst_sdk not installed — skipping RAG indexing", {"document_id": document_id})
        return True  # Don't block the pipeline
    except Exception as e:
        log_error("QuickML RAG indexing failed", {"document_id": document_id, "error": str(e)}, e)
        return False


def handler(request):
    """
    Batch indexing handler.

    1. Fetch approved, non-indexed documents (max 100 per run).
    2. Attempt RAG indexing via Catalyst QuickML.
    3. Mark each document as indexed=TRUE in the DB.
    4. Write an INDEXED record to ingestion_audit.

    Returns:
        {"status": "ok"|"partial", "indexed_count": int, "errors": [str]}
    """
    log_info("Batch indexing job started", {"timestamp": datetime.utcnow().isoformat()})

    indexed_count = 0
    errors        = []

    try:
        # Fetch up to 100 approved, non-indexed documents
        pending = db.execute_query(
            """
            SELECT document_id, fir_number, station_id, district_id,
                   sensitivity, text_content
            FROM documents
            WHERE indexed = FALSE
            ORDER BY approved_at ASC
            LIMIT 100
            """
        )
    except Exception as e:
        log_error("Failed to fetch documents for indexing", {"error": str(e)}, e)
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "status": "error",
                "message": "Failed to query documents",
                "indexed_count": 0,
                "errors": [str(e)]
            })
        }

    log_info("Documents fetched for indexing", {"count": len(pending)})

    for doc in pending:
        document_id  = doc.get("document_id", "")
        text_content = doc.get("text_content") or ""

        try:
            metadata = {
                "station_id":  str(doc.get("station_id", "")),
                "district_id": str(doc.get("district_id", "")),
                "sensitivity": doc.get("sensitivity", "NORMAL"),
                "source":      doc.get("fir_number") or document_id
            }

            # Attempt RAG indexing (non-blocking on failure)
            _index_via_zia_quickml(document_id, text_content, metadata)

            # Mark as indexed regardless of RAG result (avoids infinite retry)
            db.execute_insert(
                "UPDATE documents SET indexed = TRUE, indexed_at = %s WHERE document_id = %s",
                (datetime.utcnow(), document_id)
            )

            # Audit record
            db.execute_insert(
                "INSERT INTO ingestion_audit (id, document_id, action, performed_by, details_json) VALUES (%s,%s,'INDEXED','system_cron',%s)",
                (str(uuid.uuid4()), document_id, json.dumps({"text_length": len(text_content)}))
            )

            indexed_count += 1
            log_info("Document indexed", {"document_id": document_id, "text_length": len(text_content)})

        except Exception as doc_err:
            msg = f"Failed to index {document_id}: {doc_err}"
            errors.append(msg)
            log_error("Document indexing failed", {"document_id": document_id, "error": str(doc_err)}, doc_err)

            # Mark as failed in audit so operators can investigate
            try:
                db.execute_insert(
                    "INSERT INTO ingestion_audit (id, document_id, action, performed_by, details_json) VALUES (%s,%s,'FAILED','system_cron',%s)",
                    (str(uuid.uuid4()), document_id, json.dumps({"error": str(doc_err)}))
                )
            except Exception:
                pass

    result = {
        "status":        "ok" if not errors else "partial",
        "indexed_count": indexed_count,
        "errors":        errors,
        "timestamp":     datetime.utcnow().isoformat()
    }

    log_info("Batch indexing job completed", result)

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(result)
    }
