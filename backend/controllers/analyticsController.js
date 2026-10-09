const db = require('../config/db');
const { ANALYTICS_CATALOGUE, executeSimulatedQuery } = require('../services/analyticsService');

// Map query IDs and slugs to their metadata
const QUERY_MAP = {};
ANALYTICS_CATALOGUE.forEach(q => {
  QUERY_MAP[q.id.toUpperCase()] = q;
  QUERY_MAP[q.slug.toLowerCase()] = q;
});

/**
 * Helper to execute a query either against live Oracle or simulation fallback
 */
async function executeAnalytics(meta, params = {}) {
  const isOracle = db.isUsingOracle();

  if (isOracle) {
    let sql = meta.sql;
    let binds = {};

    // Parameterized queries (Q13, Q15)
    if (meta.id === 'Q13') {
      const ident = String(params.packageId || params.ident || params.identifier || 'QR-MED-208-01-G1').trim();
      binds = { ident };
    } else if (meta.id === 'Q15') {
      const ident = String(params.identifier || params.packageId || params.id || params.ident || 'QR-MED-208-01-G1').trim();
      binds = { ident };
    }

    const result = await db.execute(sql, binds);
    const rows = result.rows || [];
    const columns = result.metaData ? result.metaData.map(c => c.name) : meta.columns;

    return {
      success: true,
      queryId: meta.id,
      slug: meta.slug,
      title: meta.title,
      category: meta.category,
      concept: meta.concept,
      description: meta.description,
      sql: meta.sql,
      columns,
      rows,
      count: rows.length,
      executionEngine: 'Oracle 21c Database Engine (Live)'
    };
  } else {
    // In-memory simulation fallback matching exact Oracle schema
    const simulated = db.mock.runAnalyticsQuery(meta.id, params);
    return {
      success: true,
      ...simulated,
      count: simulated.rows.length,
      executionEngine: 'MedLedger Analytical Simulation Engine (Oracle Offline Fallback)'
    };
  }
}

// ----------------------------------------------------------------------------
// Catalog Index: list all 15 queries with metadata and categories
// ----------------------------------------------------------------------------
exports.getQueriesList = (req, res) => {
  res.json({
    success: true,
    count: ANALYTICS_CATALOGUE.length,
    databaseMode: db.isUsingOracle() ? 'ORACLE_21C_LIVE' : 'SIMULATION_STORAGE',
    data: ANALYTICS_CATALOGUE
  });
};

// ----------------------------------------------------------------------------
// Dynamic query runner by query ID (e.g. Q1..Q15) or slug
// ----------------------------------------------------------------------------
exports.runQuery = async (req, res, next) => {
  try {
    const { queryId } = req.params;
    const key = queryId.toUpperCase();
    const meta = QUERY_MAP[key] || QUERY_MAP[queryId.toLowerCase()];

    if (!meta) {
      return res.status(404).json({
        success: false,
        error: `Query '${queryId}' not recognized in MedLedger catalogue (Valid: Q1 to Q15).`
      });
    }

    const params = { ...req.query, ...req.params };
    const result = await executeAnalytics(meta, params);
    return res.json(result);
  } catch (err) {
    console.error(`[Analytics Error - ${req.params.queryId}]:`, err.message);
    return res.status(500).json({
      success: false,
      error: `Query execution failed: ${err.message || 'Database error occurred'}`,
      queryId: req.params.queryId
    });
  }
};

// ----------------------------------------------------------------------------
// Dedicated Endpoint Handlers (Phase 3 requirements)
// ----------------------------------------------------------------------------

// Query 1: Drug Catalogue
exports.getDrugCatalogue = async (req, res) => {
  try {
    const meta = QUERY_MAP['Q1'];
    const result = await executeAnalytics(meta);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Query 2: Batch Traceability
exports.getBatchTraceability = async (req, res) => {
  try {
    const meta = QUERY_MAP['Q2'];
    const result = await executeAnalytics(meta);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Query 3: Package Inventory
exports.getPackageInventory = async (req, res) => {
  try {
    const meta = QUERY_MAP['Q3'];
    const result = await executeAnalytics(meta);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Query 4: Shipment Tracking
exports.getShipmentTracking = async (req, res) => {
  try {
    const meta = QUERY_MAP['Q4'];
    const result = await executeAnalytics(meta);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Query 5: In-Transit Shipments
exports.getInTransitShipments = async (req, res) => {
  try {
    const meta = QUERY_MAP['Q5'];
    const result = await executeAnalytics(meta);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Query 6: Failed Quality Tests
exports.getFailedQualityTests = async (req, res) => {
  try {
    const meta = QUERY_MAP['Q6'];
    const result = await executeAnalytics(meta);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Query 7: Active Recalls
exports.getActiveRecalls = async (req, res) => {
  try {
    const meta = QUERY_MAP['Q7'];
    const result = await executeAnalytics(meta);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Query 8: Recall Impact Analysis
exports.getRecallImpact = async (req, res) => {
  try {
    const meta = QUERY_MAP['Q8'];
    const result = await executeAnalytics(meta);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Query 9: Manufacturer Performance
exports.getManufacturerPerformance = async (req, res) => {
  try {
    const meta = QUERY_MAP['Q9'];
    const result = await executeAnalytics(meta);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Query 10: Pharmacy Dispensing Summary
exports.getPharmacyDispensing = async (req, res) => {
  try {
    const meta = QUERY_MAP['Q10'];
    const result = await executeAnalytics(meta);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Query 11: Most Frequently Batched Drugs (Top Drugs)
exports.getTopDrugs = async (req, res) => {
  try {
    const meta = QUERY_MAP['Q11'];
    const result = await executeAnalytics(meta);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Query 12: Undispensed Packages
exports.getUndispensedPackages = async (req, res) => {
  try {
    const meta = QUERY_MAP['Q12'];
    const result = await executeAnalytics(meta);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Query 13: Shipment History for a Package
exports.getPackageShipmentHistory = async (req, res) => {
  try {
    const meta = QUERY_MAP['Q13'];
    const packageId = req.params.packageId || req.query.packageId || req.query.qr || req.query.ident;
    const result = await executeAnalytics(meta, { packageId });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Query 14: Pending or Failed Quality Tests
exports.getPendingQualityTests = async (req, res) => {
  try {
    const meta = QUERY_MAP['Q14'];
    const result = await executeAnalytics(meta);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Query 15: Package Verification (Lineage Audit)
exports.getVerifyPackage = async (req, res) => {
  try {
    const meta = QUERY_MAP['Q15'];
    const identifier = req.query.identifier || req.query.packageId || req.query.id || req.query.qr || 'QR-MED-208-01-G1';
    const result = await executeAnalytics(meta, { identifier });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
