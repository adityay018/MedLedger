// ============================================================================
// SCRIPT: test_plsql.js
// PROJECT: MedLedger — PL/SQL Verification & Trigger Simulation Test Suite
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
  console.log(' MEDLEDGER: PL/SQL ROUTINES & TRIGGER AUTOMATED TEST SUITE');
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
    // 1. Health & Database Mode check
    console.log('--- 1. Operational Mode Verification ---');
    const health = await apiCall('GET', '/health');
    assert(health.status === 200, 'Health endpoint responds with 200');
    console.log(`     Active Database Mode: ${health.body.databaseMode}`);
    console.log(`     Is Oracle Connected: ${health.body.database.isOracleConnected}`);
    console.log(`     Storage: ${health.body.database.storageType}`);

    // 2. PL/SQL PROCEDURE: register_batch
    console.log('\n--- 2. Testing register_batch PL/SQL Procedure ---');
    
    // Case 2A: Valid Batch Registration
    const validBatch = await apiCall('POST', '/batches', {
      drug_id: 102, // Remdesivir
      manufacturer_id: 2, // Novartis
      manufacture_date: '2026-03-15',
      batch_status: 'RELEASED'
    });
    assert(validBatch.status === 201 && validBatch.body.data.batch_id, 
      `register_batch successfully created Batch #${validBatch.body.data?.batch_id}`);

    // Case 2B: Invalid Manufacturer (Party ID 9 is CVS Pharmacy, not in MANUFACTURER table)
    const invalidMfg = await apiCall('POST', '/batches', {
      drug_id: 101,
      manufacturer_id: 9,
      manufacture_date: '2026-03-15',
      batch_status: 'RELEASED'
    });
    assert(invalidMfg.status >= 400, 
      'register_batch correctly rejects Party ID 9 (non-manufacturer party)');

    // Case 2C: Invalid Drug ID (Drug ID 9999 does not exist in DRUG table)
    const invalidDrug = await apiCall('POST', '/batches', {
      drug_id: 9999,
      manufacturer_id: 1,
      manufacture_date: '2026-03-15',
      batch_status: 'RELEASED'
    });
    assert(invalidDrug.status >= 400, 
      'register_batch correctly rejects non-existent Drug ID');

    // 3. PL/SQL PROCEDURE: register_shipment
    console.log('\n--- 3. Testing register_shipment PL/SQL Procedure ---');

    // Case 3A: Valid Shipment Registration
    const validShipment = await apiCall('POST', '/shipments', {
      sender_party_id: 1, // Pfizer
      receiver_party_id: 5, // AmerisourceBergen
      shipment_date: '2026-03-15',
      status: 'CREATED',
      mode: 'COLD_CHAIN_TRUCK',
      package_ids: []
    });
    assert(validShipment.status === 201 && validShipment.body.data?.shipment_id, 
      `register_shipment successfully created Shipment #${validShipment.body.data?.shipment_id}`);

    // Case 3B: Identical Sender and Receiver Parties
    const identicalParties = await apiCall('POST', '/shipments', {
      sender_party_id: 2,
      receiver_party_id: 2,
      shipment_date: '2026-03-15',
      status: 'CREATED',
      mode: 'ROAD_LOGISTICS',
      package_ids: []
    });
    assert(identicalParties.status === 400, 
      'register_shipment rejects identical sender and receiver parties');

    // Case 3C: Invalid Transport Mode
    const invalidMode = await apiCall('POST', '/shipments', {
      sender_party_id: 1,
      receiver_party_id: 6,
      shipment_date: '2026-03-15',
      status: 'CREATED',
      mode: 'SUBMARINE_FREIGHT',
      package_ids: []
    });
    assert(invalidMode.status >= 400, 
      'register_shipment rejects invalid transport mode not in domain');

    // 4. PL/SQL PROCEDURE: process_recall
    console.log('\n--- 4. Testing process_recall PL/SQL Procedure ---');
    
    // Create a new recall notice
    const newRecall = await apiCall('POST', '/recalls', {
      recall_date: '2026-03-15',
      status: 'INITIATED',
      reason: 'Particulate matter detected in quality retention sample',
      batch_ids: [validBatch.body.data.batch_id]
    });
    const recallId = newRecall.body.data?.recall_id;
    assert(newRecall.status === 201 && recallId, `Created Recall notice #${recallId}`);

    // Execute PL/SQL process_recall
    const processResult = await apiCall('POST', `/recalls/${recallId}/process`);
    assert(processResult.status === 200 && processResult.body.success, 
      `process_recall executed successfully on Recall #${recallId}`);

    // Verify batch status was changed to RECALLED
    const checkedBatch = await apiCall('GET', `/batches/${validBatch.body.data.batch_id}`);
    assert(checkedBatch.status === 200 && checkedBatch.body.data.batch_status === 'RECALLED', 
      `Batch #${validBatch.body.data.batch_id} status updated to RECALLED`);

    // 5. PL/SQL FUNCTION: get_recall_impact / recall_impact
    console.log('\n--- 5. Testing get_recall_impact PL/SQL Function ---');
    const impactResult = await apiCall('GET', `/recalls/${recallId}/impact`);
    assert(impactResult.status === 200 && impactResult.body.impact_summary, 
      `get_recall_impact returned summary: "${impactResult.body.impact_summary}"`);

    // 6. PL/SQL FUNCTION: verify_package
    console.log('\n--- 6. Testing verify_package PL/SQL Function ---');

    // Authentic package
    const authPkg = await apiCall('GET', '/packages/verify/QR-MED-208-01-G1');
    assert(authPkg.status === 200 && authPkg.body.verdict.startsWith('VERIFIED'), 
      `verify_package identifies authentic package (Verdict: ${authPkg.body.verdict})`);

    // Recalled package
    const recPkg = await apiCall('GET', '/packages/verify/QR-MED-201-01-A1');
    assert(recPkg.status === 200 && recPkg.body.verdict === 'RECALL ALERT', 
      `verify_package identifies recalled package (Verdict: ${recPkg.body.verdict})`);

    // Failed quality test package
    const failPkg = await apiCall('GET', '/packages/verify/QR-MED-209-01-N1');
    assert(failPkg.status === 200 && failPkg.body.verdict === 'QUALITY WARNING', 
      `verify_package identifies failed quality test package (Verdict: ${failPkg.body.verdict})`);

    // Counterfeit / Non-existent package
    const fakePkg = await apiCall('GET', '/packages/verify/QR-COUNTERFEIT-UNKNOWN');
    assert(fakePkg.status === 200 && fakePkg.body.verdict === 'NOT FOUND', 
      `verify_package identifies invalid QR code (Verdict: ${fakePkg.body.verdict})`);

    // 7. TRIGGERS: trg_package_state_transition & trg_check_package_qty
    console.log('\n--- 7. Testing Triggers & Domain State Transition Guards ---');

    // Trigger trg_check_package_qty: negative or zero quantity
    const badQtyPkg = await apiCall('POST', '/packages', {
      batch_id: 202,
      package_size: '500 ml Vial',
      qr_code: `QR-BAD-QTY-${Date.now()}`,
      status: 'PACKAGED',
      quantity_total: -10
    });
    assert(badQtyPkg.status >= 400, 
      'trg_check_package_qty blocks package insertion with quantity <= 0');

    // Trigger trg_package_state_transition: attempt to dispense a RECALLED package (Package 1 is recalled)
    const badDispense = await apiCall('PUT', '/packages/1', {
      status: 'DISPENSED'
    });
    assert(badDispense.status >= 400, 
      'trg_package_state_transition blocks dispensing a RECALLED package unit');

    console.log('\n================================================================');
    console.log(` PL/SQL TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTestSuite();
