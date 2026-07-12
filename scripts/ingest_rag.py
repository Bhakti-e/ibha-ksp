#!/usr/bin/env python
"""
Ingest RAG documents into ChromaDB.
Run once before demo from the project root:

    python scripts/ingest_rag.py

This reads all .txt files from data/rag_docs/, chunks them,
embeds them with sentence-transformers/all-MiniLM-L6-v2,
and stores them in chroma_db/.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'catalyst', 'functions'))

from rag_service import ingest_documents, _get_collection

if __name__ == '__main__':
    print("🔄  Ingesting RAG documents...")
    result = ingest_documents()

    if "error" in result:
        print(f"❌  Error: {result['error']}")
        sys.exit(1)

    print(f"✅  Ingested {result['ingested']} documents → {result['total_chunks']} chunks")
    col = _get_collection()
    print(f"📦  ChromaDB collection '{col.name}' now has {col.count()} total chunks")
    print(f"📁  Stored in: chroma_db/")
