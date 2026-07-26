-- =====================================================
-- Ibha Data Store - Sample Seed Data
-- =====================================================
-- This provides realistic sample data for testing the UI and backend.
--
-- IMPORTANT: Official Dataset Integration
-- ========================================
-- This seed script currently uses SYNTHETIC SAMPLE DATA for scaffold testing.
--
-- To use the official KSP Datathon 2026 dataset:
--
-- STEP 1: Place the official dataset files in /data/official/
--         (CSV, SQL, or JSON files provided by KSP Datathon organizers)
--
-- STEP 2: Import the official data using one of these methods:
--
--   Method A: SQL Dump
--   ------------------
--   If provided as .sql file:
--     catalyst sql:run /data/official/ksp_crime_data.sql --env dev
--
--   Method B: CSV Import (PostgreSQL COPY command)
--   ----------------------------------------------
--   Uncomment and modify these commands for your CSV files:
--
--   COPY firs (fir_id, fir_number, station_id, district_id, date_time, 
--              location_geo_lat, location_geo_lon, crime_type, crime_category,
--              modus_operandi, description, sensitivity, status)
--   FROM '/data/official/firs.csv'
--   DELIMITER ',' CSV HEADER;
--
--   COPY accused (person_id, fir_id, name, alias, age, gender, address, 
--                 role_in_crime, previous_cases)
--   FROM '/data/official/accused.csv'
--   DELIMITER ',' CSV HEADER;
--
--   COPY victims (victim_id, fir_id, name, age, gender, address, 
--                 injury_type, injury_severity)
--   FROM '/data/official/victims.csv'
--   DELIMITER ',' CSV HEADER;
--
--   COPY locations (location_id, station_id, district_id, name, location_type,
--                   geo_lat, geo_lon, description)
--   FROM '/data/official/locations.csv'
--   DELIMITER ',' CSV HEADER;
--
--   Method C: Catalyst Data Store Import
--   -------------------------------------
--   Use Catalyst CLI:
--     catalyst datastore:import --table firs --file /data/official/firs.csv
--     catalyst datastore:import --table accused --file /data/official/accused.csv
--
--   Method D: Custom Python Script
--   -------------------------------
--   Write a Python import script (see /scripts/import_dataset.py - TODO)
--
-- STEP 3: After importing, run the batch indexing function to add data to RAG:
--         catalyst function:invoke ingest_index --env dev
--
-- STEP 4: Verify data:
--         SELECT COUNT(*) FROM firs;
--         SELECT COUNT(*) FROM accused;
--
-- For more details, see:
--   - /data/README.md (dataset integration guide)
--   - /data/erd/ksp_erd_official.md (official schema documentation)
--   - /docs/architecture.md (architecture and data flow)
--
-- =====================================================

-- Insert Sample Users (Different roles and stations)
INSERT INTO users (user_id, role, station_id, district_id, email, full_name, phone, active) VALUES
('USR_001', 'Constable', 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', 'rajesh.kumar@ksp.gov.in', 'Rajesh Kumar', '+919876543210', TRUE),
('USR_002', 'SI', 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', 'priya.sharma@ksp.gov.in', 'Priya Sharma', '+919876543211', TRUE),
('USR_003', 'Inspector', 'STN_WHITEFIELD', 'DIST_BANGALORE_EAST', 'arun.desai@ksp.gov.in', 'Arun Desai', '+919876543212', TRUE),
('USR_004', 'DSP', 'DSP_OFFICE_SOUTH', 'DIST_BANGALORE_SOUTH', 'lakshmi.rao@ksp.gov.in', 'Lakshmi Rao', '+919876543213', TRUE),
('USR_005', 'SCRB_Analyst', 'SCRB_HQ', 'DIST_BANGALORE_CENTRAL', 'vikram.mehta@ksp.gov.in', 'Vikram Mehta', '+919876543214', TRUE),
('USR_006', 'Admin', 'SCRB_HQ', 'DIST_BANGALORE_CENTRAL', 'admin.system@ksp.gov.in', 'System Admin', '+919876543215', TRUE);


-- Insert Sample FIRs (Various crime types, dates, and locations)
INSERT INTO firs (fir_id, fir_number, station_id, district_id, date_time, location_name, location_geo_lat, location_geo_lon, crime_type, crime_category, modus_operandi, description, sensitivity, status) VALUES
('FIR_001', 'FIR/2025/KRMGL/0042', 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', '2025-11-10 19:30:00', 'Koramangala 5th Block', 12.9352, 77.6245, 'Theft', 'IPC', 'Breaking and Entering', 'Theft reported at residential apartment. Gold jewelry worth Rs. 2 lakhs stolen. No signs of forced entry, suspect had duplicate key.', 'NORMAL', 'UNDER_INVESTIGATION'),
('FIR_002', 'FIR/2025/KRMGL/0038', 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', '2025-10-28 14:15:00', 'Sony World Signal', 12.9343, 77.6247, 'Vehicle Theft', 'IPC', 'Two-wheeler theft', 'Honda Activa (KA-01-AB-1234) stolen from parking lot. CCTV shows suspect cutting lock at 2:30 AM.', 'NORMAL', 'UNDER_INVESTIGATION'),
('FIR_003', 'FIR/2025/KRMGL/0051', 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', '2025-11-22 11:00:00', 'Koramangala 7th Block', 12.9333, 77.6162, 'Cheating', 'IPC', 'Online fraud', 'Victim received phishing call claiming to be from bank. Rs. 45,000 transferred to unknown account.', 'CONFIDENTIAL', 'REGISTERED'),
('FIR_004', 'FIR/2025/WHTFD/0012', 'STN_WHITEFIELD', 'DIST_BANGALORE_EAST', '2025-11-15 08:45:00', 'Whitefield Main Road', 12.9698, 77.7499, 'Robbery', 'IPC', 'Street robbery', 'Two suspects on bike snatched gold chain from pedestrian. Victim injured in scuffle.', 'NORMAL', 'UNDER_INVESTIGATION'),
('FIR_005', 'FIR/2025/WHTFD/0018', 'STN_WHITEFIELD', 'DIST_BANGALORE_EAST', '2025-11-20 21:00:00', 'ITPL Main Gate', 12.9850, 77.7260, 'Assault', 'IPC', 'Physical assault after argument', 'Assault case after road rage incident. Two persons involved, both sustained minor injuries.', 'NORMAL', 'CHARGE_SHEETED'),
('FIR_006', 'FIR/2025/KRMGL/0055', 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', '2025-12-01 16:30:00', 'Forum Mall Area', 12.9342, 77.6099, 'Theft', 'IPC', 'Pickpocketing', 'Mobile phone stolen from victim''s pocket in crowded area. Suspect identified from CCTV.', 'NORMAL', 'REGISTERED'),
('FIR_007', 'FIR/2025/KRMGL/0058', 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', '2025-12-05 10:00:00', 'Koramangala 8th Block', 12.9279, 77.6270, 'Burglary', 'IPC', 'Shop burglary', 'Electronics shop burgled during night. Rs. 3 lakhs worth of goods stolen. Similar MO to FIR/2025/KRMGL/0042.', 'NORMAL', 'UNDER_INVESTIGATION'),
('FIR_008', 'FIR/2025/WHTFD/0022', 'STN_WHITEFIELD', 'DIST_BANGALORE_EAST', '2025-12-08 13:20:00', 'Varthur Main Road', 12.9345, 77.7500, 'Hit and Run', 'IPC', 'Vehicle accident', 'Pedestrian hit by speeding car. Vehicle number partially captured on CCTV. Victim in critical condition.', 'CONFIDENTIAL', 'UNDER_INVESTIGATION'),
('FIR_009', 'FIR/2025/KRMGL/0061', 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', '2025-12-10 09:15:00', 'Koramangala 6th Block', 12.9355, 77.6175, 'Cyber Crime', 'IT Act', 'Social media fraud', 'Fake investment scheme advertised on social media. Multiple victims, total loss Rs. 12 lakhs.', 'RESTRICTED', 'REGISTERED'),
('FIR_010', 'FIR/2025/WHTFD/0025', 'STN_WHITEFIELD', 'DIST_BANGALORE_EAST', '2025-12-12 18:00:00', 'Marathahalli Junction', 12.9592, 77.7010, 'Theft', 'IPC', 'Auto-rickshaw theft', 'Auto-rickshaw stolen from stand. Owner received ransom call demanding Rs. 10,000.', 'NORMAL', 'UNDER_INVESTIGATION');

-- Additional FIRs for pattern detection
INSERT INTO firs (fir_id, fir_number, station_id, district_id, date_time, location_name, location_geo_lat, location_geo_lon, crime_type, crime_category, modus_operandi, description, sensitivity, status) VALUES
('FIR_011', 'FIR/2025/KRMGL/0064', 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', '2025-12-15 20:00:00', 'Koramangala 4th Block', 12.9351, 77.6280, 'Theft', 'IPC', 'Breaking and Entering', 'Similar to FIR_001 and FIR_007. Duplicate key used. Jewelry stolen. Same suspect pattern.', 'NORMAL', 'UNDER_INVESTIGATION'),
('FIR_012', 'FIR/2025/WHTFD/0028', 'STN_WHITEFIELD', 'DIST_BANGALORE_EAST', '2025-12-18 07:30:00', 'Brookfield Area', 12.9716, 77.7137, 'Theft', 'IPC', 'Two-wheeler theft', 'Yamaha FZ stolen. Similar MO to FIR_002. Same suspect vehicle seen on CCTV.', 'NORMAL', 'REGISTERED'),
('FIR_013', 'FIR/2026/KRMGL/0001', 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', '2026-01-05 12:00:00', 'Koramangala 1st Block', 12.9380, 77.6270, 'Cheating', 'IPC', 'Credit card fraud', 'Victim''s credit card cloned. Unauthorized transactions worth Rs. 67,000.', 'CONFIDENTIAL', 'UNDER_INVESTIGATION'),
('FIR_014', 'FIR/2026/WHTFD/0003', 'STN_WHITEFIELD', 'DIST_BANGALORE_EAST', '2026-01-10 15:45:00', 'Kadugodi Circle', 12.9934, 77.7577, 'Assault', 'IPC', 'Domestic violence', 'Domestic violence complaint. Victim hospitalized with injuries.', 'RESTRICTED', 'REGISTERED'),
('FIR_015', 'FIR/2026/KRMGL/0003', 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', '2026-01-15 10:30:00', 'Koramangala 3rd Block', 12.9280, 77.6270, 'Drug Possession', 'NDPS Act', 'Drug trafficking', 'Arrested suspect with 500g cannabis. Interrogation reveals larger network.', 'RESTRICTED', 'UNDER_INVESTIGATION');


-- Insert Sample Accused (Linked to FIRs)
INSERT INTO accused (person_id, fir_id, name, alias, age, gender, address, role_in_crime, previous_cases) VALUES
('ACC_001', 'FIR_001', 'Ravi Kumar', 'Chotu', 32, 'Male', 'Unknown', 'Primary offender', 3),
('ACC_002', 'FIR_002', 'Sanjay Reddy', 'Sandy', 28, 'Male', 'HSR Layout, Bangalore', 'Primary offender', 5),
('ACC_003', 'FIR_004', 'Mukesh Singh', NULL, 25, 'Male', 'Whitefield, Bangalore', 'Primary offender', 1),
('ACC_004', 'FIR_004', 'Suresh Yadav', NULL, 27, 'Male', 'Whitefield, Bangalore', 'Accomplice', 2),
('ACC_005', 'FIR_005', 'Prakash Gowda', NULL, 35, 'Male', 'ITPL Road, Bangalore', 'Primary offender', 0),
('ACC_006', 'FIR_006', 'Deepak Kumar', 'Deepu', 22, 'Male', 'Koramangala, Bangalore', 'Primary offender', 4),
('ACC_007', 'FIR_007', 'Ravi Kumar', 'Chotu', 32, 'Male', 'Unknown', 'Primary offender', 4),  -- Same as ACC_001, showing repeat offender
('ACC_008', 'FIR_008', 'Unknown', NULL, NULL, NULL, NULL, 'Primary offender', 0),
('ACC_009', 'FIR_010', 'Ramesh Babu', NULL, 40, 'Male', 'Marathahalli, Bangalore', 'Primary offender', 1),
('ACC_010', 'FIR_011', 'Ravi Kumar', 'Chotu', 32, 'Male', 'Unknown', 'Primary offender', 5),  -- Same offender again
('ACC_011', 'FIR_012', 'Sanjay Reddy', 'Sandy', 28, 'Male', 'HSR Layout, Bangalore', 'Primary offender', 6),  -- Same offender
('ACC_012', 'FIR_015', 'Vikram Malhotra', NULL, 29, 'Male', 'Koramangala, Bangalore', 'Dealer', 2);


-- Insert Sample Victims
INSERT INTO victims (victim_id, fir_id, name, age, gender, address, injury_type) VALUES
('VIC_001', 'FIR_001', 'Sunita Rao', 45, 'Female', 'Koramangala 5th Block', 'None'),
('VIC_002', 'FIR_002', 'Mohan Kumar', 38, 'Male', 'Koramangala 6th Block', 'None'),
('VIC_003', 'FIR_003', 'Anand Swamy', 52, 'Male', 'Koramangala 7th Block', 'None'),
('VIC_004', 'FIR_004', 'Lakshmi Devi', 55, 'Female', 'Whitefield Main Road', 'Minor cuts and bruises'),
('VIC_005', 'FIR_005', 'Rajesh Patel', 42, 'Male', 'ITPL Road', 'Contusions'),
('VIC_006', 'FIR_006', 'Preethi Nair', 28, 'Female', 'HSR Layout', 'None'),
('VIC_007', 'FIR_007', 'Suresh Electronics', NULL, NULL, 'Koramangala 8th Block', 'Property damage'),
('VIC_008', 'FIR_008', 'Manjunath Gowda', 62, 'Male', 'Varthur', 'Critical - head injury'),
('VIC_009', 'FIR_010', 'Nagaraj Auto', NULL, NULL, 'Marathahalli', 'None'),
('VIC_010', 'FIR_011', 'Kavita Sharma', 38, 'Female', 'Koramangala 4th Block', 'None');


-- Insert Sample Locations (Landmarks and hotspots)
INSERT INTO locations (location_id, station_id, district_id, name, location_type, geo_lat, geo_lon, description) VALUES
('LOC_001', 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', 'Forum Mall', 'Landmark', 12.9342, 77.6099, 'Major shopping mall - pickpocketing hotspot'),
('LOC_002', 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', 'Sony World Signal', 'Hotspot', 12.9343, 77.6247, 'High vehicle theft area'),
('LOC_003', 'STN_WHITEFIELD', 'DIST_BANGALORE_EAST', 'ITPL Main Gate', 'Landmark', 12.9850, 77.7260, 'IT park entrance'),
('LOC_004', 'STN_WHITEFIELD', 'DIST_BANGALORE_EAST', 'Marathahalli Junction', 'Hotspot', 12.9592, 77.7010, 'High traffic crime area'),
('LOC_005', 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', 'Koramangala 5th Block', 'Hotspot', 12.9352, 77.6245, 'Residential burglary hotspot');


-- Insert Sample Pending Documents (For ingestion UI testing)
INSERT INTO documents_pending (document_id, fir_number, station_id, district_id, sensitivity, uploaded_by, uploaded_at, status, file_name, file_type, file_size_bytes, file_path, text_content, ocr_done) VALUES
('DOC_PEND_001', 'FIR/2025/KRMGL/0042', 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', 'NORMAL', 'USR_005', '2026-07-01 10:30:00', 'PENDING', 'fir_0042_witness_statement.pdf', 'PDF', 245678, 'documents/pending/DOC_PEND_001/fir_0042_witness_statement.pdf', 'Witness statement: I saw the suspect leaving the building around 8 PM. He was carrying a black bag and wearing a blue jacket.', FALSE),
('DOC_PEND_002', 'FIR/2025/WHTFD/0012', 'STN_WHITEFIELD', 'DIST_BANGALORE_EAST', 'CONFIDENTIAL', 'USR_005', '2026-07-02 14:20:00', 'PENDING', 'fir_0012_medical_report.pdf', 'PDF', 156890, 'documents/pending/DOC_PEND_002/fir_0012_medical_report.pdf', 'Medical examination report: Patient sustained contusions on left arm and minor lacerations. No fractures detected.', FALSE),
('DOC_PEND_003', NULL, 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', 'NORMAL', 'USR_005', '2026-07-03 09:00:00', 'PENDING', 'crime_pattern_analysis_dec2025.docx', 'DOCX', 89234, 'documents/pending/DOC_PEND_003/crime_pattern_analysis_dec2025.docx', 'Crime pattern analysis for December 2025: Increase in burglary cases in Koramangala area, primarily targeting residential apartments.', FALSE);


-- Insert Sample Approved Documents (Already indexed or ready for indexing)
INSERT INTO documents (document_id, fir_number, station_id, district_id, sensitivity, uploaded_by, approved_by, approved_at, indexed, indexed_at, file_name, file_type, file_path, text_content, chunk_count) VALUES
('DOC_001', 'FIR/2025/KRMGL/0038', 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', 'NORMAL', 'USR_005', 'USR_006', '2026-06-25 11:00:00', TRUE, '2026-06-26 03:00:00', 'fir_0038_investigation_notes.pdf', 'PDF', 'documents/approved/DOC_001/fir_0038_investigation_notes.pdf', 'Investigation notes: Suspect identified from CCTV footage. Similar pattern to previous two-wheeler thefts in the area.', 3),
('DOC_002', 'FIR/2025/KRMGL/0051', 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', 'CONFIDENTIAL', 'USR_005', 'USR_006', '2026-06-28 15:30:00', TRUE, '2026-06-29 03:00:00', 'fir_0051_bank_statement.pdf', 'PDF', 'documents/approved/DOC_002/fir_0051_bank_statement.pdf', 'Bank transaction records showing fraudulent transfers to account number XXXX-XXXX-1234.', 5),
('DOC_003', NULL, 'STN_KORAMANGALA', 'DIST_BANGALORE_SOUTH', 'NORMAL', 'USR_005', 'USR_006', '2026-06-30 10:00:00', FALSE, NULL, 'modus_operandi_guide_2025.pdf', 'PDF', 'documents/approved/DOC_003/modus_operandi_guide_2025.pdf', 'Comprehensive guide to common modus operandi in Bangalore South district, including breaking and entering, vehicle theft, and cyber crimes.', 0);


-- Insert Sample Ingestion Audit Records
INSERT INTO ingestion_audit (id, document_id, action, performed_by, details_json, ts) VALUES
('AUD_ING_001', 'DOC_001', 'UPLOADED', 'USR_005', '{"file_size": 245678, "file_type": "PDF"}', '2026-06-24 14:30:00'),
('AUD_ING_002', 'DOC_001', 'APPROVED', 'USR_006', '{"notes": "Verified and approved for indexing"}', '2026-06-25 11:00:00'),
('AUD_ING_003', 'DOC_001', 'INDEXED', 'system_cron', '{"chunk_count": 3, "indexing_time_ms": 1250}', '2026-06-26 03:00:00'),
('AUD_ING_004', 'DOC_002', 'UPLOADED', 'USR_005', '{"file_size": 156890, "file_type": "PDF"}', '2026-06-27 16:45:00'),
('AUD_ING_005', 'DOC_002', 'APPROVED', 'USR_006', '{"notes": "Sensitive document - approved with restricted access"}', '2026-06-28 15:30:00'),
('AUD_ING_006', 'DOC_002', 'INDEXED', 'system_cron', '{"chunk_count": 5, "indexing_time_ms": 2100}', '2026-06-29 03:00:00'),
('AUD_ING_007', 'DOC_PEND_001', 'UPLOADED', 'USR_005', '{"file_size": 245678, "file_type": "PDF"}', '2026-07-01 10:30:00');


-- Insert Sample Audit Logs (Chat interactions)
INSERT INTO audit_logs (id, user_id, query, query_hash, tool_trail_json, citations_json, answer_hash, confidence, mode, language, ts) VALUES
('LOG_001', 'USR_001', 'Show me theft cases in Koramangala in the last month', 'a1b2c3d4e5f6...', '["RAG", "LLM"]', '[{"source": "FIR/2025/KRMGL/0042"}, {"source": "FIR/2025/KRMGL/0038"}]', 'x1y2z3a4b5c6...', 0.89, 'text', 'en', '2026-07-02 10:15:00'),
('LOG_002', 'USR_002', 'Who is Ravi Kumar and what cases is he involved in?', 'b2c3d4e5f6g7...', '["RAG", "LLM"]', '[{"source": "FIR/2025/KRMGL/0042"}, {"source": "FIR/2025/KRMGL/0058"}]', 'y2z3a4b5c6d7...', 0.92, 'text', 'en', '2026-07-02 14:30:00'),
('LOG_003', 'USR_003', 'ಕೊರಮಂಗಲದಲ್ಲಿ ಕಳ್ಳತನ ಪ್ರಕರಣಗಳು', 'c3d4e5f6g7h8...', '["Translation", "RAG", "LLM"]', '[{"source": "FIR/2025/KRMGL/0042"}]', 'z3a4b5c6d7e8...', 0.85, 'text', 'kn', '2026-07-03 09:00:00');


-- Insert Sample Crime Trends (Pre-computed analytics)
INSERT INTO crime_trends (id, district_id, station_id, crime_type, date_bucket, bucket_type, incident_count, computed_at) VALUES
('TREND_001', 'DIST_BANGALORE_SOUTH', 'STN_KORAMANGALA', 'Theft', '2025-11-01', 'MONTHLY', 8, '2025-12-01 03:00:00'),
('TREND_002', 'DIST_BANGALORE_SOUTH', 'STN_KORAMANGALA', 'Cheating', '2025-11-01', 'MONTHLY', 2, '2025-12-01 03:00:00'),
('TREND_003', 'DIST_BANGALORE_EAST', 'STN_WHITEFIELD', 'Theft', '2025-11-01', 'MONTHLY', 3, '2025-12-01 03:00:00'),
('TREND_004', 'DIST_BANGALORE_EAST', 'STN_WHITEFIELD', 'Robbery', '2025-11-01', 'MONTHLY', 1, '2025-12-01 03:00:00'),
('TREND_005', 'DIST_BANGALORE_EAST', 'STN_WHITEFIELD', 'Assault', '2025-11-01', 'MONTHLY', 2, '2025-12-01 03:00:00'),
('TREND_006', 'DIST_BANGALORE_SOUTH', 'STN_KORAMANGALA', 'Theft', '2025-12-01', 'MONTHLY', 5, '2026-01-01 03:00:00'),
('TREND_007', 'DIST_BANGALORE_SOUTH', 'STN_KORAMANGALA', 'Cyber Crime', '2025-12-01', 'MONTHLY', 1, '2026-01-01 03:00:00'),
('TREND_008', 'DIST_BANGALORE_EAST', 'STN_WHITEFIELD', 'Theft', '2025-12-01', 'MONTHLY', 2, '2026-01-01 03:00:00');
