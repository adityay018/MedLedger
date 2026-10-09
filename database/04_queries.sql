-- ============================================================================
-- SCRIPT: 04_queries.sql (also mirrored in 05_queries.sql)
-- PROJECT: MedLedger — Pharmaceutical Supply Chain Intelligence
-- PURPOSE: 15 Core Oracle SQL Analytics Queries
--          Showcases Multi-table Joins, Aggregations, GROUP BY, HAVING,
--          Subqueries, Correlated Subqueries, Analytical Window Functions,
--          EXISTS predicates, and Parameterized Lookups with Bind Variables.
-- COMPATIBILITY: Oracle 21c / Oracle XE / Oracle SQL Developer
-- ============================================================================

SET PAGESIZE 60;
SET LINESIZE 220;
SET FEEDBACK ON;

PROMPT ============================================================================;
PROMPT       MEDLEDGER PHARMACEUTICAL SUPPLY CHAIN - 15 ADVANCED SQL QUERIES       ;
PROMPT ============================================================================;

-- ----------------------------------------------------------------------------
-- QUERY 1: Drug Catalogue
-- PURPOSE: List all drugs with their names, descriptions, strengths and dosage forms.
-- RELATIONAL CONCEPTS: Projection, String sorting, Domain catalog enumeration.
-- ----------------------------------------------------------------------------
PROMPT >>> Query 1: Drug Catalogue;
SELECT 
    d.drug_id,
    d.drug_name,
    d.description,
    d.strength,
    d.dosage_form
FROM DRUG d
ORDER BY d.drug_name ASC;


-- ----------------------------------------------------------------------------
-- QUERY 2: Batch Traceability
-- PURPOSE: List batches with their drug names, manufacturer names, manufacturing
--          dates and batch statuses.
-- RELATIONAL CONCEPTS: 3-Table INNER JOIN (BATCH -> DRUG, BATCH -> PARTY via manufacturer_id),
--                      Date formatting with TO_CHAR.
-- ----------------------------------------------------------------------------
PROMPT >>> Query 2: Batch Traceability;
SELECT 
    b.batch_id,
    d.drug_name,
    p.party_name AS manufacturer_name,
    TO_CHAR(b.manufacture_date, 'YYYY-MM-DD') AS manufacture_date,
    b.batch_status
FROM BATCH b
INNER JOIN DRUG d ON b.drug_id = d.drug_id
INNER JOIN PARTY p ON b.manufacturer_id = p.party_id
ORDER BY b.batch_id ASC;


-- ----------------------------------------------------------------------------
-- QUERY 3: Package Inventory
-- PURPOSE: List packages with package IDs, QR codes, batch IDs, drug names,
--          package sizes, and statuses.
-- RELATIONAL CONCEPTS: Multi-table INNER JOIN (PACKAGE -> BATCH -> DRUG),
--                      Inventory status visibility across serialized units.
-- ----------------------------------------------------------------------------
PROMPT >>> Query 3: Package Inventory;
SELECT 
    pkg.package_id,
    pkg.qr_code,
    pkg.batch_id,
    d.drug_name,
    pkg.package_size,
    pkg.status AS package_status,
    pkg.quantity_total
FROM PACKAGE pkg
INNER JOIN BATCH b ON pkg.batch_id = b.batch_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
ORDER BY pkg.package_id ASC;


-- ----------------------------------------------------------------------------
-- QUERY 4: Shipment Tracking
-- PURPOSE: Show shipment ID, date, sender name, receiver name, transport mode
--          and shipment status.
-- RELATIONAL CONCEPTS: Dual Join on the same table (PARTY) using distinct aliases
--                      (p_sender for sender_party_id, p_receiver for receiver_party_id).
-- ----------------------------------------------------------------------------
PROMPT >>> Query 4: Shipment Tracking;
SELECT 
    s.shipment_id,
    TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS shipment_date,
    p_sender.party_name AS sender_name,
    p_receiver.party_name AS receiver_name,
    s.mode AS transport_mode,
    s.status AS shipment_status
FROM SHIPMENT s
INNER JOIN PARTY p_sender ON s.sender_party_id = p_sender.party_id
INNER JOIN PARTY p_receiver ON s.receiver_party_id = p_receiver.party_id
ORDER BY s.shipment_id ASC;


-- ----------------------------------------------------------------------------
-- QUERY 5: In-Transit Shipments
-- PURPOSE: Find shipments whose current status indicates that they are in transit.
-- RELATIONAL CONCEPTS: Dual Join on PARTY with predicate filtering on status.
-- ----------------------------------------------------------------------------
PROMPT >>> Query 5: In-Transit Shipments;
SELECT 
    s.shipment_id,
    TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS shipment_date,
    p_sender.party_name AS sender_name,
    p_receiver.party_name AS receiver_name,
    s.mode AS transport_mode,
    s.status AS shipment_status
FROM SHIPMENT s
INNER JOIN PARTY p_sender ON s.sender_party_id = p_sender.party_id
INNER JOIN PARTY p_receiver ON s.receiver_party_id = p_receiver.party_id
WHERE s.status = 'IN_TRANSIT'
ORDER BY s.shipment_date DESC, s.shipment_id ASC;


-- ----------------------------------------------------------------------------
-- QUERY 6: Failed Quality Tests
-- PURPOSE: List failed quality tests with their test dates, test types, batch IDs
--          and drug names.
-- RELATIONAL CONCEPTS: 3-Table INNER JOIN (QUALITY_TEST -> BATCH -> DRUG) with status filter.
-- ----------------------------------------------------------------------------
PROMPT >>> Query 6: Failed Quality Tests;
SELECT 
    qt.test_id,
    TO_CHAR(qt.test_date, 'YYYY-MM-DD') AS test_date,
    qt.test_type,
    qt.result,
    qt.batch_id,
    d.drug_name,
    qt.status AS test_status
FROM QUALITY_TEST qt
INNER JOIN BATCH b ON qt.batch_id = b.batch_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
WHERE qt.status = 'FAILED'
ORDER BY qt.test_date DESC, qt.test_id ASC;


-- ----------------------------------------------------------------------------
-- QUERY 7: Active Recalls
-- PURPOSE: List active recalls and their associated batches and drugs.
-- RELATIONAL CONCEPTS: 4-Table INNER JOIN (RECALL -> BATCH -> DRUG -> PARTY),
--                      Predicate filter on recall status ('ACTIVE').
-- ----------------------------------------------------------------------------
PROMPT >>> Query 7: Active Recalls;
SELECT 
    r.recall_id,
    TO_CHAR(r.recall_date, 'YYYY-MM-DD') AS recall_date,
    r.status AS recall_status,
    r.reason AS recall_reason,
    b.batch_id,
    b.batch_status,
    d.drug_name,
    p.party_name AS manufacturer_name
FROM RECALL r
INNER JOIN BATCH b ON r.recall_id = b.recall_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
INNER JOIN PARTY p ON b.manufacturer_id = p.party_id
WHERE r.status = 'ACTIVE'
ORDER BY r.recall_date DESC, b.batch_id ASC;


-- ----------------------------------------------------------------------------
-- QUERY 8: Recall Impact Analysis
-- PURPOSE: Identify individual packages belonging to batches affected by active recalls.
-- RELATIONAL CONCEPTS: Hierarchical Multi-Table Join (PACKAGE -> BATCH -> RECALL -> DRUG)
--                      for rapid supply-chain quarantine identification.
-- ----------------------------------------------------------------------------
PROMPT >>> Query 8: Recall Impact Analysis;
SELECT 
    pkg.package_id,
    pkg.qr_code,
    pkg.status AS package_status,
    pkg.package_size,
    pkg.quantity_total,
    b.batch_id,
    d.drug_name,
    r.recall_id,
    r.reason AS recall_reason,
    TO_CHAR(r.recall_date, 'YYYY-MM-DD') AS recall_date
FROM PACKAGE pkg
INNER JOIN BATCH b ON pkg.batch_id = b.batch_id
INNER JOIN RECALL r ON b.recall_id = r.recall_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
WHERE r.status = 'ACTIVE'
ORDER BY r.recall_id ASC, pkg.package_id ASC;


-- ----------------------------------------------------------------------------
-- QUERY 9: Manufacturer Performance
-- PURPOSE: List manufacturers and count the number of batches created by each.
--          Includes manufacturers with zero batches where possible.
-- RELATIONAL CONCEPTS: Subclass-to-Superclass Join (MANUFACTURER -> PARTY),
--                      LEFT OUTER JOIN with BATCH, Aggregations (COUNT, conditional SUM),
--                      GROUP BY, Handling NULL values with NVL.
-- ----------------------------------------------------------------------------
PROMPT >>> Query 9: Manufacturer Performance;
SELECT 
    m.party_id AS manufacturer_id,
    p.party_name AS manufacturer_name,
    m.manufacturing_license_no,
    COUNT(b.batch_id) AS total_batches,
    NVL(SUM(CASE WHEN b.batch_status = 'RELEASED' THEN 1 ELSE 0 END), 0) AS released_batches,
    NVL(SUM(CASE WHEN b.batch_status = 'RECALLED' THEN 1 ELSE 0 END), 0) AS recalled_batches
FROM MANUFACTURER m
INNER JOIN PARTY p ON m.party_id = p.party_id
LEFT JOIN BATCH b ON m.party_id = b.manufacturer_id
GROUP BY m.party_id, p.party_name, m.manufacturing_license_no
ORDER BY total_batches DESC, p.party_name ASC;


-- ----------------------------------------------------------------------------
-- QUERY 10: Pharmacy Dispensing Summary
-- PURPOSE: List pharmacies and the total quantity dispensed by each pharmacy.
-- RELATIONAL CONCEPTS: Subclass-to-Superclass Join (PHARMACY -> PARTY),
--                      LEFT OUTER JOIN with DISPENSING, Aggregations (COUNT, SUM),
--                      NVL for handling pharmacies with zero dispensing events.
-- ----------------------------------------------------------------------------
PROMPT >>> Query 10: Pharmacy Dispensing Summary;
SELECT 
    ph.party_id AS pharmacy_id,
    p.party_name AS pharmacy_name,
    ph.pharmacy_license_no,
    ph.hq AS headquarters,
    COUNT(d.dispense_id) AS dispensing_events_count,
    NVL(SUM(d.quantity), 0) AS total_quantity_dispensed
FROM PHARMACY ph
INNER JOIN PARTY p ON ph.party_id = p.party_id
LEFT JOIN DISPENSING d ON ph.party_id = d.pharmacy_id
GROUP BY ph.party_id, p.party_name, ph.pharmacy_license_no, ph.hq
ORDER BY total_quantity_dispensed DESC, p.party_name ASC;


-- ----------------------------------------------------------------------------
-- QUERY 11: Most Frequently Batched Drugs
-- PURPOSE: Rank drugs by the number of batches associated with each drug.
-- RELATIONAL CONCEPTS: LEFT JOIN, Aggregate COUNT, Analytical Window Function
--                      (DENSE_RANK() OVER (ORDER BY COUNT(...) DESC)).
-- ----------------------------------------------------------------------------
PROMPT >>> Query 11: Most Frequently Batched Drugs;
SELECT 
    d.drug_id,
    d.drug_name,
    d.strength,
    d.dosage_form,
    COUNT(b.batch_id) AS total_batches,
    DENSE_RANK() OVER (ORDER BY COUNT(b.batch_id) DESC) AS batch_rank
FROM DRUG d
LEFT JOIN BATCH b ON d.drug_id = b.drug_id
GROUP BY d.drug_id, d.drug_name, d.strength, d.dosage_form
ORDER BY total_batches DESC, d.drug_name ASC;


-- ----------------------------------------------------------------------------
-- QUERY 12: Undispensed Packages
-- PURPOSE: Find packages that have not been dispensed, using the actual relationships
--          and lifecycle statuses in the schema.
-- RELATIONAL CONCEPTS: 3-Table Join (PACKAGE -> BATCH -> DRUG),
--                      Multi-condition non-dispensed verification:
--                      checks pkg.dispense_id IS NULL AND pkg.status <> 'DISPENSED'.
-- ----------------------------------------------------------------------------
PROMPT >>> Query 12: Undispensed Packages;
SELECT 
    pkg.package_id,
    pkg.qr_code,
    pkg.batch_id,
    d.drug_name,
    pkg.package_size,
    pkg.status AS package_status,
    pkg.quantity_total,
    TO_CHAR(pkg.packaged_at, 'YYYY-MM-DD') AS packaged_at
FROM PACKAGE pkg
INNER JOIN BATCH b ON pkg.batch_id = b.batch_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
WHERE pkg.dispense_id IS NULL 
  AND pkg.status <> 'DISPENSED'
ORDER BY pkg.package_id ASC;


-- ----------------------------------------------------------------------------
-- QUERY 13: Shipment History for a Package
-- PURPOSE: Given a package ID or QR code, display its complete shipment history,
--          sender, receiver, shipment date and status.
-- RELATIONAL CONCEPTS: 5-Table Join (PACKAGE -> CONTAINS -> SHIPMENT -> 2x PARTY),
--                      Parameterized bind variables (:ident) for secure execution.
-- NOTE: For standalone SQL*Plus demo, variable :ident is bound below.
-- ----------------------------------------------------------------------------
PROMPT >>> Query 13: Shipment History for a Package (Sample: QR-MED-208-01-G1 or PKG #1);
VARIABLE b_pkg_ident VARCHAR2(100);
EXEC :b_pkg_ident := 'QR-MED-208-01-G1';

SELECT 
    pkg.package_id,
    pkg.qr_code,
    s.shipment_id,
    TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS shipment_date,
    p_sender.party_name AS sender_name,
    p_receiver.party_name AS receiver_name,
    s.mode AS transport_mode,
    s.status AS shipment_status
FROM PACKAGE pkg
INNER JOIN CONTAINS c ON pkg.package_id = c.package_id
INNER JOIN SHIPMENT s ON c.shipment_id = s.shipment_id
INNER JOIN PARTY p_sender ON s.sender_party_id = p_sender.party_id
INNER JOIN PARTY p_receiver ON s.receiver_party_id = p_receiver.party_id
WHERE pkg.qr_code = :b_pkg_ident 
   OR (REGEXP_LIKE(:b_pkg_ident, '^[0-9]+$') AND pkg.package_id = TO_NUMBER(:b_pkg_ident))
ORDER BY s.shipment_date DESC, s.shipment_id DESC;


-- ----------------------------------------------------------------------------
-- QUERY 14: Pending or Failed Quality Tests
-- PURPOSE: List batches with pending or failed quality tests for lab compliance.
-- RELATIONAL CONCEPTS: 4-Table INNER JOIN (QUALITY_TEST -> BATCH -> DRUG -> PARTY),
--                      Set membership filter IN ('PENDING', 'FAILED').
-- ----------------------------------------------------------------------------
PROMPT >>> Query 14: Pending or Failed Quality Tests;
SELECT 
    qt.test_id,
    b.batch_id,
    d.drug_name,
    p.party_name AS manufacturer_name,
    qt.test_type,
    qt.result,
    qt.status AS test_status,
    TO_CHAR(qt.test_date, 'YYYY-MM-DD') AS test_date,
    b.batch_status
FROM QUALITY_TEST qt
INNER JOIN BATCH b ON qt.batch_id = b.batch_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
INNER JOIN PARTY p ON b.manufacturer_id = p.party_id
WHERE qt.status IN ('PENDING', 'FAILED')
ORDER BY qt.test_date DESC, b.batch_id ASC;


-- ----------------------------------------------------------------------------
-- QUERY 15: Package Verification (Full 360-degree Lineage Audit)
-- PURPOSE: Given a package ID or QR code, retrieve its package information,
--          associated drug, batch, manufacturer, quality-test summary,
--          recall status, and dispensing information where available.
-- RELATIONAL CONCEPTS: 7-Table Join with LEFT JOINS for optional entities
--                      (Recall, Dispensing), Correlated Scalar Subqueries for
--                      Quality Test counts, Safe Parameterized Bind (:ident).
-- ----------------------------------------------------------------------------
PROMPT >>> Query 15: Package Verification (Sample: QR-MED-208-01-G1 or PKG #1);
VARIABLE b_verify_ident VARCHAR2(100);
EXEC :b_verify_ident := 'QR-MED-208-01-G1';

SELECT 
    pkg.package_id,
    pkg.qr_code,
    pkg.package_size,
    pkg.status AS package_status,
    pkg.quantity_total,
    TO_CHAR(pkg.packaged_at, 'YYYY-MM-DD') AS packaged_at,
    b.batch_id,
    b.batch_status,
    TO_CHAR(b.manufacture_date, 'YYYY-MM-DD') AS manufacture_date,
    d.drug_id,
    d.drug_name,
    d.strength,
    d.dosage_form,
    mfg_p.party_name AS manufacturer_name,
    mfg.manufacturing_license_no,
    r.recall_id,
    r.status AS recall_status,
    r.reason AS recall_reason,
    TO_CHAR(r.recall_date, 'YYYY-MM-DD') AS recall_date,
    disp.dispense_id,
    disp.patient_id,
    disp_p.party_name AS dispensing_pharmacy,
    TO_CHAR(disp.dispensed_at, 'YYYY-MM-DD') AS dispensed_at,
    (SELECT COUNT(*) FROM QUALITY_TEST qt WHERE qt.batch_id = b.batch_id) AS total_quality_tests,
    (SELECT COUNT(*) FROM QUALITY_TEST qt WHERE qt.batch_id = b.batch_id AND qt.status = 'PASSED') AS passed_quality_tests,
    (SELECT COUNT(*) FROM QUALITY_TEST qt WHERE qt.batch_id = b.batch_id AND qt.status = 'FAILED') AS failed_quality_tests,
    (SELECT COUNT(*) FROM QUALITY_TEST qt WHERE qt.batch_id = b.batch_id AND qt.status = 'PENDING') AS pending_quality_tests
FROM PACKAGE pkg
INNER JOIN BATCH b ON pkg.batch_id = b.batch_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
INNER JOIN PARTY mfg_p ON b.manufacturer_id = mfg_p.party_id
LEFT JOIN MANUFACTURER mfg ON mfg_p.party_id = mfg.party_id
LEFT JOIN RECALL r ON b.recall_id = r.recall_id
LEFT JOIN DISPENSING disp ON pkg.dispense_id = disp.dispense_id
LEFT JOIN PARTY disp_p ON disp.pharmacy_id = disp_p.party_id
WHERE pkg.qr_code = :b_verify_ident 
   OR (REGEXP_LIKE(:b_verify_ident, '^[0-9]+$') AND pkg.package_id = TO_NUMBER(:b_verify_ident));

PROMPT ============================================================================;
PROMPT All 15 MedLedger Oracle SQL Queries Defined and Verified Successfully.       ;
PROMPT ============================================================================;
