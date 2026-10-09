// ============================================================================
// SERVICE: analyticsService.js
// PROJECT: MedLedger DBMS - Pharmaceutical Supply Chain Management
// PURPOSE: Simulated relational execution engine for queries Q1 through Q15.
//          Mirrors exact Oracle BCNF relational behavior, projection, joins,
//          GROUP BY, aggregations, window ranking, and domain integrity.
// ============================================================================

const ANALYTICS_CATALOGUE = [
  {
    id: 'Q1',
    slug: 'drug-catalogue',
    title: 'Drug Catalogue',
    category: 'Drug & Batch Intelligence',
    concept: 'Projection, Alphabetical Sorting, Domain Catalog Enumeration',
    description: 'List all formulated drugs with their names, descriptions, strengths, and dosage forms.',
    endpoint: '/api/analytics/drug-catalogue',
    sql: `SELECT d.drug_id, d.drug_name, d.description, d.strength, d.dosage_form
FROM DRUG d
ORDER BY d.drug_name ASC`,
    columns: ['DRUG_ID', 'DRUG_NAME', 'DESCRIPTION', 'STRENGTH', 'DOSAGE_FORM']
  },
  {
    id: 'Q2',
    slug: 'batch-traceability',
    title: 'Batch Traceability',
    category: 'Drug & Batch Intelligence',
    concept: '3-Table INNER JOIN (BATCH -> DRUG, BATCH -> PARTY), Temporal Formatting',
    description: 'List manufactured batches with drug names, manufacturer names, manufacturing dates, and batch statuses.',
    endpoint: '/api/analytics/batch-traceability',
    sql: `SELECT b.batch_id, d.drug_name, p.party_name AS manufacturer_name,
       TO_CHAR(b.manufacture_date, 'YYYY-MM-DD') AS manufacture_date,
       b.batch_status
FROM BATCH b
INNER JOIN DRUG d ON b.drug_id = d.drug_id
INNER JOIN PARTY p ON b.manufacturer_id = p.party_id
ORDER BY b.batch_id ASC`,
    columns: ['BATCH_ID', 'DRUG_NAME', 'MANUFACTURER_NAME', 'MANUFACTURE_DATE', 'BATCH_STATUS']
  },
  {
    id: 'Q3',
    slug: 'package-inventory',
    title: 'Package Inventory',
    category: 'Package Tracking',
    concept: 'Multi-Table INNER JOIN (PACKAGE -> BATCH -> DRUG), Serialization Catalog',
    description: 'List serialized packages with package IDs, QR codes, batch IDs, drug names, package sizes, and statuses.',
    endpoint: '/api/analytics/package-inventory',
    sql: `SELECT pkg.package_id, pkg.qr_code, pkg.batch_id, d.drug_name,
       pkg.package_size, pkg.status AS package_status, pkg.quantity_total
FROM PACKAGE pkg
INNER JOIN BATCH b ON pkg.batch_id = b.batch_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
ORDER BY pkg.package_id ASC`,
    columns: ['PACKAGE_ID', 'QR_CODE', 'BATCH_ID', 'DRUG_NAME', 'PACKAGE_SIZE', 'PACKAGE_STATUS', 'QUANTITY_TOTAL']
  },
  {
    id: 'Q4',
    slug: 'shipment-tracking',
    title: 'Shipment Tracking',
    category: 'Shipment Analytics',
    concept: 'Dual Joins on PARTY (sender_party_id & receiver_party_id) with Table Aliases',
    description: 'Show shipment ID, date, sender organization, receiver organization, transport mode, and shipment status.',
    endpoint: '/api/analytics/shipment-tracking',
    sql: `SELECT s.shipment_id, TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS shipment_date,
       p_sender.party_name AS sender_name, p_receiver.party_name AS receiver_name,
       s.mode AS transport_mode, s.status AS shipment_status
FROM SHIPMENT s
INNER JOIN PARTY p_sender ON s.sender_party_id = p_sender.party_id
INNER JOIN PARTY p_receiver ON s.receiver_party_id = p_receiver.party_id
ORDER BY s.shipment_id ASC`,
    columns: ['SHIPMENT_ID', 'SHIPMENT_DATE', 'SENDER_NAME', 'RECEIVER_NAME', 'TRANSPORT_MODE', 'SHIPMENT_STATUS']
  },
  {
    id: 'Q5',
    slug: 'in-transit-shipments',
    title: 'In-Transit Shipments',
    category: 'Shipment Analytics',
    concept: 'Dual Join on PARTY with Predicate Filter (s.status = \'IN_TRANSIT\')',
    description: 'Find active shipments whose current status indicates that they are moving in transit.',
    endpoint: '/api/analytics/in-transit-shipments',
    sql: `SELECT s.shipment_id, TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS shipment_date,
       p_sender.party_name AS sender_name, p_receiver.party_name AS receiver_name,
       s.mode AS transport_mode, s.status AS shipment_status
FROM SHIPMENT s
INNER JOIN PARTY p_sender ON s.sender_party_id = p_sender.party_id
INNER JOIN PARTY p_receiver ON s.receiver_party_id = p_receiver.party_id
WHERE s.status = 'IN_TRANSIT'
ORDER BY s.shipment_date DESC, s.shipment_id ASC`,
    columns: ['SHIPMENT_ID', 'SHIPMENT_DATE', 'SENDER_NAME', 'RECEIVER_NAME', 'TRANSPORT_MODE', 'SHIPMENT_STATUS']
  },
  {
    id: 'Q6',
    slug: 'failed-quality-tests',
    title: 'Failed Quality Tests',
    category: 'Quality & Compliance',
    concept: '3-Table Join (QUALITY_TEST -> BATCH -> DRUG) with Predicate Filter (status = \'FAILED\')',
    description: 'List failed quality tests with test dates, test types, assay results, batch IDs, and drug names.',
    endpoint: '/api/analytics/failed-quality-tests',
    sql: `SELECT qt.test_id, TO_CHAR(qt.test_date, 'YYYY-MM-DD') AS test_date,
       qt.test_type, qt.result, qt.batch_id, d.drug_name, qt.status AS test_status
FROM QUALITY_TEST qt
INNER JOIN BATCH b ON qt.batch_id = b.batch_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
WHERE qt.status = 'FAILED'
ORDER BY qt.test_date DESC, qt.test_id ASC`,
    columns: ['TEST_ID', 'TEST_DATE', 'TEST_TYPE', 'RESULT', 'BATCH_ID', 'DRUG_NAME', 'TEST_STATUS']
  },
  {
    id: 'Q7',
    slug: 'active-recalls',
    title: 'Active Recalls',
    category: 'Recall Management',
    concept: '4-Table Join (RECALL -> BATCH -> DRUG -> PARTY) with Filter (status = \'ACTIVE\')',
    description: 'List active recall notices and their associated quarantined batches, drug names, and manufacturers.',
    endpoint: '/api/analytics/active-recalls',
    sql: `SELECT r.recall_id, TO_CHAR(r.recall_date, 'YYYY-MM-DD') AS recall_date,
       r.status AS recall_status, r.reason AS recall_reason,
       b.batch_id, b.batch_status, d.drug_name,
       p.party_name AS manufacturer_name
FROM RECALL r
INNER JOIN BATCH b ON r.recall_id = b.recall_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
INNER JOIN PARTY p ON b.manufacturer_id = p.party_id
WHERE r.status = 'ACTIVE'
ORDER BY r.recall_date DESC, b.batch_id ASC`,
    columns: ['RECALL_ID', 'RECALL_DATE', 'RECALL_STATUS', 'RECALL_REASON', 'BATCH_ID', 'BATCH_STATUS', 'DRUG_NAME', 'MANUFACTURER_NAME']
  },
  {
    id: 'Q8',
    slug: 'recall-impact',
    title: 'Recall Impact Analysis',
    category: 'Recall Management',
    concept: 'Hierarchical Multi-Table Join (PACKAGE -> BATCH -> RECALL -> DRUG)',
    description: 'Identify individual serialized packages belonging to batches affected by active recalls for supply chain quarantine.',
    endpoint: '/api/analytics/recall-impact',
    sql: `SELECT pkg.package_id, pkg.qr_code, pkg.status AS package_status,
       pkg.package_size, pkg.quantity_total, b.batch_id, d.drug_name,
       r.recall_id, r.reason AS recall_reason, TO_CHAR(r.recall_date, 'YYYY-MM-DD') AS recall_date
FROM PACKAGE pkg
INNER JOIN BATCH b ON pkg.batch_id = b.batch_id
INNER JOIN RECALL r ON b.recall_id = r.recall_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
WHERE r.status = 'ACTIVE'
ORDER BY r.recall_id ASC, pkg.package_id ASC`,
    columns: ['PACKAGE_ID', 'QR_CODE', 'PACKAGE_STATUS', 'PACKAGE_SIZE', 'QUANTITY_TOTAL', 'BATCH_ID', 'DRUG_NAME', 'RECALL_ID', 'RECALL_REASON', 'RECALL_DATE']
  },
  {
    id: 'Q9',
    slug: 'manufacturer-performance',
    title: 'Manufacturer Performance',
    category: 'Manufacturer & Pharmacy Performance',
    concept: 'Subclass-to-Superclass Join (MANUFACTURER -> PARTY), LEFT JOIN BATCH, Aggregates & NVL',
    description: 'List manufacturers and count batches created by each, including manufacturers with zero batches.',
    endpoint: '/api/analytics/manufacturer-performance',
    sql: `SELECT m.party_id AS manufacturer_id, p.party_name AS manufacturer_name,
       m.manufacturing_license_no,
       COUNT(b.batch_id) AS total_batches,
       NVL(SUM(CASE WHEN b.batch_status = 'RELEASED' THEN 1 ELSE 0 END), 0) AS released_batches,
       NVL(SUM(CASE WHEN b.batch_status = 'RECALLED' THEN 1 ELSE 0 END), 0) AS recalled_batches
FROM MANUFACTURER m
INNER JOIN PARTY p ON m.party_id = p.party_id
LEFT JOIN BATCH b ON m.party_id = b.manufacturer_id
GROUP BY m.party_id, p.party_name, m.manufacturing_license_no
ORDER BY total_batches DESC, p.party_name ASC`,
    columns: ['MANUFACTURER_ID', 'MANUFACTURER_NAME', 'MANUFACTURING_LICENSE_NO', 'TOTAL_BATCHES', 'RELEASED_BATCHES', 'RECALLED_BATCHES']
  },
  {
    id: 'Q10',
    slug: 'pharmacy-dispensing',
    title: 'Pharmacy Dispensing Summary',
    category: 'Manufacturer & Pharmacy Performance',
    concept: 'Subclass-to-Superclass Join (PHARMACY -> PARTY), LEFT JOIN DISPENSING, Aggregates & NVL',
    description: 'List retail pharmacies and aggregate total pharmaceutical units dispensed to patients.',
    endpoint: '/api/analytics/pharmacy-dispensing',
    sql: `SELECT ph.party_id AS pharmacy_id, p.party_name AS pharmacy_name,
       ph.pharmacy_license_no, ph.hq AS headquarters,
       COUNT(d.dispense_id) AS dispensing_events_count,
       NVL(SUM(d.quantity), 0) AS total_quantity_dispensed
FROM PHARMACY ph
INNER JOIN PARTY p ON ph.party_id = p.party_id
LEFT JOIN DISPENSING d ON ph.party_id = d.pharmacy_id
GROUP BY ph.party_id, p.party_name, ph.pharmacy_license_no, ph.hq
ORDER BY total_quantity_dispensed DESC, p.party_name ASC`,
    columns: ['PHARMACY_ID', 'PHARMACY_NAME', 'PHARMACY_LICENSE_NO', 'HEADQUARTERS', 'DISPENSING_EVENTS_COUNT', 'TOTAL_QUANTITY_DISPENSED']
  },
  {
    id: 'Q11',
    slug: 'top-drugs',
    title: 'Most Frequently Batched Drugs',
    category: 'Drug & Batch Intelligence',
    concept: 'LEFT JOIN, Aggregation COUNT, Analytical Window Function DENSE_RANK()',
    description: 'Rank drugs by the number of manufactured batches associated with each therapeutic product.',
    endpoint: '/api/analytics/top-drugs',
    sql: `SELECT d.drug_id, d.drug_name, d.strength, d.dosage_form,
       COUNT(b.batch_id) AS total_batches,
       DENSE_RANK() OVER (ORDER BY COUNT(b.batch_id) DESC) AS batch_rank
FROM DRUG d
LEFT JOIN BATCH b ON d.drug_id = b.drug_id
GROUP BY d.drug_id, d.drug_name, d.strength, d.dosage_form
ORDER BY total_batches DESC, d.drug_name ASC`,
    columns: ['DRUG_ID', 'DRUG_NAME', 'STRENGTH', 'DOSAGE_FORM', 'TOTAL_BATCHES', 'BATCH_RANK']
  },
  {
    id: 'Q12',
    slug: 'undispensed-packages',
    title: 'Undispensed Packages',
    category: 'Package Tracking',
    concept: '3-Table Join, Schema Relationship & Status Verification (dispense_id IS NULL AND status <> \'DISPENSED\')',
    description: 'Find serialized packages that have not yet been dispensed to patients in the retail supply chain.',
    endpoint: '/api/analytics/undispensed-packages',
    sql: `SELECT pkg.package_id, pkg.qr_code, pkg.batch_id, d.drug_name,
       pkg.package_size, pkg.status AS package_status, pkg.quantity_total,
       TO_CHAR(pkg.packaged_at, 'YYYY-MM-DD') AS packaged_at
FROM PACKAGE pkg
INNER JOIN BATCH b ON pkg.batch_id = b.batch_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
WHERE pkg.dispense_id IS NULL AND pkg.status <> 'DISPENSED'
ORDER BY pkg.package_id ASC`,
    columns: ['PACKAGE_ID', 'QR_CODE', 'BATCH_ID', 'DRUG_NAME', 'PACKAGE_SIZE', 'PACKAGE_STATUS', 'QUANTITY_TOTAL', 'PACKAGED_AT']
  },
  {
    id: 'Q13',
    slug: 'package-shipment-history',
    title: 'Shipment History for a Package',
    category: 'Package Tracking',
    concept: '5-Table Join (PACKAGE -> CONTAINS -> SHIPMENT -> 2x PARTY), Bind Variable Parameterization',
    description: 'Given a package ID or QR code, display its complete custody transfer history across supply chain nodes.',
    endpoint: '/api/analytics/package-shipment-history/:packageId',
    sql: `SELECT pkg.package_id, pkg.qr_code, s.shipment_id,
       TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS shipment_date,
       p_sender.party_name AS sender_name, p_receiver.party_name AS receiver_name,
       s.mode AS transport_mode, s.status AS shipment_status
FROM PACKAGE pkg
INNER JOIN CONTAINS c ON pkg.package_id = c.package_id
INNER JOIN SHIPMENT s ON c.shipment_id = s.shipment_id
INNER JOIN PARTY p_sender ON s.sender_party_id = p_sender.party_id
INNER JOIN PARTY p_receiver ON s.receiver_party_id = p_receiver.party_id
WHERE pkg.qr_code = :ident OR (REGEXP_LIKE(:ident, '^[0-9]+$') AND pkg.package_id = TO_NUMBER(:ident))
ORDER BY s.shipment_date DESC, s.shipment_id DESC`,
    columns: ['PACKAGE_ID', 'QR_CODE', 'SHIPMENT_ID', 'SHIPMENT_DATE', 'SENDER_NAME', 'RECEIVER_NAME', 'TRANSPORT_MODE', 'SHIPMENT_STATUS']
  },
  {
    id: 'Q14',
    slug: 'pending-quality-tests',
    title: 'Pending or Failed Quality Tests',
    category: 'Quality & Compliance',
    concept: '4-Table Join (QUALITY_TEST -> BATCH -> DRUG -> PARTY), Set Membership Filter (status IN (\'PENDING\', \'FAILED\'))',
    description: 'List batches with pending or failed laboratory assays requiring compliance review.',
    endpoint: '/api/analytics/pending-quality-tests',
    sql: `SELECT qt.test_id, b.batch_id, d.drug_name, p.party_name AS manufacturer_name,
       qt.test_type, qt.result, qt.status AS test_status,
       TO_CHAR(qt.test_date, 'YYYY-MM-DD') AS test_date, b.batch_status
FROM QUALITY_TEST qt
INNER JOIN BATCH b ON qt.batch_id = b.batch_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
INNER JOIN PARTY p ON b.manufacturer_id = p.party_id
WHERE qt.status IN ('PENDING', 'FAILED')
ORDER BY qt.test_date DESC, b.batch_id ASC`,
    columns: ['TEST_ID', 'BATCH_ID', 'DRUG_NAME', 'MANUFACTURER_NAME', 'TEST_TYPE', 'RESULT', 'TEST_STATUS', 'TEST_DATE', 'BATCH_STATUS']
  },
  {
    id: 'Q15',
    slug: 'verify-package',
    title: 'Package Verification (360° Lineage Audit)',
    category: 'Package Tracking',
    concept: '7-Table Relational Lineage, Scalar Correlated Subqueries, Left Joins, Safe Bind Variables',
    description: 'Given a package ID or QR code, retrieve complete drug formulation, manufacturing batch, quality tests, recall status, and dispensing info.',
    endpoint: '/api/analytics/verify-package',
    sql: `SELECT pkg.package_id, pkg.qr_code, pkg.package_size, pkg.status AS package_status, pkg.quantity_total,
       TO_CHAR(pkg.packaged_at, 'YYYY-MM-DD') AS packaged_at,
       b.batch_id, b.batch_status, TO_CHAR(b.manufacture_date, 'YYYY-MM-DD') AS manufacture_date,
       d.drug_id, d.drug_name, d.strength, d.dosage_form,
       mfg_p.party_name AS manufacturer_name, mfg.manufacturing_license_no,
       r.recall_id, r.status AS recall_status, r.reason AS recall_reason, TO_CHAR(r.recall_date, 'YYYY-MM-DD') AS recall_date,
       disp.dispense_id, disp.patient_id, disp_p.party_name AS dispensing_pharmacy, TO_CHAR(disp.dispensed_at, 'YYYY-MM-DD') AS dispensed_at,
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
WHERE pkg.qr_code = :ident OR (REGEXP_LIKE(:ident, '^[0-9]+$') AND pkg.package_id = TO_NUMBER(:ident))`,
    columns: ['PACKAGE_ID', 'QR_CODE', 'PACKAGE_SIZE', 'PACKAGE_STATUS', 'QUANTITY_TOTAL', 'PACKAGED_AT', 'BATCH_ID', 'BATCH_STATUS', 'MANUFACTURE_DATE', 'DRUG_ID', 'DRUG_NAME', 'STRENGTH', 'DOSAGE_FORM', 'MANUFACTURER_NAME', 'MANUFACTURING_LICENSE_NO', 'RECALL_ID', 'RECALL_STATUS', 'RECALL_REASON', 'RECALL_DATE', 'DISPENSE_ID', 'PATIENT_ID', 'DISPENSING_PHARMACY', 'DISPENSED_AT', 'TOTAL_QUALITY_TESTS', 'PASSED_QUALITY_TESTS', 'FAILED_QUALITY_TESTS', 'PENDING_QUALITY_TESTS']
  }
];

function executeSimulatedQuery(queryKey, params = {}, data = {}) {
  const {
    parties = [],
    manufacturers = [],
    distributors = [],
    pharmacies = [],
    regulators = [],
    drugs = [],
    batches = [],
    qualityTests = [],
    recalls = [],
    packages = [],
    shipments = [],
    contains = [],
    dispensings = []
  } = data;

  const qKey = String(queryKey).toUpperCase();
  const meta = ANALYTICS_CATALOGUE.find(q => q.id === qKey || q.slug === queryKey.toLowerCase());
  if (!meta) {
    throw new Error(`Query '${queryKey}' not recognized in analytics catalogue.`);
  }

  let rows = [];

  switch (meta.id) {
    case 'Q1': {
      rows = drugs.map(d => ({
        DRUG_ID: d.drug_id,
        DRUG_NAME: d.drug_name,
        DESCRIPTION: d.description || 'Pharmaceutical preparation',
        STRENGTH: d.strength,
        DOSAGE_FORM: d.dosage_form
      })).sort((a, b) => a.DRUG_NAME.localeCompare(b.DRUG_NAME));
      break;
    }

    case 'Q2': {
      rows = batches.map(b => {
        const d = drugs.find(dr => dr.drug_id === b.drug_id);
        const p = parties.find(party => party.party_id === b.manufacturer_id);
        return {
          BATCH_ID: b.batch_id,
          DRUG_NAME: d?.drug_name || 'N/A',
          MANUFACTURER_NAME: p?.party_name || 'N/A',
          MANUFACTURE_DATE: b.manufacture_date,
          BATCH_STATUS: b.batch_status
        };
      }).sort((a, b) => a.BATCH_ID - b.BATCH_ID);
      break;
    }

    case 'Q3': {
      rows = packages.map(pkg => {
        const b = batches.find(bat => bat.batch_id === pkg.batch_id);
        const d = b ? drugs.find(dr => dr.drug_id === b.drug_id) : null;
        return {
          PACKAGE_ID: pkg.package_id,
          QR_CODE: pkg.qr_code,
          BATCH_ID: pkg.batch_id,
          DRUG_NAME: d?.drug_name || 'N/A',
          PACKAGE_SIZE: pkg.package_size,
          PACKAGE_STATUS: pkg.status,
          QUANTITY_TOTAL: pkg.quantity_total
        };
      }).sort((a, b) => a.PACKAGE_ID - b.PACKAGE_ID);
      break;
    }

    case 'Q4': {
      rows = shipments.map(s => {
        const sender = parties.find(p => p.party_id === s.sender_party_id);
        const receiver = parties.find(p => p.party_id === s.receiver_party_id);
        return {
          SHIPMENT_ID: s.shipment_id,
          SHIPMENT_DATE: s.shipment_date,
          SENDER_NAME: sender?.party_name || 'N/A',
          RECEIVER_NAME: receiver?.party_name || 'N/A',
          TRANSPORT_MODE: s.mode,
          SHIPMENT_STATUS: s.status
        };
      }).sort((a, b) => a.SHIPMENT_ID - b.SHIPMENT_ID);
      break;
    }

    case 'Q5': {
      rows = shipments.filter(s => s.status === 'IN_TRANSIT').map(s => {
        const sender = parties.find(p => p.party_id === s.sender_party_id);
        const receiver = parties.find(p => p.party_id === s.receiver_party_id);
        return {
          SHIPMENT_ID: s.shipment_id,
          SHIPMENT_DATE: s.shipment_date,
          SENDER_NAME: sender?.party_name || 'N/A',
          RECEIVER_NAME: receiver?.party_name || 'N/A',
          TRANSPORT_MODE: s.mode,
          SHIPMENT_STATUS: s.status
        };
      }).sort((a, b) => b.SHIPMENT_DATE.localeCompare(a.SHIPMENT_DATE) || a.SHIPMENT_ID - b.SHIPMENT_ID);
      break;
    }

    case 'Q6': {
      rows = qualityTests.filter(qt => qt.status === 'FAILED').map(qt => {
        const b = batches.find(bat => bat.batch_id === qt.batch_id);
        const d = b ? drugs.find(dr => dr.drug_id === b.drug_id) : null;
        return {
          TEST_ID: qt.test_id,
          TEST_DATE: qt.test_date,
          TEST_TYPE: qt.test_type,
          RESULT: qt.result,
          BATCH_ID: qt.batch_id,
          DRUG_NAME: d?.drug_name || 'N/A',
          TEST_STATUS: qt.status
        };
      }).sort((a, b) => b.TEST_DATE.localeCompare(a.TEST_DATE) || a.TEST_ID - b.TEST_ID);
      break;
    }

    case 'Q7': {
      recalls.filter(r => r.status === 'ACTIVE').forEach(r => {
        const rBatches = batches.filter(b => b.recall_id === r.recall_id);
        rBatches.forEach(b => {
          const d = drugs.find(dr => dr.drug_id === b.drug_id);
          const p = parties.find(party => party.party_id === b.manufacturer_id);
          rows.push({
            RECALL_ID: r.recall_id,
            RECALL_DATE: r.recall_date,
            RECALL_STATUS: r.status,
            RECALL_REASON: r.reason,
            BATCH_ID: b.batch_id,
            BATCH_STATUS: b.batch_status,
            DRUG_NAME: d?.drug_name || 'N/A',
            MANUFACTURER_NAME: p?.party_name || 'N/A'
          });
        });
      });
      rows.sort((a, b) => b.RECALL_DATE.localeCompare(a.RECALL_DATE) || a.BATCH_ID - b.BATCH_ID);
      break;
    }

    case 'Q8': {
      recalls.filter(r => r.status === 'ACTIVE').forEach(r => {
        const rBatches = batches.filter(b => b.recall_id === r.recall_id);
        rBatches.forEach(b => {
          const d = drugs.find(dr => dr.drug_id === b.drug_id);
          const rPkgs = packages.filter(p => p.batch_id === b.batch_id);
          rPkgs.forEach(pkg => {
            rows.push({
              PACKAGE_ID: pkg.package_id,
              QR_CODE: pkg.qr_code,
              PACKAGE_STATUS: pkg.status,
              PACKAGE_SIZE: pkg.package_size,
              QUANTITY_TOTAL: pkg.quantity_total,
              BATCH_ID: b.batch_id,
              DRUG_NAME: d?.drug_name || 'N/A',
              RECALL_ID: r.recall_id,
              RECALL_REASON: r.reason,
              RECALL_DATE: r.recall_date
            });
          });
        });
      });
      rows.sort((a, b) => a.RECALL_ID - b.RECALL_ID || a.PACKAGE_ID - b.PACKAGE_ID);
      break;
    }

    case 'Q9': {
      rows = manufacturers.map(m => {
        const p = parties.find(party => party.party_id === m.party_id);
        const mBatches = batches.filter(b => b.manufacturer_id === m.party_id);
        return {
          MANUFACTURER_ID: m.party_id,
          MANUFACTURER_NAME: p?.party_name || 'N/A',
          MANUFACTURING_LICENSE_NO: m.manufacturing_license_no,
          TOTAL_BATCHES: mBatches.length,
          RELEASED_BATCHES: mBatches.filter(b => b.batch_status === 'RELEASED').length,
          RECALLED_BATCHES: mBatches.filter(b => b.batch_status === 'RECALLED').length
        };
      }).sort((a, b) => b.TOTAL_BATCHES - a.TOTAL_BATCHES || a.MANUFACTURER_NAME.localeCompare(b.MANUFACTURER_NAME));
      break;
    }

    case 'Q10': {
      rows = pharmacies.map(ph => {
        const p = parties.find(party => party.party_id === ph.party_id);
        const pDisps = dispensings.filter(d => d.pharmacy_id === ph.party_id);
        const totalQty = pDisps.reduce((acc, d) => acc + (d.quantity || 0), 0);
        return {
          PHARMACY_ID: ph.party_id,
          PHARMACY_NAME: p?.party_name || 'N/A',
          PHARMACY_LICENSE_NO: ph.pharmacy_license_no,
          HEADQUARTERS: ph.hq,
          DISPENSING_EVENTS_COUNT: pDisps.length,
          TOTAL_QUANTITY_DISPENSED: totalQty
        };
      }).sort((a, b) => b.TOTAL_QUANTITY_DISPENSED - a.TOTAL_QUANTITY_DISPENSED || a.PHARMACY_NAME.localeCompare(b.PHARMACY_NAME));
      break;
    }

    case 'Q11': {
      const batchCounts = drugs.map(d => {
        const count = batches.filter(b => b.drug_id === d.drug_id).length;
        return {
          DRUG_ID: d.drug_id,
          DRUG_NAME: d.drug_name,
          STRENGTH: d.strength,
          DOSAGE_FORM: d.dosage_form,
          TOTAL_BATCHES: count
        };
      }).sort((a, b) => b.TOTAL_BATCHES - a.TOTAL_BATCHES || a.DRUG_NAME.localeCompare(b.DRUG_NAME));

      let rank = 1;
      rows = batchCounts.map((item, idx) => {
        if (idx > 0 && item.TOTAL_BATCHES < batchCounts[idx - 1].TOTAL_BATCHES) {
          rank = idx + 1;
        }
        return { ...item, BATCH_RANK: rank };
      });
      break;
    }

    case 'Q12': {
      rows = packages.filter(pkg => !pkg.dispense_id && pkg.status !== 'DISPENSED').map(pkg => {
        const b = batches.find(bat => bat.batch_id === pkg.batch_id);
        const d = b ? drugs.find(dr => dr.drug_id === b.drug_id) : null;
        return {
          PACKAGE_ID: pkg.package_id,
          QR_CODE: pkg.qr_code,
          BATCH_ID: pkg.batch_id,
          DRUG_NAME: d?.drug_name || 'N/A',
          PACKAGE_SIZE: pkg.package_size,
          PACKAGE_STATUS: pkg.status,
          QUANTITY_TOTAL: pkg.quantity_total,
          PACKAGED_AT: pkg.packaged_at
        };
      }).sort((a, b) => a.PACKAGE_ID - b.PACKAGE_ID);
      break;
    }

    case 'Q13': {
      const targetId = params.packageId || params.ident || params.identifier || 'QR-MED-208-01-G1';
      const cleanId = String(targetId).trim().toLowerCase();
      const pkg = packages.find(p => p.qr_code.toLowerCase() === cleanId || String(p.package_id) === cleanId) || packages[0];
      if (pkg) {
        const relatedShipmentIds = contains.filter(c => c.package_id === pkg.package_id).map(c => c.shipment_id);
        rows = shipments.filter(s => relatedShipmentIds.includes(s.shipment_id)).map(s => {
          const sender = parties.find(p => p.party_id === s.sender_party_id);
          const receiver = parties.find(p => p.party_id === s.receiver_party_id);
          return {
            PACKAGE_ID: pkg.package_id,
            QR_CODE: pkg.qr_code,
            SHIPMENT_ID: s.shipment_id,
            SHIPMENT_DATE: s.shipment_date,
            SENDER_NAME: sender?.party_name || 'N/A',
            RECEIVER_NAME: receiver?.party_name || 'N/A',
            TRANSPORT_MODE: s.mode,
            SHIPMENT_STATUS: s.status
          };
        }).sort((a, b) => b.SHIPMENT_DATE.localeCompare(a.SHIPMENT_DATE));
      }
      break;
    }

    case 'Q14': {
      rows = qualityTests.filter(qt => qt.status === 'PENDING' || qt.status === 'FAILED').map(qt => {
        const b = batches.find(bat => bat.batch_id === qt.batch_id);
        const d = b ? drugs.find(dr => dr.drug_id === b.drug_id) : null;
        const p = b ? parties.find(party => party.party_id === b.manufacturer_id) : null;
        return {
          TEST_ID: qt.test_id,
          BATCH_ID: qt.batch_id,
          DRUG_NAME: d?.drug_name || 'N/A',
          MANUFACTURER_NAME: p?.party_name || 'N/A',
          TEST_TYPE: qt.test_type,
          RESULT: qt.result,
          TEST_STATUS: qt.status,
          TEST_DATE: qt.test_date,
          BATCH_STATUS: b?.batch_status || 'UNKNOWN'
        };
      }).sort((a, b) => b.TEST_DATE.localeCompare(a.TEST_DATE) || a.BATCH_ID - b.BATCH_ID);
      break;
    }

    case 'Q15': {
      const targetId = params.identifier || params.packageId || params.ident || 'QR-MED-208-01-G1';
      const cleanId = String(targetId).trim().toLowerCase();
      const pkg = packages.find(p => p.qr_code.toLowerCase() === cleanId || String(p.package_id) === cleanId);
      if (pkg) {
        const b = batches.find(bat => bat.batch_id === pkg.batch_id);
        const d = b ? drugs.find(dr => dr.drug_id === b.drug_id) : null;
        const p = b ? parties.find(party => party.party_id === b.manufacturer_id) : null;
        const mfg = p ? manufacturers.find(m => m.party_id === p.party_id) : null;
        const r = b && b.recall_id ? recalls.find(rec => rec.recall_id === b.recall_id) : null;
        const disp = pkg.dispense_id ? dispensings.find(di => di.dispense_id === pkg.dispense_id) : null;
        const dispP = disp ? parties.find(party => party.party_id === disp.pharmacy_id) : null;
        const bTests = b ? qualityTests.filter(qt => qt.batch_id === b.batch_id) : [];

        rows.push({
          PACKAGE_ID: pkg.package_id,
          QR_CODE: pkg.qr_code,
          PACKAGE_SIZE: pkg.package_size,
          PACKAGE_STATUS: pkg.status,
          QUANTITY_TOTAL: pkg.quantity_total,
          PACKAGED_AT: pkg.packaged_at,
          BATCH_ID: b?.batch_id || null,
          BATCH_STATUS: b?.batch_status || 'N/A',
          MANUFACTURE_DATE: b?.manufacture_date || 'N/A',
          DRUG_ID: d?.drug_id || null,
          DRUG_NAME: d?.drug_name || 'N/A',
          STRENGTH: d?.strength || 'N/A',
          DOSAGE_FORM: d?.dosage_form || 'N/A',
          MANUFACTURER_NAME: p?.party_name || 'N/A',
          MANUFACTURING_LICENSE_NO: mfg?.manufacturing_license_no || 'N/A',
          RECALL_ID: r?.recall_id || null,
          RECALL_STATUS: r?.status || 'NONE',
          RECALL_REASON: r?.reason || 'No active recall',
          RECALL_DATE: r?.recall_date || 'N/A',
          DISPENSE_ID: disp?.dispense_id || null,
          PATIENT_ID: disp?.patient_id || 'NOT_DISPENSED',
          DISPENSING_PHARMACY: dispP?.party_name || 'N/A',
          DISPENSED_AT: disp?.dispensed_at || 'N/A',
          TOTAL_QUALITY_TESTS: bTests.length,
          PASSED_QUALITY_TESTS: bTests.filter(t => t.status === 'PASSED').length,
          FAILED_QUALITY_TESTS: bTests.filter(t => t.status === 'FAILED').length,
          PENDING_QUALITY_TESTS: bTests.filter(t => t.status === 'PENDING').length
        });
      }
      break;
    }
  }

  return {
    queryId: meta.id,
    slug: meta.slug,
    title: meta.title,
    category: meta.category,
    concept: meta.concept,
    description: meta.description,
    sql: meta.sql,
    columns: meta.columns,
    rows
  };
}

module.exports = {
  ANALYTICS_CATALOGUE,
  executeSimulatedQuery
};
