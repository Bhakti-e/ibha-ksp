-- =====================================================
-- OFFICIAL KSP SCHEMA EXTENSION
-- =====================================================
-- This file extends the Ibha schema with official tables from
-- Police-FIR-ER-Diagram.pdf (KSP Datathon 2026)
--
-- IMPORTANT: Run this AFTER schema.sql to add official KSP tables
-- alongside Ibha extension tables (audit_logs, documents, etc.)

-- =====================================================
-- CORE OFFICIAL TABLES
-- =====================================================

-- CaseMaster (Main FIR Table - replaces/extends "firs")
CREATE TABLE IF NOT EXISTS CaseMaster (
    CaseMasterID INT PRIMARY KEY,
    CrimeNo VARCHAR(18) NOT NULL UNIQUE,  -- 18-digit format: [1-cat][4-dist][4-stn][4-year][5-serial]
    CaseNo VARCHAR(9) NOT NULL,  -- 9-digit format: YYYY + 5-digit serial
    CrimeRegisteredDate DATE NOT NULL,
    PolicePersonID INT,  -- FK → Employee.EmployeeID
    PoliceStationID INT,  -- FK → Unit.UnitID
    CaseCategoryID INT,  -- FK → CaseCategory.CaseCategoryID
    GravityOffenceID INT,  -- FK → GravityOffence.GravityOffenceID
    CrimeMajorHeadID INT,  -- FK → CrimeHead.CrimeHeadID
    CrimeMinorHeadID INT,  -- FK → CrimeSubHead.CrimeSubHeadID
    CaseStatusID INT,  -- FK → CaseStatusMaster.CaseStatusID
    CourtID INT,  -- FK → Court.CourtID
    IncidentFromDate TIMESTAMP,
    IncidentToDate TIMESTAMP,
    InfoReceivedPSDate TIMESTAMP,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    BriefFacts TEXT,  -- Main text content for RAG indexing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_casemaster_crimeno ON CaseMaster(CrimeNo);
CREATE INDEX idx_casemaster_station ON CaseMaster(PoliceStationID);
CREATE INDEX idx_casemaster_date ON CaseMaster(CrimeRegisteredDate DESC);
CREATE INDEX idx_casemaster_crimehead ON CaseMaster(CrimeMajorHeadID, CrimeMinorHeadID);
CREATE INDEX idx_casemaster_geo ON CaseMaster(latitude, longitude);


-- Accused (Official Schema)
CREATE TABLE IF NOT EXISTS Accused (
    AccusedMasterID INT PRIMARY KEY,
    CaseMasterID INT NOT NULL,
    AccusedName VARCHAR(255) NOT NULL,
    AgeYear INT,
    GenderID INT,  -- Lookup value (not text: M/F/T)
    PersonID VARCHAR(10),  -- Accused sorting identifier: A1, A2, A3...
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID) ON DELETE CASCADE
);

CREATE INDEX idx_accused_case ON Accused(CaseMasterID);
CREATE INDEX idx_accused_name ON Accused(AccusedName);
CREATE INDEX idx_accused_personid ON Accused(PersonID);


-- Victim (Official Schema)
CREATE TABLE IF NOT EXISTS Victim (
    VictimMasterID INT PRIMARY KEY,
    CaseMasterID INT NOT NULL,
    VictimName VARCHAR(255) NOT NULL,
    AgeYear INT,
    GenderID INT,  -- Lookup value
    VictimPolice VARCHAR(1) DEFAULT '0' CHECK (VictimPolice IN ('0', '1')),  -- '1' if victim is police
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID) ON DELETE CASCADE
);

CREATE INDEX idx_victim_case ON Victim(CaseMasterID);
CREATE INDEX idx_victim_police ON Victim(VictimPolice);


-- ComplainantDetails (Who Filed FIR)
CREATE TABLE IF NOT EXISTS ComplainantDetails (
    ComplainantID INT PRIMARY KEY,
    CaseMasterID INT NOT NULL,
    ComplainantName VARCHAR(255) NOT NULL,
    AgeYear INT,
    OccupationID INT,  -- FK → OccupationMaster
    ReligionID INT,  -- FK → ReligionMaster
    CasteID INT,  -- FK → CasteMaster
    GenderID INT,  -- Lookup value
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID) ON DELETE CASCADE
);

CREATE INDEX idx_complainant_case ON ComplainantDetails(CaseMasterID);


-- Employee (Police Personnel - Official Schema)
CREATE TABLE IF NOT EXISTS Employee (
    EmployeeID INT PRIMARY KEY,
    DistrictID INT,  -- FK → District
    UnitID INT,  -- FK → Unit (police station)
    RankID INT,  -- FK → Rank
    DesignationID INT,  -- FK → Designation
    KGID VARCHAR(50),  -- Karnataka Government ID
    FirstName VARCHAR(255),
    EmployeeDOB DATE,
    GenderID INT,
    BloodGroupID INT,
    PhysicallyChallenged BIT DEFAULT 0,
    AppointmentDate DATE,
    Active BIT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employee_unit ON Employee(UnitID);
CREATE INDEX idx_employee_kgid ON Employee(KGID);
CREATE INDEX idx_employee_rank ON Employee(RankID);


-- Unit (Police Stations/Units)
CREATE TABLE IF NOT EXISTS Unit (
    UnitID INT PRIMARY KEY,
    UnitName VARCHAR(255) NOT NULL,
    TypeID INT,  -- FK → UnitType
    ParentUnit INT,  -- Hierarchical: parent unit ID
    NationalityID INT,
    StateID INT,  -- FK → State
    DistrictID INT,  -- FK → District
    Active BIT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_unit_district ON Unit(DistrictID);
CREATE INDEX idx_unit_parent ON Unit(ParentUnit);
CREATE INDEX idx_unit_type ON Unit(TypeID);


-- ArrestSurrender (Arrest Tracking)
CREATE TABLE IF NOT EXISTS ArrestSurrender (
    ArrestSurrenderID INT PRIMARY KEY,
    CaseMasterID INT NOT NULL,
    ArrestSurrenderTypeID INT,  -- Lookup: arrest or surrender
    ArrestSurrenderDate DATE,
    ArrestSurrenderStateId INT,  -- FK → State
    ArrestSurrenderDistrictId INT,  -- FK → District
    PoliceStationID INT,  -- FK → Unit
    IOID INT,  -- FK → Employee (Investigating Officer)
    CourtID INT,  -- FK → Court
    AccusedMasterID INT,  -- FK → Accused
    IsAccused BIT DEFAULT 0,
    IsComplainantAccused BIT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID) ON DELETE CASCADE,
    FOREIGN KEY (AccusedMasterID) REFERENCES Accused(AccusedMasterID) ON DELETE CASCADE
);

CREATE INDEX idx_arrest_case ON ArrestSurrender(CaseMasterID);
CREATE INDEX idx_arrest_accused ON ArrestSurrender(AccusedMasterID);
CREATE INDEX idx_arrest_date ON ArrestSurrender(ArrestSurrenderDate DESC);


-- ActSectionAssociation (Link Cases to Legal Acts/Sections)
CREATE TABLE IF NOT EXISTS ActSectionAssociation (
    AssociationID INT PRIMARY KEY AUTO_INCREMENT,
    CaseMasterID INT NOT NULL,
    ActID VARCHAR(50),  -- FK → Act.ActCode
    SectionID VARCHAR(50),  -- FK → Section.SectionCode
    ActOrderID INT,
    SectionOrderID INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID) ON DELETE CASCADE
);

CREATE INDEX idx_actsec_case ON ActSectionAssociation(CaseMasterID);
CREATE INDEX idx_actsec_act ON ActSectionAssociation(ActID);


-- ChargesheetDetails
CREATE TABLE IF NOT EXISTS ChargesheetDetails (
    CSID INT PRIMARY KEY,
    CaseMasterID INT NOT NULL,
    csdate TIMESTAMP,
    cstype CHAR(1) CHECK (cstype IN ('A', 'B', 'C')),  -- A=Chargesheet, B=False Case, C=Undetected
    PolicePersonID INT,  -- FK → Employee
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID) ON DELETE CASCADE
);

CREATE INDEX idx_chargesheet_case ON ChargesheetDetails(CaseMasterID);
CREATE INDEX idx_chargesheet_date ON ChargesheetDetails(csdate DESC);


-- Court
CREATE TABLE IF NOT EXISTS Court (
    CourtID INT PRIMARY KEY,
    CourtName VARCHAR(255) NOT NULL,
    DistrictID INT,  -- FK → District
    StateID INT,  -- FK → State
    Active BIT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_court_district ON Court(DistrictID);


-- =====================================================
-- MASTER / LOOKUP TABLES
-- =====================================================

-- CaseCategory (FIR, UDR, PAR, Zero FIR)
CREATE TABLE IF NOT EXISTS CaseCategory (
    CaseCategoryID INT PRIMARY KEY,
    LookupValue VARCHAR(50) NOT NULL,  -- FIR, UDR, PAR, Zero FIR
    Active BIT DEFAULT 1
);

INSERT INTO CaseCategory (CaseCategoryID, LookupValue) VALUES
(1, 'FIR'),
(2, 'UDR'),
(3, 'PAR'),
(4, 'Zero FIR')
ON CONFLICT DO NOTHING;


-- CaseStatusMaster
CREATE TABLE IF NOT EXISTS CaseStatusMaster (
    CaseStatusID INT PRIMARY KEY,
    CaseStatusName VARCHAR(100) NOT NULL,  -- Under Investigation, Charge Sheeted, Closed
    Active BIT DEFAULT 1
);

INSERT INTO CaseStatusMaster (CaseStatusID, CaseStatusName) VALUES
(1, 'Registered'),
(2, 'Under Investigation'),
(3, 'Charge Sheeted'),
(4, 'Closed'),
(5, 'Reopened')
ON CONFLICT DO NOTHING;


-- GravityOffence
CREATE TABLE IF NOT EXISTS GravityOffence (
    GravityOffenceID INT PRIMARY KEY,
    LookupValue VARCHAR(50) NOT NULL,  -- Heinous, Non-Heinous
    Active BIT DEFAULT 1
);

INSERT INTO GravityOffence (GravityOffenceID, LookupValue) VALUES
(1, 'Heinous'),
(2, 'Non-Heinous')
ON CONFLICT DO NOTHING;


-- CrimeHead (Major Crime Categories)
CREATE TABLE IF NOT EXISTS CrimeHead (
    CrimeHeadID INT PRIMARY KEY,
    CrimeGroupName VARCHAR(255) NOT NULL,  -- e.g., "Crimes Against Body"
    Active BIT DEFAULT 1
);


-- CrimeSubHead (Sub-Categories)
CREATE TABLE IF NOT EXISTS CrimeSubHead (
    CrimeSubHeadID INT PRIMARY KEY,
    CrimeHeadID INT NOT NULL,
    CrimeHeadName VARCHAR(255) NOT NULL,  -- e.g., "Murder", "Robbery"
    SeqID INT,
    Active BIT DEFAULT 1,
    FOREIGN KEY (CrimeHeadID) REFERENCES CrimeHead(CrimeHeadID)
);

CREATE INDEX idx_crimesubhead_head ON CrimeSubHead(CrimeHeadID);


-- Act (Legal Acts)
CREATE TABLE IF NOT EXISTS Act (
    ActCode VARCHAR(50) PRIMARY KEY,
    ActDescription VARCHAR(500),
    ShortName VARCHAR(100),
    Active BIT DEFAULT 1
);


-- Section (Legal Sections)
CREATE TABLE IF NOT EXISTS Section (
    SectionCode VARCHAR(50) PRIMARY KEY,
    ActCode VARCHAR(50) NOT NULL,
    SectionDescription VARCHAR(500),
    Active BIT DEFAULT 1,
    FOREIGN KEY (ActCode) REFERENCES Act(ActCode)
);

CREATE INDEX idx_section_act ON Section(ActCode);


-- State
CREATE TABLE IF NOT EXISTS State (
    StateID INT PRIMARY KEY,
    StateName VARCHAR(255) NOT NULL,
    StateCode VARCHAR(10),
    Active BIT DEFAULT 1
);


-- District
CREATE TABLE IF NOT EXISTS District (
    DistrictID INT PRIMARY KEY,
    DistrictName VARCHAR(255) NOT NULL,
    StateID INT NOT NULL,
    Active BIT DEFAULT 1,
    FOREIGN KEY (StateID) REFERENCES State(StateID)
);

CREATE INDEX idx_district_state ON District(StateID);


-- Rank (Police Ranks)
CREATE TABLE IF NOT EXISTS Rank (
    RankID INT PRIMARY KEY,
    RankName VARCHAR(100) NOT NULL,
    RankOrder INT,  -- Hierarchy: 1=Constable, 2=Head Constable, etc.
    Active BIT DEFAULT 1
);


-- Designation (Police Designations)
CREATE TABLE IF NOT EXISTS Designation (
    DesignationID INT PRIMARY KEY,
    DesignationName VARCHAR(100) NOT NULL,
    Active BIT DEFAULT 1
);


-- UnitType (Types of Police Units)
CREATE TABLE IF NOT EXISTS UnitType (
    UnitTypeID INT PRIMARY KEY,
    UnitTypeName VARCHAR(100) NOT NULL,  -- Police Station, Circle, Division, etc.
    Active BIT DEFAULT 1
);


-- ReligionMaster
CREATE TABLE IF NOT EXISTS ReligionMaster (
    ReligionID INT PRIMARY KEY,
    ReligionName VARCHAR(100) NOT NULL,
    Active BIT DEFAULT 1
);


-- CasteMaster
CREATE TABLE IF NOT EXISTS CasteMaster (
    caste_master_id INT PRIMARY KEY,
    CasteName VARCHAR(100) NOT NULL,
    Active BIT DEFAULT 1
);


-- OccupationMaster
CREATE TABLE IF NOT EXISTS OccupationMaster (
    OccupationID INT PRIMARY KEY,
    OccupationName VARCHAR(100) NOT NULL,
    Active BIT DEFAULT 1
);


-- =====================================================
-- VIEWS FOR COMPATIBILITY
-- =====================================================

-- View: Map CaseMaster to old "firs" table structure for backward compatibility
CREATE OR REPLACE VIEW firs_compat AS
SELECT 
    CONCAT('FIR_', CaseMasterID) AS fir_id,
    CrimeNo AS fir_number,
    PoliceStationID AS station_id,
    NULL AS district_id,  -- Need to join with Unit table
    CrimeRegisteredDate AS date_time,
    NULL AS location_name,
    latitude AS location_geo_lat,
    longitude AS location_geo_lon,
    NULL AS crime_type,
    NULL AS crime_category,
    NULL AS modus_operandi,
    BriefFacts AS description,
    CASE 
        WHEN GravityOffenceID = 1 THEN 'CONFIDENTIAL'
        ELSE 'NORMAL'
    END AS sensitivity,
    CASE CaseStatusID
        WHEN 1 THEN 'REGISTERED'
        WHEN 2 THEN 'UNDER_INVESTIGATION'
        WHEN 3 THEN 'CHARGE_SHEETED'
        WHEN 4 THEN 'CLOSED'
    END AS status,
    created_at
FROM CaseMaster;


-- =====================================================
-- NOTES
-- =====================================================
-- 1. Foreign key constraints assume you will populate lookup tables
-- 2. GenderID, BloodGroupID, etc. should have their own lookup tables (add if needed)
-- 3. Junction table inv_arrestsurrenderaccused mentioned in ERD (add if needed)
-- 4. CrimeHeadActSection junction table mentioned in ERD (add if needed)
-- 5. Run this script AFTER schema.sql to keep Ibha extension tables
-- 6. To import official KSP dataset, use:
--    catalyst datastore:import --table CaseMaster --file data/official/casemaster.csv
