"""
Centralized Logging Utilities
------------------------------
These utilities provide structured logging for audit, debugging, and monitoring.

WHY: Centralized logging is critical for:
- Audit compliance (every action must be traceable)
- Debugging production issues
- Security monitoring (detect anomalies and attacks)
- Performance analysis
"""

import json
import sys
from datetime import datetime


def log_info(message: str, context_dict: dict = None):
    """
    Log informational message with structured context.
    
    Args:
        message: human-readable log message
        context_dict: structured data (will be serialized to JSON)
    
    Output format (JSON for production log aggregation):
        {
            "level": "INFO",
            "timestamp": "2026-07-03T14:55:00.123Z",
            "message": "...",
            "context": {...}
        }
    """
    log_entry = {
        "level": "INFO",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "message": message,
        "context": context_dict or {}
    }
    
    # Print as JSON for structured log ingestion (Catalyst logs, CloudWatch, etc.)
    print(json.dumps(log_entry))
    sys.stdout.flush()


def log_error(message: str, context_dict: dict = None, exception: Exception = None):
    """
    Log error message with structured context and exception details.
    
    Args:
        message: human-readable error message
        context_dict: structured data (will be serialized to JSON)
        exception: exception object (will extract type and message)
    
    Output format (JSON):
        {
            "level": "ERROR",
            "timestamp": "2026-07-03T14:55:00.123Z",
            "message": "...",
            "context": {...},
            "exception": {
                "type": "ValueError",
                "message": "..."
            }
        }
    """
    log_entry = {
        "level": "ERROR",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "message": message,
        "context": context_dict or {}
    }
    
    if exception:
        log_entry["exception"] = {
            "type": exception.__class__.__name__,
            "message": str(exception)
        }
    
    # Print to stderr for error stream separation
    print(json.dumps(log_entry), file=sys.stderr)
    sys.stderr.flush()


def log_security_event(event_type: str, user_id: str, context_dict: dict = None):
    """
    Log security-related events for SIEM and threat detection.
    
    Security events include:
    - Failed authentication attempts
    - Unauthorized access attempts
    - RLS policy violations
    - Suspicious query patterns
    - Data export/download events
    
    Args:
        event_type: type of security event (e.g., "AUTH_FAILURE", "RLS_VIOLATION")
        user_id: user involved in the event
        context_dict: additional context
    """
    log_entry = {
        "level": "SECURITY",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "event_type": event_type,
        "user_id": user_id,
        "context": context_dict or {}
    }
    
    # Security events go to both stdout and stderr for visibility
    print(json.dumps(log_entry))
    print(json.dumps(log_entry), file=sys.stderr)
    sys.stdout.flush()
    sys.stderr.flush()
