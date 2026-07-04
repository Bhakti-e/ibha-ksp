"""
Health Check Endpoint for Ibha
-------------------------------
This endpoint provides a simple health status for monitoring and uptime checks.
Used by load balancers, monitoring tools, and DevOps to verify service availability.
"""

import json
from datetime import datetime


def handler(request):
    """
    Health check handler for Catalyst Serverless Function.
    
    Returns:
        dict: Health status response with service metadata
    """
    try:
        response_data = {
            "status": "ok",
            "service": "Ibha - KSP Crime Intelligence",
            "version": "0.1.0",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        # Log health check for monitoring (production logs should be structured JSON)
        print(f"[HEALTH_CHECK] {response_data['timestamp']} - Status: OK")
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                # CORS headers for frontend access
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": json.dumps(response_data)
        }
    
    except Exception as e:
        # Log error for debugging
        print(f"[HEALTH_CHECK_ERROR] {str(e)}")
        
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "status": "error",
                "message": "Health check failed"
            })
        }
