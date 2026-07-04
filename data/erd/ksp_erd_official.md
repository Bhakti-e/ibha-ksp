# KSP Datathon 2026 – Official Database Schema (ERD)

**Entity Relationship Diagram for Karnataka State Police Crime Database**

> **SOURCE**: Official "Police FIR System — ER Diagram" provided by Karnataka Police Department for KSP Datathon 2026.
> 
> **Document**: Police-FIR-ER-Diagram.pdf (Confidential)
> 
> **Last Updated**: Based on official PDF received July 3, 2026

---

## Overview

The KSP crime database is a comprehensive relational system for managing First Information Reports (FIRs), investigations, arrests, and legal proceedings across Karnataka.

### Core Tables (12)
- CaseMaster, Accused, Victim, ComplainantDetails
- ArrestSurrender, ActSectionAssociation, ChargesheetDetails
- Employee, Unit, Court, State, District

### Master/Lookup Tables (15)
- CaseCategory, CaseStatusMaster, GravityOffence
- CrimeHead, CrimeSubHead, Act, Section
- Rank, Designation, UnitType
- ReligionMaster, CasteMaster, OccupationMaster
- CrimeHeadActSection, inv_arrestsurrenderaccused (junction)

---

## Table Definitions

### 1. CaseMaster (Core FIR Table)

**Purpose**: Main table storing all registered FIRs and cases.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| CaseMasterID | INT | PK | Unique identifier for each FIR/case |
| CrimeNo | VARCHAR | | Crime Number (18 digits): 1-digit category + 4-digit district + 4-digit station + 4-digit year + 5-digit serial |
| CaseNo | VARCHAR | | Case Number (9 digits): YYYY + 5-digit serial (last 9 digits from CrimeNo) |
| CrimeRegisteredDate | DATE | | Date when FIR was registered |
| PolicePersonID | INT | FK | FK → Employee.EmployeeID (officer who registered FIR) |
| PoliceStationID | INT | FK | FK → Unit.UnitID (police station) |
| CaseCategoryID | INT | FK | FK → CaseCategory.CaseCategoryID |
| GravityOffenceID | INT | FK | FK → GravityOffence.GravityOffenceID |
| CrimeMajorHeadID | INT | FK | FK → CrimeHead.CrimeHeadID |
| CrimeMinorHeadID | INT | FK | FK → CrimeSubHead.CrimeSubHeadID |
| CaseStatusID | INT | FK | FK → CaseStatusMaster.CaseStatusID |
| CourtID | INT | FK | FK → Court.CourtID |
| IncidentFromDate | DATETIME | | Start date/time of incident |
| IncidentToDate | DATETIME | | End date/time of incident |
| InfoReceivedPSDate | DATETIME | | When police station received information |
| latitude | DECIMAL | | GPS latitude of incident location |
| longitude | DECIMAL | | GPS longitude of incident location |
| BriefFacts | Nvarchar(Max) | | Summary/description of the case |

**Crime Number Format Examples**:
- FIR: `104430006202600001` (1=FIR, 0443=District, 0006=Station, 2026=Year, 00001=Serial)
- UDR: `304430006202600001` (3=UDR)
- Zero FIR: `804430006202600001` (8=Zero FIR)
- PAR: `404430006202600001` (4=PAR)

---

### 2. ComplainantDetails

**Purpose**: Persons who file complaints/FIRs.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| ComplainantID | INT | PK | Unique identifier for complainant |
| CaseMasterID | INT | FK | FK → CaseMaster.CaseMasterID |
| ComplainantName | VARCHAR | | Full name |
| AgeYear | INT | | Age in years |
| OccupationID | INT | FK | FK → OccupationMaster.OccupationID |
| ReligionID | INT | FK | FK → ReligionMaster.ReligionID |
| CasteID | INT | FK | FK → CasteMaster.caste_master_id |
| GenderID | INT | | Gender (lookup value) |

---

### 3. Victim

**Purpose**: Persons affected by crimes.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| VictimMasterID | INT | PK | Unique identifier for victim |
| CaseMasterID | INT | FK | FK → CaseMaster.CaseMasterID |
| VictimName | VARCHAR | | Full name |
| AgeYear | INT | | Age in years |
| GenderID | INT | | Gender (m/f/t) |
| VictimPolice | VARCHAR | | "1" if victim is police, "0" otherwise |

---

### 4. Accused

**Purpose**: Persons accused in FIRs.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| AccusedMasterID | INT | PK | Unique identifier for accused |
| CaseMasterID | INT | FK | FK → CaseMaster.CaseMasterID |
| AccusedName | VARCHAR | | Full name |
| AgeYear | INT | | Age in years |
| GenderID | INT | | Gender (M/F/T) |
| PersonID | VARCHAR | | Accused sorting identifier (A1, A2, A3...) |

---

### 5. ArrestSurrender

**Purpose**: Track arrests and voluntary surrenders.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| ArrestSurrenderID | INT | PK | Unique identifier for event |
| CaseMasterID | INT | FK | FK → CaseMaster.CaseMasterID |
| ArrestSurrenderTypeID | INT | | Type: arrest or surrender (lookup) |
| ArrestSurrenderDate | DATE | | Date of arrest/surrender |
| ArrestSurrenderStateId | INT | FK | FK → State.StateID |
| ArrestSurrenderDistrictId | INT | FK | FK → District.DistrictID |
| PoliceStationID | INT | FK | FK → Unit.UnitID |
| IOID | INT | FK | FK → Employee.EmployeeID (Investigating Officer) |
| CourtID | INT | FK | FK → Court.CourtID |
| AccusedMasterID | INT | FK | FK → Accused.AccusedMasterID |
| IsAccused | BIT | | Flag: 1 if primary accused |
| IsComplainantAccused | BIT | | Flag: 1 if complainant is also accused |

**Note**: Junction table `inv_arrestsurrenderaccused` links arrests to multiple accused.

---

### 6. ActSectionAssociation

**Purpose**: Link cases to legal acts and sections.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| CaseMasterID | INT | FK | FK → CaseMaster.CaseMasterID |
| ActID | INT | FK | FK → Act.ActCode |
| SectionID | INT | FK | FK → Section.SectionCode |
| ActOrderID | INT | | Display order of act |
| SectionOrderID | INT | | Display order of section |

---

### 7. ChargesheetDetails

**Purpose**: Chargesheet information.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| CSID | INT | PK | Unique identifier for chargesheet |
| CaseMasterID | INT | FK | FK → CaseMaster.CaseMasterID |
| csdate | DATETIME | | Chargesheeted date |
| cstype | CHAR | | Type: A=Chargesheet, B=False Case, C=Undetected |
| PolicePersonID | INT | FK | FK → Employee.EmployeeID |

---

### 8. Employee (Police Personnel)

**Purpose**: Police officers and staff.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| EmployeeID | INT | PK | Unique identifier for employee |
| DistrictID | INT | FK | FK → District.DistrictID (current posting) |
| UnitID | INT | FK | FK → Unit.UnitID (assigned unit/station) |
| RankID | INT | FK | FK → Rank.RankID |
| DesignationID | INT | FK | FK → Designation.DesignationID |
| KGID | VARCHAR | | Karnataka Government ID |
| FirstName | VARCHAR | | First name |
| EmployeeDOB | DATE | | Date of birth |
| GenderID | INT | | Gender (lookup) |
| BloodGroupID | INT | | Blood group (lookup) |
| PhysicallyChallenged | BIT | | 1=Yes, 0=No |
| AppointmentDate | DATE | | Date of appointment |

---

### 9. Unit (Police Stations/Units)

**Purpose**: Police stations and organizational units.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| UnitID | INT | PK | Unique identifier for unit |
| UnitName | VARCHAR | | Name of unit/police station |
| TypeID | INT | FK | FK → UnitType.UnitTypeID |
| ParentUnit | INT | | Parent unit ID (hierarchy) |
| NationalityID | INT | | Nationality reference |
| StateID | INT | FK | FK → State.StateID |
| DistrictID | INT | FK | FK → District.DistrictID |
| Active | BIT | | 1=Active, 0=Inactive |

---

### 10. Court

**Purpose**: Courts handling cases.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| CourtID | INT | PK | Unique identifier for court |
| CourtName | VARCHAR | | Full name of court |
| DistrictID | INT | FK | FK → District.DistrictID |
| StateID | INT | FK | FK → State.StateID |
| Active | BIT | | 1=Active, 0=Inactive |

---

## Master/Lookup Tables

### CaseCategory

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| CaseCategoryID | INT | PK | Unique identifier |
| LookupValue | VARCHAR | | Category: FIR, UDR, PAR, Zero FIR |

### CaseStatusMaster

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| CaseStatusID | INT | PK | Unique identifier |
| CaseStatusName | VARCHAR | | Under Investigation, Charge Sheeted, Closed |

### GravityOffence

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| GravityOffenceID | INT | PK | Unique identifier |
| LookupValue | VARCHAR | | Heinous, Non-Heinous |

### CrimeHead

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| CrimeHeadID | INT | PK | Unique identifier |
| CrimeGroupName | VARCHAR | | Major crime category (e.g., Crimes Against Body) |
| Active | BIT | | 1=Active, 0=Inactive |

### CrimeSubHead

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| CrimeSubHeadID | INT | PK | Unique identifier |
| CrimeHeadID | INT | FK | FK → CrimeHead.CrimeHeadID |
| CrimeHeadName | VARCHAR | | Sub-category (e.g., Murder, Robbery) |
| SeqID | INT | | Display sequence |

### Act

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| ActCode | VARCHAR | PK | Unique code (e.g., IPC, NDPS, IT Act) |
| ActDescription | VARCHAR | | Full official name |
| ShortName | VARCHAR | | Abbreviated name |
| Active | BIT | | 1=Active, 0=Inactive |

### Section

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| ActCode | VARCHAR | FK | FK → Act.ActCode |
| SectionCode | VARCHAR | | Section number (e.g., 302, 307) |
| SectionDescription | VARCHAR | | Full description |
| Active | BIT | | 1=Active, 0=Inactive |

### State, District, Rank, Designation, UnitType

Similar lookup structures for geographic hierarchy, police ranks, designations, and unit types.

### ReligionMaster, CasteMaster, OccupationMaster

Demographic lookup tables referenced by ComplainantDetails.

---

## Relationships Summary

### One-to-Many Relationships

| Parent | Child | Description |
|--------|-------|-------------|
| CaseMaster | Victim | One FIR → many victims |
| CaseMaster | Accused | One FIR → many accused |
| CaseMaster | ArrestSurrender | One FIR → many arrests |
| CaseMaster | ComplainantDetails | One FIR → many complainants |
| CaseMaster | ActSectionAssociation | One FIR → many act-sections |
| Employee | CaseMaster | One officer → many FIRs |
| Unit | CaseMaster | One station → many FIRs |
| Court | CaseMaster | One court → many cases |
| State | District | One state → many districts |
| District | Unit | One district → many units |
| Act | Section | One act → many sections |
| CrimeHead | CrimeSubHead | One major head → many sub-heads |

### Many-to-Many (via Junction Tables)

| Table 1 | Junction | Table 2 | Description |
|---------|----------|---------|-------------|
| ArrestSurrender | inv_arrestsurrenderaccused | Accused | One arrest → multiple accused |
| CrimeHead | CrimeHeadActSection | Act/Section | Crime heads ↔ legal provisions |

---

## Key Design Patterns

### 1. Crime Number Format

**Structure**: `[1-digit category][4-digit district][4-digit station][4-digit year][5-digit serial]`

**Examples**:
- FIR: `1` + `0443` + `0006` + `2026` + `00001` = `104430006202600001`
- UDR: `3` + `0443` + `0006` + `2026` + `00001` = `304430006202600001`

**Serial Number**: Separate running serial maintained per station, category, and year.

### 2. Hierarchical Lookups

- **Geography**: State → District → Unit (Police Station)
- **Crime Classification**: CrimeHead → CrimeSubHead
- **Legal Framework**: Act → Section
- **Police Hierarchy**: Rank, Designation

### 3. Active/Inactive Flags

Most master tables have `Active` BIT field for soft deletes.

---

## Integration Notes for Ibha

### Schema Mapping

| Official KSP Table | Ibha Equivalent | Notes |
|--------------------|-----------------|-------|
| CaseMaster | `firs` (rename in Ibha) | Core alignment needed |
| Accused | `accused` | ✅ Compatible |
| Victim | `victims` | ✅ Compatible |
| ComplainantDetails | N/A (new) | ⚠️ Add to Ibha schema |
| Employee | `users` (extend) | ⚠️ Extend with KGID, ranks |
| Unit | `stations` (add) | ⚠️ Add to Ibha schema |
| ArrestSurrender | N/A (new) | ⚠️ Add to Ibha schema |
| ChargesheetDetails | N/A (new) | ⚠️ Add to Ibha schema |
| Act, Section | N/A (new) | ⚠️ Add to Ibha schema |
| CrimeHead, CrimeSubHead | N/A (new) | ⚠️ Add to Ibha schema |

### Required Schema Updates

1. **Rename** `firs` → `CaseMaster` (or keep firs and add columns)
2. **Add** ComplainantDetails, ArrestSurrender, ChargesheetDetails tables
3. **Add** Act, Section, ActSectionAssociation tables
4. **Add** CrimeHead, CrimeSubHead, CrimeHeadActSection tables
5. **Add** All lookup/master tables
6. **Extend** Employee table with official columns
7. **Add** Unit table (rename/extend from stations)

### Data Import Strategy

**Step 1**: Create all official tables in Catalyst Data Store  
**Step 2**: Import CSV/SQL files provided by KSP organizers  
**Step 3**: Maintain Ibha-specific tables separately:
- `users` (for Ibha RBAC, mapped to Employee)
- `audit_logs` (Ibha-specific audit trail)
- `documents`, `documents_pending` (controlled ingestion)
- `crime_trends` (pre-computed analytics)

### RAG Integration

**Tables to Index in QuickML RAG**:
- CaseMaster.BriefFacts (main text content)
- Documents.text_content (uploaded documents)
- ActSectionAssociation (for legal context)

**Metadata for RAG Chunks**:
- CaseMasterID, CrimeNo, CaseNo
- PoliceStationID (for RLS filtering)
- CrimeMajorHeadID, CrimeMinorHeadID (for crime type filtering)
- CaseStatusID (filter by active/closed cases)

---

## Data Volume Estimates

Based on typical Karnataka police operations:

| Table | Estimated Rows |
|-------|----------------|
| CaseMaster | 50,000 - 100,000 |
| Accused | 80,000 - 150,000 |
| Victim | 60,000 - 120,000 |
| ComplainantDetails | 50,000 - 100,000 |
| Employee | 20,000 - 30,000 |
| Unit | 500 - 1,000 |
| Court | 200 - 500 |
| Master Tables | 100 - 1,000 each |

**Total Database Size**: ~500 MB - 1 GB

---

## Notes

1. **Confidential Data**: This schema is marked "Confidential" by Karnataka Police Department
2. **Official Source**: All definitions are from official KSP Datathon 2026 ERD PDF
3. **Complete Schema**: This represents the FULL official schema (not a subset)
4. **Junction Tables**: Some many-to-many relationships use junction tables (e.g., inv_arrestsurrenderaccused)

---

**Last Updated**: July 3, 2026  
**Source Document**: Police-FIR-ER-Diagram.pdf  
**Maintainer**: Ibha Development Team
