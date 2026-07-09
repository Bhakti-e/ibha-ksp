"""
Pydantic Schemas — Ibha KSP
============================
Central source of truth for all request/response shapes and internal
data structures.  Using Pydantic v2 for:
  - Runtime validation (bad inputs are rejected with clear errors)
  - Structured agent outputs (each processing stage returns a typed object)
  - Auto-generated JSON Schema (useful for docs / frontend type-gen)

Agent pipeline (see chat.py for orchestration):
  ChatRequest
      │  NLPAgent
      ▼
  QueryIntent (intent, filters, language)
      │  DBAgent
      ▼
  DBResult (rows, count, sql_fingerprint)
      │  AnswerAgent
      ▼
  ChatResponse
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# ────────────────────────────────────────────────────────────────────────────
# Chat API
# ────────────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    """Incoming chat query from the frontend."""
    query: str = Field(..., min_length=1, max_length=2000)
    mode: Literal["text", "voice"] = "text"
    language: Optional[Literal["en", "kn"]] = None

    @field_validator("query")
    @classmethod
    def query_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Query cannot be blank")
        return v.strip()


class ExplanationContract(BaseModel):
    """Transparent explanation of how the answer was derived."""
    intent: str
    filters_applied: Dict[str, Any]
    reasoning_sketch: List[str]
    result_count: int
    rls_scope: str  # e.g. "station_1", "district_2", "state"


class ChatResponse(BaseModel):
    """Response sent back to the frontend."""
    answer: str
    data: List[Dict[str, Any]] = []
    citations: List[str] = []
    explanation_contract: ExplanationContract
    metadata: Dict[str, Any] = {}


# ────────────────────────────────────────────────────────────────────────────
# NLP Agent outputs
# ────────────────────────────────────────────────────────────────────────────

class DateRange(BaseModel):
    """Extracted date range from natural language."""
    date_from: Optional[str] = None   # YYYY-MM-DD
    date_to:   Optional[str] = None   # YYYY-MM-DD


class QueryFilters(BaseModel):
    """All structured filters extracted from a natural-language query."""
    crime_type_ids:  Optional[List[int]] = None   # maps to CrimeMinorHeadID
    date_range:      DateRange = Field(default_factory=DateRange)
    location_scope:  Literal["my_station", "my_district", "state"] = "my_station"
    accused_id:      Optional[str] = None
    keyword:         Optional[str] = None   # free-text fallback


class QueryIntent(BaseModel):
    """
    Structured output of the NLP Agent.

    In prototype mode this is produced by keyword rules in nlp_simple.py.
    In production this will be the structured output of an LLM call that
    is constrained to return a JSON object matching this schema.
    """
    intent: Literal["search_cases", "count_cases", "analyze_trends", "network_lookup"] = "search_cases"
    language: Literal["en", "kn"] = "en"
    filters: QueryFilters = Field(default_factory=QueryFilters)
    crime_type_name: str = "all crime types"
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    raw_query: str = ""


# ────────────────────────────────────────────────────────────────────────────
# DB Agent outputs
# ────────────────────────────────────────────────────────────────────────────

class DBResult(BaseModel):
    """Structured output of the DB Agent."""
    rows: List[Dict[str, Any]]
    count: int
    sql_fingerprint: str   # hash / abbreviated SQL for audit, NOT the full query


# ────────────────────────────────────────────────────────────────────────────
# OCR
# ────────────────────────────────────────────────────────────────────────────

class OCRRequest(BaseModel):
    image_base64: str = Field(..., min_length=10)


class OCRResponse(BaseModel):
    text: str
    char_count: int
    model: str


# ────────────────────────────────────────────────────────────────────────────
# Admin / Audit
# ────────────────────────────────────────────────────────────────────────────

class AuditLogEntry(BaseModel):
    log_id:          int
    user_id:         str
    role:            str
    station_id:      Optional[int]
    district_id:     Optional[int]
    query_text:      str
    intent:          str
    filters_applied: Dict[str, Any]
    result_count:    int
    timestamp:       datetime


class SystemStats(BaseModel):
    total_cases:          int
    total_users:          int
    total_queries_today:  int
    top_querying_users:   List[Dict[str, Any]]
    database_health:      Literal["OK", "WARNING", "ERROR"]


# ────────────────────────────────────────────────────────────────────────────
# Auth
# ────────────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email:    str
    password: str

    @field_validator("email")
    @classmethod
    def email_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Email cannot be blank")
        return v.strip().lower()


class UserClaims(BaseModel):
    """Decoded JWT claims — user identity inside the system."""
    user_id:     str
    role:        Literal["Constable", "SI", "Inspector", "DSP", "SCRB_Analyst", "Admin"]
    station_id:  Optional[int]
    district_id: Optional[int]
    email:       str
    full_name:   str
    exp:         int


class LoginResponse(BaseModel):
    token: str
    user:  Dict[str, Any]
