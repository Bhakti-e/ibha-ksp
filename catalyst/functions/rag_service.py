"""
RAG Service — Ibha KSP
=======================
Retrieval-Augmented Generation over crime documents (FIRs, reports).

Stack:
  - ChromaDB (local persistent vector store)
  - sentence-transformers/all-MiniLM-L6-v2 (384-dim embeddings, ~80 MB)
  - Plain text documents from data/rag_docs/

Endpoint:  POST /api/v1/rag/query
Ingest script: scripts/ingest_rag.py

ChromaDB persists data to ./chroma_db/ so ingest only needs to run once.
"""

import os
import json
from typing import List, Optional

# ── Paths ────────────────────────────────────────────────────────────────────
# Resolve from this file's location regardless of working directory
_HERE     = os.path.dirname(os.path.abspath(__file__))
_REPO     = os.path.abspath(os.path.join(_HERE, '..', '..'))
CHROMA_DIR = os.path.join(_REPO, 'chroma_db')
DOCS_DIR   = os.path.join(_REPO, 'data', 'rag_docs')
COLLECTION = 'ibha_fir_docs'
EMBED_MODEL = 'all-MiniLM-L6-v2'

# ── Lazy singletons ───────────────────────────────────────────────────────────
_embedder  = None
_chroma    = None
_collection = None


def _get_embedder():
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer(EMBED_MODEL)
    return _embedder


def _get_collection():
    global _chroma, _collection
    if _collection is None:
        import chromadb
        _chroma     = chromadb.PersistentClient(path=CHROMA_DIR)
        _collection = _chroma.get_or_create_collection(
            name=COLLECTION,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


# ── Public API ────────────────────────────────────────────────────────────────

def query_rag(question: str, top_k: int = 4) -> List[dict]:
    """
    Embed the question and retrieve the top-k most relevant document chunks.

    Returns:
        [{ "text": str, "source": str, "score": float }, ...]
    """
    col = _get_collection()
    if col.count() == 0:
        return []  # Nothing ingested yet

    emb = _get_embedder().encode([question]).tolist()
    results = col.query(
        query_embeddings=emb,
        n_results=min(top_k, col.count()),
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    docs       = results.get("documents", [[]])[0]
    metas      = results.get("metadatas", [[]])[0]
    distances  = results.get("distances",  [[]])[0]

    for text, meta, dist in zip(docs, metas, distances):
        # ChromaDB returns cosine distance (0=identical, 2=opposite)
        # Convert to similarity score 0-1
        score = round(1.0 - (dist / 2.0), 4)
        chunks.append({
            "text":   text,
            "source": meta.get("source", "unknown"),
            "score":  score,
        })

    return chunks


def ingest_documents(docs_dir: Optional[str] = None) -> dict:
    """
    Read all .txt files in docs_dir, chunk them, embed, and upsert into Chroma.
    Safe to call multiple times — existing documents are overwritten by ID.

    Returns:
        { "ingested": int, "total_chunks": int }
    """
    target = docs_dir or DOCS_DIR
    if not os.path.isdir(target):
        return {"ingested": 0, "total_chunks": 0, "error": f"Directory not found: {target}"}

    col      = _get_collection()
    embedder = _get_embedder()

    all_ids, all_texts, all_metas = [], [], []

    for fname in sorted(os.listdir(target)):
        if not fname.endswith('.txt'):
            continue
        fpath = os.path.join(target, fname)
        with open(fpath, encoding='utf-8') as f:
            raw = f.read().strip()

        # Simple chunking: split on double-newline, keep chunks ≥ 80 chars
        paragraphs = [p.strip() for p in raw.split('\n\n') if len(p.strip()) >= 80]

        for i, chunk in enumerate(paragraphs):
            doc_id = f"{fname}::chunk{i}"
            all_ids.append(doc_id)
            all_texts.append(chunk)
            all_metas.append({"source": fname, "chunk": i})

    if not all_texts:
        return {"ingested": 0, "total_chunks": 0}

    # Embed in one batch
    embeddings = embedder.encode(all_texts).tolist()

    col.upsert(
        ids=all_ids,
        documents=all_texts,
        embeddings=embeddings,
        metadatas=all_metas,
    )

    return {"ingested": len(set(m["source"] for m in all_metas)), "total_chunks": len(all_texts)}


# ── Flask handler ─────────────────────────────────────────────────────────────

def handler(request: dict) -> dict:
    """
    POST /api/v1/rag/query
    Body: { "question": "...", "top_k": 4 }

    Returns:
    {
        "question": "...",
        "chunks": [{ "text": "...", "source": "...", "score": 0.xx }],
        "total_chunks_in_store": int
    }
    """
    CORS = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }

    try:
        body = request.get("body", {})
        if isinstance(body, str):
            body = json.loads(body)

        question = (body.get("question") or "").strip()
        top_k    = int(body.get("top_k", 4))

        if not question:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "question is required"})}

        chunks = query_rag(question, top_k=top_k)

        col = _get_collection()
        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "question": question,
                "chunks":   chunks,
                "total_chunks_in_store": col.count(),
            }),
        }

    except Exception as e:
        import traceback; traceback.print_exc()
        return {"statusCode": 500, "headers": CORS, "body": json.dumps({"error": str(e)})}
