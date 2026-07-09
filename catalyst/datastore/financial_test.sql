-- Financial Test Data for Ibha KSP — TEST ONLY
-- Secondary dump, load after ibha_dump.sql
-- Links to existing multi-accused cases 14,21,29,31
-- Marked as TEST DATA in UI

DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    holder_name VARCHAR(255) NOT NULL,
    bank VARCHAR(100),
    account_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE financial_transactions (
    id SERIAL PRIMARY KEY,
    from_account INT REFERENCES accounts(id),
    to_account INT REFERENCES accounts(id),
    amount DECIMAL(12,2) NOT NULL,
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    case_id INT REFERENCES casemaster(casemasterid) ON DELETE SET NULL,
    flagged BOOLEAN DEFAULT FALSE,
    notes TEXT
);

-- 8 accounts for accused in multi-accused cases
INSERT INTO accounts (holder_name, bank, account_type) VALUES
('Mukesh Singh', 'SBI', 'savings'),
('Suresh Yadav', 'HDFC', 'current'),
('Ramesh Babu', 'ICICI', 'savings'),
('Kumar Swamy', 'SBI', 'savings'),
('Vijay Kumar', 'HDFC', 'current'),
('Ajay Singh', 'Axis', 'savings'),
('Anil Patil', 'SBI', 'current'),
('Dinesh Kumar', 'HDFC', 'savings');

-- Transactions linking to case 14 (Mukesh 1 <-> Suresh 2)
INSERT INTO financial_transactions (from_account, to_account, amount, ts, case_id, flagged, notes) VALUES
(1, 2, 50000.00, '2025-12-01 10:30:00', 14, true, 'Suspicious transfer before burglary - TEST'),
(2, 1, 25000.00, '2025-12-02 14:00:00', 14, true, 'Return transfer - case 14 linked - TEST'),
(1, 2, 12000.00, '2025-11-20 09:00:00', 14, false, 'Regular transfer - TEST');

-- Case 21 (Ramesh 3 <-> Kumar 4)
INSERT INTO financial_transactions (from_account, to_account, amount, ts, case_id, flagged, notes) VALUES
(3, 4, 75000.00, '2025-12-10 11:00:00', 21, true, 'Large cash movement - case 21 - TEST'),
(4, 3, 30000.00, '2025-12-11 16:30:00', 21, true, 'Chain - TEST'),
(3, 4, 5000.00, '2025-11-15 10:00:00', 21, false, 'Small - TEST');

-- Case 29 (Vijay 5 <-> Ajay 6)
INSERT INTO financial_transactions (from_account, to_account, amount, ts, case_id, flagged, notes) VALUES
(5, 6, 100000.00, '2025-12-20 09:00:00', 29, true, 'High value - robbery proceeds suspected - TEST'),
(6, 5, 45000.00, '2025-12-21 10:00:00', 29, true, 'Split - TEST'),
(5, 6, 15000.00, '2025-11-25 13:00:00', 29, false, 'TEST');

-- Case 31 triangle (Anil 7, Dinesh 8, plus Sunil extra account 1 for demo)
INSERT INTO financial_transactions (from_account, to_account, amount, ts, case_id, flagged, notes) VALUES
(7, 8, 60000.00, '2026-01-02 10:00:00', 31, true, 'Triangle 1 - organized - TEST'),
(8, 1, 40000.00, '2026-01-02 11:30:00', 31, true, 'Triangle 2 - TEST'),
(1, 7, 20000.00, '2026-01-02 12:00:00', 31, true, 'Triangle 3 completes cycle - TEST'),
(7, 1, 8000.00, '2025-12-15 09:00:00', 31, false, 'Pre - TEST'),
(8, 7, 15000.00, '2025-12-18 14:00:00', 31, false, 'Pre - TEST');

-- Additional cross-case suspicious links
INSERT INTO financial_transactions (from_account, to_account, amount, ts, case_id, flagged, notes) VALUES
(1, 3, 30000.00, '2025-12-05 10:00:00', 14, true, 'Cross-gang link 14->21 - TEST'),
(5, 7, 55000.00, '2025-12-22 11:00:00', 29, true, 'Cross-gang link 29->31 - TEST'),
(2, 4, 20000.00, '2025-12-08 15:00:00', 14, true, 'Cross - TEST'),
(6, 8, 25000.00, '2025-12-19 16:00:00', 29, false, 'Cross - TEST'),
(3, 5, 18000.00, '2025-12-12 09:30:00', 21, true, 'Cross - TEST');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fin_tx_case ON financial_transactions(case_id);
CREATE INDEX IF NOT EXISTS idx_fin_tx_flagged ON financial_transactions(flagged);
CREATE INDEX IF NOT EXISTS idx_fin_tx_from ON financial_transactions(from_account);
CREATE INDEX IF NOT EXISTS idx_fin_tx_to ON financial_transactions(to_account);
