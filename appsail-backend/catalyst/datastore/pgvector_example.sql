-- ============================================================
-- pgvector — Semantic Search for Ibha KSP
-- ============================================================
-- pgvector adds a `vector` column type to PostgreSQL, enabling
-- fast cosine / L2 / inner-product similarity search.
-- This is the recommended direction for production semantic
-- search over FIR text, OCR'd documents, and case narratives.
--
-- Install pgvector:
--   • Local (PostgreSQL 18 on Windows):
--       Download: https://github.com/pgvector/pgvector/releases
--       Then in psql: CREATE EXTENSION vector;
--   • Supabase / Neon (cloud): already available — just run:
--       CREATE EXTENSION IF NOT EXISTS vector;
--   • Docker: use pgvector/pgvector:pg16 image
--
-- pgvector docs: https://github.com/pgvector/pgvector
-- Python client: pip install pgvector
-- ============================================================

-- Step 1: Enable the extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- Step 2: Case Embeddings table
-- ============================================================
-- Stores a 768-dimensional sentence embedding for each FIR's
-- BriefFacts text.  384-dim works too (MiniLM); 768 = MPNet.
-- Adjust dimensions to match your chosen embedding model.

CREATE TABLE IF NOT EXISTS case_embeddings (
    id              SERIAL PRIMARY KEY,
    case_master_id  INT NOT NULL REFERENCES CaseMaster(CaseMasterID) ON DELETE CASCADE,
    crime_no        VARCHAR(18),
    -- 768 dims = sentence-transformers/all-mpnet-base-v2
    -- 384 dims = sentence-transformers/all-MiniLM-L6-v2
    embedding       vector(768),
    model_name      VARCHAR(100) DEFAULT 'all-mpnet-base-v2',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast approximate nearest-neighbour search (IVFFlat)
-- Build this AFTER inserting data (needs ≥ 1000 rows for good quality)
CREATE INDEX ON case_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);          -- tune lists ≈ sqrt(row_count)

-- ============================================================
-- Step 3: Insert an embedding (Python side)
-- ============================================================
-- from sentence_transformers import SentenceTransformer
-- from pgvector.psycopg2 import register_vector
-- import psycopg2
--
-- conn = psycopg2.connect(DATABASE_URL)
-- register_vector(conn)
--
-- model = SentenceTransformer('all-mpnet-base-v2')
-- text  = "Accused broke into a shop and stole mobile phones"
-- emb   = model.encode(text).tolist()
--
-- cur = conn.cursor()
-- cur.execute(
--     "INSERT INTO case_embeddings (case_master_id, crime_no, embedding) VALUES (%s, %s, %s)",
--     (42, "CR-001/2024", emb)
-- )
-- conn.commit()

-- ============================================================
-- Step 4: Query by similarity (SQL)
-- ============================================================
-- Find the 5 most semantically similar cases to a query embedding
-- (replace '[…]' with the actual query vector from Python):

/*
SELECT
    ce.crime_no,
    cm.BriefFacts,
    ce.embedding <=> '[0.12, 0.34, ...]'::vector AS distance
FROM case_embeddings ce
JOIN CaseMaster cm ON ce.case_master_id = cm.CaseMasterID
ORDER BY distance
LIMIT 5;
*/

-- <=>  = cosine distance (0 = identical, 2 = opposite)
-- <->  = L2 / Euclidean distance
-- <#>  = negative inner product (for dot-product similarity)

-- ============================================================
-- Step 5: OCR document embeddings (same pattern)
-- ============================================================
CREATE TABLE IF NOT EXISTS document_embeddings (
    id            SERIAL PRIMARY KEY,
    filename      VARCHAR(255),
    station_id    INT,
    extracted_text TEXT,
    embedding     vector(768),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ON document_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 50);

-- ============================================================
-- Production notes
-- ============================================================
-- 1. Embedding models to evaluate:
--      sentence-transformers/all-MiniLM-L6-v2   (fast, 384-dim)
--      sentence-transformers/all-mpnet-base-v2  (accurate, 768-dim)
--      Vertex AI text-embedding-004             (Google cloud, free tier)
--      intfloat/multilingual-e5-large           (English + Kannada)
--
-- 2. LlamaIndex integration:
--      Use LlamaIndex's PGVectorStore to manage insert + query:
--      https://docs.llamaindex.ai/en/stable/examples/vector_stores/postgres/
--
-- 3. Hybrid search (recommended for police data):
--      Combine pgvector similarity with SQL keyword filters:
--        SELECT … WHERE station_id = $1   -- RLS filter
--        ORDER BY embedding <=> $2        -- semantic ranking
--        LIMIT 20;
--
-- 4. Guardrails:
--      Always apply RLS station/district/state filters BEFORE or AFTER
--      the vector search — never expose embeddings from other jurisdictions.
