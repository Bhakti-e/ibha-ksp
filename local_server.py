"""
Local API Server for Ibha Development
======================================
Development-only Flask wrapper around Catalyst functions.
DO NOT USE IN PRODUCTION.

Usage:
    python local_server.py

All routes mirror the API Gateway paths in catalyst/api/openapi.yaml.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import json

# Make catalyst/functions importable as a flat namespace
sys.path.insert(0, 'catalyst/functions')

# ── DB environment ─────────────────────────────────────────────────────────
os.environ.setdefault('DB_HOST',     'localhost')
os.environ.setdefault('DB_PORT',     '5432')
os.environ.setdefault('DB_NAME',     'ibha')
os.environ.setdefault('DB_USER',     'postgres')
os.environ.setdefault('DB_PASSWORD', 'yeet')

# ── Import core handlers ───────────────────────────────────────────────────
try:
    from auth    import handler as auth_handler
    from chat    import handler as chat_handler
    from trends  import handler as trends_handler, handler_forecast
    from network import handler as network_handler
    from admin   import handler_audit_logs, handler_stats
    from audit   import handler as audit_handler
    from health  import handler as health_handler
    from insights import handler as insights_handler
    from support  import (handler_case_summary, handler_similar_cases)
    from ingest_upload import handler as upload_handler
    from ingest_review import (
        approve_handler, reject_handler, handler_pending
    )
    from ingest_index  import handler as index_handler
    print("✅ All handlers imported successfully")
except Exception as e:
    print(f"❌ Error importing handlers: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# ── OCR handler — optional ─────────────────────────────────────────────────
try:
    from ocr_service import (
        handler as ocr_handler,
        extract_text_zia,
        extract_text_trocr_fallback,
        moderate_image_bytes,
        analyse_text,
    )
    OCR_AVAILABLE = True
    print("✅ OCR handler imported successfully")
except Exception as e:
    OCR_AVAILABLE = False
    print(f"⚠️  OCR handler not available: {e}")

# ── Flask app ──────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)


def make_req(flask_req, path_params=None):
    """Convert Flask request to Catalyst-style dict."""
    body = {}
    try:
        if flask_req.is_json:
            body = flask_req.get_json(silent=True) or {}
    except Exception:
        pass
    return {
        'body':                 body,
        'headers':              dict(flask_req.headers),
        'queryStringParameters': flask_req.args.to_dict(),
        'pathParameters':       path_params or {},
        'path':                 flask_req.path
    }


def send(catalyst_response):
    """Unwrap a Catalyst-style response dict into a Flask response."""
    status = catalyst_response.get('statusCode', 200)
    body   = catalyst_response.get('body', '{}')
    if isinstance(body, str):
        try:
            body = json.loads(body)
        except Exception:
            pass
    return jsonify(body), status


# ── Health ─────────────────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
@app.route('/api/v1/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "Ibha Local API", "version": "0.1.0"}), 200


# ── Auth ───────────────────────────────────────────────────────────────────
@app.route('/api/v1/auth/login', methods=['POST'])
def login():
    try:
        return send(auth_handler(make_req(request)))
    except Exception as e:
        print(f"❌ Login: {e}")
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ── Chat ───────────────────────────────────────────────────────────────────
@app.route('/api/v1/chat', methods=['POST'])
def chat():
    try:
        return send(chat_handler(make_req(request)))
    except Exception as e:
        print(f"❌ Chat: {e}")
        return jsonify({"error": str(e)}), 500


# ── Audit ──────────────────────────────────────────────────────────────────
@app.route('/api/v1/audit', methods=['POST'])
def audit():
    try:
        return send(audit_handler(make_req(request)))
    except Exception as e:
        print(f"❌ Audit: {e}")
        return jsonify({"error": str(e)}), 500


# ── Trends ─────────────────────────────────────────────────────────────────
@app.route('/api/v1/trends/hotspots', methods=['GET'])
def hotspots():
    try:
        return send(trends_handler(make_req(request)))
    except Exception as e:
        print(f"❌ Hotspots: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/v1/trends/summary', methods=['GET'])
def trends_summary():
    try:
        req = make_req(request)
        req['path'] = '/trends/summary'
        return send(trends_handler(req))
    except Exception as e:
        print(f"❌ Trends summary: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/v1/trends/forecast', methods=['GET'])
def trends_forecast():
    try:
        req = make_req(request)
        req['path'] = '/trends/forecast'
        return send(trends_handler(req))
    except Exception as e:
        print(f"❌ Forecast: {e}")
        return jsonify({"error": str(e)}), 500


# ── Network ────────────────────────────────────────────────────────────────
@app.route('/api/v1/network/accused/<person_id>', methods=['GET'])
def network(person_id):
    try:
        return send(network_handler(make_req(request, {'person_id': person_id})))
    except Exception as e:
        print(f"❌ Network: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/v1/network/financial/<accused_id>', methods=['GET'])
def financial_links(accused_id):
    """
    Financial links are mock-only for now — no real transaction table exists.
    Return an empty response so the frontend does not crash.
    """
    return jsonify({
        "accused_id":   accused_id,
        "transactions": [],
        "note":         "Financial transaction data not available in this environment."
    }), 200


# ── Admin ──────────────────────────────────────────────────────────────────
@app.route('/api/v1/admin/audit-logs', methods=['GET'])
def audit_logs():
    try:
        return send(handler_audit_logs(make_req(request)))
    except Exception as e:
        print(f"❌ Audit logs: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/v1/admin/stats', methods=['GET'])
def admin_stats():
    try:
        return send(handler_stats(make_req(request)))
    except Exception as e:
        print(f"❌ Admin stats: {e}")
        return jsonify({"error": str(e)}), 500


# ── Insights ───────────────────────────────────────────────────────────────
@app.route('/api/v1/insights/socio', methods=['GET'])
def socio_insights():
    try:
        return send(insights_handler(make_req(request)))
    except Exception as e:
        print(f"❌ Insights: {e}")
        return jsonify({"error": str(e)}), 500


# ── Decision Support ───────────────────────────────────────────────────────
@app.route('/api/v1/support/case-summary/<case_id>', methods=['GET'])
def case_summary(case_id):
    try:
        return send(handler_case_summary(make_req(request, {'case_id': case_id}), case_id))
    except Exception as e:
        print(f"❌ Case summary: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/v1/support/similar-cases/<case_id>', methods=['GET'])
def similar_cases(case_id):
    try:
        return send(handler_similar_cases(make_req(request, {'case_id': case_id}), case_id))
    except Exception as e:
        print(f"❌ Similar cases: {e}")
        return jsonify({"error": str(e)}), 500


# ── Knowledge Ingestion ────────────────────────────────────────────────────
@app.route('/api/v1/ingest/upload', methods=['POST'])
def ingest_upload():
    try:
        req = make_req(request)
        # For multipart uploads parse file info from flask and pass as body
        if request.content_type and 'multipart' in request.content_type:
            file = request.files.get('file')
            meta_str = request.form.get('metadata', '{}')
            meta = json.loads(meta_str)
            req['body'] = {
                'metadata': meta,
                'file': {
                    'name': file.filename if file else '',
                    'size': 0
                },
                # Run OCR on uploaded file and attach extracted text
                'text_content': _ocr_file(file) if file else ''
            }
        return send(upload_handler(req))
    except Exception as e:
        print(f"❌ Ingest upload: {e}")
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/v1/ingest/approve', methods=['POST'])
def ingest_approve():
    try:
        return send(approve_handler(make_req(request)))
    except Exception as e:
        print(f"❌ Ingest approve: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/v1/ingest/reject', methods=['POST'])
def ingest_reject():
    try:
        return send(reject_handler(make_req(request)))
    except Exception as e:
        print(f"❌ Ingest reject: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/v1/ingest/pending', methods=['GET'])
def ingest_pending():
    try:
        return send(handler_pending(make_req(request)))
    except Exception as e:
        print(f"❌ Ingest pending: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/v1/ingest/index', methods=['POST'])
def ingest_index():
    """Manual trigger for batch indexing (normally called by cron)."""
    try:
        return send(index_handler(make_req(request)))
    except Exception as e:
        print(f"❌ Ingest index: {e}")
        return jsonify({"error": str(e)}), 500


# ── OCR ────────────────────────────────────────────────────────────────────
def _ocr_file(file_obj):
    """Run OCR on an uploaded file object; return extracted text or empty string."""
    if not OCR_AVAILABLE or not file_obj:
        return ''
    try:
        image_bytes = file_obj.read()
        file_obj.seek(0)  # rewind for any downstream reads
        text = extract_text_zia(image_bytes)
        if not text:
            text = extract_text_trocr_fallback(image_bytes)
        return text or ''
    except Exception as e:
        print(f"⚠️  OCR during upload failed: {e}")
        return ''


@app.route('/api/v1/ocr/extract', methods=['POST'])
def ocr_extract():
    if not OCR_AVAILABLE:
        return jsonify({
            "error": "OCR not available. Install: pip install torch transformers Pillow",
            "hint":  "Catalyst Zia OCR is the primary engine; TrOCR is the local fallback."
        }), 503

    try:
        if request.content_type and 'multipart' in request.content_type:
            file = request.files.get('file')
            if not file:
                return jsonify({"error": "No file in request"}), 400

            image_bytes = file.read()
            moderation  = moderate_image_bytes(image_bytes)
            if not moderation["safe"]:
                return jsonify({
                    "error": "Image failed content moderation.",
                    "moderation": moderation
                }), 422

            zia_text = extract_text_zia(image_bytes)
            if zia_text:
                text, engine = zia_text, "zia"
            else:
                text, engine = extract_text_trocr_fallback(image_bytes), "trocr_fallback"

            return jsonify({
                "text":       text,
                "char_count": len(text),
                "ocr_engine": engine,
                "moderation": moderation,
                "analytics":  analyse_text(text)
            }), 200
        else:
            return send(ocr_handler(make_req(request)))

    except Exception as e:
        print(f"❌ OCR: {e}")
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ── Start ──────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Ibha Local API Server")
    print("=" * 60)
    print("   URL:  http://localhost:8000")
    print("   DB:   PostgreSQL @ localhost:5432/ibha")
    print("=" * 60)
    app.run(host='0.0.0.0', port=8000, debug=True)
