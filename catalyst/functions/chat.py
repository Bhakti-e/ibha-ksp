"""
Chat Endpoint for Ibha Conversational AI
-----------------------------------------
This endpoint processes user queries and returns SQL-generated answers with citations.
NO external LLM - uses keyword NLP + SQL queries + response templates.
Supports both text and voice modes, multilingual (English + Kannada).

Security: Enforces RBAC/RLS to ensure users only see data from their authorized scope.
"""

import json
import re
from datetime import datetime
from lib.auth_utils import require_auth
from lib.logging_utils import log_info, log_error
from lib import nlp_simple
from lib import query_builder
from lib import db
from lib import templates

try:
    from agents.orchestrator import extract_entities_with_orchestrator
    HAS_ORCHESTRATOR = True
except ImportError:
    HAS_ORCHESTRATOR = False
    extract_entities_with_orchestrator = None


def handler(request):
    """
    Main chat handler for conversational AI queries.
    
    Input (JSON):
        {
            "query": str,
            "mode": "text" | "voice",
            "language": "en" | "kn"  (optional, auto-detected)
        }
    
    Returns:
        {
            "answer": str,
            "data": [row_dicts],
            "citations": [FIR_numbers],
            "explanation_contract": {...}
        }
    """
    try:
        # Parse request body - handle both Catalyst format and direct dict
        if hasattr(request, 'body'):
            body = json.loads(request.body) if isinstance(request.body, str) else request.body
        elif isinstance(request, dict) and 'body' in request:
            body = request['body']
        else:
            body = request
        
        # Extract inputs
        query = body.get("query", "").strip()
        mode = body.get("mode", "text")
        language_hint = body.get("language", None)
        conversation = body.get("conversation", []) or body.get("history", [])
        
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
        
        # Authenticate user
        try:
            user_claims = require_auth(request)
        except ValueError as e:
            return {
                "statusCode": 401,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": str(e)})
            }
        
        log_info("Chat query received", {
            "user_id": user_claims["user_id"],
            "role": user_claims["role"],
            "station_id": user_claims["station_id"],
            "query_length": len(query),
            "mode": mode
        })
        
        # STEP 1: Extract entities via orchestrator (OpenRouter -> fallback keyword)
        if HAS_ORCHESTRATOR and extract_entities_with_orchestrator:
            entities = extract_entities_with_orchestrator(query, conversation)
        else:
            entities = nlp_simple.extract_entities(query)
            entities["crime_type_name"] = nlp_simple.get_crime_name(
                entities.get("crime_type_ids"), entities.get("language", "en")
            )

        language = language_hint or entities.get("language", "en")
        log_info("NLP entities extracted", entities)

        if "crime_type_name" not in entities:
            entities["crime_type_name"] = nlp_simple.get_crime_name(
                entities.get("crime_type_ids"), language
            )
        case_identifier = extract_case_identifier(query)
        
        # STEP 2: Build SQL query based on intent
        intent = entities["intent"]

        # New agentic intents -> provide guidance but still run search for data table
        redirect_intents = {
            "sociological": "Sociological Insights window shows demographic breakdowns. Showing base data below.",
            "profiling": "Offender Profiling window provides risk scoring. Showing base data below.",
            "decision_support": "Investigation Support window gives summaries + similar cases. Showing base data below.",
            "trends": "Trends window has hotspot maps + forecasting. Showing base data below.",
            "network": "Network window visualizes co-accused links. Showing base data below.",
            "financial": "Financial test data in new window. Showing base data below.",
        }
        intent_note = redirect_intents.get(intent)

        if case_identifier:
            intent = "case_lookup"
            sql, params = query_builder.build_case_lookup_query(user_claims, case_identifier)
        elif intent == "search_cases" or intent in redirect_intents:
            sql, params = query_builder.build_search_query(
                user_claims,
                entities["crime_type_ids"],
                entities["date_from"],
                entities["date_to"]
            )
        elif intent == "count_cases":
            sql, params = query_builder.build_count_query(
                user_claims,
                entities["crime_type_ids"],
                entities["date_from"],
                entities["date_to"]
            )
        else:
            sql, params = query_builder.build_search_query(
                user_claims,
                entities["crime_type_ids"],
                entities["date_from"],
                entities["date_to"]
            )
        
        log_info("SQL query built", {"intent": intent, "param_count": len(params)})
        
        # STEP 3: Execute query against database
        try:
            data = db.execute_query(sql, params)
        except Exception as db_error:
            log_error("Database query failed", {"error": str(db_error)}, db_error)
            return {
                "statusCode": 500,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({
                    "error": templates.get_error_message("db_error", language)
                })
            }
        
        log_info("Query executed", {"result_count": len(data)})
        
        # STEP 4: Format answer using templates (NO LLM)
        if intent == "case_lookup":
            formatted = templates.format_answer_search(data, entities, language)
            formatted["answer_text"] = (
                f"Found case {case_identifier}. Details are shown below."
                if data else
                f"No case found for {case_identifier} within your authorised access."
            )
        elif intent == "search_cases" or intent in redirect_intents:
            formatted = templates.format_answer_search(data, entities, language)
            if intent_note:
                formatted["answer_text"] = intent_note + " " + formatted["answer_text"]
        elif intent == "count_cases":
            formatted = templates.format_answer_count(data, entities, language)
        else:
            formatted = templates.format_answer_search(data, entities, language)
        
        # STEP 5: Build explanation contract
        query_info = {
            "user_role": user_claims["role"],
            "station_id": user_claims["station_id"],
            "result_count": len(data),
            "limit": 50
        }
        explanation_contract = templates.build_explanation_contract(entities, query_info)
        
        # STEP 6: Build response
        response_data = {
            "answer": formatted["answer_text"],
            "data": formatted["data_rows"],
            "citations": formatted["citations"],
            "explanation_contract": explanation_contract,
            "metadata": {
                "intent": intent,
                "entity_source": entities.get("_source", "keyword"),
                "language": language,
                "result_count": len(data),
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        # STEP 7: Log to audit (async - don't block response)
        try:
            log_audit(user_claims, query, intent, entities, len(data))
        except Exception as audit_error:
            log_error("Audit logging failed", {"error": str(audit_error)}, audit_error)
            # Don't fail the request if audit logging fails
        
        log_info("Chat response generated", {
            "user_id": user_claims["user_id"],
            "result_count": len(data),
            "intent": intent
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


def log_audit(user_claims: dict, query: str, intent: str, entities: dict, result_count: int):
    """
    Log chat query to audit trail.
    
    Args:
        user_claims: User authentication claims
        query: Original query text
        intent: Detected intent
        entities: Extracted entities
        result_count: Number of results returned
    """
    try:
        sql = """
            INSERT INTO audit_logs (
                user_id, role, station_id, district_id,
                query_text, intent, filters_applied, result_count
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        filters_json = json.dumps({
            "crime_type_ids": entities.get("crime_type_ids"),
            "date_from": entities.get("date_from"),
            "date_to": entities.get("date_to"),
            "location_scope": entities.get("location_scope")
        })
        
        params = (
            user_claims["user_id"],
            user_claims["role"],
            user_claims["station_id"],
            user_claims["district_id"],
            query,
            intent,
            filters_json,
            result_count
        )
        
        db.execute_insert(sql, params)
        log_info("Audit log created", {"user_id": user_claims["user_id"]})
    
    except Exception as e:
        log_error("Audit log insertion failed", {"error": str(e)}, e)


def extract_case_identifier(query: str):
    """Extract an explicit FIR/CrimeNo or CaseMasterID from case follow-up questions."""
    q = query.lower()

    long_number = re.search(r"\b\d{8,24}\b", q)
    if long_number:
        return long_number.group(0)

    labelled_case = re.search(r"\b(?:case|fir|crime)\s*(?:no\.?|number|id)?\s*[:#-]?\s*(\d{1,7})\b", q)
    if labelled_case:
        return labelled_case.group(1)

    return None
        # Don't propagate error - audit failure shouldn't break chat
