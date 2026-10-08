const db = require('../config/db');

const QUERY_CATALOGUE = [
  { id: 'Q1', title: 'Drugs with their Manufactured Batches', concept: '3-Table INNER JOIN, ORDER BY', description: 'Tracks lot numbers and manufacture dates for every formulated drug.' },
  { id: 'Q2', title: 'Manufacturer-wise Batch Production Summary', concept: 'INNER JOIN, GROUP BY, Aggregates (COUNT, MAX, MIN)', description: 'Provides regulatory oversight on batch volume and active production.' },
  { id: 'Q3', title: 'Packages Currently In Transit', concept: '5-Table Join, Complex Predicate Filtering', description: 'Identifies custody and physical location of products actively moving.' },
  { id: 'Q4', title: 'Custody Transfer Shipments with Resolved Party Names', concept: 'Dual Joins on the same superclass table (PARTY) using table aliases', description: 'Clarifies logistics custody without exposing cryptic foreign keys.' },
  { id: 'Q5', title: 'Quality Test Audit for Specific Batches (Batches 201 & 204)', concept: 'Parameterized Lookup, JOIN, Conditional Case Projection', description: 'Audits lab assay compliance prior to market release.' },
  { id: 'Q6', title: 'Recalled Batches and Affected Drug Formulations', concept: '4-Table Join, Temporal and Status Filtering', description: 'Rapid recall visibility for safety inspectors and regulators.' },
  { id: 'Q7', title: 'Pharmacies Actively Performing Retail Dispensing', concept: 'Subquery with IN / EXISTS clause, Distinct entity extraction', description: 'Differentiates active dispensing centers from idle retail nodes.' },
  { id: 'Q8', title: 'Packages Handled Across Multiple Shipments (Multi-hop Transit)', concept: 'Bridge table aggregation, GROUP BY, HAVING COUNT(*) > 1', description: 'Detects supply chain custody transfers through wholesale intermediaries.' },
  { id: 'Q9', title: 'Drugs with at least One Failed Quality Test', concept: 'Correlated Subquery / IN with Subquery, Aggregation', description: 'Identifies high-risk therapeutic products requiring investigation.' },
  { id: 'Q10', title: 'Cargo Manifest Package Count per Shipment', concept: 'LEFT OUTER JOIN, GROUP BY, Aggregate COUNT, Handling NULLs', description: 'Cargo manifest verification for transport carriers.' },
  { id: 'Q11', title: 'Top Dispensed Drugs by Total Units Handed to Patients', concept: '4-Table Join, GROUP BY, SUM Aggregate, ORDER BY DESC', description: 'High-turnover drug consumption analytics for hospital demand planning.' },
  { id: 'Q12', title: 'Serialized Packages Compromised by Active Recalls', concept: 'Hierarchical Multi-Table Join (RECALL -> BATCH -> PACKAGE)', description: 'Instant quarantine list of serialized QR codes across the network.' }
];

const ORACLE_SQL_MAP = {
  Q1: `SELECT d.drug_id, d.drug_name, d.strength, d.dosage_form, b.batch_id, b.batch_status, TO_CHAR(b.manufacture_date, 'YYYY-MM-DD') AS mfg_date, p.party_name AS manufacturer_name
FROM DRUG d
INNER JOIN BATCH b ON d.drug_id = b.drug_id
INNER JOIN PARTY p ON b.manufacturer_id = p.party_id
ORDER BY d.drug_id, b.manufacture_date DESC`,

  Q2: `SELECT m.party_id AS mfg_id, p.party_name AS manufacturer_name, m.manufacturing_license_no,
       COUNT(b.batch_id) AS total_batches_produced,
       SUM(CASE WHEN b.batch_status = 'RELEASED' THEN 1 ELSE 0 END) AS released_batches,
       SUM(CASE WHEN b.batch_status = 'RECALLED' THEN 1 ELSE 0 END) AS recalled_batches,
       MIN(b.manufacture_date) AS earliest_batch_date,
       MAX(b.manufacture_date) AS latest_batch_date
FROM MANUFACTURER m
INNER JOIN PARTY p ON m.party_id = p.party_id
LEFT JOIN BATCH b ON m.party_id = b.manufacturer_id
GROUP BY m.party_id, p.party_name, m.manufacturing_license_no
ORDER BY total_batches_produced DESC`,

  Q3: `SELECT pkg.package_id, pkg.qr_code, pkg.package_size, pkg.status AS package_status,
       d.drug_name, b.batch_id, s.shipment_id, s.mode AS transport_mode,
       sender.party_name AS sender, receiver.party_name AS receiver,
       TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS dispatch_date
FROM PACKAGE pkg
INNER JOIN BATCH b ON pkg.batch_id = b.batch_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
INNER JOIN CONTAINS c ON pkg.package_id = c.package_id
INNER JOIN SHIPMENT s ON c.shipment_id = s.shipment_id
INNER JOIN PARTY sender ON s.sender_party_id = sender.party_id
INNER JOIN PARTY receiver ON s.receiver_party_id = receiver.party_id
WHERE pkg.status = 'IN_TRANSIT' OR s.status = 'IN_TRANSIT'
ORDER BY s.shipment_date DESC`,

  Q4: `SELECT s.shipment_id, TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS shipment_date,
       s.mode, s.status AS shipment_status, s.sender_party_id,
       p_sender.party_name AS sender_organization, s.receiver_party_id,
       p_receiver.party_name AS receiver_organization
FROM SHIPMENT s
INNER JOIN PARTY p_sender ON s.sender_party_id = p_sender.party_id
INNER JOIN PARTY p_receiver ON s.receiver_party_id = p_receiver.party_id
ORDER BY s.shipment_id`,

  Q5: `SELECT qt.test_id, qt.batch_id, d.drug_name, TO_CHAR(qt.test_date, 'YYYY-MM-DD') AS test_date,
       qt.test_type, qt.result, qt.status AS test_status
FROM QUALITY_TEST qt
INNER JOIN BATCH b ON qt.batch_id = b.batch_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
WHERE b.batch_id IN (201, 204)
ORDER BY qt.batch_id, qt.test_date`,

  Q6: `SELECT r.recall_id, TO_CHAR(r.recall_date, 'YYYY-MM-DD') AS recall_date,
       r.status AS recall_status, r.reason AS recall_justification,
       b.batch_id, b.batch_status, d.drug_name, d.strength,
       mfg_p.party_name AS manufacturer
FROM RECALL r
INNER JOIN BATCH b ON r.recall_id = b.recall_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
INNER JOIN PARTY mfg_p ON b.manufacturer_id = mfg_p.party_id
ORDER BY r.recall_date DESC`,

  Q7: `SELECT p.party_id, p.party_name AS pharmacy_name, ph.pharmacy_license_no,
       ph.hq AS headquarters, p.phone, p.email
FROM PHARMACY ph
INNER JOIN PARTY p ON ph.party_id = p.party_id
WHERE EXISTS (
    SELECT 1 FROM DISPENSING d WHERE d.pharmacy_id = ph.party_id
)
ORDER BY p.party_name`,

  Q8: `SELECT c.package_id, pkg.qr_code, d.drug_name, pkg.status AS current_status,
       COUNT(c.shipment_id) AS shipment_hops_count
FROM CONTAINS c
INNER JOIN PACKAGE pkg ON c.package_id = pkg.package_id
INNER JOIN BATCH b ON pkg.batch_id = b.batch_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
GROUP BY c.package_id, pkg.qr_code, d.drug_name, pkg.status
HAVING COUNT(c.shipment_id) > 1
ORDER BY shipment_hops_count DESC, c.package_id`,

  Q9: `SELECT d.drug_id, d.drug_name, d.dosage_form, COUNT(qt.test_id) AS total_failed_tests
FROM DRUG d
INNER JOIN BATCH b ON d.drug_id = b.drug_id
INNER JOIN QUALITY_TEST qt ON b.batch_id = qt.batch_id
WHERE qt.status = 'FAILED'
GROUP BY d.drug_id, d.drug_name, d.dosage_form
ORDER BY total_failed_tests DESC`,

  Q10: `SELECT s.shipment_id, TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS shipment_date,
       s.status AS shipment_status, s.mode,
       sender.party_name AS sender, receiver.party_name AS receiver,
       COUNT(c.package_id) AS total_packages_loaded
FROM SHIPMENT s
INNER JOIN PARTY sender ON s.sender_party_id = sender.party_id
INNER JOIN PARTY receiver ON s.receiver_party_id = receiver.party_id
LEFT JOIN CONTAINS c ON s.shipment_id = c.shipment_id
GROUP BY s.shipment_id, s.shipment_date, s.status, s.mode, sender.party_name, receiver.party_name
ORDER BY total_packages_loaded DESC, s.shipment_id`,

  Q11: `SELECT d.drug_id, d.drug_name, d.strength, d.dosage_form,
       COUNT(DISTINCT disp.dispense_id) AS total_dispensing_events,
       SUM(disp.quantity) AS total_units_dispensed
FROM DRUG d
INNER JOIN BATCH b ON d.drug_id = b.drug_id
INNER JOIN PACKAGE pkg ON b.batch_id = pkg.batch_id
INNER JOIN DISPENSING disp ON pkg.dispense_id = disp.dispense_id
GROUP BY d.drug_id, d.drug_name, d.strength, d.dosage_form
ORDER BY total_units_dispensed DESC`,

  Q12: `SELECT r.recall_id, TO_CHAR(r.recall_date, 'YYYY-MM-DD') AS recall_date,
       r.reason, b.batch_id, d.drug_name, pkg.package_id, pkg.qr_code,
       pkg.package_size, pkg.status AS package_status, pkg.quantity_total
FROM RECALL r
INNER JOIN BATCH b ON r.recall_id = b.recall_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
INNER JOIN PACKAGE pkg ON b.batch_id = pkg.batch_id
ORDER BY r.recall_id, pkg.package_id`
};

exports.getQueriesList = (req, res) => {
  res.json({ success: true, count: QUERY_CATALOGUE.length, data: QUERY_CATALOGUE });
};

exports.runQuery = async (req, res, next) => {
  try {
    const { queryId } = req.params;
    const qKey = queryId.toUpperCase();
    const meta = QUERY_CATALOGUE.find(q => q.id === qKey);

    if (!meta) {
      return res.status(404).json({ success: false, error: `Query ${queryId} not recognized in catalogue.` });
    }

    if (db.isUsingOracle()) {
      const sql = ORACLE_SQL_MAP[qKey];
      const result = await db.execute(sql);
      const columns = result.metaData ? result.metaData.map(col => col.name) : Object.keys(result.rows[0] || {});
      return res.json({
        success: true,
        queryId: qKey,
        title: meta.title,
        concept: meta.concept,
        description: meta.description,
        sql,
        columns,
        rows: result.rows,
        count: result.rows.length,
        executionEngine: 'Oracle 21c Database Engine'
      });
    } else {
      const result = db.mock.runAnalyticsQuery(qKey);
      return res.json({
        success: true,
        ...result,
        count: result.rows.length,
        executionEngine: 'MedLedger Analytical Simulation Engine'
      });
    }
  } catch (err) {
    next(err);
  }
};
