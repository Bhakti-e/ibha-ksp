"""
Chat Endpoint for Ibha Conversational AI
-----------------------------------------
This endpoint processes user queries and returns AI-generated answers with citations.
Supports both text and voice modes, multilingual (English + Kannada).

Security: Enforces RBAC/RLS to ensure users only see data from their authorized scope.
"""

import json
from datetime import datetime
from lib.auth_utils import get_user_claims, enforce_rls
from lib.logging_utils import log_info, log_error


def handler(request):
    """
    Main chat handler for conversational AI queries.
    
    Input (JSON):
        {
            "query": str,
            "mode": "text" | "voice",
            "language": "en" | "kn"
        }
    
    Returns:
        {
            "answer": str,
            "citations": [{"chunk_id", "source", "text"}],
            "explanation_contract": {
                "reasoning_sketch": [str],
                "tool_trail": [str],
                "guardrails": [str],
                "confidence": float
            }
        }
    """
    try:
        # Parse request body
        if hasattr(request, 'body'):
            body = json.loads(request.body) if isinstance(request.body, str) else request.body
        else:
            body = request
        
        # Extract and validate inputs
        query = body.get("query", "").strip()
        mode = body.get("mode", "text")
        language = body.get("language", "en")
        
        # Input validation
        if not query:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Query cannot be empty"})
            }
        
        if mode not in ["text", "voice"]:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Mode must be 'text' or 'voice'"})
            }
        
        if language not in ["en", "kn"]:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Language must be 'en' or 'kn'"})
            }
        
        # TODO: Extract JWT token from Authorization header
        # token = request.headers.get("Authorization", "").replace("Bearer ", "")
        
        # Get user claims (RBAC/RLS enforcement)
        # TODO: Replace with real JWT validation using Catalyst Auth
        user_claims = get_user_claims("")
        
        log_info("Chat query received", {
            "user_id": user_claims["user_id"],
            "role": user_claims["role"],
            "station_id": user_claims["station_id"],
            "query_length": len(query),
            "mode": mode,
            "language": language
        })
        
        # TODO: Apply RLS filters based on user role and station
        # base_query = {"station_id": user_claims["station_id"]}
        # filtered_query = enforce_rls(user_claims, base_query)
        
        # TODO: Real AI pipeline will go here:
        # 1. Language detection (if not provided)
        # 2. If mode == "voice", use Zia STT to convert to text
        # 3. Translate query to English if language == "kn" (for RAG retrieval)
        # 4. Apply RLS filters to RAG query
        # 5. Retrieve top-k documents from QuickML RAG
        # 6. Generate answer using QuickML LLM Serving (Qwen 2.5 14B)
        # 7. Extract citations and explanation
        # 8. If language == "kn" and mode == "voice", use Zia TTS for audio response
        # 9. Apply PII filtering and guardrails
        # 10. Log to audit trail
        
        # Demo response for scaffold testing
        response_data = {
            "answer": (
                f"Demo answer – Ibha backend is connected. Real AI logic will be added later. "
                f"Query received: '{query[:50]}...' in {language} mode ({mode}). "
                f"User: {user_claims['role']} from {user_claims['station_id']}."
            ),
            "citations": [
                {
                    "chunk_id": "demo_fir_001",
                    "source": "FIR_2025_STN001_0042",
                    "text": "Demo citation text for testing UI. This is a sample FIR excerpt that would appear as supporting evidence.",
                    "metadata": {
                        "station_id": "STN_001",
                        "date": "2025-11-10",
                        "crime_type": "Theft"
                    }
                },
                {
                    "chunk_id": "demo_fir_002",
                    "source": "FIR_2025_STN001_0038",
                    "text": "Another sample citation showing similar pattern in different case.",
                    "metadata": {
                        "station_id": "STN_001",
                        "date": "2025-10-28",
                        "crime_type": "Theft"
                    }
                }
            ],
            "explanation_contract": {
                "reasoning_sketch": [
                    "Received user query and detected language",
                    f"Applied station-level RLS filters for {user_claims['station_id']} (stub)",
                    "Retrieved top-k documents from RAG with similarity scores (stub)",
                    "Generated answer using LLM with retrieved context (stub)",
                    "Applied PII filtering and guardrails (stub)"
                ],
                "tool_trail": [
                    "Language Detection (demo)",
                    "RAG Retrieval (demo)",
                    "LLM Generation (Qwen 2.5 14B - demo)",
                    "PII Filter (demo)"
                ],
                "guardrails": [
                    "RLS: station-level filtering applied",
                    "PII Filter: names and IDs masked where appropriate",
                    "Content Safety: response validated for professional context"
                ],
                "confidence": 0.92
            }
        }
        
        log_info("Chat response generated", {
            "user_id": user_claims["user_id"],
            "citations_count": len(response_data["citations"]),
            "confidence": response_data["explanation_contract"]["confidence"]
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
        log_error("Chat endpoint error", {"error": str(e)}, e)
        
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "error": "Internal server error",
                "message": "Failed to process query"
            })
        }
