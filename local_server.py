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

# Set database environment variables
os.environ['DB_HOST'] = 'localhost'
os.environ['DB_PORT'] = '5432'
os.environ['DB_NAME'] = 'ibha'
os.environ['DB_USER'] = 'atharva'
os.environ['DB_PASSWORD'] = ''

# Import handlers
try:
    from auth import handler as auth_handler
    from chat import handler as chat_handler
    from trends import handler as trends_handler
    from network import handler as network_handler
    from admin import handler_audit_logs, handler_stats
    print("✅ All handlers imported successfully")
except Exception as e:
    print(f"❌ Error importing handlers: {e}")
    sys.exit(1)

# OCR handler — optional (requires torch + transformers)
try:
    from ocr_service import handler as ocr_handler
    OCR_AVAILABLE = True
    print("✅ OCR handler imported successfully")
except Exception as e:
    OCR_AVAILABLE = False
    print(f"⚠️  OCR handler not available (install torch + transformers): {e}")

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
