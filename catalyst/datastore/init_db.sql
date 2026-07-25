-- =====================================================
-- Ibha Database Initialization Script
-- =====================================================
-- This script creates all tables for the Ibha KSP Crime Intelligence system
-- Run this ONCE to set up the database
--
-- Usage (Catalyst): catalyst sql:run catalyst/datastore/init_db.sql --env dev
-- Usage (Local):    psql -d ibha -f catalyst/datastore/init_db.sql

-- Drop old conflicting tables from scaffold
DROP TABLE IF EXISTS firs CASCADE;
DROP VIEW IF EXISTS firs_compat CASCADE;

-- =====================================================
-- OFFICIAL KSP SCHEMA (from Police-FIR-ER-Diagram.pdf)
-- =====================================================

-- CaseMaster (Main FIR Table)
CREATE TABLE IF NOT EXISTS CaseMaster (
    CaseMasterID SERIAL PRIMARY KEY,
    CrimeNo VARCHAR(18) NOT NULL UNIQUE,
    CaseNo VARCHAR(9) NOT NULL,
    CrimeRegisteredDate DATE NOT NULL,
    PolicePersonID INT,
    PoliceStationID INT,
    CaseCategoryID INT DEFAULT 1,
    GravityOffenceID INT DEFAULT 2,
    CrimeMajorHeadID INT,
    CrimeMinorHeadID INT,
    CaseStatusID INT DEFAULT 1,
    CourtID INT,
    IncidentFromDate TIMESTAMP,
    IncidentToDate TIMESTAMP,
    InfoReceivedPSDate TIMESTAMP,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    BriefFacts TEXT,
    ModusOperandi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_casemaster_crimeno ON CaseMaster(CrimeNo);
CREATE INDEX idx_casemaster_station ON CaseMaster(PoliceStationID);
CREATE INDEX idx_casemaster_date ON CaseMaster(CrimeRegisteredDate DESC);
CREATE INDEX idx_casemaster_crimehead ON CaseMaster(CrimeMajorHeadID, CrimeMinorHeadID);
CREATE INDEX idx_casemaster_status ON CaseMaster(CaseStatusID);
CREATE INDEX idx_casemaster_geo ON CaseMaster(latitude, longitude);

-- Accused
CREATE TABLE IF NOT EXISTS Accused (
    AccusedMasterID SERIAL PRIMARY KEY,
    CaseMasterID INT NOT NULL,
    AccusedName VARCHAR(255) NOT NULL,
    AgeYear INT,
    GenderID INT,
    PersonID VARCHAR(10),
    Address TEXT,
    PreviousCases INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID) ON DELETE CASCADE
);

CREATE INDEX idx_accused_case ON Accused(CaseMasterID);
CREATE INDEX idx_accused_name ON Accused(AccusedName);
CREATE INDEX idx_accused_personid ON Accused(PersonID);

-- Victim
CREATE TABLE IF NOT EXISTS Victim (
    VictimMasterID SERIAL PRIMARY KEY,
    CaseMasterID INT NOT NULL,
    VictimName VARCHAR(255) NOT NULL,
    AgeYear INT,
    GenderID INT,
    VictimPolice VARCHAR(1) DEFAULT '0' CHECK (VictimPolice IN ('0', '1')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID) ON DELETE CASCADE
);

CREATE INDEX idx_victim_case ON Victim(CaseMasterID);
CREATE INDEX idx_victim_police ON Victim(VictimPolice);

-- ComplainantDetails
CREATE TABLE IF NOT EXISTS ComplainantDetails (
    ComplainantID SERIAL PRIMARY KEY,
    CaseMasterID INT NOT NULL,
    ComplainantName VARCHAR(255) NOT NULL,
    AgeYear INT,
    GenderID INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID) ON DELETE CASCADE
);

-- State
CREATE TABLE IF NOT EXISTS State (
    StateID SERIAL PRIMARY KEY,
    StateName VARCHAR(255) NOT NULL,
    StateCode VARCHAR(10),
    Active BOOLEAN DEFAULT TRUE
);

-- District
CREATE TABLE IF NOT EXISTS District (
    DistrictID SERIAL PRIMARY KEY,
    DistrictName VARCHAR(255) NOT NULL,
    StateID INT NOT NULL,
    Active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (StateID) REFERENCES State(StateID)
);

CREATE INDEX idx_district_state ON District(StateID);

-- UnitType
CREATE TABLE IF NOT EXISTS UnitType (
    UnitTypeID SERIAL PRIMARY KEY,
    UnitTypeName VARCHAR(100) NOT NULL,
    Active BOOLEAN DEFAULT TRUE
);

-- Unit (Police Stations)
CREATE TABLE IF NOT EXISTS Unit (
    UnitID SERIAL PRIMARY KEY,
    UnitName VARCHAR(255) NOT NULL,
    TypeID INT,
    ParentUnit INT,
    StateID INT,
    DistrictID INT,
    Active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StateID) REFERENCES State(StateID),
    FOREIGN KEY (DistrictID) REFERENCES District(DistrictID),
    FOREIGN KEY (TypeID) REFERENCES UnitType(UnitTypeID)
);

CREATE INDEX idx_unit_district ON Unit(DistrictID);
CREATE INDEX idx_unit_type ON Unit(TypeID);

-- Rank
CREATE TABLE IF NOT EXISTS Rank (
    RankID SERIAL PRIMARY KEY,
    RankName VARCHAR(100) NOT NULL,
    RankOrder INT,
    Active BOOLEAN DEFAULT TRUE
);

-- Designation
CREATE TABLE IF NOT EXISTS Designation (
    DesignationID SERIAL PRIMARY KEY,
    DesignationName VARCHAR(100) NOT NULL,
    Active BOOLEAN DEFAULT TRUE
);

-- Employee (Police Personnel)
CREATE TABLE IF NOT EXISTS Employee (
    EmployeeID SERIAL PRIMARY KEY,
    DistrictID INT,
    UnitID INT,
    RankID INT,
    DesignationID INT,
    KGID VARCHAR(50),
    FirstName VARCHAR(255),
    EmployeeDOB DATE,
    GenderID INT,
    PhysicallyChallenged BOOLEAN DEFAULT FALSE,
    AppointmentDate DATE,
    Active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (DistrictID) REFERENCES District(DistrictID),
    FOREIGN KEY (UnitID) REFERENCES Unit(UnitID),
    FOREIGN KEY (RankID) REFERENCES Rank(RankID),
    FOREIGN KEY (DesignationID) REFERENCES Designation(DesignationID)
);

CREATE INDEX idx_employee_unit ON Employee(UnitID);
CREATE INDEX idx_employee_kgid ON Employee(KGID);

-- CaseCategory
CREATE TABLE IF NOT EXISTS CaseCategory (
    CaseCategoryID SERIAL PRIMARY KEY,
    LookupValue VARCHAR(50) NOT NULL,
    Active BOOLEAN DEFAULT TRUE
);

-- CaseStatusMaster
CREATE TABLE IF NOT EXISTS CaseStatusMaster (
    CaseStatusID SERIAL PRIMARY KEY,
    CaseStatusName VARCHAR(100) NOT NULL,
    Active BOOLEAN DEFAULT TRUE
);

-- GravityOffence
CREATE TABLE IF NOT EXISTS GravityOffence (
    GravityOffenceID SERIAL PRIMARY KEY,
    LookupValue VARCHAR(50) NOT NULL,
    Active BOOLEAN DEFAULT TRUE
);

-- CrimeHead
CREATE TABLE IF NOT EXISTS CrimeHead (
    CrimeHeadID SERIAL PRIMARY KEY,
    CrimeGroupName VARCHAR(255) NOT NULL,
    Active BOOLEAN DEFAULT TRUE
);

-- CrimeSubHead
CREATE TABLE IF NOT EXISTS CrimeSubHead (
    CrimeSubHeadID SERIAL PRIMARY KEY,
    CrimeHeadID INT NOT NULL,
    CrimeHeadName VARCHAR(255) NOT NULL,
    SeqID INT,
    Active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (CrimeHeadID) REFERENCES CrimeHead(CrimeHeadID)
);

CREATE INDEX idx_crimesubhead_head ON CrimeSubHead(CrimeHeadID);

-- =====================================================
-- IBHA APPLICATION TABLES
-- =====================================================

-- Users (for authentication - mapped to Employee)
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('Constable', 'SI', 'Inspector', 'DSP', 'SCRB_Analyst', 'Admin')),
    station_id INT,
    district_id INT,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES Unit(UnitID),
    FOREIGN KEY (district_id) REFERENCES District(DistrictID)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_station ON users(station_id);
CREATE INDEX idx_users_district ON users(district_id);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    role VARCHAR(30),
    station_id INT,
    district_id INT,
    query_text TEXT NOT NULL,
    intent VARCHAR(50),
    filters_applied JSONB,
    result_count INT,
    execution_time_ms INT,
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_ts ON audit_logs(ts DESC);
CREATE INDEX idx_audit_role ON audit_logs(role);

-- Crime Trends (pre-computed)
CREATE TABLE IF NOT EXISTS crime_trends (
    id SERIAL PRIMARY KEY,
    district_id INT,
    station_id INT,
    crime_head_id INT,
    date_bucket DATE,
    bucket_type VARCHAR(10) CHECK (bucket_type IN ('DAILY', 'WEEKLY', 'MONTHLY')),
    incident_count INT DEFAULT 0,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES District(DistrictID),
    FOREIGN KEY (station_id) REFERENCES Unit(UnitID),
    FOREIGN KEY (crime_head_id) REFERENCES CrimeHead(CrimeHeadID)
);

CREATE INDEX idx_trends_district_date ON crime_trends(district_id, date_bucket DESC);
CREATE INDEX idx_trends_station_date ON crime_trends(station_id, date_bucket DESC);

-- =====================================================
-- SEED LOOKUP DATA
-- =====================================================

-- Insert basic lookup data
INSERT INTO CaseCategory (CaseCategoryID, LookupValue) VALUES
(1, 'FIR'),
(2, 'UDR'),
(3, 'PAR'),
(4, 'Zero FIR')
ON CONFLICT DO NOTHING;

INSERT INTO CaseStatusMaster (CaseStatusID, CaseStatusName) VALUES
(1, 'Registered'),
(2, 'Under Investigation'),
(3, 'Charge Sheeted'),
(4, 'Closed'),
(5, 'Reopened')
ON CONFLICT DO NOTHING;

INSERT INTO GravityOffence (GravityOffenceID, LookupValue) VALUES
(1, 'Heinous'),
(2, 'Non-Heinous')
ON CONFLICT DO NOTHING;

INSERT INTO State (StateID, StateName, StateCode) VALUES
(1, 'Karnataka', 'KA')
ON CONFLICT DO NOTHING;

INSERT INTO District (DistrictID, DistrictName, StateID) VALUES
(1, 'Bangalore Urban', 1),
(2, 'Bangalore Rural', 1),
(3, 'Mysuru', 1),
(4, 'Mangaluru', 1)
ON CONFLICT DO NOTHING;

INSERT INTO UnitType (UnitTypeID, UnitTypeName) VALUES
(1, 'Police Station'),
(2, 'Circle Office'),
(3, 'Division Office'),
(4, 'Headquarters')
ON CONFLICT DO NOTHING;

INSERT INTO Unit (UnitID, UnitName, TypeID, DistrictID, StateID) VALUES
(1, 'Koramangala Police Station', 1, 1, 1),
(2, 'Whitefield Police Station', 1, 1, 1),
(3, 'Jayanagar Police Station', 1, 1, 1),
(4, 'HSR Layout Police Station', 1, 1, 1),
(5, 'Mysuru City Police Station', 1, 3, 1),
(6, 'Mangaluru Central Police Station', 1, 4, 1),
(100, 'SCRB Headquarters', 4, 1, 1)
ON CONFLICT DO NOTHING;

INSERT INTO Rank (RankID, RankName, RankOrder) VALUES
(1, 'Constable', 1),
(2, 'Head Constable', 2),
(3, 'Sub-Inspector', 3),
(4, 'Inspector', 4),
(5, 'Deputy Superintendent of Police', 5),
(6, 'Superintendent of Police', 6)
ON CONFLICT DO NOTHING;

INSERT INTO Designation (DesignationID, DesignationName) VALUES
(1, 'Beat Constable'),
(2, 'Investigating Officer'),
(3, 'Station House Officer'),
(4, 'Crime Analyst'),
(5, 'System Administrator')
ON CONFLICT DO NOTHING;

INSERT INTO CrimeHead (CrimeHeadID, CrimeGroupName) VALUES
(1, 'Crimes Against Property'),
(2, 'Crimes Against Body'),
(3, 'Crimes Against Women'),
(4, 'Cyber Crimes'),
(5, 'Drug Related Crimes')
ON CONFLICT DO NOTHING;

INSERT INTO CrimeSubHead (CrimeSubHeadID, CrimeHeadID, CrimeHeadName, SeqID) VALUES
(1, 1, 'Theft', 1),
(2, 1, 'Burglary', 2),
(3, 1, 'Robbery', 3),
(4, 1, 'Vehicle Theft', 4),
(5, 2, 'Murder', 1),
(6, 2, 'Assault', 2),
(7, 2, 'Grievous Hurt', 3),
(8, 3, 'Domestic Violence', 1),
(9, 3, 'Sexual Assault', 2),
(10, 4, 'Online Fraud', 1),
(11, 4, 'Identity Theft', 2),
(12, 5, 'Drug Possession', 1),
(13, 5, 'Drug Trafficking', 2)
ON CONFLICT DO NOTHING;

-- =====================================================
-- CONFIRMATION
-- =====================================================
SELECT 'Database initialization complete!' as status;
SELECT 'Tables created: CaseMaster, Accused, Victim, Unit, Employee, users, audit_logs, etc.' as info;
