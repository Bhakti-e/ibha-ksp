-- Extensions for Phase 2 Focus 4/5/6 — Ibha KSP
-- Load after ibha_dump.sql, safe to re-run (IF NOT EXISTS)

-- Case embeddings for similar case search (384-dim for MiniLM-L6-v2)
CREATE TABLE IF NOT EXISTS case_embeddings (
    case_id INT PRIMARY KEY REFERENCES casemaster(casemasterid) ON DELETE CASCADE,
    embedding FLOAT8[] ,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- pgvector alternative if available — store as vector type, but fallback to float array
-- This migration will try to create pgvector extension, ignore if not installed
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
    NULL;
END
$$;

-- Offender risk cache (optional materialization)
CREATE TABLE IF NOT EXISTS offender_risk_cache (
    accusedmasterid INT PRIMARY KEY REFERENCES accused(accusedmasterid) ON DELETE CASCADE,
    risk_score INT CHECK (risk_score >=0 AND risk_score <=100),
    factors JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Views for sociological analytics

CREATE OR REPLACE VIEW vw_age_buckets AS
SELECT
    CASE
        WHEN ageyear IS NULL THEN 'Unknown'
        WHEN ageyear < 18 THEN 'Under 18'
        WHEN ageyear BETWEEN 18 AND 25 THEN '18-25'
        WHEN ageyear BETWEEN 26 AND 35 THEN '26-35'
        WHEN ageyear BETWEEN 36 AND 50 THEN '36-50'
        ELSE '50+'
    END AS bucket,
    COUNT(*) AS count
FROM accused
GROUP BY bucket
ORDER BY bucket;

CREATE OR REPLACE VIEW vw_crime_by_unit_type AS
SELECT
    ut.unittypeid,
    ut.unittypeid AS type_id,
    COUNT(cm.casemasterid) AS case_count,
    cm.crimemajorheadid AS crimeheadid
FROM casemaster cm
LEFT JOIN unit u ON cm.policestationid = u.unitid
LEFT JOIN unittype ut ON u.typeid = ut.unittypeid
GROUP BY ut.unittypeid, cm.crimemajorheadid;

CREATE OR REPLACE VIEW vw_hourly_crime AS
SELECT
    EXTRACT(HOUR FROM crimeregistereddate) AS hour_of_day,
    COUNT(*) AS case_count
FROM casemaster
WHERE crimeregistereddate IS NOT NULL
GROUP BY hour_of_day
ORDER BY hour_of_day;

-- Indexes for new agents performance
CREATE INDEX IF NOT EXISTS idx_accused_age ON accused(ageyear);
CREATE INDEX IF NOT EXISTS idx_casemaster_date ON casemaster(crimeregistereddate);
CREATE INDEX IF NOT EXISTS idx_casemaster_unit ON casemaster(policestationid);
