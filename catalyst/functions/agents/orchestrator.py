"""
Orchestrator — Ibha Agentic Router
===================================
Tries OpenRouter LLM for intent classification first, falls back to keyword NLP.
Keeps last 6 turns of conversation for follow-up awareness.
Future: will route to sociological / profiling / decision_support agents (Phase 2 PR-3).
"""

from typing import Dict, List, Optional

from lib import nlp_simple
from lib.logging_utils import log_info

try:
    from lib.openrouter_client import classify_intent_openrouter
    HAS_OR = True
except ImportError:
    HAS_OR = False
    classify_intent_openrouter = None


def _normalize_or_entities(or_data: Dict, fallback_entities: Dict) -> Dict:
    """Merge OpenRouter JSON with fallback structure."""
    if not or_data:
        return fallback_entities

    merged = {
        "intent": or_data.get("intent", fallback_entities.get("intent", "search_cases")),
        "language": or_data.get("language", fallback_entities.get("language", "en")),
        "crime_type_ids": or_data.get("crime_type_ids", fallback_entities.get("crime_type_ids")),
        "crime_type_name": or_data.get("crime_type_name", fallback_entities.get("crime_type_name", "all crime types")),
        "date_from": or_data.get("date_from", fallback_entities.get("date_from")),
        "date_to": or_data.get("date_to", fallback_entities.get("date_to")),
        "location_scope": or_data.get("location_scope", fallback_entities.get("location_scope", "my_station")),
    }

    valid_intents = {"search_cases", "count_cases", "sociological", "profiling", "decision_support", "trends", "network", "financial"}
    if merged["intent"] not in valid_intents:
        merged["intent"] = fallback_entities.get("intent", "search_cases")

    return merged


def extract_entities_with_orchestrator(query: str, conversation: Optional[List[Dict]] = None) -> Dict:
    """
    Returns entities dict compatible with existing templates/query_builder.
    Tries OpenRouter first, falls back to nlp_simple.
    Conversation: list of {role, text} for follow-up awareness.
    """
    fallback = nlp_simple.extract_entities(query)

    if HAS_OR and classify_intent_openrouter:
        try:
            or_result = classify_intent_openrouter(query, conversation)
            if or_result:
                merged = _normalize_or_entities(or_result, fallback)
                merged["crime_type_name"] = nlp_simple.get_crime_name(merged.get("crime_type_ids"), merged.get("language", "en"))
                merged["_source"] = "openrouter"
                log_info("Orchestrator: OpenRouter intent used", {"intent": merged["intent"]})
                return merged
        except Exception as e:
            log_info("Orchestrator: OpenRouter failed, fallback to keyword", {"error": str(e)})

    fallback["crime_type_name"] = nlp_simple.get_crime_name(fallback.get("crime_type_ids"), fallback.get("language", "en"))
    fallback["_source"] = "keyword"
    return fallback
