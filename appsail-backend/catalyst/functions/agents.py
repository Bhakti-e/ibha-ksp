"""
Agent Pipeline — Ibha KSP
==========================
Three lightweight agents that orchestrate the chat request lifecycle:

  NLPAgent   — turns raw text into a structured QueryIntent
  DBAgent    — turns a QueryIntent into a DBResult
  AnswerAgent — turns a DBResult into a ChatResponse

Currently:
  NLPAgent   uses keyword rules from nlp_simple.py  (no external LLM)
  DBAgent    uses query_builder.py + db.py
  AnswerAgent uses templates.py

Production upgrade path (see comments throughout):
  NLPAgent   → replace with Vertex AI / OpenAI structured output call
               whose response is validated against the QueryIntent schema
  DBAgent    → add pgvector similarity search for semantic case retrieval
  AnswerAgent → use an LLM to produce natural-language summaries with
                Guardrails AI or Guidance for anti-hallucination guardrails

LlamaIndex orchestration:
  For document-level RAG (e.g. OCR'd FIRs indexed in a VectorStore),
  wrap DBAgent with a LlamaIndex QueryEngine that first checks the vector
  store for relevant document chunks before falling back to SQL.
"""

from __future__ import annotations

from schemas import (
    ChatRequest,
    ChatResponse,
    QueryIntent,
    QueryFilters,
    DateRange,
    DBResult,
    ExplanationContract,
    UserClaims,
)
from lib import nlp_simple, query_builder, db, templates


# ────────────────────────────────────────────────────────────────────────────
# NLP Agent
# ────────────────────────────────────────────────────────────────────────────

class NLPAgent:
    """
    Converts a raw natural-language query into a structured QueryIntent.

    Prototype implementation: keyword rules from nlp_simple.py
    Production upgrade: replace _run_llm() with a call to
      Vertex AI text-bison / Gemini with a structured-output prompt,
      then parse the JSON response into QueryIntent via Pydantic.
    """

    def run(self, request: ChatRequest) -> QueryIntent:
        entities = nlp_simple.extract_entities(request.query)
        language  = request.language or entities["language"]

        crime_type_name = nlp_simple.get_crime_name(
            entities.get("crime_type_ids"),
            language,
        )

        filters = QueryFilters(
            crime_type_ids=entities.get("crime_type_ids"),
            date_range=DateRange(
                date_from=entities.get("date_from"),
                date_to=entities.get("date_to"),
            ),
            location_scope=entities.get("location_scope", "my_station"),
        )

        return QueryIntent(
            intent=entities["intent"],
            language=language,
            filters=filters,
            crime_type_name=crime_type_name,
            confidence=0.85,   # keyword rules are deterministic but limited
            raw_query=request.query,
        )

    # ── Production stub ──────────────────────────────────────────────────────
    def _run_llm(self, query: str) -> QueryIntent:
        """
        PRODUCTION REPLACEMENT for keyword rules.

        Call a fine-tuned or prompted LLM and ask it to return a JSON object
        matching the QueryIntent schema.

        Example (Vertex AI):
            from vertexai.language_models import TextGenerationModel
            model = TextGenerationModel.from_pretrained("text-bison@002")
            response = model.predict(
                prompt=SYSTEM_PROMPT + query,
                max_output_tokens=512,
                temperature=0.0,
            )
            return QueryIntent.model_validate_json(response.text)

        Anti-hack guardrails to add:
          - Validate returned intent is in the allowed enum.
          - Reject crime_type_ids outside the known range.
          - Limit date ranges to reasonable bounds.
          - Block prompt injection via a pre-filter (e.g. Guardrails AI).
        """
        raise NotImplementedError("LLM-based NLP not yet implemented")


# ────────────────────────────────────────────────────────────────────────────
# DB Agent
# ────────────────────────────────────────────────────────────────────────────

class DBAgent:
    """
    Executes the query described by a QueryIntent and returns a DBResult.

    Uses parameterised SQL with RLS (Row-Level Security) applied by
    query_builder.py based on the user's role.

    Production upgrade: add a pgvector similarity search step so that
    semantically similar cases (from indexed OCR'd documents) are also
    retrieved alongside the SQL results.
    """

    def run(self, intent: QueryIntent, user_claims: UserClaims) -> DBResult:
        claims_dict = user_claims.model_dump()
        f = intent.filters

        if intent.intent == "count_cases":
            sql, params = query_builder.build_count_query(
                claims_dict,
                f.crime_type_ids,
                f.date_range.date_from,
                f.date_range.date_to,
            )
        else:
            sql, params = query_builder.build_search_query(
                claims_dict,
                f.crime_type_ids,
                f.date_range.date_from,
                f.date_range.date_to,
            )

        rows = db.execute_query(sql, params)

        # sql_fingerprint: a short descriptor for audit (not the full SQL)
        fingerprint = f"{intent.intent}|crimes={f.crime_type_ids}|from={f.date_range.date_from}"

        return DBResult(rows=rows, count=len(rows), sql_fingerprint=fingerprint)


# ────────────────────────────────────────────────────────────────────────────
# Answer Agent
# ────────────────────────────────────────────────────────────────────────────

class AnswerAgent:
    """
    Formats a DBResult into a ChatResponse with answer text, citations,
    and an explanation contract.

    Prototype: template-based formatting in templates.py
    Production: replace template call with a constrained LLM summariser
                (e.g. Gemini Flash) with Guardrails to prevent hallucination
                of FIR numbers or names not present in the data.
    """

    def run(
        self,
        db_result: DBResult,
        intent:    QueryIntent,
        user_claims: UserClaims,
    ) -> ChatResponse:
        entities = {
            "intent":          intent.intent,
            "language":        intent.language,
            "crime_type_ids":  intent.filters.crime_type_ids,
            "crime_type_name": intent.crime_type_name,
            "date_from":       intent.filters.date_range.date_from,
            "date_to":         intent.filters.date_range.date_to,
            "location_scope":  intent.filters.location_scope,
        }

        if intent.intent == "count_cases":
            formatted = templates.format_answer_count(db_result.rows, entities, intent.language)
        else:
            formatted = templates.format_answer_search(db_result.rows, entities, intent.language)

        query_info = {
            "user_role":    user_claims.role,
            "station_id":   user_claims.station_id,
            "result_count": db_result.count,
            "limit":        50,
        }
        raw_explanation = templates.build_explanation_contract(entities, query_info)

        explanation = ExplanationContract(
            intent=intent.intent,
            filters_applied={
                "crime_type_ids":  intent.filters.crime_type_ids,
                "date_from":       intent.filters.date_range.date_from,
                "date_to":         intent.filters.date_range.date_to,
                "location_scope":  intent.filters.location_scope,
            },
            reasoning_sketch=raw_explanation.get("reasoning_sketch", []),
            result_count=db_result.count,
            rls_scope=f"{user_claims.role}|station={user_claims.station_id}",
        )

        return ChatResponse(
            answer=formatted["answer_text"],
            data=formatted["data_rows"],
            citations=formatted["citations"],
            explanation_contract=explanation,
            metadata={
                "intent":      intent.intent,
                "language":    intent.language,
                "confidence":  intent.confidence,
                "sql_fingerprint": db_result.sql_fingerprint,
            },
        )
