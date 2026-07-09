"""
OpenRouter Client — Ibha KSP
=============================
Free-tier wrapper for https://openrouter.ai/api/v1/chat/completions
Handles: intent classification, case summarization, Kannada support,
with fallback to keyword NLP when API key missing or rate limited.
"""

import os
import json
import time
from typing import List, Dict, Optional

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

try:
    from lib.logging_utils import log_info
except ImportError:
    def log_info(message, context=None):
        print(message, context or {})


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = os.getenv("OPENROUTER_MODEL", "qwen/qwen3.6-27b")
FALLBACK_MODEL = os.getenv("OPENROUTER_FALLBACK_MODEL", "google/gemma-3-27b-it")
AGENT_MODEL = os.getenv("OPENROUTER_AGENT_MODEL", FALLBACK_MODEL)

SYSTEM_POLICE = """/no_think
You are Ibha, a Karnataka State Police crime intelligence assistant.
You must:
- Be concise, professional, factual
- Never hallucinate FIR numbers, names, or stats not provided
- Support English and Kannada (ಕನ್ನಡ)
- For crime queries, extract: intent (search_cases|count_cases|sociological|profiling|decision_support|trends|network), crime_type_ids (theft=1,burglary=2,robbery=3,vehicle theft=4,murder=5,assault=6,hit and run=7,kidnapping=8,rape=9,cyber=10,fraud=11,drug=12), date_from (YYYY-MM-DD), language (en|kn)
- Respond with raw JSON only when asked for structured output. Do not include markdown or explanations.
"""


def is_configured() -> bool:
    return bool(os.getenv("OPENROUTER_API_KEY")) and HAS_REQUESTS


def _headers() -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY','')}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("OPENROUTER_REFERER", "http://localhost:3000"),
        "X-Title": os.getenv("OPENROUTER_TITLE", "Ibha KSP"),
    }


def chat_completion(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.1,
    max_tokens: int = 800,
    retries: int = 1,
) -> Optional[str]:
    if not is_configured():
        return None

    payload = {
        "model": model or DEFAULT_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "reasoning": {"enabled": False},
    }

    for attempt in range(retries + 1):
        try:
            resp = requests.post(OPENROUTER_URL, headers=_headers(), json=payload, timeout=20)
            if resp.status_code == 429:
                time.sleep(1 + attempt)
                continue
            if resp.status_code >= 400:
                log_info("OpenRouter request failed", {
                    "status_code": resp.status_code,
                    "model": payload.get("model"),
                    "body": resp.text[:300],
                })
                if attempt == 0 and (model or DEFAULT_MODEL) != FALLBACK_MODEL:
                    payload["model"] = FALLBACK_MODEL
                    continue
                return None
            data = resp.json()
            choices = data.get("choices", [])
            if not choices:
                return None
            return choices[0].get("message", {}).get("content", "")
        except Exception:
            if attempt < retries:
                time.sleep(0.5)
                continue
            return None
    return None


def classify_intent_openrouter(query: str, conversation: Optional[List[Dict]] = None) -> Optional[Dict]:
    """
    Try OpenRouter to extract structured intent. Returns dict like nlp_simple entities or None.
    """
    if not is_configured():
        return None

    hist = ""
    if conversation:
        for turn in conversation[-6:]:
            role = turn.get("role", "user")
            text = turn.get("text", "")[:200]
            hist += f"{role}: {text}\n"

    prompt = f"""/no_think
Extract crime query intent. Return one raw JSON object only.
Query: {query}
History:
{hist}
Schema:
{{"intent": "search_cases|count_cases|sociological|profiling|decision_support|trends|network|financial",
 "language": "en|kn",
 "crime_type_ids": [1],
 "crime_type_name": "theft" or "all crime types",
 "date_from": "YYYY-MM-DD" or null,
 "date_to": null,
 "location_scope": "my_station|my_district|state"}}

Date rules: last 12 months -> date_from = today-365d approx, today is 2026-07-09.
If no crime type is mentioned, set crime_type_ids to null and crime_type_name to "all crime types".
If no timeframe is mentioned, set date_from to null.
"""

    content = chat_completion(
        [
            {"role": "system", "content": SYSTEM_POLICE},
            {"role": "user", "content": prompt},
        ],
        temperature=0.0,
        max_tokens=800,
    )

    if not content:
        log_info("OpenRouter intent returned no content")
        return None

    try:
        start = content.find("{")
        end = content.rfind("}") + 1
        if start >= 0 and end > start:
            obj = json.loads(content[start:end])
            obj["date_to"] = None
            if "intent" not in obj:
                obj["intent"] = "search_cases"
            if "language" not in obj:
                obj["language"] = "en"
            return obj
    except Exception as e:
        log_info("OpenRouter intent JSON parse failed", {"error": str(e), "content": content[:300]})
        return None
    log_info("OpenRouter intent JSON object not found", {"content": content[:300]})
    return None


def summarize_case_openrouter(case_data: Dict, language: str = "en") -> Optional[str]:
    if not is_configured():
        return None

    facts = case_data.get("brieffacts") or case_data.get("briefFacts") or case_data.get("brief_facts") or "No facts"
    crime_no = case_data.get("crimeno") or case_data.get("crime_no") or "Unknown"

    prompt = f"""/no_think
Summarize this FIR for a police investigator. Use plain text only. Do not use markdown.
FIR No: {crime_no}
BriefFacts: {facts[:1500]}

Respond in {'Kannada' if language == 'kn' else 'English'} using 4 short lines:
Incident: ...
Suspects: ...
Status: ...
Immediate leads: ...
"""

    return chat_completion(
        [
            {"role": "system", "content": SYSTEM_POLICE},
            {"role": "user", "content": prompt},
        ],
        model=AGENT_MODEL,
        temperature=0.2,
        max_tokens=400,
    )


def decision_support_openrouter(case_data: Dict, accused: List[Dict], financial: List[Dict], similar: List[Dict]) -> Optional[Dict]:
    """Generate structured summary/leads from case data with the cheaper agent model."""
    if not is_configured():
        return None

    facts = case_data.get("brieffacts") or "No facts"
    payload = {
        "case": {
            "case_id": case_data.get("casemasterid"),
            "fir_no": case_data.get("crimeno"),
            "registered_date": str(case_data.get("crimeregistereddate")),
            "gravity": case_data.get("gravityoffenceid"),
            "facts": facts[:1600],
        },
        "accused": accused[:8],
        "flagged_financial": financial[:8],
        "similar_cases": similar[:5],
    }

    prompt = f"""/no_think
You are a police investigation analyst. Generate decision support only from this JSON data.
Do not invent facts, names, dates, locations, amounts, or FIR numbers.
Return raw JSON only with this schema:
{{
  "summary": {{
    "incident": "one concise sentence",
    "suspects": "one concise sentence",
    "status": "one concise sentence",
    "next_steps": ["step 1", "step 2", "step 3"]
  }},
  "leads": [
    {{"type":"co_accused|financial|similar_mo|investigation", "priority":"HIGH|MEDIUM|LOW", "description":"specific lead grounded in the data"}}
  ]
}}

Data:
{json.dumps(payload, default=str)}
"""

    content = chat_completion(
        [
            {"role": "system", "content": SYSTEM_POLICE},
            {"role": "user", "content": prompt},
        ],
        model=AGENT_MODEL,
        temperature=0.1,
        max_tokens=900,
    )
    if not content:
        return None
    try:
        start = content.find("{")
        end = content.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(content[start:end])
    except Exception as e:
        log_info("Decision support JSON parse failed", {"error": str(e), "content": content[:300]})
    return None
