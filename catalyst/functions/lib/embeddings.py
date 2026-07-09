"""
Embeddings — Ibha KSP
======================
Singleton wrapper for sentence-transformers MiniLM-L6-v2 (384-dim)
Used for similar case search and MO similarity.
Falls back to dummy zero vectors if model not available.
"""

import os
from typing import List, Optional
import math

_model = None
_dim = 384


def _load_model():
    global _model
    if _model is not None:
        return _model
    try:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer('all-MiniLM-L6-v2')
        return _model
    except Exception as e:
        print(f"⚠️  Embeddings model not available: {e}")
        _model = None
        return None


def get_embedding(text: str) -> List[float]:
    if not text:
        return [0.0] * _dim
    model = _load_model()
    if model is None:
        # Deterministic hash fallback for tests
        h = hash(text) % 1000 / 1000.0
        return [h] * _dim
    try:
        vec = model.encode(text, normalize_embeddings=True)
        return vec.tolist() if hasattr(vec, 'tolist') else list(vec)
    except Exception:
        return [0.0] * _dim


def cosine_similarity(a: List[float], b: List[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    try:
        dot = sum(x * y for x, y in zip(a, b))
        # Already normalized if using normalize_embeddings=True
        return float(max(-1.0, min(1.0, dot)))
    except Exception:
        return 0.0


def find_similar(query_embedding: List[float], candidates: List[dict], top_k: int = 5, id_key: str = "case_id", emb_key: str = "embedding") -> List[dict]:
    scored = []
    for c in candidates:
        emb = c.get(emb_key)
        if not emb:
            continue
        score = cosine_similarity(query_embedding, emb)
        scored.append({**c, "similarity": score})
    scored.sort(key=lambda x: x["similarity"], reverse=True)
    return scored[:top_k]
