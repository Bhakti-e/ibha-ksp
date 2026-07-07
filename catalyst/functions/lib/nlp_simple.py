"""
Simple NLP for Query Understanding
----------------------------------
Keyword-based intent and entity extraction (NO external LLM/AI)
All logic is local, rule-based, and deterministic.
"""

import re
from datetime import datetime, timedelta

# Crime type keyword mapping to CrimeMinorHeadID
# Based on official KSP schema CrimeSubHead table
CRIME_KEYWORDS_EN = {
    "theft": [1],  # CrimeMinorHeadID = 1
    "burglary": [2],
    "robbery": [3],
    "vehicle theft": [4],
    "bike theft": [4],
    "car theft": [4],
    "murder": [5],
    "assault": [6],
    "hit and run": [7],
    "kidnapping": [8],
    "rape": [9],
    "cyber": [10, 11],
    "fraud": [10, 11],
    "online fraud": [10],
    "phishing": [10],
    "drug": [12, 13],
    "narcotics": [12, 13],
    "chain snatching": [3],
    "pickpocketing": [1]
}

# Kannada crime keywords (ಕನ್ನಡ)
CRIME_KEYWORDS_KN = {
    "ಕಳ್ಳತನ": [1],  # theft
    "ದರೋಡೆ": [3],  # robbery
    "ಕೊಲೆ": [5],  # murder
    "ಹಲ್ಲೆ": [6],  # assault
    "ಸೈಬರ್": [10, 11],  # cyber
    "ಮಾದಕ": [12, 13]  # drugs
}

# Intent detection keywords
INTENT_KEYWORDS = {
    "search_cases": ["show", "list", "display", "find", "give me", "get", "ತೋರಿಸಿ", "ನೀಡಿ"],
    "count_cases": ["how many", "count", "number of", "total", "ಎಷ್ಟು", "ಸಂಖ್ಯೆ"],
    "analyze_trends": ["trend", "pattern", "increase", "decrease", "analysis", "ಪ್ರವೃತ್ತಿ"]
}

# Time period keywords
TIME_KEYWORDS_EN = {
    "today": 1,
    "yesterday": 2,
    "this week": 7,
    "last week": 7,
    "this month": 30,
    "last month": 30,
    "this year": 365,
    "last year": 365
}

TIME_KEYWORDS_KN = {
    "ಇಂದು": 1,
    "ನಿನ್ನೆ": 2,
    "ಈ ವಾರ": 7,
    "ಕಳೆದ ವಾರ": 7,
    "ಈ ತಿಂಗಳು": 30,
    "ಕಳೆದ ತಿಂಗಳು": 30
}


def detect_language(query: str) -> str:
    """
    Detect if query is in English or Kannada.
    
    Simple heuristic: Check for Kannada Unicode characters
    
    Returns:
        'en' or 'kn'
    """
    # Kannada Unicode range: \u0C80-\u0CFF
    if re.search(r'[\u0C80-\u0CFF]', query):
        return 'kn'
    return 'en'


def detect_intent(query: str) -> str:
    """
    Detect user intent from query text.
    
    Intents:
        - search_cases: Show/list cases
        - count_cases: How many cases
        - analyze_trends: Trends/patterns
    
    Returns:
        Intent string (default: 'search_cases')
    """
    q = query.lower()
    
    for intent, keywords in INTENT_KEYWORDS.items():
        if any(keyword in q for keyword in keywords):
            return intent
    
    # Default intent
    return "search_cases"


def extract_crime_type(query: str, language: str = 'en') -> list:
    """
    Extract crime type from query.
    
    Args:
        query: User query text
        language: 'en' or 'kn'
    
    Returns:
        List of CrimeMinorHeadID integers, or None for all types
    """
    q = query.lower()
    
    # Choose keyword dictionary based on language
    keywords = CRIME_KEYWORDS_EN if language == 'en' else CRIME_KEYWORDS_KN
    
    for crime_name, crime_ids in keywords.items():
        if crime_name in q:
            return crime_ids
    
    # No specific crime type mentioned - return None (means all types)
    return None


def extract_date_range(query: str, language: str = 'en') -> tuple:
    """
    Extract date range from query.
    
    Returns:
        (start_date_str, end_date_str) or (start_date_str, None)
        Date format: 'YYYY-MM-DD'
    """
    q = query.lower()
    today = datetime.now()
    
    # Check for "last N days" pattern
    match = re.search(r'last (\d+) days?', q)
    if match:
        days = int(match.group(1))
        start_date = today - timedelta(days=days)
        return start_date.strftime('%Y-%m-%d'), None
    
    # Check for "last N months" pattern
    match = re.search(r'last (\d+) months?', q)
    if match:
        months = int(match.group(1))
        start_date = today - timedelta(days=months*30)
        return start_date.strftime('%Y-%m-%d'), None
    
    # Check for "last N weeks" pattern
    match = re.search(r'last (\d+) weeks?', q)
    if match:
        weeks = int(match.group(1))
        start_date = today - timedelta(days=weeks*7)
        return start_date.strftime('%Y-%m-%d'), None
    
    # Check predefined time keywords (English)
    for keyword, days in TIME_KEYWORDS_EN.items():
        if keyword in q:
            start_date = today - timedelta(days=days)
            return start_date.strftime('%Y-%m-%d'), None
    
    # Check Kannada time keywords
    if language == 'kn':
        for keyword, days in TIME_KEYWORDS_KN.items():
            if keyword in q:
                start_date = today - timedelta(days=days)
                return start_date.strftime('%Y-%m-%d'), None
    
    # Default: last 30 days
    start_date = today - timedelta(days=30)
    return start_date.strftime('%Y-%m-%d'), None


def extract_location_scope(query: str) -> str:
    """
    Extract location scope from query.
    
    Scopes:
        - 'my_station': User's own station
        - 'my_district': User's district
        - 'state': State-wide (if user has permission)
    
    Returns:
        Scope string (default: 'my_station')
    """
    q = query.lower()
    
    if any(keyword in q for keyword in ["my station", "our station", "this station", "here"]):
        return "my_station"
    
    if any(keyword in q for keyword in ["my district", "our district", "district wide", "district-wide"]):
        return "my_district"
    
    if any(keyword in q for keyword in ["state", "karnataka", "state wide", "state-wide", "all stations"]):
        return "state"
    
    # Default: user's station
    return "my_station"


def extract_entities(query: str) -> dict:
    """
    Extract all entities from query in one pass.
    
    Returns:
        dict with keys:
            - intent: str
            - language: str
            - crime_type_ids: list or None
            - date_from: str or None
            - date_to: str or None
            - location_scope: str
    """
    language = detect_language(query)
    intent = detect_intent(query)
    crime_type_ids = extract_crime_type(query, language)
    date_from, date_to = extract_date_range(query, language)
    location_scope = extract_location_scope(query)
    
    return {
        "intent": intent,
        "language": language,
        "crime_type_ids": crime_type_ids,
        "date_from": date_from,
        "date_to": date_to,
        "location_scope": location_scope
    }


def get_crime_name(crime_type_ids: list, language: str = 'en') -> str:
    """
    Get human-readable crime name from IDs.
    
    Args:
        crime_type_ids: List of CrimeMinorHeadID
        language: 'en' or 'kn'
    
    Returns:
        Crime name string
    """
    if not crime_type_ids:
        return "all crime types" if language == 'en' else "ಎಲ್ಲಾ ಅಪರಾಧಗಳು"
    
    # Reverse lookup
    keywords = CRIME_KEYWORDS_EN if language == 'en' else CRIME_KEYWORDS_KN
    
    for crime_name, crime_ids in keywords.items():
        if crime_ids == crime_type_ids:
            return crime_name
    
    return "crime" if language == 'en' else "ಅಪರಾಧ"
