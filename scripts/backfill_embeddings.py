#!/usr/bin/env python3
"""
Backfill case_embeddings from casemaster BriefFacts
Usage: PYTHONPATH=. .venv/bin/python scripts/backfill_embeddings.py
"""

import sys
import os
sys.path.insert(0, 'catalyst/functions')
sys.path.insert(0, '.')

os.environ['DB_HOST'] = os.getenv('DB_HOST', 'localhost')
os.environ['DB_PORT'] = os.getenv('DB_PORT', '5432')
os.environ['DB_NAME'] = os.getenv('DB_NAME', 'ibha')
os.environ['DB_USER'] = os.getenv('DB_USER', 'atharva')
os.environ['DB_PASSWORD'] = os.getenv('DB_PASSWORD', '')

from lib import db
from lib.embeddings import get_embedding

def main():
    print("🔍 Fetching cases...")
    rows = db.execute_query("SELECT casemasterid, brieffacts FROM casemaster WHERE brieffacts IS NOT NULL")
    print(f"Found {len(rows)} cases with BriefFacts")

    for r in rows:
        case_id = r['casemasterid']
        facts = r['brieffacts'] or ""
        if not facts.strip():
            continue
        emb = get_embedding(facts)
        # Upsert
        try:
            db.execute_insert(
                """
                INSERT INTO case_embeddings (case_id, embedding)
                VALUES (%s, %s)
                ON CONFLICT (case_id) DO UPDATE SET embedding = EXCLUDED.embedding, created_at = CURRENT_TIMESTAMP
                """,
                (case_id, emb)
            )
            print(f"  ✅ {case_id}: {facts[:40]}... -> {len(emb)}d")
        except Exception as e:
            print(f"  ❌ {case_id} failed: {e}")

    print("Done.")

if __name__ == "__main__":
    main()
