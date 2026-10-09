// ============================================================================
// SCRIPT: test_analytics.js
// PROJECT: MedLedger DBMS - Automated Phase 3 Analytics & Verification Test Suite
// ============================================================================

const http = require('http');

function apiCall(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:5000/api${path}`);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('================================================================');
  console.log(' MEDLEDGER PHASE 3: AUTOMATED ANALYTICS & VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health & Database Mode
    console.log('--- 1. Testing System Health & Engine Mode ---');
    const health = await apiCall('GET', '/health');
    assert(health.status === 200, 'Health endpoint responds with 200');
    console.log(`     Active Database Mode: ${health.body.databaseMode}`);

    // 2. Analytics Catalogue
    console.log('\n--- 2. Testing Analytics Catalogue Metadata ---');
    const catalog = await apiCall('GET', '/analytics');
    assert(catalog.status === 200 && catalog.body.success === true, 'GET /api/analytics returns 200');
    assert(catalog.body.count === 15, `Catalogue exposes exactly 15 queries (found ${catalog.body.count})`);

    // 3. Testing All 15 Dedicated Endpoints
    console.log('\n--- 3. Testing 15 Dedicated Query Endpoints ---');

    // Q1
    const q1 = await apiCall('GET', '/analytics/drug-catalogue');
    assert(q1.status === 200 && q1.body.queryId === 'Q1' && q1.body.rows.length > 0, 
      `Q1: Drug Catalogue returned ${q1.body.rows?.length} drugs`);

    // Q2
    const q2 = await apiCall('GET', '/analytics/batch-traceability');
    assert(q2.status === 200 && q2.body.queryId === 'Q2' && q2.body.rows.length > 0, 
      `Q2: Batch Traceability returned ${q2.body.rows?.length} batches`);

    // Q3
    const q3 = await apiCall('GET', '/analytics/package-inventory');
    assert(q3.status === 200 && q3.body.queryId === 'Q3' && q3.body.rows.length > 0, 
      `Q3: Package Inventory returned ${q3.body.rows?.length} packages`);

    // Q4
    const q4 = await apiCall('GET', '/analytics/shipment-tracking');
    assert(q4.status === 200 && q4.body.queryId === 'Q4' && q4.body.rows.length > 0, 
      `Q4: Shipment Tracking returned ${q4.body.rows?.length} shipments`);

    // Q5
    const q5 = await apiCall('GET', '/analytics/in-transit-shipments');
    assert(q5.status === 200 && q5.body.queryId === 'Q5', 
      `Q5: In-Transit Shipments returned ${q5.body.rows?.length} in-transit shipments`);

    // Q6
    const q6 = await apiCall('GET', '/analytics/failed-quality-tests');
    assert(q6.status === 200 && q6.body.queryId === 'Q6' && q6.body.rows.length > 0, 
      `Q6: Failed Quality Tests returned ${q6.body.rows?.length} failed assays`);

    // Q7
    const q7 = await apiCall('GET', '/analytics/active-recalls');
    assert(q7.status === 200 && q7.body.queryId === 'Q7', 
      `Q7: Active Recalls returned ${q7.body.rows?.length} active recall notices`);

    // Q8
    const q8 = await apiCall('GET', '/analytics/recall-impact');
    assert(q8.status === 200 && q8.body.queryId === 'Q8', 
      `Q8: Recall Impact Analysis returned ${q8.body.rows?.length} quarantined packages`);

    // Q9
    const q9 = await apiCall('GET', '/analytics/manufacturer-performance');
    assert(q9.status === 200 && q9.body.queryId === 'Q9' && q9.body.rows.length > 0, 
      `Q9: Manufacturer Performance returned ${q9.body.rows?.length} manufacturers`);

    // Q10
    const q10 = await apiCall('GET', '/analytics/pharmacy-dispensing');
    assert(q10.status === 200 && q10.body.queryId === 'Q10' && q10.body.rows.length > 0, 
      `Q10: Pharmacy Dispensing Summary returned ${q10.body.rows?.length} pharmacies`);

    // Q11
    const q11 = await apiCall('GET', '/analytics/top-drugs');
    assert(q11.status === 200 && q11.body.queryId === 'Q11' && q11.body.rows.length > 0, 
      `Q11: Most Frequently Batched Drugs returned ${q11.body.rows?.length} ranked drugs`);

    // Q12
    const q12 = await apiCall('GET', '/analytics/undispensed-packages');
    assert(q12.status === 200 && q12.body.queryId === 'Q12' && q12.body.rows.length > 0, 
      `Q12: Undispensed Packages returned ${q12.body.rows?.length} un-dispensed units`);

    // Q13
    const q13 = await apiCall('GET', '/analytics/package-shipment-history/QR-MED-208-01-G1');
    assert(q13.status === 200 && q13.body.queryId === 'Q13', 
      `Q13: Shipment History for Package returned ${q13.body.rows?.length} custody transfers`);

    // Q14
    const q14 = await apiCall('GET', '/analytics/pending-quality-tests');
    assert(q14.status === 200 && q14.body.queryId === 'Q14' && q14.body.rows.length > 0, 
      `Q14: Pending or Failed Quality Tests returned ${q14.body.rows?.length} test items`);

    // Q15
    const q15 = await apiCall('GET', '/analytics/verify-package?identifier=QR-MED-208-01-G1');
    assert(q15.status === 200 && q15.body.queryId === 'Q15' && q15.body.rows.length > 0, 
      `Q15: Package Verification Audit returned verified lineage tuple`);

    // 4. Verification Endpoint Logic (Phase 5 Verdicts)
    console.log('\n--- 4. Testing Package Verification Scenarios (Phase 5) ---');

    // Case A: Authentic Valid Package
    const vValid = await apiCall('GET', '/packages/verify/QR-MED-208-01-G1');
    assert(vValid.status === 200 && vValid.body.verdict.startsWith('VERIFIED'), 
      `Valid package returns VERIFIED verdict (Got: ${vValid.body.verdict})`);
    assert(vValid.body.package?.shipment_history !== undefined, 
      'Package verification payload includes shipment_history');

    // Case B: Recalled Lot
    const vRecall = await apiCall('GET', '/packages/verify/QR-MED-201-01-A1');
    assert(vRecall.status === 200 && vRecall.body.verdict === 'RECALL ALERT', 
      `Recalled package returns RECALL ALERT verdict (Got: ${vRecall.body.verdict})`);

    // Case C: Failed Quality Test (Batch 209 has failed thermal stability assay, no active recall)
    const vQuality = await apiCall('GET', '/packages/verify/QR-MED-209-01-N1');
    assert(vQuality.status === 200 && vQuality.body.verdict === 'QUALITY WARNING', 
      `Failed assay package returns QUALITY WARNING verdict (Got: ${vQuality.body.verdict})`);

    // Case D: Not Found / Invalid QR
    const vNotFound = await apiCall('GET', '/packages/verify/QR-COUNTERFEIT-FAKE-999');
    assert(vNotFound.status === 200 && vNotFound.body.verdict === 'NOT FOUND', 
      `Unregistered identifier returns NOT FOUND verdict (Got: ${vNotFound.body.verdict})`);

    // 5. Query Dynamic Route & 404 Handling
    console.log('\n--- 5. Testing Error Boundaries & Dynamic Routes ---');
    const dynamicQ1 = await apiCall('GET', '/analytics/Q1');
    assert(dynamicQ1.status === 200 && dynamicQ1.body.queryId === 'Q1', 
      'Dynamic lookup /api/analytics/Q1 resolves correctly');

    const invalidQ = await apiCall('GET', '/analytics/Q99');
    assert(invalidQ.status === 404, 'Invalid query ID Q99 returns 404 Not Found');

    // 6. Regression: Check Existing CRUD
    console.log('\n--- 6. Verifying Existing CRUD Endpoints Intact ---');
    const drugsRes = await apiCall('GET', '/drugs');
    assert(drugsRes.status === 200 && Array.isArray(drugsRes.body.data), 'GET /api/drugs functions normally');

    const batchesRes = await apiCall('GET', '/batches');
    assert(batchesRes.status === 200 && Array.isArray(batchesRes.body.data), 'GET /api/batches functions normally');

    const pkgsRes = await apiCall('GET', '/packages');
    assert(pkgsRes.status === 200 && Array.isArray(pkgsRes.body.data), 'GET /api/packages functions normally');

    console.log('\n================================================================');
    console.log(` TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  }
}

runTestSuite();
