-- ============================================================================
-- SCRIPT: 05_queries.sql
-- PROJECT: MedLedger DBMS - University DA2 Project
-- PURPOSE: 12 Meaningful SQL queries showcasing core DBMS concepts:
--          Multi-table joins, Self-joins, Aggregations, GROUP BY, HAVING,
--          Subqueries, Correlated Subqueries, and EXISTS clauses.
-- COMPATIBILITY: Oracle 21c / Oracle XE / Oracle SQL Developer
-- ============================================================================

-- Format SQL*Plus terminal output cleanly
SET PAGESIZE 50;
SET LINESIZE 200;
SET FEEDBACK ON;

PROMPT ============================================================================;
PROMPT EXECUTING MEDLEDGER SQL QUERY CATALOGUE (Q1 TO Q12);
PROMPT ============================================================================;

-- ----------------------------------------------------------------------------
-- Q1: Display all drugs with their manufactured batches
-- DBMS CONCEPT: 3-Table INNER JOIN, ORDER BY
-- OBJECTIVE: Tracks lot numbers and manufacture dates for every formulated drug.
-- ----------------------------------------------------------------------------
PROMPT >>> Q1: Drugs with their Manufactured Batches;
SELECT 
    d.drug_id,
    d.drug_name,
    d.strength,
    d.dosage_form,
    b.batch_id,
    b.batch_status,
    TO_CHAR(b.manufacture_date, 'YYYY-MM-DD') AS mfg_date,
    p.party_name AS manufacturer_name
FROM DRUG d
INNER JOIN BATCH b ON d.drug_id = b.drug_id
INNER JOIN PARTY p ON b.manufacturer_id = p.party_id
ORDER BY d.drug_id, b.manufacture_date DESC;

-- ----------------------------------------------------------------------------
-- Q2: Display manufacturer-wise batch production summary
-- DBMS CONCEPT: INNER JOIN, GROUP BY, Aggregates (COUNT, MAX, MIN)
-- OBJECTIVE: Provides regulatory oversight on batch volume and active production.
-- ----------------------------------------------------------------------------
PROMPT >>> Q2: Manufacturer-wise Batch Production Summary;
SELECT 
    m.party_id AS mfg_id,
    p.party_name AS manufacturer_name,
    m.manufacturing_license_no,
    COUNT(b.batch_id) AS total_batches_produced,
    SUM(CASE WHEN b.batch_status = 'RELEASED' THEN 1 ELSE 0 END) AS released_batches,
    SUM(CASE WHEN b.batch_status = 'RECALLED' THEN 1 ELSE 0 END) AS recalled_batches,
    MIN(b.manufacture_date) AS earliest_batch_date,
    MAX(b.manufacture_date) AS latest_batch_date
FROM MANUFACTURER m
INNER JOIN PARTY p ON m.party_id = p.party_id
LEFT JOIN BATCH b ON m.party_id = b.manufacturer_id
GROUP BY m.party_id, p.party_name, m.manufacturing_license_no
ORDER BY total_batches_produced DESC;

-- ----------------------------------------------------------------------------
-- Q3: Display all packages currently in transit with shipment and drug details
-- DBMS CONCEPT: 5-Table Join, Complex Predicate Filtering
-- OBJECTIVE: Identifies custody and physical location of products actively moving.
-- ----------------------------------------------------------------------------
PROMPT >>> Q3: Packages Currently In Transit;
SELECT 
    pkg.package_id,
    pkg.qr_code,
    pkg.package_size,
    pkg.status AS package_status,
    d.drug_name,
    b.batch_id,
    s.shipment_id,
    s.mode AS transport_mode,
    sender.party_name AS sender,
    receiver.party_name AS receiver,
    TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS dispatch_date
FROM PACKAGE pkg
INNER JOIN BATCH b ON pkg.batch_id = b.batch_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
INNER JOIN CONTAINS c ON pkg.package_id = c.package_id
INNER JOIN SHIPMENT s ON c.shipment_id = s.shipment_id
INNER JOIN PARTY sender ON s.sender_party_id = sender.party_id
INNER JOIN PARTY receiver ON s.receiver_party_id = receiver.party_id
WHERE pkg.status = 'IN_TRANSIT' OR s.status = 'IN_TRANSIT'
ORDER BY s.shipment_date DESC;

-- ----------------------------------------------------------------------------
-- Q4: Display shipment details with resolved sender and receiver names
-- DBMS CONCEPT: Dual Joins on the same superclass table (PARTY) using table aliases
-- OBJECTIVE: Clarifies logistics custody without exposing cryptic foreign keys.
-- ----------------------------------------------------------------------------
PROMPT >>> Q4: Custody Transfer Shipments with Resolved Party Names;
SELECT 
    s.shipment_id,
    TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS shipment_date,
    s.mode,
    s.status AS shipment_status,
    s.sender_party_id,
    p_sender.party_name AS sender_organization,
    s.receiver_party_id,
    p_receiver.party_name AS receiver_organization
FROM SHIPMENT s
INNER JOIN PARTY p_sender ON s.sender_party_id = p_sender.party_id
INNER JOIN PARTY p_receiver ON s.receiver_party_id = p_receiver.party_id
ORDER BY s.shipment_id;

-- ----------------------------------------------------------------------------
-- Q5: Display all quality tests for a particular batch (Batch #201 and #204)
-- DBMS CONCEPT: Parameterized Lookup, JOIN, Conditional Case Projection
-- OBJECTIVE: Audits lab assay compliance prior to market release.
-- ----------------------------------------------------------------------------
PROMPT >>> Q5: Quality Test Audit for Specific Batches (e.g., Batches 201 & 204);
SELECT 
    qt.test_id,
    qt.batch_id,
    d.drug_name,
    TO_CHAR(qt.test_date, 'YYYY-MM-DD') AS test_date,
    qt.test_type,
    qt.result,
    qt.status AS test_status
FROM QUALITY_TEST qt
INNER JOIN BATCH b ON qt.batch_id = b.batch_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
WHERE b.batch_id IN (201, 204)
ORDER BY qt.batch_id, qt.test_date;

-- ----------------------------------------------------------------------------
-- Q6: Display all recalled batches and affected drugs with recall rationale
-- DBMS CONCEPT: 4-Table Join, Temporal and Status Filtering
-- OBJECTIVE: Rapid recall visibility for safety inspectors and regulators.
-- ----------------------------------------------------------------------------
PROMPT >>> Q6: Recalled Batches and Affected Drug Formulations;
SELECT 
    r.recall_id,
    TO_CHAR(r.recall_date, 'YYYY-MM-DD') AS recall_date,
    r.status AS recall_status,
    r.reason AS recall_justification,
    b.batch_id,
    b.batch_status,
    d.drug_name,
    d.strength,
    mfg_p.party_name AS manufacturer
FROM RECALL r
INNER JOIN BATCH b ON r.recall_id = b.recall_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
INNER JOIN PARTY mfg_p ON b.manufacturer_id = mfg_p.party_id
ORDER BY r.recall_date DESC;

-- ----------------------------------------------------------------------------
-- Q7: Find pharmacies that actively performed dispensing
-- DBMS CONCEPT: Subquery with IN / EXISTS clause, Distinct entity extraction
-- OBJECTIVE: Differentiates active dispensing centers from idle retail nodes.
-- ----------------------------------------------------------------------------
PROMPT >>> Q7: Pharmacies Actively Performing Retail Dispensing;
SELECT 
    p.party_id,
    p.party_name AS pharmacy_name,
    ph.pharmacy_license_no,
    ph.hq AS headquarters,
    p.phone,
    p.email
FROM PHARMACY ph
INNER JOIN PARTY p ON ph.party_id = p.party_id
WHERE EXISTS (
    SELECT 1 
    FROM DISPENSING d 
    WHERE d.pharmacy_id = ph.party_id
)
ORDER BY p.party_name;

-- ----------------------------------------------------------------------------
-- Q8: Find packages that were shipped more than once (Multi-hop supply chain)
-- DBMS CONCEPT: Bridge table aggregation, GROUP BY, HAVING COUNT(*) > 1
-- OBJECTIVE: Detects supply chain custody transfers through wholesale intermediaries.
-- ----------------------------------------------------------------------------
PROMPT >>> Q8: Packages Handled Across Multiple Shipments (Multi-hop Transit);
SELECT 
    c.package_id,
    pkg.qr_code,
    d.drug_name,
    pkg.status AS current_status,
    COUNT(c.shipment_id) AS shipment_hops_count
FROM CONTAINS c
INNER JOIN PACKAGE pkg ON c.package_id = pkg.package_id
INNER JOIN BATCH b ON pkg.batch_id = b.batch_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
GROUP BY c.package_id, pkg.qr_code, d.drug_name, pkg.status
HAVING COUNT(c.shipment_id) > 1
ORDER BY shipment_hops_count DESC, c.package_id;

-- ----------------------------------------------------------------------------
-- Q9: Find drugs with at least one failed quality test
-- DBMS CONCEPT: Correlated Subquery / IN with Subquery, Aggregation
-- OBJECTIVE: Identifies high-risk therapeutic products requiring investigation.
-- ----------------------------------------------------------------------------
PROMPT >>> Q9: Drugs with at least One Failed Quality Test;
SELECT 
    d.drug_id,
    d.drug_name,
    d.dosage_form,
    COUNT(qt.test_id) AS total_failed_tests
FROM DRUG d
INNER JOIN BATCH b ON d.drug_id = b.drug_id
INNER JOIN QUALITY_TEST qt ON b.batch_id = qt.batch_id
WHERE qt.status = 'FAILED'
GROUP BY d.drug_id, d.drug_name, d.dosage_form
ORDER BY total_failed_tests DESC;

-- ----------------------------------------------------------------------------
-- Q10: Find the number of packages associated with each shipment
-- DBMS CONCEPT: LEFT OUTER JOIN, GROUP BY, Aggregate COUNT, Handling NULLs
-- OBJECTIVE: Cargo manifest verification for transport carriers.
-- ----------------------------------------------------------------------------
PROMPT >>> Q10: Cargo Manifest Package Count per Shipment;
SELECT 
    s.shipment_id,
    TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS shipment_date,
    s.status AS shipment_status,
    s.mode,
    sender.party_name AS sender,
    receiver.party_name AS receiver,
    COUNT(c.package_id) AS total_packages_loaded
FROM SHIPMENT s
INNER JOIN PARTY sender ON s.sender_party_id = sender.party_id
INNER JOIN PARTY receiver ON s.receiver_party_id = receiver.party_id
LEFT JOIN CONTAINS c ON s.shipment_id = c.shipment_id
GROUP BY s.shipment_id, s.shipment_date, s.status, s.mode, sender.party_name, receiver.party_name
ORDER BY total_packages_loaded DESC, s.shipment_id;

-- ----------------------------------------------------------------------------
-- Q11: Find the most frequently dispensed drugs
-- DBMS CONCEPT: 4-Table Join, GROUP BY, SUM Aggregate, ORDER BY DESC
-- OBJECTIVE: High-turnover drug consumption analytics for hospital demand planning.
-- ----------------------------------------------------------------------------
PROMPT >>> Q11: Top Dispensed Drugs by Total Units Handed to Patients;
SELECT 
    d.drug_id,
    d.drug_name,
    d.strength,
    d.dosage_form,
    COUNT(DISTINCT disp.dispense_id) AS total_dispensing_events,
    SUM(disp.quantity) AS total_units_dispensed
FROM DRUG d
INNER JOIN BATCH b ON d.drug_id = b.drug_id
INNER JOIN PACKAGE pkg ON b.batch_id = pkg.batch_id
INNER JOIN DISPENSING disp ON pkg.dispense_id = disp.dispense_id
GROUP BY d.drug_id, d.drug_name, d.strength, d.dosage_form
ORDER BY total_units_dispensed DESC;

-- ----------------------------------------------------------------------------
-- Q12: Find all individual packages affected by a recall notice
-- DBMS CONCEPT: Hierarchical Multi-Table Join (RECALL -> BATCH -> PACKAGE)
-- OBJECTIVE: Instant quarantine list of serialized QR codes across the network.
-- ----------------------------------------------------------------------------
PROMPT >>> Q12: Serialized Packages Compromised by Active Recalls;
SELECT 
    r.recall_id,
    TO_CHAR(r.recall_date, 'YYYY-MM-DD') AS recall_date,
    r.reason,
    b.batch_id,
    d.drug_name,
    pkg.package_id,
    pkg.qr_code,
    pkg.package_size,
    pkg.status AS package_status,
    pkg.quantity_total
FROM RECALL r
INNER JOIN BATCH b ON r.recall_id = b.recall_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
INNER JOIN PACKAGE pkg ON b.batch_id = pkg.batch_id
ORDER BY r.recall_id, pkg.package_id;

PROMPT ============================================================================;
PROMPT All 12 MedLedger SQL Queries Executed Successfully.
PROMPT ============================================================================;
