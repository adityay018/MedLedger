-- ============================================================================
-- SCRIPT: 04_insert_data.sql
-- PROJECT: MedLedger DBMS - University DA2 Project
-- PURPOSE: Insert realistic, consistent synthetic pharmaceutical data across
--          all 13 tables matching all foreign keys and constraints.
-- COMPATIBILITY: Oracle 21c / Oracle XE / Oracle SQL Developer
-- ============================================================================

PROMPT ===================================================;
PROMPT Populating MedLedger Synthetic Data...;
PROMPT ===================================================;

-- ----------------------------------------------------------------------------
-- 1. PARTY (Superclass - 16 records)
-- ----------------------------------------------------------------------------
INSERT INTO PARTY (party_id, party_name, address, phone, email) VALUES
(1, 'Pfizer Global Supply', '235 E 42nd St, New York, NY 10017, USA', '+1-212-733-2323', 'supply.chain@pfizer.com');
INSERT INTO PARTY (party_id, party_name, address, phone, email) VALUES
(2, 'Novartis BioPharma AG', 'Lichtstrasse 35, 4056 Basel, Switzerland', '+41-61-324-1111', 'logistics@novartis.com');
INSERT INTO PARTY (party_id, party_name, address, phone, email) VALUES
(3, 'Sun Pharma Laboratories Ltd', 'Sun House, Goregaon East, Mumbai 400063, India', '+91-22-4324-4324', 'qa.batch@sunpharma.com');
INSERT INTO PARTY (party_id, party_name, address, phone, email) VALUES
(4, 'Cipla Life Sciences', 'Cipla House, Peninsula Business Park, Mumbai 400013, India', '+91-22-2482-6000', 'regulatory@cipla.com');

INSERT INTO PARTY (party_id, party_name, address, phone, email) VALUES
(5, 'AmerisourceBergen Logistics', '1 W First Ave, Conshohocken, PA 19428, USA', '+1-800-829-3132', 'ops@amerisourcebergen.com');
INSERT INTO PARTY (party_id, party_name, address, phone, email) VALUES
(6, 'McKesson Cold Chain Supply', '6555 State Hwy 161, Irving, TX 75039, USA', '+1-972-446-4000', 'dispatch@mckesson.com');
INSERT INTO PARTY (party_id, party_name, address, phone, email) VALUES
(7, 'Cardinal Health Logistics', '7000 Cardinal Pl, Dublin, OH 43017, USA', '+1-614-757-5000', 'freight@cardinalhealth.com');
INSERT INTO PARTY (party_id, party_name, address, phone, email) VALUES
(8, 'Apollo MedSupply Distribution', 'Ali Towers, Greams Rd, Chennai 600006, India', '+91-44-2829-0200', 'distro@apollomedsupply.in');

INSERT INTO PARTY (party_id, party_name, address, phone, email) VALUES
(9, 'CVS Health Pharmacy #104', 'One CVS Dr, Woonsocket, RI 02895, USA', '+1-401-765-1500', 'rx104@cvshealth.com');
INSERT INTO PARTY (party_id, party_name, address, phone, email) VALUES
(10, 'Walgreens MediCare Center', '108 Wilmot Rd, Deerfield, IL 60015, USA', '+1-847-914-2500', 'pharmacy@walgreens.com');
INSERT INTO PARTY (party_id, party_name, address, phone, email) VALUES
(11, 'Apollo Central Pharmacy', '21 Greams Lane, Thousand Lights, Chennai 600006, India', '+91-44-2829-3333', 'rx.central@apollo.in');
INSERT INTO PARTY (party_id, party_name, address, phone, email) VALUES
(12, 'Boots Healthcare Dispensing', '1 Thane Rd, Nottingham NG90 1BS, UK', '+44-115-950-6111', 'dispensing@boots.co.uk');
INSERT INTO PARTY (party_id, party_name, address, phone, email) VALUES
(13, 'MedPlus Clinical Pharmacy', 'Hitech City Main Rd, Hyderabad 500081, India', '+91-40-6700-6700', 'support@medplusindia.com');

INSERT INTO PARTY (party_id, party_name, address, phone, email) VALUES
(14, 'US Food & Drug Administration (FDA)', '10903 New Hampshire Ave, Silver Spring, MD 20993, USA', '+1-888-463-6332', 'cdersupply@fda.gov');
INSERT INTO PARTY (party_id, party_name, address, phone, email) VALUES
(15, 'European Medicines Agency (EMA)', 'Domenico Scarlattilaan 6, 1083 HS Amsterdam, Netherlands', '+31-88-781-6000', 'vigilance@ema.europa.eu');
INSERT INTO PARTY (party_id, party_name, address, phone, email) VALUES
(16, 'CDSCO National Drug Authority', 'FDA Bhawan, Kotla Rd, New Delhi 110002, India', '+91-11-2323-6975', 'dci@cdsco.nic.in');

-- ----------------------------------------------------------------------------
-- 2. MANUFACTURER (4 records)
-- ----------------------------------------------------------------------------
INSERT INTO MANUFACTURER (party_id, manufacturing_license_no) VALUES (1, 'MFG-USA-FDA-2018-0912');
INSERT INTO MANUFACTURER (party_id, manufacturing_license_no) VALUES (2, 'MFG-CHE-SWISS-2019-3814');
INSERT INTO MANUFACTURER (party_id, manufacturing_license_no) VALUES (3, 'MFG-IND-CDSCO-2017-7741');
INSERT INTO MANUFACTURER (party_id, manufacturing_license_no) VALUES (4, 'MFG-IND-CDSCO-2020-1192');

-- ----------------------------------------------------------------------------
-- 3. DISTRIBUTOR (4 records)
-- ----------------------------------------------------------------------------
INSERT INTO DISTRIBUTOR (party_id, distributor_license_no) VALUES (5, 'DST-USA-DEA-90812');
INSERT INTO DISTRIBUTOR (party_id, distributor_license_no) VALUES (6, 'DST-USA-DEA-65521');
INSERT INTO DISTRIBUTOR (party_id, distributor_license_no) VALUES (7, 'DST-USA-DEA-33419');
INSERT INTO DISTRIBUTOR (party_id, distributor_license_no) VALUES (8, 'DST-IND-STATE-88120');

-- ----------------------------------------------------------------------------
-- 4. PHARMACY (5 records)
-- ----------------------------------------------------------------------------
INSERT INTO PHARMACY (party_id, pharmacy_license_no, hq) VALUES (9, 'PHM-USA-RI-4401', 'Rhode Island Corporate HQ');
INSERT INTO PHARMACY (party_id, pharmacy_license_no, hq) VALUES (10, 'PHM-USA-IL-8910', 'Illinois Operations HQ');
INSERT INTO PHARMACY (party_id, pharmacy_license_no, hq) VALUES (11, 'PHM-IND-TN-6120', 'Apollo Chennai Regional HQ');
INSERT INTO PHARMACY (party_id, pharmacy_license_no, hq) VALUES (12, 'PHM-GBR-ENG-1198', 'Nottingham UK HQ');
INSERT INTO PHARMACY (party_id, pharmacy_license_no, hq) VALUES (13, 'PHM-IND-TS-5541', 'Hyderabad Central Operations HQ');

-- ----------------------------------------------------------------------------
-- 5. REGULATOR (3 records)
-- ----------------------------------------------------------------------------
INSERT INTO REGULATOR (party_id, regulator_code) VALUES (14, 'REG-FDA-USA-001');
INSERT INTO REGULATOR (party_id, regulator_code) VALUES (15, 'REG-EMA-EU-002');
INSERT INTO REGULATOR (party_id, regulator_code) VALUES (16, 'REG-CDSCO-IND-003');

-- ----------------------------------------------------------------------------
-- 6. DRUG (12 records)
-- ----------------------------------------------------------------------------
INSERT INTO DRUG (drug_id, drug_name, description, strength, dosage_form) VALUES
(101, 'Remdesivir (Veklury)', 'Broad-spectrum antiviral nucleotide analog for viral RNA polymerase inhibition.', '100mg', 'Lyophilized Powder for Injection');
INSERT INTO DRUG (drug_id, drug_name, description, strength, dosage_form) VALUES
(102, 'Amoxicillin Trihydrate', 'Beta-lactam antibiotic treating bacterial ear, nose, throat and chest infections.', '500mg', 'Oral Capsule');
INSERT INTO DRUG (drug_id, drug_name, description, strength, dosage_form) VALUES
(103, 'Paracetamol (Acetaminophen)', 'Analgesic and antipyretic medication used for mild to moderate pain and fever.', '650mg', 'Film-Coated Tablet');
INSERT INTO DRUG (drug_id, drug_name, description, strength, dosage_form) VALUES
(104, 'Lipitor (Atorvastatin)', 'HMG-CoA reductase inhibitor for cardiovascular risk reduction and hyperlipidemia.', '20mg', 'Film-Coated Tablet');
INSERT INTO DRUG (drug_id, drug_name, description, strength, dosage_form) VALUES
(105, 'Paxlovid (Nirmatrelvir/Ritonavir)', 'SARS-CoV-2 main protease (Mpro) inhibitor co-packaged with ritonavir booster.', '300mg/100mg', 'Co-packaged Tablets');
INSERT INTO DRUG (drug_id, drug_name, description, strength, dosage_form) VALUES
(106, 'Lantus (Insulin Glargine)', 'Long-acting basal human insulin analogue for glycemic control in diabetes mellitus.', '100 units/mL', 'Subcutaneous Injection Pen');
INSERT INTO DRUG (drug_id, drug_name, description, strength, dosage_form) VALUES
(107, 'Azithromycin Monohydrate', 'Macrolide antibacterial preventing bacterial protein synthesis via 50S subunit.', '250mg', 'Film-Coated Tablet');
INSERT INTO DRUG (drug_id, drug_name, description, strength, dosage_form) VALUES
(108, 'Metformin Hydrochloride', 'Biguanide antihyperglycemic agent reducing hepatic glucose output.', '850mg', 'Extended-Release Tablet');
INSERT INTO DRUG (drug_id, drug_name, description, strength, dosage_form) VALUES
(109, 'Omeprazole Magnesium', 'Proton pump inhibitor suppressing gastric acid secretion via H+/K+ ATPase.', '40mg', 'Delayed-Release Capsule');
INSERT INTO DRUG (drug_id, drug_name, description, strength, dosage_form) VALUES
(110, 'Ciprofloxacin Hydrochloride', 'Fluoroquinolone antibiotic targeting bacterial DNA gyrase and topoisomerase IV.', '500mg', 'Coated Tablet');
INSERT INTO DRUG (drug_id, drug_name, description, strength, dosage_form) VALUES
(111, 'Dexamethasone Sodium Phosphate', 'Potent systemic corticosteroid with glucocorticoid and anti-inflammatory activity.', '4mg/mL', 'Injectable Solution');
INSERT INTO DRUG (drug_id, drug_name, description, strength, dosage_form) VALUES
(112, 'Montelukast Sodium', 'Selective leukotriene receptor antagonist for prophylaxis of chronic asthma.', '10mg', 'Chewable Tablet');

-- ----------------------------------------------------------------------------
-- 7. RECALL (4 records)
-- ----------------------------------------------------------------------------
INSERT INTO RECALL (recall_id, recall_date, status, reason) VALUES
(501, TO_DATE('2026-01-15', 'YYYY-MM-DD'), 'ACTIVE', 'Sub-potent active pharmaceutical ingredient (API) detected during ongoing 12-month stability trial.');
INSERT INTO RECALL (recall_id, recall_date, status, reason) VALUES
(502, TO_DATE('2026-02-10', 'YYYY-MM-DD'), 'ACTIVE', 'Microscopic glass particulate delamination detected in glass ampoules of injection lot.');
INSERT INTO RECALL (recall_id, recall_date, status, reason) VALUES
(503, TO_DATE('2026-02-28', 'YYYY-MM-DD'), 'COMPLETED', 'Secondary outer-carton labeling omission regarding pediatric dosing contraindications.');
INSERT INTO RECALL (recall_id, recall_date, status, reason) VALUES
(504, TO_DATE('2026-03-20', 'YYYY-MM-DD'), 'INVESTIGATING', 'Cold-chain excursion alert triggered by IoT data logger exceeding 8 deg C for 48 hours.');

-- ----------------------------------------------------------------------------
-- 8. BATCH (18 records)
-- ----------------------------------------------------------------------------
INSERT INTO BATCH (batch_id, drug_id, manufacturer_id, recall_id, batch_status, manufacture_date) VALUES
(201, 101, 1, 502, 'RECALLED', TO_DATE('2025-11-10', 'YYYY-MM-DD'));
INSERT INTO BATCH (batch_id, drug_id, manufacturer_id, recall_id, batch_status, manufacture_date) VALUES
(202, 101, 1, NULL, 'RELEASED', TO_DATE('2026-01-05', 'YYYY-MM-DD'));
INSERT INTO BATCH (batch_id, drug_id, manufacturer_id, recall_id, batch_status, manufacture_date) VALUES
(203, 102, 3, NULL, 'RELEASED', TO_DATE('2026-01-12', 'YYYY-MM-DD'));
INSERT INTO BATCH (batch_id, drug_id, manufacturer_id, recall_id, batch_status, manufacture_date) VALUES
(204, 102, 4, 501, 'RECALLED', TO_DATE('2025-12-02', 'YYYY-MM-DD'));
INSERT INTO BATCH (batch_id, drug_id, manufacturer_id, recall_id, batch_status, manufacture_date) VALUES
(205, 103, 3, NULL, 'RELEASED', TO_DATE('2026-01-20', 'YYYY-MM-DD'));
INSERT INTO BATCH (batch_id, drug_id, manufacturer_id, recall_id, batch_status, manufacture_date) VALUES
(206, 103, 4, NULL, 'RELEASED', TO_DATE('2026-02-01', 'YYYY-MM-DD'));
INSERT INTO BATCH (batch_id, drug_id, manufacturer_id, recall_id, batch_status, manufacture_date) VALUES
(207, 104, 1, NULL, 'RELEASED', TO_DATE('2026-01-18', 'YYYY-MM-DD'));
INSERT INTO BATCH (batch_id, drug_id, manufacturer_id, recall_id, batch_status, manufacture_date) VALUES
(208, 105, 1, NULL, 'IN_TRANSIT', TO_DATE('2026-02-15', 'YYYY-MM-DD'));
INSERT INTO BATCH (batch_id, drug_id, manufacturer_id, recall_id, batch_status, manufacture_date) VALUES
(209, 106, 2, 504, 'QUARANTINED', TO_DATE('2026-02-10', 'YYYY-MM-DD'));
INSERT INTO BATCH (batch_id, drug_id, manufacturer_id, recall_id, batch_status, manufacture_date) VALUES
(210, 106, 2, NULL, 'RELEASED', TO_DATE('2026-02-25', 'YYYY-MM-DD'));
INSERT INTO BATCH (batch_id, drug_id, manufacturer_id, recall_id, batch_status, manufacture_date) VALUES
(211, 107, 4, NULL, 'RELEASED', TO_DATE('2026-01-25', 'YYYY-MM-DD'));
INSERT INTO BATCH (batch_id, drug_id, manufacturer_id, recall_id, batch_status, manufacture_date) VALUES
(212, 108, 3, NULL, 'RELEASED', TO_DATE('2026-02-05', 'YYYY-MM-DD'));
INSERT INTO BATCH (batch_id, drug_id, manufacturer_id, recall_id, batch_status, manufacture_date) VALUES
(213, 109, 2, NULL, 'RELEASED', TO_DATE('2026-02-12', 'YYYY-MM-DD'));
INSERT INTO BATCH (batch_id, drug_id, manufacturer_id, recall_id, batch_status, manufacture_date) VALUES
(214, 110, 4, NULL, 'RELEASED', TO_DATE('2026-02-18', 'YYYY-MM-DD'));
INSERT INTO BATCH (batch_id, drug_id, manufacturer_id, recall_id, batch_status, manufacture_date) VALUES
(215, 111, 2, NULL, 'RELEASED', TO_DATE('2026-01-30', 'YYYY-MM-DD'));
INSERT INTO BATCH (batch_id, drug_id, manufacturer_id, recall_id, batch_status, manufacture_date) VALUES
(216, 112, 3, NULL, 'RELEASED', TO_DATE('2026-02-22', 'YYYY-MM-DD'));
INSERT INTO BATCH (batch_id, drug_id, manufacturer_id, recall_id, batch_status, manufacture_date) VALUES
(217, 105, 1, NULL, 'RELEASED', TO_DATE('2026-03-01', 'YYYY-MM-DD'));
INSERT INTO BATCH (batch_id, drug_id, manufacturer_id, recall_id, batch_status, manufacture_date) VALUES
(218, 102, 3, 503, 'RECALLED', TO_DATE('2025-10-14', 'YYYY-MM-DD'));

-- ----------------------------------------------------------------------------
-- 9. QUALITY_TEST (24 records)
-- ----------------------------------------------------------------------------
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(301, 201, TO_DATE('2025-11-15', 'YYYY-MM-DD'), 'HPLC Assay', '99.4% API Potency', 'PASSED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(302, 201, TO_DATE('2026-02-08', 'YYYY-MM-DD'), 'Particulate Inspection', 'Observed glass micro-flakes > 10um', 'FAILED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(303, 202, TO_DATE('2026-01-08', 'YYYY-MM-DD'), 'HPLC Assay', '99.9% API Potency', 'PASSED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(304, 202, TO_DATE('2026-01-09', 'YYYY-MM-DD'), 'Sterility Test (USP 71)', 'No microbial growth after 14 days', 'PASSED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(305, 203, TO_DATE('2026-01-15', 'YYYY-MM-DD'), 'Dissolution Profile', '88% dissolved in 30 mins', 'PASSED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(306, 204, TO_DATE('2025-12-05', 'YYYY-MM-DD'), 'HPLC Assay', '82.1% API Potency (Sub-potent)', 'FAILED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(307, 204, TO_DATE('2025-12-06', 'YYYY-MM-DD'), 'Content Uniformity', 'Relative Standard Deviation > 6.8%', 'FAILED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(308, 205, TO_DATE('2026-01-22', 'YYYY-MM-DD'), 'HPLC Assay', '100.2% Purity Verified', 'PASSED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(309, 206, TO_DATE('2026-02-03', 'YYYY-MM-DD'), 'Friability Test', 'Weight loss 0.12% (< 1.0% limit)', 'PASSED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(310, 207, TO_DATE('2026-01-21', 'YYYY-MM-DD'), 'Related Substances', 'Total impurities < 0.25%', 'PASSED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(311, 208, TO_DATE('2026-02-18', 'YYYY-MM-DD'), 'HPLC Assay', '99.8% Nirmatrelvir / Ritonavir', 'PASSED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(312, 209, TO_DATE('2026-02-12', 'YYYY-MM-DD'), 'Bio-Identity Test', 'Molecular weight confirmed 6063 Da', 'PASSED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(313, 209, TO_DATE('2026-03-19', 'YYYY-MM-DD'), 'Thermal Stability Audit', 'Cold chain breach detected (+11 C)', 'FAILED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(314, 210, TO_DATE('2026-02-27', 'YYYY-MM-DD'), 'Bacterial Endotoxins', '< 0.05 EU/mL', 'PASSED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(315, 211, TO_DATE('2026-01-28', 'YYYY-MM-DD'), 'Microbial Enumeration', '< 10 CFU/g (TAMC)', 'PASSED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(316, 212, TO_DATE('2026-02-08', 'YYYY-MM-DD'), 'Dissolution Profile', 'Extended release rate within specs', 'PASSED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(317, 213, TO_DATE('2026-02-15', 'YYYY-MM-DD'), 'Acid Resistance Test', '< 5% release in 0.1N HCl buffer', 'PASSED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(318, 214, TO_DATE('2026-02-20', 'YYYY-MM-DD'), 'Chromatographic Purity', 'Pure ciprofloxacin peak confirmed', 'PASSED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(319, 215, TO_DATE('2026-02-02', 'YYYY-MM-DD'), 'pH Determination', 'pH 7.82 (Acceptance 7.0 - 8.5)', 'PASSED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(320, 216, TO_DATE('2026-02-25', 'YYYY-MM-DD'), 'Heavy Metal Screen', '< 10 ppm lead equivalent', 'PASSED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(321, 217, TO_DATE('2026-03-03', 'YYYY-MM-DD'), 'Moisture Content', 'Loss on drying 1.8% (Target < 3%)', 'PASSED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(322, 218, TO_DATE('2025-10-18', 'YYYY-MM-DD'), 'Carton Inspection', 'Dosing instruction label misplaced', 'FAILED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(323, 208, TO_DATE('2026-02-20', 'YYYY-MM-DD'), 'Disintegration Test', 'Completely dissolved in 4 mins', 'PASSED');
INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status) VALUES
(324, 210, TO_DATE('2026-03-01', 'YYYY-MM-DD'), 'High Molecular Weight Protein', 'Dimer content < 0.15%', 'PENDING');

-- ----------------------------------------------------------------------------
-- 10. DISPENSING (12 records)
-- ----------------------------------------------------------------------------
INSERT INTO DISPENSING (dispense_id, pharmacy_id, dispensed_at, patient_id, quantity, remarks) VALUES
(601, 9, TO_DATE('2026-02-12', 'YYYY-MM-DD'), 'PAT-8812', 2, 'Dispensed against e-Prescription #RX-9912. Verified patient identity.');
INSERT INTO DISPENSING (dispense_id, pharmacy_id, dispensed_at, patient_id, quantity, remarks) VALUES
(602, 9, TO_DATE('2026-02-15', 'YYYY-MM-DD'), 'PAT-4402', 1, 'Prescribed for post-op treatment. Batch verified authentic on MedLedger.');
INSERT INTO DISPENSING (dispense_id, pharmacy_id, dispensed_at, patient_id, quantity, remarks) VALUES
(603, 10, TO_DATE('2026-02-20', 'YYYY-MM-DD'), 'PAT-1934', 1, 'Emergency care dispensing. Patient counselled on dosage schedule.');
INSERT INTO DISPENSING (dispense_id, pharmacy_id, dispensed_at, patient_id, quantity, remarks) VALUES
(604, 10, TO_DATE('2026-02-24', 'YYYY-MM-DD'), 'PAT-7719', 3, 'Regular monthly maintenance prescription filled.');
INSERT INTO DISPENSING (dispense_id, pharmacy_id, dispensed_at, patient_id, quantity, remarks) VALUES
(605, 11, TO_DATE('2026-02-28', 'YYYY-MM-DD'), 'PAT-6612', 2, 'Doctor prescription checked. QR code scanned prior to handover.');
INSERT INTO DISPENSING (dispense_id, pharmacy_id, dispensed_at, patient_id, quantity, remarks) VALUES
(606, 11, TO_DATE('2026-03-02', 'YYYY-MM-DD'), 'PAT-3329', 1, 'Dispensed under national health insurance scheme.');
INSERT INTO DISPENSING (dispense_id, pharmacy_id, dispensed_at, patient_id, quantity, remarks) VALUES
(607, 12, TO_DATE('2026-03-05', 'YYYY-MM-DD'), 'PAT-9011', 2, 'Patient reported allergic history; verified non-reactive excipients.');
INSERT INTO DISPENSING (dispense_id, pharmacy_id, dispensed_at, patient_id, quantity, remarks) VALUES
(608, 12, TO_DATE('2026-03-08', 'YYYY-MM-DD'), 'PAT-5544', 1, 'Repeat prescription dispensed. Digital sign-off complete.');
INSERT INTO DISPENSING (dispense_id, pharmacy_id, dispensed_at, patient_id, quantity, remarks) VALUES
(609, 13, TO_DATE('2026-03-10', 'YYYY-MM-DD'), 'PAT-2210', 4, 'Chronic cardiovascular therapy refill for 60-day supply.');
INSERT INTO DISPENSING (dispense_id, pharmacy_id, dispensed_at, patient_id, quantity, remarks) VALUES
(610, 13, TO_DATE('2026-03-12', 'YYYY-MM-DD'), 'PAT-8841', 1, 'Outpatient clinical dispensing.');
INSERT INTO DISPENSING (dispense_id, pharmacy_id, dispensed_at, patient_id, quantity, remarks) VALUES
(611, 11, TO_DATE('2026-03-15', 'YYYY-MM-DD'), 'PAT-7023', 2, 'Diabetic management kit dispensed along with glucose logbook.');
INSERT INTO DISPENSING (dispense_id, pharmacy_id, dispensed_at, patient_id, quantity, remarks) VALUES
(612, 9, TO_DATE('2026-03-18', 'YYYY-MM-DD'), 'PAT-1190', 1, 'Specialist antimicrobial prescription.');

-- ----------------------------------------------------------------------------
-- 11. PACKAGE (32 records)
-- ----------------------------------------------------------------------------
-- Packages 401-404: Belong to Recalled Batch 201
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(401, 201, NULL, '10 Vials / Box', TO_DATE('2025-11-12', 'YYYY-MM-DD'), 'QR-MED-201-01-A1', 'RECALLED', 10);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(402, 201, NULL, '10 Vials / Box', TO_DATE('2025-11-12', 'YYYY-MM-DD'), 'QR-MED-201-02-A2', 'RECALLED', 10);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(403, 201, NULL, '10 Vials / Box', TO_DATE('2025-11-12', 'YYYY-MM-DD'), 'QR-MED-201-03-A3', 'RECALLED', 10);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(404, 201, NULL, '10 Vials / Box', TO_DATE('2025-11-12', 'YYYY-MM-DD'), 'QR-MED-201-04-A4', 'RECALLED', 10);

-- Packages 405-408: Batch 202 (Active, Dispensed or Delivered)
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(405, 202, 601, '10 Vials / Box', TO_DATE('2026-01-07', 'YYYY-MM-DD'), 'QR-MED-202-01-B1', 'DISPENSED', 10);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(406, 202, 602, '10 Vials / Box', TO_DATE('2026-01-07', 'YYYY-MM-DD'), 'QR-MED-202-02-B2', 'DISPENSED', 10);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(407, 202, NULL, '10 Vials / Box', TO_DATE('2026-01-07', 'YYYY-MM-DD'), 'QR-MED-202-03-B3', 'DELIVERED', 10);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(408, 202, NULL, '10 Vials / Box', TO_DATE('2026-01-07', 'YYYY-MM-DD'), 'QR-MED-202-04-B4', 'IN_TRANSIT', 10);

-- Packages 409-412: Batch 203 (Amoxicillin)
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(409, 203, 603, '100 Capsules / Bottle', TO_DATE('2026-01-14', 'YYYY-MM-DD'), 'QR-MED-203-01-C1', 'DISPENSED', 100);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(410, 203, NULL, '100 Capsules / Bottle', TO_DATE('2026-01-14', 'YYYY-MM-DD'), 'QR-MED-203-02-C2', 'DELIVERED', 100);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(411, 203, NULL, '100 Capsules / Bottle', TO_DATE('2026-01-14', 'YYYY-MM-DD'), 'QR-MED-203-03-C3', 'IN_TRANSIT', 100);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(412, 203, NULL, '100 Capsules / Bottle', TO_DATE('2026-01-14', 'YYYY-MM-DD'), 'QR-MED-203-04-C4', 'PACKAGED', 100);

-- Packages 413-414: Batch 204 (Recalled)
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(413, 204, NULL, '500 Capsules / Tub', TO_DATE('2025-12-04', 'YYYY-MM-DD'), 'QR-MED-204-01-D1', 'RECALLED', 500);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(414, 204, NULL, '500 Capsules / Tub', TO_DATE('2025-12-04', 'YYYY-MM-DD'), 'QR-MED-204-02-D2', 'RECALLED', 500);

-- Packages 415-418: Batch 205 (Paracetamol)
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(415, 205, 604, '10x10 Blister Pack', TO_DATE('2026-01-22', 'YYYY-MM-DD'), 'QR-MED-205-01-E1', 'DISPENSED', 100);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(416, 205, 605, '10x10 Blister Pack', TO_DATE('2026-01-22', 'YYYY-MM-DD'), 'QR-MED-205-02-E2', 'DISPENSED', 100);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(417, 205, NULL, '10x10 Blister Pack', TO_DATE('2026-01-22', 'YYYY-MM-DD'), 'QR-MED-205-03-E3', 'DELIVERED', 100);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(418, 205, NULL, '10x10 Blister Pack', TO_DATE('2026-01-22', 'YYYY-MM-DD'), 'QR-MED-205-04-E4', 'IN_TRANSIT', 100);

-- Packages 419-421: Batch 207 (Lipitor)
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(419, 207, 609, '30 Tablets / Bottle', TO_DATE('2026-01-20', 'YYYY-MM-DD'), 'QR-MED-207-01-F1', 'DISPENSED', 30);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(420, 207, NULL, '30 Tablets / Bottle', TO_DATE('2026-01-20', 'YYYY-MM-DD'), 'QR-MED-207-02-F2', 'DELIVERED', 30);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(421, 207, NULL, '30 Tablets / Bottle', TO_DATE('2026-01-20', 'YYYY-MM-DD'), 'QR-MED-207-03-F3', 'IN_TRANSIT', 30);

-- Packages 422-424: Batch 208 (Paxlovid)
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(422, 208, 606, '30 Tablets Daily Dose Pack', TO_DATE('2026-02-16', 'YYYY-MM-DD'), 'QR-MED-208-01-G1', 'DISPENSED', 30);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(423, 208, NULL, '30 Tablets Daily Dose Pack', TO_DATE('2026-02-16', 'YYYY-MM-DD'), 'QR-MED-208-02-G2', 'DELIVERED', 30);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(424, 208, NULL, '30 Tablets Daily Dose Pack', TO_DATE('2026-02-16', 'YYYY-MM-DD'), 'QR-MED-208-03-G3', 'IN_TRANSIT', 30);

-- Packages 425-427: Batch 210 (Lantus Insulin)
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(425, 210, 611, '5 x 3ml SoloStar Pens', TO_DATE('2026-02-26', 'YYYY-MM-DD'), 'QR-MED-210-01-H1', 'DISPENSED', 5);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(426, 210, NULL, '5 x 3ml SoloStar Pens', TO_DATE('2026-02-26', 'YYYY-MM-DD'), 'QR-MED-210-02-H2', 'DELIVERED', 5);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(427, 210, NULL, '5 x 3ml SoloStar Pens', TO_DATE('2026-02-26', 'YYYY-MM-DD'), 'QR-MED-210-03-H3', 'IN_TRANSIT', 5);

-- Packages 428-430: Batch 211 (Azithromycin) & Batch 212 (Metformin)
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(428, 211, 607, '6 Tablets / Strip', TO_DATE('2026-01-26', 'YYYY-MM-DD'), 'QR-MED-211-01-J1', 'DISPENSED', 6);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(429, 211, 608, '6 Tablets / Strip', TO_DATE('2026-01-26', 'YYYY-MM-DD'), 'QR-MED-211-02-J2', 'DISPENSED', 6);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(430, 212, 610, '60 Tablets / Box', TO_DATE('2026-02-06', 'YYYY-MM-DD'), 'QR-MED-212-01-K1', 'DISPENSED', 60);

-- Packages 431-432: Batch 218 (Recalled Amoxicillin) & Batch 217 (Packaged)
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(431, 218, NULL, '100 Capsules / Bottle', TO_DATE('2025-10-16', 'YYYY-MM-DD'), 'QR-MED-218-01-L1', 'RECALLED', 100);
INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total) VALUES
(432, 217, 612, '30 Tablets / Box', TO_DATE('2026-03-02', 'YYYY-MM-DD'), 'QR-MED-217-01-M1', 'DISPENSED', 30);

-- ----------------------------------------------------------------------------
-- 12. SHIPMENT (16 records)
-- ----------------------------------------------------------------------------
-- Manufacturer to Distributor shipments
INSERT INTO SHIPMENT (shipment_id, sender_party_id, receiver_party_id, shipment_date, status, mode) VALUES
(701, 1, 5, TO_DATE('2025-11-20', 'YYYY-MM-DD'), 'DELIVERED', 'AIR_CARGO');
INSERT INTO SHIPMENT (shipment_id, sender_party_id, receiver_party_id, shipment_date, status, mode) VALUES
(702, 1, 6, TO_DATE('2026-01-10', 'YYYY-MM-DD'), 'DELIVERED', 'AIR_CARGO');
INSERT INTO SHIPMENT (shipment_id, sender_party_id, receiver_party_id, shipment_date, status, mode) VALUES
(703, 3, 8, TO_DATE('2026-01-16', 'YYYY-MM-DD'), 'DELIVERED', 'COLD_CHAIN_TRUCK');
INSERT INTO SHIPMENT (shipment_id, sender_party_id, receiver_party_id, shipment_date, status, mode) VALUES
(704, 4, 7, TO_DATE('2025-12-10', 'YYYY-MM-DD'), 'RETURNED', 'ROAD_LOGISTICS');
INSERT INTO SHIPMENT (shipment_id, sender_party_id, receiver_party_id, shipment_date, status, mode) VALUES
(705, 3, 8, TO_DATE('2026-01-25', 'YYYY-MM-DD'), 'DELIVERED', 'ROAD_LOGISTICS');
INSERT INTO SHIPMENT (shipment_id, sender_party_id, receiver_party_id, shipment_date, status, mode) VALUES
(706, 1, 5, TO_DATE('2026-01-22', 'YYYY-MM-DD'), 'DELIVERED', 'EXPRESS_COURIER');
INSERT INTO SHIPMENT (shipment_id, sender_party_id, receiver_party_id, shipment_date, status, mode) VALUES
(707, 2, 6, TO_DATE('2026-02-28', 'YYYY-MM-DD'), 'IN_TRANSIT', 'COLD_CHAIN_TRUCK');
INSERT INTO SHIPMENT (shipment_id, sender_party_id, receiver_party_id, shipment_date, status, mode) VALUES
(708, 4, 8, TO_DATE('2026-02-01', 'YYYY-MM-DD'), 'DELIVERED', 'ROAD_LOGISTICS');

-- Distributor to Pharmacy shipments
INSERT INTO SHIPMENT (shipment_id, sender_party_id, receiver_party_id, shipment_date, status, mode) VALUES
(709, 5, 9, TO_DATE('2026-02-02', 'YYYY-MM-DD'), 'DELIVERED', 'ROAD_LOGISTICS');
INSERT INTO SHIPMENT (shipment_id, sender_party_id, receiver_party_id, shipment_date, status, mode) VALUES
(710, 6, 10, TO_DATE('2026-02-12', 'YYYY-MM-DD'), 'DELIVERED', 'COLD_CHAIN_TRUCK');
INSERT INTO SHIPMENT (shipment_id, sender_party_id, receiver_party_id, shipment_date, status, mode) VALUES
(711, 8, 11, TO_DATE('2026-02-20', 'YYYY-MM-DD'), 'DELIVERED', 'EXPRESS_COURIER');
INSERT INTO SHIPMENT (shipment_id, sender_party_id, receiver_party_id, shipment_date, status, mode) VALUES
(712, 7, 12, TO_DATE('2026-02-25', 'YYYY-MM-DD'), 'DELIVERED', 'AIR_CARGO');
INSERT INTO SHIPMENT (shipment_id, sender_party_id, receiver_party_id, shipment_date, status, mode) VALUES
(713, 8, 13, TO_DATE('2026-03-01', 'YYYY-MM-DD'), 'DELIVERED', 'ROAD_LOGISTICS');
INSERT INTO SHIPMENT (shipment_id, sender_party_id, receiver_party_id, shipment_date, status, mode) VALUES
(714, 5, 9, TO_DATE('2026-03-10', 'YYYY-MM-DD'), 'IN_TRANSIT', 'EXPRESS_COURIER');
INSERT INTO SHIPMENT (shipment_id, sender_party_id, receiver_party_id, shipment_date, status, mode) VALUES
(715, 6, 10, TO_DATE('2026-03-12', 'YYYY-MM-DD'), 'DISPATCHED', 'COLD_CHAIN_TRUCK');
INSERT INTO SHIPMENT (shipment_id, sender_party_id, receiver_party_id, shipment_date, status, mode) VALUES
(716, 7, 11, TO_DATE('2026-03-14', 'YYYY-MM-DD'), 'CREATED', 'AIR_CARGO');

-- ----------------------------------------------------------------------------
-- 13. CONTAINS (M:N Bridge - 32 records)
-- Demonstrates single and multi-hop shipments for packages
-- ----------------------------------------------------------------------------
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (401, 701);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (402, 701);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (403, 701);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (404, 701);

INSERT INTO CONTAINS (package_id, shipment_id) VALUES (405, 702);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (405, 709); -- Shipped twice (Mfg -> Distro -> Pharmacy)
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (406, 702);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (406, 709); -- Shipped twice
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (407, 702);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (408, 714);

INSERT INTO CONTAINS (package_id, shipment_id) VALUES (409, 703);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (409, 710); -- Shipped twice
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (410, 703);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (411, 715);

INSERT INTO CONTAINS (package_id, shipment_id) VALUES (413, 704);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (414, 704);

INSERT INTO CONTAINS (package_id, shipment_id) VALUES (415, 705);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (415, 711); -- Shipped twice
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (416, 705);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (416, 711); -- Shipped twice
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (417, 705);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (418, 716);

INSERT INTO CONTAINS (package_id, shipment_id) VALUES (419, 706);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (419, 713); -- Shipped twice
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (420, 706);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (421, 714);

INSERT INTO CONTAINS (package_id, shipment_id) VALUES (422, 707);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (423, 707);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (424, 707);

INSERT INTO CONTAINS (package_id, shipment_id) VALUES (425, 708);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (425, 712); -- Shipped twice
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (426, 708);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (427, 715);

INSERT INTO CONTAINS (package_id, shipment_id) VALUES (428, 708);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (429, 708);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (430, 711);
INSERT INTO CONTAINS (package_id, shipment_id) VALUES (432, 713);

COMMIT;

PROMPT All MedLedger synthetic records inserted and committed successfully.
PROMPT ===================================================;
