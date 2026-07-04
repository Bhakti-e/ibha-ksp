# Official KSP Schema Integration - Update Notes

**Date**: July 3, 2026  
**Source**: Police-FIR-ER-Diagram.pdf (Confidential - Karnataka Police Department)

---

## Summary

The **official KSP Datathon 2026 database schema** has been documented from the PDF provided. The official schema is significantly more comprehensive than initially estimated.

---

## Key Findings

### Official Schema Has 25+ Tables

#### Core Tables (12)
1. **CaseMaster** (main FIR table, not "firs")
2. **Accused** ✅ (compatible with Ibha)
3. **Victim** ✅ (compatible with Ibha)
4. **ComplainantDetails** ⚠️ (new, not in Ibha)
5. **ArrestSurrender** ⚠️ (new, not in Ibha)
6. **ActSectionAssociation** ⚠️ (new, not in Ibha)
7. **ChargesheetDetails** ⚠️ (new, not in Ibha)
8. **Employee** (police personnel)
9. **Unit** (police stations/units)
10. **Court**
11. **District**
12. **State**

#### Master/Lookup Tables (15)
- CaseCategory (FIR, UDR, PAR, Zero FIR)
- CaseStatusMaster
- GravityOffence (Heinous, Non-Heinous)
- CrimeHead, CrimeSubHead
- Act, Section, CrimeHeadActSection
- Rank, Designation, UnitType
- ReligionMaster, CasteMaster, OccupationMaster
- inv_arrestsurrenderaccused (junction table)

---

## Critical Schema Differences

### 1. Crime Number Format (Complex)

**Official Format** (18 digits):  
`[1-digit category][4-digit district][4-digit station][4-digit year][5-digit serial]`

**Examples**:
- FIR: `104430006202600001`
- UDR: `304430006202600001`
- Zero FIR: `804430006202600001`
- PAR: `404430006202600001`

**Impact**: Need to implement this numbering logic in Ibha.

### 2. Table Name: "CaseMaster" not "firs"

The official schema uses **CaseMaster** as the primary table name.

**Options for Ibha**:
1. Rename `firs` → `CaseMaster`
2. Keep `firs` as alias/view to `CaseMaster`
3. Use both (import to CaseMaster, expose as firs)

### 3. Missing Tables in Ibha

Ibha currently does NOT have:
- **ComplainantDetails** (who files the FIR)
- **ArrestSurrender** (arrest tracking)
- **ActSectionAssociation** (legal acts/sections)
- **ChargesheetDetails** (chargesheet info)
- **Act, Section** (legal framework)
- **CrimeHead, CrimeSubHead** (crime classification)
- **All 15 master/lookup tables**

### 4. Employee vs Users

**Official**: Employee table (EmployeeID, KGID, RankID, DesignationID, UnitID)  
**Ibha**: users table (user_id, role, station_id, email)

**Impact**: Ibha's RBAC model needs to be mapped to official Employee + Rank + Designation.

### 5. Unit vs Stations

**Official**: Unit table (UnitID, UnitName, TypeID, ParentUnit, hierarchy)  
**Ibha**: No explicit stations table (only station_id references)

**Impact**: Need to create Unit table or extend existing references.

---

## Immediate Actions Required

### Phase 1: Document (✅ DONE)

- [x] Document official schema in `/data/erd/ksp_erd_official.md`
- [x] Update sample CSV files to match official tables
- [x] Update `/data/README.md` with schema notes
- [x] Update `.gitignore` to exclude PDF and official dataset

### Phase 2: Schema Extension (TODO)

Update `/catalyst/datastore/schema.sql` to add:

1. **Rename or extend `firs` → `CaseMaster`**
   - Add columns: CrimeNo, CaseNo, CaseCategoryID, GravityOffenceID, CrimeMajorHeadID, CrimeMinorHeadID
   - Keep existing columns for Ibha compatibility

2. **Add new core tables**:
   ```sql
   CREATE TABLE ComplainantDetails (...);
   CREATE TABLE ArrestSurrender (...);
   CREATE TABLE ActSectionAssociation (...);
   CREATE TABLE ChargesheetDetails (...);
   CREATE TABLE Act (...);
   CREATE TABLE Section (...);
   CREATE TABLE Unit (...);
   ```

3. **Add all master/lookup tables**:
   ```sql
   CREATE TABLE CaseCategory (...);
   CREATE TABLE CaseStatusMaster (...);
   CREATE TABLE GravityOffence (...);
   CREATE TABLE CrimeHead (...);
   CREATE TABLE CrimeSubHead (...);
   CREATE TABLE Rank (...);
   CREATE TABLE Designation (...);
   CREATE TABLE UnitType (...);
   -- etc.
   ```

4. **Extend Employee table** (or map users → Employee):
   ```sql
   ALTER TABLE users ADD COLUMN KGID VARCHAR(50);
   ALTER TABLE users ADD COLUMN RankID INT REFERENCES Rank(RankID);
   ALTER TABLE users ADD COLUMN DesignationID INT REFERENCES Designation(DesignationID);
   -- etc.
   ```

### Phase 3: Data Import (TODO)

1. **Obtain official dataset** from KSP Datathon organizers
2. **Place in `/data/official/`** (excluded from Git)
3. **Import into Catalyst Data Store**:
   - Option A: SQL dump (`catalyst sql:run`)
   - Option B: CSV import (`catalyst datastore:import`)
   - Option C: Custom Python script
4. **Verify row counts** match expected
5. **Index into QuickML RAG**

### Phase 4: Application Updates (TODO)

1. **Update RAG queries** to use CaseMaster.BriefFacts
2. **Update chat.py** to reference correct table/column names
3. **Update frontend types** (`/web/app/lib/types.ts`)
4. **Update API responses** to include new fields (CrimeNo, CaseNo, etc.)
5. **Test RLS filtering** with new schema

---

## Compatibility Matrix

| Official Table | Ibha Table | Status | Action |
|----------------|------------|--------|--------|
| CaseMaster | `firs` | ⚠️ Partial | Extend with new columns |
| Accused | `accused` | ✅ Compatible | Minor adjustments (PersonID) |
| Victim | `victims` | ✅ Compatible | Minor adjustments (VictimPolice) |
| ComplainantDetails | N/A | ❌ Missing | CREATE TABLE |
| Employee | `users` | ⚠️ Different | Extend or map |
| Unit | N/A | ❌ Missing | CREATE TABLE |
| ArrestSurrender | N/A | ❌ Missing | CREATE TABLE |
| ChargesheetDetails | N/A | ❌ Missing | CREATE TABLE |
| Act, Section | N/A | ❌ Missing | CREATE TABLE |
| CrimeHead, CrimeSubHead | N/A | ❌ Missing | CREATE TABLE |
| All lookup tables | N/A | ❌ Missing | CREATE 15 TABLES |

---

## Ibha-Specific Tables (Keep)

These tables are **Ibha extensions** and should be retained:

✅ **Keep These**:
- `users` (Ibha RBAC, mapped to Employee)
- `audit_logs` (Ibha audit trail)
- `documents`, `documents_pending` (controlled ingestion)
- `ingestion_audit` (document lifecycle)
- `crime_trends` (pre-computed analytics)

---

## Data Import Strategy

### Recommended Approach

**Step 1**: Create **parallel schemas**
- Official KSP tables (CaseMaster, Accused, Victim, etc.)
- Ibha extension tables (audit_logs, documents, etc.)

**Step 2**: Import official dataset into official tables

**Step 3**: Create **views or mapping tables** to connect:
- CaseMaster → firs (view for backward compatibility)
- Employee → users (mapping table: EmployeeID ↔ user_id)
- Unit → station references (mapping table: UnitID ↔ station_id)

**Step 4**: Update Ibha application to use official tables

---

## Questions for Team Discussion

1. **Table Naming**: Should we rename `firs` → `CaseMaster` or keep both?
2. **User Mapping**: Map `users` → `Employee` or extend `users` table?
3. **Backward Compatibility**: Keep old column names as aliases?
4. **RAG Indexing**: Index only CaseMaster.BriefFacts or also ComplainantDetails?
5. **RLS Filtering**: How to apply RLS with Unit hierarchy (ParentUnit)?

---

## Files Updated in This Integration

1. ✅ `/data/erd/ksp_erd_official.md` (complete rewrite with official schema)
2. ✅ `/data/samples/casemaster_sample.csv` (new file, matches CaseMaster)
3. ✅ `/data/samples/accused_sample.csv` (updated to match official Accused)
4. ✅ `/data/samples/victims_sample.csv` (updated to match official Victim)
5. ✅ `/data/README.md` (added schema update note)
6. ✅ `.gitignore` (added /data/official/, *.pdf exclusions)
7. ✅ `/data/SCHEMA_UPDATE_NOTES.md` (this file)

---

## Next Steps

### For Development Team

1. **Review** the official schema in `/data/erd/ksp_erd_official.md`
2. **Discuss** schema extension strategy (meeting recommended)
3. **Update** `/catalyst/datastore/schema.sql` with new tables
4. **Test** schema updates in dev environment
5. **Wait** for official dataset from organizers
6. **Import** official data once received
7. **Update** application code to use new tables/columns

### For Documentation

- Update `/docs/architecture.md` with schema changes
- Update `/docs/problem_statement.md` with official table names
- Create migration guide for schema updates

---

**Prepared by**: Kiro AI  
**Date**: July 3, 2026  
**Status**: Schema documented, application updates pending
