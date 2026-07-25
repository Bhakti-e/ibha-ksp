"""
Response Templates for Multilingual Answers
--------------------------------------------
Provides natural language templates for formatting query results.
Supports English and Kannada.
NO external LLM - all responses are template-based.
"""

from typing import List, Dict


def format_answer_search(data: List[dict], entities: dict, language: str = 'en') -> dict:
    """
    Format answer for search_cases intent.
    
    Args:
        data: List of case dicts from database
        entities: Extracted entities (crime_type, date_range, etc.)
        language: 'en' or 'kn'
    
    Returns:
        Dict with keys: answer_text, data_rows, citations
    """
    count = len(data)
    crime_type = entities.get("crime_type_name", "crime")
    date_from = entities.get("date_from", "")
    
    # Calculate days
    from datetime import datetime
    try:
        start_date = datetime.strptime(date_from, '%Y-%m-%d')
        days = (datetime.now() - start_date).days
    except:
        days = 30
    
    # Build answer text
    if language == 'en':
        if count == 0:
            answer_text = f"No {crime_type} cases found in the selected time period."
        elif count == 1:
            answer_text = f"Found 1 {crime_type} case in the last {days} days."
        else:
            answer_text = f"Found {count} {crime_type} cases in the last {days} days."
        
        # Add trend insight if significant
        if count > 10:
            answer_text += f" This is a relatively high number. Consider reviewing patterns."
    
    else:  # Kannada
        if count == 0:
            answer_text = f"ಆಯ್ಕೆ ಮಾಡಿದ ಅವಧಿಯಲ್ಲಿ ಯಾವುದೇ {crime_type} ಪ್ರಕರಣಗಳು ಕಂಡುಬಂದಿಲ್ಲ."
        elif count == 1:
            answer_text = f"ಕಳೆದ {days} ದಿನಗಳಲ್ಲಿ 1 {crime_type} ಪ್ರಕರಣ ಕಂಡುಬಂದಿದೆ."
        else:
            answer_text = f"ಕಳೆದ {days} ದಿನಗಳಲ್ಲಿ {count} {crime_type} ಪ್ರಕರಣಗಳು ಕಂಡುಬಂದಿವೆ."
    
    # Extract citations (FIR numbers)
    citations = [row.get("crimeno") or row.get("CrimeNo") for row in data]
    
    return {
        "answer_text": answer_text,
        "data_rows": data,
        "citations": citations
    }


def format_answer_count(data: List[dict], entities: dict, language: str = 'en') -> dict:
    """
    Format answer for count_cases intent.
    
    Args:
        data: List with single dict containing 'case_count'
        entities: Extracted entities
        language: 'en' or 'kn'
    
    Returns:
        Dict with keys: answer_text, data_rows, citations
    """
    count = data[0].get("case_count", 0) if data else 0
    crime_type = entities.get("crime_type_name", "crime")
    date_from = entities.get("date_from", "")
    
    # Calculate days
    from datetime import datetime
    try:
        start_date = datetime.strptime(date_from, '%Y-%m-%d')
        days = (datetime.now() - start_date).days
    except:
        days = 30
    
    if language == 'en':
        answer_text = f"There are {count} {crime_type} cases in the last {days} days."
        
        if count == 0:
            answer_text += " This is a positive sign."
        elif count > 20:
            answer_text += " This is higher than usual. Recommend increased patrolling."
    
    else:  # Kannada
        answer_text = f"ಕಳೆದ {days} ದಿನಗಳಲ್ಲಿ {count} {crime_type} ಪ್ರಕರಣಗಳಿವೆ."
    
    return {
        "answer_text": answer_text,
        "data_rows": data,
        "citations": []
    }


def format_answer_trends(data: List[dict], language: str = 'en') -> dict:
    """
    Format answer for analyze_trends intent.
    
    Args:
        data: Monthly trend data
        language: 'en' or 'kn'
    
    Returns:
        Dict with formatted answer
    """
    if not data:
        answer_text = "No trend data available." if language == 'en' else "ಯಾವುದೇ ಪ್ರವೃತ್ತಿ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ."
        return {
            "answer_text": answer_text,
            "data_rows": [],
            "citations": []
        }
    
    # Calculate trend (comparing last 2 months)
    if len(data) >= 2:
        recent_count = data[0].get("case_count", 0)
        previous_count = data[1].get("case_count", 0)
        
        if previous_count > 0:
            change_pct = ((recent_count - previous_count) / previous_count) * 100
        else:
            change_pct = 0
        
        if language == 'en':
            if change_pct > 30:
                trend_text = f"Crime has increased by {change_pct:.1f}% compared to last month. Risk level: HIGH."
            elif change_pct > 0:
                trend_text = f"Crime has increased by {change_pct:.1f}% compared to last month. Risk level: MEDIUM."
            elif change_pct < -20:
                trend_text = f"Crime has decreased by {abs(change_pct):.1f}% compared to last month. Risk level: LOW."
            else:
                trend_text = f"Crime levels are stable (change: {change_pct:.1f}%). Risk level: MEDIUM."
            
            answer_text = f"Trend analysis: {trend_text}"
        else:
            answer_text = f"ಪ್ರವೃತ್ತಿ ವಿಶ್ಲೇಷಣೆ: ಕಳೆದ ತಿಂಗಳಿಗೆ ಹೋಲಿಸಿದರೆ {change_pct:.1f}% ಬದಲಾವಣೆ."
    else:
        answer_text = "Insufficient data for trend analysis." if language == 'en' else "ಪ್ರವೃತ್ತಿ ವಿಶ್ಲೇಷಣೆಗೆ ಸಾಕಷ್ಟು ಡೇಟಾ ಇಲ್ಲ."
    
    return {
        "answer_text": answer_text,
        "data_rows": data,
        "citations": []
    }


def build_explanation_contract(entities: dict, query_info: dict) -> dict:
    """
    Build explanation contract showing how the query was processed.
    
    Args:
        entities: Extracted entities from NLP
        query_info: Additional query information (filters, result count, etc.)
    
    Returns:
        Dict with explanation contract
    """
    reasoning_sketch = []
    
    # Step 1: Intent detection
    intent = entities.get("intent", "unknown")
    reasoning_sketch.append(f"Detected intent: {intent}")
    
    # Step 2: Entity extraction
    crime_type = entities.get("crime_type_ids")
    if crime_type:
        reasoning_sketch.append(f"Crime type filter: {entities.get('crime_type_name', 'specified')}")
    else:
        reasoning_sketch.append("No crime type filter (all crimes)")
    
    # Step 3: Date range
    date_from = entities.get("date_from")
    if date_from:
        reasoning_sketch.append(f"Date filter: from {date_from}")
    
    # Step 4: RLS applied
    user_role = query_info.get("user_role", "")
    station_id = query_info.get("station_id", "")
    reasoning_sketch.append(f"RLS applied: role={user_role}, station={station_id}")
    
    # Step 5: Result count
    result_count = query_info.get("result_count", 0)
    reasoning_sketch.append(f"Returned {result_count} results")
    
    return {
        "reasoning_sketch": reasoning_sketch,
        "tool_trail": [
            "nlp_simple.extract_entities",
            "query_builder.build_query",
            "db.execute_query",
            "templates.format_answer"
        ],
        "guardrails": [
            "RLS enforced",
            "Parameterized queries (SQL injection safe)",
            f"Result limit: {query_info.get('limit', 50)} rows",
            "Sensitive data filtered by role"
        ],
        "confidence": 0.9,  # Fixed for rule-based system
        "data_sources": ["CaseMaster", "CrimeSubHead", "Unit"]
    }


def get_empty_state_message(language: str = 'en') -> str:
    """
    Get message for empty query results.
    """
    if language == 'en':
        return "No cases found matching your filters. Try broadening your search criteria."
    else:
        return "ನಿಮ್ಮ ಫಿಲ್ಟರ್‌ಗಳಿಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಯಾವುದೇ ಪ್ರಕರಣಗಳು ಕಂಡುಬಂದಿಲ್ಲ."


def get_error_message(error_type: str, language: str = 'en') -> str:
    """
    Get user-friendly error messages.
    """
    errors_en = {
        "auth_failed": "Authentication failed. Please log in again.",
        "permission_denied": "You don't have permission to view this data.",
        "db_error": "Database error occurred. Please try again later.",
        "invalid_query": "Could not understand your query. Please rephrase."
    }
    
    errors_kn = {
        "auth_failed": "ದೃಢೀಕರಣ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಲಾಗಿನ್ ಮಾಡಿ.",
        "permission_denied": "ಈ ಡೇಟಾವನ್ನು ವೀಕ್ಷಿಸಲು ನಿಮಗೆ ಅನುಮತಿ ಇಲ್ಲ.",
        "db_error": "ಡೇಟಾಬೇಸ್ ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ನಂತರ ಪ್ರಯತ್ನಿಸಿ.",
        "invalid_query": "ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ."
    }
    
    errors = errors_en if language == 'en' else errors_kn
    return errors.get(error_type, "An error occurred.")
