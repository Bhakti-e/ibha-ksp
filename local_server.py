"""
Local API Server for Ibha Development
======================================
This is a development-only server that wraps Catalyst functions
for local testing. DO NOT USE IN PRODUCTION.

Usage:
    python local_server.py

Endpoints:
    POST /api/v1/auth/login
    POST /api/v1/chat
    GET  /api/v1/trends/hotspots
    GET  /api/v1/trends/summary
    GET  /api/v1/network/accused/{person_id}
    GET  /api/v1/admin/audit-logs
    GET  /api/v1/admin/stats
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import json

# Add functions to path
sys.path.insert(0, 'catalyst/functions')

# Simple .env loader (no external deps) for OpenRouter + DB overrides
def _load_dotenv():
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if not os.path.exists(env_path):
        return
    try:
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                k, v = line.split('=', 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k and k not in os.environ:
                    os.environ[k] = v
    except Exception as e:
        print(f"⚠️  .env load failed: {e}")

_load_dotenv()

# Set database environment variables (allow .env override)
os.environ['DB_HOST'] = os.getenv('DB_HOST', 'localhost')
os.environ['DB_PORT'] = os.getenv('DB_PORT', '5432')
os.environ['DB_NAME'] = os.getenv('DB_NAME', 'ibha')
os.environ['DB_USER'] = os.getenv('DB_USER', 'atharva')
os.environ['DB_PASSWORD'] = os.getenv('DB_PASSWORD', '')

if os.getenv('OPENROUTER_API_KEY'):
    print(f"✅ OpenRouter configured (model={os.getenv('OPENROUTER_MODEL','meta-llama/llama-3.1-8b-instruct:free')})")
else:
    print("ℹ️  OpenRouter not configured — keyword NLP fallback will be used")

# Import handlers
try:
    from auth import handler as auth_handler
    from chat import handler as chat_handler
    from trends import handler as trends_handler
    from network import handler as network_handler
    from admin import handler_audit_logs, handler_stats
    print("✅ Core handlers imported successfully")
except Exception as e:
    print(f"❌ Error importing core handlers: {e}")
    sys.exit(1)

# Optional extended handlers (sociological, profiling, decision-support, financial)
try:
    from sociological import handler as sociological_handler
    SOCIOLOGICAL_AVAILABLE = True
    print("✅ Sociological handler loaded")
except Exception as e:
    SOCIOLOGICAL_AVAILABLE = False
    sociological_handler = None
    print(f"ℹ️  Sociological not available yet: {e}")

try:
    from profiling import handler as profiling_handler
    PROFILING_AVAILABLE = True
    print("✅ Profiling handler loaded")
except Exception as e:
    PROFILING_AVAILABLE = False
    profiling_handler = None
    print(f"ℹ️  Profiling not available yet: {e}")

try:
    from decision_support import handler as decision_support_handler
    DS_AVAILABLE = True
    print("✅ Decision Support handler loaded")
except Exception as e:
    DS_AVAILABLE = False
    decision_support_handler = None
    print(f"ℹ️  Decision Support not available yet: {e}")

try:
    from financial import handler as financial_handler
    FINANCIAL_AVAILABLE = True
    print("✅ Financial test handler loaded")
except Exception as e:
    FINANCIAL_AVAILABLE = False
    financial_handler = None
    print(f"ℹ️  Financial test not available yet: {e}")

# OCR handler — optional (requires torch + transformers)
try:
    from ocr_service import handler as ocr_handler
    OCR_AVAILABLE = True
    print("✅ OCR handler imported successfully")
except Exception as e:
    OCR_AVAILABLE = False
    print(f"⚠️  OCR handler not available (install torch + transformers): {e}")

# RAG handler — optional (requires chromadb + sentence-transformers)
try:
    from rag_service import handler as rag_handler, ingest_documents, _get_collection
    RAG_AVAILABLE = True
    # Auto-ingest if collection is empty
    try:
        col = _get_collection()
        if col.count() == 0:
            print("🔄  RAG collection empty — auto-ingesting documents…")
            result = ingest_documents()
            print(f"✅  RAG ingested {result.get('ingested',0)} docs → {result.get('total_chunks',0)} chunks")
        else:
            print(f"✅  RAG handler ready ({col.count()} chunks in store)")
    except Exception as ingest_err:
        print(f"⚠️  RAG auto-ingest skipped: {ingest_err}")
except Exception as e:
    RAG_AVAILABLE = False
    rag_handler = None
    print(f"ℹ️  RAG not available (install chromadb): {e}")

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

def make_request_object(flask_request, path_params=None):
    """Convert Flask request to Catalyst-style request object"""
    # Get JSON body, default to empty dict if no data
    body = {}
    try:
        if flask_request.is_json:
            body = flask_request.get_json(silent=True) or {}
    except:
        pass
    
    return {
        'body': body,
        'headers': dict(flask_request.headers),
        'queryStringParameters': flask_request.args.to_dict(),
        'pathParameters': path_params or {},
        'path': flask_request.path
    }

def parse_response(catalyst_response):
    """Parse Catalyst function response"""
    status_code = catalyst_response.get('statusCode', 200)
    body = catalyst_response.get('body', '{}')
    
    # Parse body if it's a string
    if isinstance(body, str):
        try:
            body = json.loads(body)
        except:
            pass
    
    return jsonify(body), status_code

@app.route('/api/v1/auth/login', methods=['POST'])
def login():
    """Login endpoint"""
    try:
        request_obj = make_request_object(request)
        result = auth_handler(request_obj)
        return parse_response(result)
    except Exception as e:
        print(f"❌ Login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/chat', methods=['POST'])
def chat():
    """Chat endpoint"""
    try:
        request_obj = make_request_object(request)
        result = chat_handler(request_obj)
        return parse_response(result)
    except Exception as e:
        print(f"❌ Chat error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/trends/hotspots', methods=['GET'])
def hotspots():
    """Hotspots endpoint"""
    try:
        request_obj = make_request_object(request)
        result = trends_handler(request_obj)
        return parse_response(result)
    except Exception as e:
        print(f"❌ Hotspots error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/trends/summary', methods=['GET'])
def trends_summary():
    """Trends summary endpoint"""
    try:
        request_obj = make_request_object(request)
        request_obj['path'] = '/trends/summary'
        result = trends_handler(request_obj)
        return parse_response(result)
    except Exception as e:
        print(f"❌ Trends summary error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/network/accused/<person_id>', methods=['GET'])
def network(person_id):
    """Network endpoint"""
    try:
        request_obj = make_request_object(request, {'person_id': person_id})
        result = network_handler(request_obj)
        return parse_response(result)
    except Exception as e:
        print(f"❌ Network error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/admin/audit-logs', methods=['GET'])
def audit_logs():
    """Audit logs endpoint"""
    try:
        request_obj = make_request_object(request)
        result = handler_audit_logs(request_obj)
        return parse_response(result)
    except Exception as e:
        print(f"❌ Audit logs error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/admin/stats', methods=['GET'])
def admin_stats():
    """Admin stats endpoint"""
    try:
        request_obj = make_request_object(request)
        result = handler_stats(request_obj)
        return parse_response(result)
    except Exception as e:
        print(f"❌ Admin stats error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/sociological/<path:subpath>', methods=['GET', 'POST'])
@app.route('/api/v1/sociological', methods=['GET', 'POST'])
def sociological(subpath=""):
    if not SOCIOLOGICAL_AVAILABLE:
        return jsonify({"error": "Sociological module not yet implemented"}), 501
    try:
        request_obj = make_request_object(request)
        request_obj['path'] = f"/sociological/{subpath}" if subpath else "/sociological"
        result = sociological_handler(request_obj)
        return parse_response(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/profiling/<path:subpath>', methods=['GET', 'POST'])
@app.route('/api/v1/profiling', methods=['GET', 'POST'])
def profiling(subpath=""):
    if not PROFILING_AVAILABLE:
        return jsonify({"error": "Profiling module not yet implemented"}), 501
    try:
        request_obj = make_request_object(request, {'subpath': subpath})
        request_obj['path'] = f"/profiling/{subpath}" if subpath else "/profiling"
        result = profiling_handler(request_obj)
        return parse_response(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/decision-support/<path:subpath>', methods=['GET', 'POST'])
@app.route('/api/v1/decision-support', methods=['GET', 'POST'])
def decision_support(subpath=""):
    if not DS_AVAILABLE:
        return jsonify({"error": "Decision Support not yet implemented"}), 501
    try:
        request_obj = make_request_object(request)
        request_obj['path'] = f"/decision-support/{subpath}" if subpath else "/decision-support"
        result = decision_support_handler(request_obj)
        return parse_response(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/financial/<path:subpath>', methods=['GET', 'POST'])
@app.route('/api/v1/financial', methods=['GET', 'POST'])
def financial(subpath=""):
    if not FINANCIAL_AVAILABLE:
        return jsonify({"error": "Financial test not yet implemented"}), 501
    try:
        request_obj = make_request_object(request)
        request_obj['path'] = f"/financial/{subpath}" if subpath else "/financial"
        result = financial_handler(request_obj)
        return parse_response(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/rag/query', methods=['POST'])
def rag_query():
    """RAG document search endpoint"""
    if not RAG_AVAILABLE:
        return jsonify({"error": "RAG not available. Install: pip install chromadb"}), 503
    try:
        request_obj = make_request_object(request)
        result = rag_handler(request_obj)
        return parse_response(result)
    except Exception as e:
        print(f"❌ RAG query error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/rag/status', methods=['GET'])
def rag_status():
    """RAG status — number of chunks indexed"""
    if not RAG_AVAILABLE:
        return jsonify({"available": False, "chunks": 0}), 200
    try:
        col = _get_collection()
        return jsonify({"available": True, "chunks": col.count(), "collection": col.name}), 200
    except Exception as e:
        return jsonify({"available": False, "chunks": 0, "error": str(e)}), 200

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "OK", "service": "Ibha Local API"}), 200


@app.route('/api/v1/ocr/extract', methods=['POST'])
def ocr_extract():
    """OCR extraction endpoint — accepts base64 image or multipart file"""
    if not OCR_AVAILABLE:
        return jsonify({
            "error": "OCR not available. Install: pip install torch transformers Pillow"
        }), 503

    try:
        # Support both JSON (base64) and multipart file upload
        if request.content_type and 'multipart' in request.content_type:
            file = request.files.get('file')
            if not file:
                return jsonify({"error": "No file in request"}), 400
            image_bytes = file.read()
            from ocr_service import extract_text_from_image_bytes
            text = extract_text_from_image_bytes(image_bytes)
            return jsonify({"text": text, "char_count": len(text)}), 200
        else:
            request_obj = make_request_object(request)
            result = ocr_handler(request_obj)
            return parse_response(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Ibha Local API Server Starting...")
    print("=" * 60)
    print("   URL: http://localhost:8000")
    print("   Environment: Development (Local)")
    print("   Database: PostgreSQL @ localhost:5432/ibha")
    print("=" * 60)
    print("\n✅ Server ready! Press Ctrl+C to stop\n")
    app.run(host='0.0.0.0', port=8000, debug=True)
