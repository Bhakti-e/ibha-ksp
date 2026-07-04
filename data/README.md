# KSP Datathon 2026 – Official Dataset

This folder contains the official Karnataka State Police crime database schema and sample data for the **KSP Datathon 2026 – Challenge 1**.

> **IMPORTANT UPDATE (July 3, 2026)**: The official KSP schema has been documented from the **Police-FIR-ER-Diagram.pdf** provided by organizers. The official schema is **more comprehensive** than initially estimated, with 25+ tables including CaseMaster, Employee, Unit, ArrestSurrender, ChargesheetDetails, and extensive master/lookup tables.
> 
> **Action Required**: The Ibha Data Store schema (`/catalyst/datastore/schema.sql`) will need to be updated to align with the official schema. See `/data/erd/ksp_erd_official.md` for complete details.

---

## Folder Structure

```
/data/
├── README.md                    # This file
├── erd/                         # Entity Relationship Diagram documentation
│   └── ksp_erd_official.md      # Textual ERD specification
└── samples/                     # Sample data files (stub/synthetic)
    ├── firs_sample.csv          # Sample FIR records
    ├── accused_sample.csv       # Sample accused persons
    ├── victims_sample.csv       # Sample victims
    └── locations_sample.csv     # Sample locations
```

---

## What This Folder Contains

### 1. ERD Documentation (`/erd/`)

The **Entity Relationship Diagram** for the official KSP Datathon 2026 crime database is documented in:
- **`ksp_erd_official.md`**: Textual representation of the database schema

This includes:
- **Tables**: FIRs, Accused, Victims, Locations, Evidence, Investigations, etc.
- **Columns**: Key fields for each table
- **Relationships**: Foreign keys and associations
- **Constraints**: Primary keys, indexes, data types

The ERD is based on the official specification provided by Karnataka State Police and Hack2Skill organizers.

### 2. Sample Data (`/samples/`)

Small **stub CSV files** with 5-10 sample rows each, matching the **official KSP schema**:

| File | Official Table | Description | Rows |
|------|----------------|-------------|------|
| `casemaster_sample.csv` | CaseMaster | Sample FIR records (core table) | ~10 |
| `accused_sample.csv` | Accused | Sample accused persons | ~10 |
| `victims_sample.csv` | Victim | Sample victims | ~10 |
| `locations_sample.csv` | N/A | Location reference (for Ibha UI) | ~10 |

**Note**: The official KSP schema uses **CaseMaster** (not "FIRs"). Sample files match the official PDF schema exactly.

These are **synthetic/stub data** for scaffold testing. Replace with the official dataset when provided.

---

## How to Use This Dataset

### Step 1: Obtain Official Dataset

The official dataset will be provided by KSP Datathon organizers after registration. It may include:
- SQL dump files (`.sql`)
- CSV files (`.csv`)
- JSON files (`.json`)
- Excel files (`.xlsx`)

Download the official dataset and place it in:
- `/data/official/` (create this folder, not tracked in Git)
- OR replace the files in `/data/samples/` with the official data

### Step 2: Import into Catalyst Data Store

Once you have the official dataset, import it into Catalyst Data Store:

#### Option A: Using SQL Dump

If the dataset is provided as a `.sql` file:

```bash
# Run the SQL file against Catalyst Data Store
catalyst sql:run /data/official/ksp_crime_data.sql --env dev
```

#### Option B: Using CSV Files

If the dataset is provided as CSV files:

1. Place CSV files in `/data/official/`
2. Use the import script in `/catalyst/datastore/seed.sql`
3. Or use Catalyst Data Store's CSV import feature:

```bash
catalyst datastore:import --table firs --file /data/official/firs.csv
catalyst datastore:import --table accused --file /data/official/accused.csv
catalyst datastore:import --table victims --file /data/official/victims.csv
catalyst datastore:import --table locations --file /data/official/locations.csv
```

#### Option C: Custom Import Script

For complex datasets, write a Python import script:

```python
# Example: /scripts/import_dataset.py
import pandas as pd
from catalyst import datastore

# Read CSV files
firs_df = pd.read_csv('/data/official/firs.csv')
accused_df = pd.read_csv('/data/official/accused.csv')

# Insert into Data Store
datastore.insert('firs', firs_df.to_dict('records'))
datastore.insert('accused', accused_df.to_dict('records'))
```

### Step 3: Index into QuickML RAG

After importing into Data Store, index the data into QuickML RAG for conversational AI:

1. Run the batch indexing function:
   ```bash
   catalyst function:invoke ingest_index --env dev
   ```

2. Or trigger via the nightly cron job (configured in `/catalyst/cron/nightly_ingestion.json`)

---

## Dataset Schema Alignment

The Ibha scaffold is designed to work with the official KSP Datathon 2026 dataset schema. Our Data Store schema (`/catalyst/datastore/schema.sql`) matches the official ERD with some extensions:

| Official Table | Ibha Table | Status | Notes |
|----------------|------------|--------|-------|
| FIRs | `firs` | ✅ Aligned | Extended with `sensitivity`, `status` |
| Accused | `accused` | ✅ Aligned | Extended with `previous_cases` |
| Victims | `victims` | ✅ Aligned | Extended with `injury_type` |
| Locations | `locations` | ✅ Aligned | Extended with `location_type` |
| Evidence | N/A | ⚠️ TODO | Add if official dataset includes |
| Investigations | N/A | ⚠️ TODO | Add if official dataset includes |

If the official dataset includes additional tables not in our schema, add them to `/catalyst/datastore/schema.sql`.

---

## Controlled Knowledge Ingestion

**IMPORTANT**: Once the initial dataset is imported, **new FIR documents should be added via the Controlled Ingestion Pipeline** (not direct database inserts).

### Why?

- Ensures data quality (human review required)
- Provides audit trail (who uploaded, who approved)
- Prevents poisoning attacks (malicious documents)
- Maintains RAG index integrity (batch updates)

### How to Add New Documents

1. **Web UI**: `/admin/ingestion` page
2. **API**: `POST /ingest/upload` endpoint
3. **Workflow**: Upload → OCR → Review → Approve → Batch Index

See `/docs/architecture.md` for details on the ingestion pipeline.

---

## Data Security & Privacy

### ⚠️ CRITICAL: Do NOT Commit Sensitive Data to GitHub

**The official KSP ERD PDF and any large/sensitive data should be stored in `/data/official/` and must NOT be committed to GitHub. Only small synthetic samples are included in this repo.**

**Rules**:
1. ✅ **DO** commit: Small sample/stub CSV files (< 100 rows, synthetic data)
2. ❌ **DO NOT** commit: Official dataset, real FIR data, sensitive information
3. ✅ **DO** store locally: Official files in `/data/official/` (excluded by .gitignore)
4. ❌ **DO NOT** push: Any files containing real names, phone numbers, addresses

**`.gitignore` Configuration**:
```gitignore
# Official Dataset (sensitive/large data ONLY)
/data/official/*
!/data/official/.gitkeep
```

### What is Committed to GitHub

**Included in Git**:
- ✅ `/data/erd/ksp_erd_official.md` - Schema documentation (no sensitive data)
- ✅ `/data/samples/*.csv` - Synthetic sample data (10 rows each)
- ✅ `/data/README.md` - This integration guide
- ✅ `/data/SCHEMA_UPDATE_NOTES.md` - Schema comparison notes

**Excluded from Git**:
- ❌ `/data/official/Police-FIR-ER-Diagram.pdf` - Official ERD (Confidential)
- ❌ `/data/official/*.csv` - Official datasets from KSP organizers
- ❌ Any large or real crime data files

### Data Handling Guidelines

- **Synthetic Data Only**: For GitHub and public demos
- **Official Dataset**: Only in Catalyst environment (secured) or local `/data/official/`
- **Sensitivity Levels**: Mark data as NORMAL, CONFIDENTIAL, or RESTRICTED  
- **Access Control**: Use RBAC/RLS (see `/docs/security_model.md`)
- **Confidential Schema**: The official Police-FIR-ER-Diagram.pdf is marked "Confidential" by Karnataka Police Department

---

## Dataset Versioning

If the organizers provide multiple versions of the dataset, document them here:

| Version | Date | Changes | File |
|---------|------|---------|------|
| v1.0 | 2026-01-15 | Initial release | `ksp_crime_data_v1.0.sql` |
| v1.1 | 2026-02-01 | Added 5K more FIRs | `ksp_crime_data_v1.1.sql` |
| v2.0 | 2026-03-01 | Final dataset | `ksp_crime_data_v2.0.sql` |

Update `/catalyst/datastore/seed.sql` when switching dataset versions.

---

## Troubleshooting

### Issue: CSV Import Fails

**Solution**:
- Check CSV encoding (should be UTF-8)
- Verify column names match schema
- Check for NULL values in required fields
- Use data validation script: `/scripts/validate_dataset.py` (TODO)

### Issue: RAG Indexing Takes Too Long

**Solution**:
- Index in smaller batches (modify `ingest_index.py`)
- Increase Catalyst function timeout
- Use multi-threading (if supported)

### Issue: Schema Mismatch

**Solution**:
- Compare official ERD with `/data/erd/ksp_erd_official.md`
- Update `/catalyst/datastore/schema.sql` if needed
- Write migration scripts for schema changes

---

## Additional Resources

- **Official Dataset Documentation**: Provided by KSP Datathon organizers (check Hack2Skill platform)
- **Schema Mapping**: `/docs/architecture.md` → "Dataset Integration" section
- **Import Scripts**: `/catalyst/datastore/seed.sql` (commented examples)
- **Security Guidelines**: `/docs/security_model.md` → "Data Protection" section

---

## Questions?

For dataset-related questions:
- **KSP Datathon Support**: scrb@ksp.gov.in
- **Hack2Skill Platform**: [https://hack2skill.com](https://hack2skill.com)
- **Team Discussion**: Internal Slack channel

---

**Last Updated**: July 3, 2026

**Maintainer**: Ibha Development Team
