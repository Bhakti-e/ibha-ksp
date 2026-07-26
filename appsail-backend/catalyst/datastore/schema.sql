-- =====================================================
-- Ibha Data Store Schema for Karnataka State Police
-- =====================================================
-- This schema defines the relational database structure for:
-- - User management and RBAC
-- - Crime records (FIRs, accused, victims)
-- - Controlled knowledge ingestion
-- - Audit trails

-- Users Table
-- Purpose: Store police personnel with role and station assignments for RBAC/RLS
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    role VARCHAR(30) NOT NULL CHECK (role IN ('Constable', 'SI', 'Inspector', 'DSP', 'SCRB_Analyst', 'Admin')),
    station_id VARCHAR(50) NOT NULL,
    district_id VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_station ON users(station_id);
CREATE INDEX idx_users_district ON users(district_id);
CREATE INDEX idx_users_role ON users(role);


-- FIRs (First Information Reports) Table
-- Purpose: Store crime reports with geographic and temporal data
CREATE TABLE firs (
    fir_id VARCHAR(50) PRIMARY KEY,
    fir_number VARCHAR(100) UNIQUE NOT NULL,
    station_id VARCHAR(50) NOT NULL,
    district_id VARCHAR(50) NOT NULL,
    date_time TIMESTAMP NOT NULL,
    location_name VARCHAR(255),
    location_geo_lat DECIMAL(9,6),
    location_geo_lon DECIMAL(9,6),
    crime_type VARCHAR(100) NOT NULL,
    crime_category VARCHAR(50),  -- IPC, Local/Special Laws, etc.
    modus_operandi TEXT,
    description TEXT NOT NULL,
    sensitivity VARCHAR(20) DEFAULT 'NORMAL' CHECK (sensitivity IN ('NORMAL', 'CONFIDENTIAL', 'RESTRICTED')),
    status VARCHAR(30) DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED', 'UNDER_INVESTIGATION', 'CHARGE_SHEETED', 'CLOSED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying (critical for RLS and analytics)
CREATE INDEX idx_firs_station ON firs(station_id);
CREATE INDEX idx_firs_district ON firs(district_id);
CREATE INDEX idx_firs_date ON firs(date_time DESC);
CREATE INDEX idx_firs_crime_type ON firs(crime_type);
CREATE INDEX idx_firs_status ON firs(status);
CREATE INDEX idx_firs_geo ON firs(location_geo_lat, location_geo_lon);
CREATE INDEX idx_firs_station_date ON firs(station_id, date_time DESC);


-- Accused Persons Table
-- Purpose: Link accused persons to FIRs for network analysis
CREATE TABLE accused (
    person_id VARCHAR(50) PRIMARY KEY,
    fir_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    alias VARCHAR(255),
    age INT,
    gender VARCHAR(10),
    address TEXT,
    role_in_crime VARCHAR(100),  -- Primary offender, accomplice, etc.
    previous_cases INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fir_id) REFERENCES firs(fir_id) ON DELETE CASCADE
);

CREATE INDEX idx_accused_fir ON accused(fir_id);
CREATE INDEX idx_accused_name ON accused(name);


-- Victims Table
-- Purpose: Store victim information for analysis
CREATE TABLE victims (
    victim_id VARCHAR(50) PRIMARY KEY,
    fir_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INT,
    gender VARCHAR(10),
    address TEXT,
    injury_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fir_id) REFERENCES firs(fir_id) ON DELETE CASCADE
);

CREATE INDEX idx_victims_fir ON victims(fir_id);


-- Locations Table
-- Purpose: Named locations (landmarks, hotspots) for mapping
CREATE TABLE locations (
    location_id VARCHAR(50) PRIMARY KEY,
    station_id VARCHAR(50) NOT NULL,
    district_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    location_type VARCHAR(50),  -- Landmark, Hotspot, etc.
    geo_lat DECIMAL(9,6),
    geo_lon DECIMAL(9,6),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_station ON locations(station_id);
CREATE INDEX idx_locations_geo ON locations(geo_lat, geo_lon);


-- Audit Logs Table
-- Purpose: Track all chat interactions for compliance and quality assurance
CREATE TABLE audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    query TEXT NOT NULL,
    query_hash VARCHAR(64),  -- SHA-256 hash for integrity
    tool_trail_json JSON,  -- Array of tools/models used
    citations_json JSON,  -- Array of citations with sources
    answer_hash VARCHAR(64) NOT NULL,  -- SHA-256 hash of answer
    confidence DECIMAL(3,2),
    mode VARCHAR(10),  -- text, voice
    language VARCHAR(5),  -- en, kn
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_ts ON audit_logs(ts DESC);
CREATE INDEX idx_audit_user_ts ON audit_logs(user_id, ts DESC);


-- =====================================================
-- CONTROLLED KNOWLEDGE INGESTION TABLES
-- =====================================================

-- Documents Pending Review Table
-- Purpose: Quarantine zone for uploaded documents before indexing
-- This prevents immediate knowledge base updates and enforces human review
CREATE TABLE documents_pending (
    document_id VARCHAR(50) PRIMARY KEY,
    fir_number VARCHAR(100),  -- Optional: link to existing FIR
    station_id VARCHAR(50) NOT NULL,
    district_id VARCHAR(50) NOT NULL,
    sensitivity VARCHAR(20) DEFAULT 'NORMAL' CHECK (sensitivity IN ('NORMAL', 'CONFIDENTIAL', 'RESTRICTED')),
    uploaded_by VARCHAR(50) NOT NULL,  -- user_id
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    file_size_bytes INT,
    file_path VARCHAR(500),  -- Path in Stratus object storage
    text_content TEXT,  -- Extracted text (from OCR or direct extraction)
    ocr_done BOOLEAN DEFAULT FALSE,
    ocr_confidence DECIMAL(3,2),
    indexed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
);

CREATE INDEX idx_docs_pending_status ON documents_pending(status);
CREATE INDEX idx_docs_pending_uploaded_at ON documents_pending(uploaded_at DESC);
CREATE INDEX idx_docs_pending_station ON documents_pending(station_id);


-- Approved Documents Table
-- Purpose: Store approved documents ready for or already indexed into RAG
CREATE TABLE documents (
    document_id VARCHAR(50) PRIMARY KEY,
    fir_number VARCHAR(100),
    station_id VARCHAR(50) NOT NULL,
    district_id VARCHAR(50) NOT NULL,
    sensitivity VARCHAR(20) DEFAULT 'NORMAL' CHECK (sensitivity IN ('NORMAL', 'CONFIDENTIAL', 'RESTRICTED')),
    uploaded_by VARCHAR(50) NOT NULL,
    approved_by VARCHAR(50),  -- Reviewer user_id
    approved_at TIMESTAMP,
    indexed BOOLEAN DEFAULT FALSE,
    indexed_at TIMESTAMP,
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    file_path VARCHAR(500),
    text_content TEXT,  -- Full text for indexing
    chunk_count INT,  -- Number of chunks in RAG
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

CREATE INDEX idx_docs_indexed ON documents(indexed);
CREATE INDEX idx_docs_approved_at ON documents(approved_at DESC);
CREATE INDEX idx_docs_station ON documents(station_id);
CREATE INDEX idx_docs_fir ON documents(fir_number);


-- Ingestion Audit Table
-- Purpose: Track all ingestion lifecycle events for compliance
CREATE TABLE ingestion_audit (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) NOT NULL,
    action VARCHAR(30) NOT NULL CHECK (action IN ('UPLOADED', 'APPROVED', 'REJECTED', 'INDEXED', 'FAILED')),
    performed_by VARCHAR(50),  -- user_id or 'system_cron'
    details_json JSON,  -- Additional metadata (rejection reason, error details, etc.)
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ingestion_audit_doc ON ingestion_audit(document_id);
CREATE INDEX idx_ingestion_audit_ts ON ingestion_audit(ts DESC);
CREATE INDEX idx_ingestion_audit_action ON ingestion_audit(action);


-- =====================================================
-- ANALYTICS SUPPORT TABLES (Optional)
-- =====================================================

-- Crime Trends Table (Materialized View / Pre-aggregated)
-- Purpose: Store pre-computed crime trends for fast dashboard loading
CREATE TABLE crime_trends (
    id VARCHAR(50) PRIMARY KEY,
    district_id VARCHAR(50),
    station_id VARCHAR(50),
    crime_type VARCHAR(100),
    date_bucket DATE,  -- Daily, weekly, or monthly aggregation
    bucket_type VARCHAR(10) CHECK (bucket_type IN ('DAILY', 'WEEKLY', 'MONTHLY')),
    incident_count INT DEFAULT 0,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trends_district_date ON crime_trends(district_id, date_bucket DESC);
CREATE INDEX idx_trends_station_date ON crime_trends(station_id, date_bucket DESC);
CREATE INDEX idx_trends_crime_type ON crime_trends(crime_type, date_bucket DESC);


-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Recent FIRs by Station (for Constable/SI quick access)
CREATE VIEW recent_firs_by_station AS
SELECT 
    fir_id,
    fir_number,
    station_id,
    date_time,
    crime_type,
    status,
    description
FROM firs
ORDER BY date_time DESC;

-- View: Pending Documents Summary (for SCRB_Analyst dashboard)
CREATE VIEW pending_documents_summary AS
SELECT 
    document_id,
    fir_number,
    station_id,
    district_id,
    sensitivity,
    uploaded_by,
    uploaded_at,
    status,
    file_name
FROM documents_pending
WHERE status = 'PENDING'
ORDER BY uploaded_at DESC;
