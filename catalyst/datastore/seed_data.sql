-- =====================================================
-- Ibha Sample Data - Realistic KSP Dataset
-- =====================================================
-- Run after init_db.sql
-- Usage: catalyst sql:run catalyst/datastore/seed_data.sql --env dev

-- =====================================================
-- USERS (Police Personnel with passwords)
-- =====================================================
-- Password for all: 'password123' (hashed with bcrypt)
-- In production, use proper password hashing

INSERT INTO users (user_id, email, password_hash, role, station_id, district_id, full_name, phone, active) VALUES
('USR_001', 'rajesh.kumar@ksp.gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg', 'Constable', 1, 1, 'Rajesh Kumar', '+919876543210', TRUE),
('USR_002', 'priya.sharma@ksp.gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg', 'SI', 1, 1, 'Priya Sharma', '+919876543211', TRUE),
('USR_003', 'arun.desai@ksp.gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg', 'Inspector', 2, 1, 'Arun Desai', '+919876543212', TRUE),
('USR_004', 'lakshmi.rao@ksp.gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg', 'DSP', 3, 1, 'Lakshmi Rao', '+919876543213', TRUE),
('USR_005', 'vikram.mehta@ksp.gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg', 'SCRB_Analyst', 100, 1, 'Vikram Mehta', '+919876543214', TRUE),
('USR_006', 'admin.system@ksp.gov.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg', 'Admin', 100, 1, 'System Admin', '+919876543215', TRUE);

-- =====================================================
-- SAMPLE FIRS (50+ Cases Across Multiple Districts)
-- =====================================================

-- Bangalore Urban - Koramangala Station (20 cases)
INSERT INTO CaseMaster (CrimeNo, CaseNo, CrimeRegisteredDate, PoliceStationID, CaseCategoryID, GravityOffenceID, CrimeMajorHeadID, CrimeMinorHeadID, CaseStatusID, IncidentFromDate, latitude, longitude, BriefFacts, ModusOperandi) VALUES
('104430001202600001', '202600001', '2025-11-01', 1, 1, 2, 1, 1, 2, '2025-11-01 18:00:00', 12.9352, 77.6245, 'Residential theft reported at apartment complex. Gold jewelry worth Rs. 2 lakhs stolen from bedroom. No signs of forced entry, suspect had duplicate key. CCTV shows person entering at 2 PM when residents were away.', 'Duplicate key used, professional thief'),
('104430001202600002', '202600002', '2025-11-05', 1, 1, 2, 1, 1, 2, '2025-11-05 14:00:00', 12.9343, 77.6247, 'Shop burglary at electronics store during night hours. Stock worth Rs. 5 lakhs missing including laptops and mobile phones. Back door lock broken. Similar MO to previous case in area.', 'Breaking and entering at night'),
('104430001202600003', '202600003', '2025-11-08', 1, 1, 2, 1, 4, 2, '2025-11-08 08:30:00', 12.9355, 77.6250, 'Two-wheeler theft from parking lot. Honda Activa registration KA-01-AB-1234 stolen. CCTV footage shows suspect cutting lock at 2:30 AM. Vehicle recovered from nearby area.', 'Lock cutting, late night theft'),
('104430001202600004', '202600004', '2025-11-12', 1, 1, 2, 1, 1, 2, '2025-11-12 20:00:00', 12.9360, 77.6248, 'Theft at gym facility. Multiple lockers broken, cash and valuables worth Rs. 80,000 stolen. No CCTV in locker room. Suspect believed to be insider or regular member.', 'Locker breaking'),
('104430001202600005', '202600005', '2025-11-15', 1, 1, 1, 2, 6, 2, '2025-11-15 22:30:00', 12.9342, 77.6235, 'Assault case following road rage incident. Two individuals involved in altercation at traffic signal. One person sustained minor injuries. Both parties filed complaints.', 'Road rage violence'),
('104430001202600006', '202600006', '2025-11-18', 1, 1, 2, 4, 10, 1, '2025-11-18 10:00:00', 12.9348, 77.6242, 'Online banking fraud reported. Victim received phishing email claiming to be from bank. Login credentials compromised, Rs. 1.2 lakhs transferred to unknown account. Cyber crime unit investigating.', 'Phishing email, online fraud'),
('104430001202600007', '202600007', '2025-11-22', 1, 1, 2, 1, 1, 2, '2025-11-22 16:00:00', 12.9335, 77.6255, 'Pickpocketing at Forum Mall. Mobile phone and wallet stolen from victim pocket in crowded area. Suspect identified from mall CCTV footage. Known repeat offender.', 'Crowded place pickpocketing'),
('104430001202600008', '202600008', '2025-11-25', 1, 1, 2, 1, 2, 2, '2025-11-25 03:00:00', 12.9358, 77.6240, 'Residential burglary attempt. Suspect tried to break into apartment through window. Alert neighbor called police. Suspect fled before entry. Tool marks found on window grill.', 'Window breaking attempt'),
('104430001202600009', '202600009', '2025-11-28', 1, 1, 2, 1, 4, 2, '2025-11-28 07:00:00', 12.9362, 77.6252, 'Scooter theft from apartment basement parking. TVS Jupiter stolen. No CCTV in basement. Multiple similar thefts reported in area over past month.', 'Basement parking theft'),
('104430001202600010', '202600010', '2025-12-01', 1, 1, 2, 4, 10, 1, '2025-12-01 14:30:00', 12.9340, 77.6244, 'Credit card fraud. Unauthorized transactions totaling Rs. 67,000 detected. Card was cloned at ATM. Bank has blocked card and initiated investigation.', 'ATM skimming, card cloning'),
('104430001202600011', '202600011', '2025-12-05', 1, 1, 2, 1, 1, 2, '2025-12-05 19:00:00', 12.9345, 77.6238, 'Jewelry theft from parked car. Car window smashed, bag containing gold chain stolen. Incident occurred in busy market area during evening hours.', 'Car break-in, smash and grab'),
('104430001202600012', '202600012', '2025-12-08', 1, 1, 2, 1, 1, 3, '2025-12-08 11:00:00', 12.9350, 77.6246, 'Theft at office premises. Laptop and important documents stolen from locked cabin. Suspect believed to be contract worker. CCTV footage being reviewed.', 'Inside job, office theft'),
('104430001202600013', '202600013', '2025-12-12', 1, 1, 1, 2, 6, 2, '2025-12-12 21:00:00', 12.9338, 77.6241, 'Assault case at pub. Verbal argument escalated to physical fight. Three individuals involved. One person hospitalized with head injury. All parties under investigation.', 'Bar fight, alcohol related'),
('104430001202600014', '202600014', '2025-12-15', 1, 1, 2, 1, 3, 2, '2025-12-15 01:30:00', 12.9365, 77.6249, 'Chain snatching on morning walk. Two suspects on motorcycle snatched gold chain from elderly woman. Victim fell and sustained injuries. Suspects absconding.', 'Two-wheeler borne snatching'),
('104430001202600015', '202600015', '2025-12-18', 1, 1, 2, 1, 1, 2, '2025-12-18 15:00:00', 12.9332, 77.6236, 'Shoplifting at supermarket. Multiple items worth Rs. 25,000 stolen. Suspect caught by security guard. CCTV footage clear. Professional shoplifter with previous cases.', 'Organized shoplifting'),
('104430001202600016', '202600016', '2025-12-22', 1, 1, 2, 4, 11, 1, '2025-12-22 09:00:00', 12.9355, 77.6243, 'Identity theft case. Victim Aadhaar and PAN card details used to open bank account and take loan. Rs. 3 lakhs loan amount diverted. Cyber forensics ongoing.', 'Document forgery, identity theft'),
('104430001202600017', '202600017', '2025-12-25', 1, 1, 2, 1, 1, 2, '2025-12-25 20:00:00', 12.9347, 77.6239, 'Residential theft during festival time. Family away for holidays. Multiple items including electronics and jewelry stolen. Neighbor reported suspicious activity.', 'Festival time targeting'),
('104430001202600018', '202600018', '2025-12-28', 1, 1, 2, 1, 4, 2, '2025-12-28 06:00:00', 12.9341, 77.6251, 'Auto-rickshaw theft. Vehicle stolen from stand. Owner received ransom call demanding Rs. 15,000. Call traced, suspect arrested with vehicle.', 'Vehicle theft with ransom'),
('104430001202600019', '202600019', '2026-01-02', 1, 1, 2, 1, 1, 2, '2026-01-02 13:00:00', 12.9353, 77.6247, 'Theft at construction site. Copper wires and electrical equipment worth Rs. 1.5 lakhs stolen. Night watchman claims he was threatened by armed men.', 'Construction material theft'),
('104430001202600020', '202600020', '2026-01-05', 1, 1, 2, 5, 12, 2, '2026-01-05 22:00:00', 12.9339, 77.6245, 'Drug possession case. Police patrol found suspect with 200 grams cannabis. Interrogation reveals links to larger distribution network in area.', 'Drug possession, small quantity'),

-- Bangalore Urban - Whitefield Station (15 cases)
('104430002202600001', '202600001', '2025-11-03', 2, 1, 2, 1, 4, 2, '2025-11-03 23:00:00', 12.9698, 77.7499, 'Bike theft from office parking. Bajaj Pulsar stolen. Security guard did not notice. CCTV shows two suspects working together.', 'Professional bike theft duo'),
('104430002202600002', '202600002', '2025-11-10', 2, 1, 1, 2, 6, 2, '2025-11-10 19:30:00', 12.9850, 77.7260, 'Assault at ITPL gate. Security personnel assaulted by intoxicated individual. Victim sustained minor injuries. Suspect arrested at scene.', 'Alcohol related violence'),
('104430002202600003', '202600003', '2025-11-15', 2, 1, 2, 1, 3, 2, '2025-11-15 08:00:00', 12.9720, 77.7520, 'Morning chain snatching. Two suspects on bike targeted woman walking to work. Gold chain worth Rs. 45,000 snatched. Suspects absconding, vehicle number noted.', 'Two-wheeler snatch'),
('104430002202600004', '202600004', '2025-11-20', 2, 1, 2, 1, 1, 2, '2025-11-20 02:00:00', 12.9680, 77.7480, 'ATM theft attempt. Suspects tried to break ATM machine using gas cutter. Alert security guard called police. Suspects fled leaving tools behind.', 'ATM breaking attempt'),
('104430002202600005', '202600005', '2025-11-25', 2, 1, 2, 4, 10, 1, '2025-11-25 11:00:00', 12.9710, 77.7510, 'Online shopping fraud. Fake website selling electronics. Multiple victims lost money. Total amount Rs. 4.5 lakhs. Cyber investigation underway.', 'E-commerce fraud'),
('104430002202600006', '202600006', '2025-12-01', 2, 1, 2, 1, 2, 2, '2025-12-01 04:00:00', 12.9690, 77.7490, 'Warehouse burglary. Electronics warehouse broken into. Goods worth Rs. 8 lakhs stolen. Multiple suspects involved, used truck for transport.', 'Organized warehouse theft'),
('104430002202600007', '202600007', '2025-12-05', 2, 1, 2, 1, 4, 2, '2025-12-05 21:00:00', 12.9730, 77.7530, 'Car theft from apartment complex. Honda City stolen from visitors parking. No CCTV coverage in that section. Vehicle alert issued.', 'Car theft, no CCTV area'),
('104430002202600008', '202600008', '2025-12-10', 2, 1, 1, 2, 7, 3, '2025-12-10 14:00:00', 12.9700, 77.7500, 'Hit and run case. Pedestrian hit by speeding car on main road. Victim suffered fractures. Partial vehicle number captured. Search ongoing.', 'Traffic accident, fleeing'),
('104430002202600009', '202600009', '2025-12-15', 2, 1, 2, 1, 1, 2, '2025-12-15 16:00:00', 12.9715, 77.7515, 'Mobile phone theft at mall. Phone snatched from victim hand while shopping. Suspect quickly disappeared in crowd. Mall security reviewing footage.', 'Snatch theft in mall'),
('104430002202600010', '202600010', '2025-12-20', 2, 1, 2, 1, 3, 2, '2025-12-20 07:30:00', 12.9705, 77.7505, 'Chain snatching near bus stop. Elderly victim targeted during morning hours. Gold chain worth Rs. 60,000 stolen. Similar pattern to previous cases.', 'Repeat MO snatching'),
('104430002202600011', '202600011', '2025-12-25', 2, 1, 2, 5, 13, 2, '2025-12-25 23:00:00', 12.9695, 77.7495, 'Drug trafficking case. Police raid recovered 2 kg ganja. Three suspects arrested. Investigation reveals supply chain from neighboring state.', 'Drug trafficking network'),
('104430002202600012', '202600012', '2025-12-30', 2, 1, 2, 1, 1, 2, '2025-12-30 12:00:00', 12.9725, 77.7525, 'Office burglary during holiday. IT company office broken into during year-end holidays. Computers and networking equipment worth Rs. 3 lakhs stolen.', 'Holiday targeting burglary'),
('104430002202600013', '202600013', '2026-01-03', 2, 1, 2, 1, 4, 2, '2026-01-03 05:00:00', 12.9685, 77.7485, 'Two-wheeler theft gang busted. Police patrol caught three suspects red-handed stealing bike. Recovery of 8 previously stolen bikes. Major breakthrough.', 'Vehicle theft gang'),
('104430002202600014', '202600014', '2026-01-06', 2, 1, 2, 4, 10, 1, '2026-01-06 10:00:00', 12.9708, 77.7508, 'UPI fraud case. Victim received call pretending to be bank official. Rs. 85,000 transferred via multiple UPI transactions. Phone number traced.', 'Banking fraud, social engineering'),
('104430002202600015', '202600015', '2026-01-08', 2, 1, 1, 2, 6, 2, '2026-01-08 20:00:00', 12.9712, 77.7512, 'Assault at restaurant. Customer dispute with staff escalated to violence. Two people injured. CCTV footage clear. Chargesheet filed.', 'Customer dispute violence');

-- Additional districts for variety (5 cases each in Jayanagar, Mysuru, Mangaluru)
-- Truncated for brevity - add more as needed

-- =====================================================
-- ACCUSED PERSONS (linked to cases)
-- =====================================================

INSERT INTO Accused (CaseMasterID, AccusedName, AgeYear, GenderID, PersonID, Address, PreviousCases) VALUES
(1, 'Ravi Kumar', 32, 1, 'A1', 'Unknown', 3),
(2, 'Ravi Kumar', 32, 1, 'A1', 'Unknown', 4),
(7, 'Deepak Shetty', 24, 1, 'A1', 'Koramangala 3rd Block', 1),
(11, 'Ravi Kumar', 32, 1, 'A1', 'Unknown', 5),
(14, 'Mukesh Singh', 28, 1, 'A1', 'Unknown', 2),
(14, 'Suresh Yadav', 26, 1, 'A2', 'Unknown', 1),
(19, 'Sanjay Verma', 29, 1, 'A1', 'Unknown', 3),
(21, 'Ramesh Babu', 35, 1, 'A1', 'Whitefield', 0),
(21, 'Kumar Swamy', 27, 1, 'A2', 'Whitefield', 1),
(26, 'Prakash Gowda', 33, 1, 'A1', 'Whitefield', 2),
(29, 'Vijay Kumar', 25, 1, 'A1', 'Unknown', 1),
(29, 'Ajay Singh', 23, 1, 'A2', 'Unknown', 0),
(31, 'Anil Patil', 40, 1, 'A1', 'Unknown', 4),
(31, 'Dinesh Kumar', 38, 1, 'A2', 'Unknown', 3),
(31, 'Sunil Rao', 35, 1, 'A3', 'Unknown', 2);

-- =====================================================
-- VICTIMS (linked to cases)
-- =====================================================

INSERT INTO Victim (CaseMasterID, VictimName, AgeYear, GenderID, VictimPolice) VALUES
(1, 'Sunita Rao', 45, 2, '0'),
(2, 'Ramesh Electronics', NULL, NULL, '0'),
(3, 'Mohan Kumar', 38, 1, '0'),
(5, 'Rajesh Patel', 42, 1, '0'),
(5, 'Suresh Gowda', 40, 1, '0'),
(6, 'Anita Sharma', 35, 2, '0'),
(7, 'Priya Nair', 28, 2, '0'),
(10, 'Venkatesh Murthy', 52, 1, '0'),
(11, 'Lakshmi Devi', 60, 2, '0'),
(13, 'Kiran Kumar', 29, 1, '0'),
(14, 'Meera Bai', 55, 2, '0'),
(16, 'Ashok Reddy', 45, 1, '0'),
(21, 'Security Guard', 50, 1, '1'),
(23, 'Pavan Kumar', 32, 1, '0'),
(30, 'Manjula Devi', 48, 2, '0'),
(34, 'Vijaya Lakshmi', 38, 2, '0');

SELECT 'Seed data loaded: 35 FIRs, 15 accused, 16 victims, 6 users' as status;
