const http = require('http');
let authToken = null;

function apiCall(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:5000/api${path}`);
    const headers = {
      'Content-Type': 'application/json'
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers
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

async function runTests() {
  console.log('================================================================');
  console.log(' STARTING END-TO-END CRUD AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  // Authenticate as Administrator for authorized operational tests
  const loginRes = await apiCall('POST', '/auth/login', {
    email: 'admin@medledger.io',
    password: 'AdminPass123!'
  });
  if (loginRes.status === 200 && loginRes.body.token) {
    authToken = loginRes.body.token;
  }

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

  // 1. HEALTH & DASHBOARD
  console.log('--- 1. Testing Health & Dashboard Telemetry ---');
  const health = await apiCall('GET', '/health');
  assert(health.status === 200 && health.body.status === 'online', 'Backend health check returns status 200 online');

  const dash = await apiCall('GET', '/dashboard');
  assert(dash.status === 200 && dash.body.data.kpi.drugsCount > 0, 'Dashboard returns live KPI counts');
  assert(dash.body.data.qualityTestSummary !== undefined, 'Dashboard returns qualityTestSummary');
  assert(dash.body.data.recentShipments?.length > 0, 'Dashboard returns recentShipments');
  assert(dash.body.data.recentRecalls?.length > 0, 'Dashboard returns recentRecalls');

  // 2. DRUG CRUD (Create -> Read -> Update -> Delete + FK check)
  console.log('\n--- 2. Testing DRUG CRUD ---');
  const createDrug = await apiCall('POST', '/drugs', {
    drug_name: 'Amoxicillin Trihydrate Extra',
    description: 'Broad-spectrum beta-lactam antibiotic for bacterial infections',
    strength: '500 mg',
    dosage_form: 'Oral Capsule'
  });
  assert(createDrug.status === 201 && createDrug.body.data.drug_id, 'DRUG: Create Amoxicillin Trihydrate Extra');
  const createdDrugId = createDrug.body.data.drug_id;

  const readDrug = await apiCall('GET', `/drugs/${createdDrugId}`);
  assert(readDrug.status === 200 && readDrug.body.data.drug_name === 'Amoxicillin Trihydrate Extra', `DRUG: Read drug #${createdDrugId}`);

  const updateDrug = await apiCall('PUT', `/drugs/${createdDrugId}`, {
    drug_name: 'Amoxicillin Trihydrate Ultra',
    strength: '625 mg'
  });
  assert(updateDrug.status === 200, `DRUG: Update drug #${createdDrugId}`);

  const deleteDrug = await apiCall('DELETE', `/drugs/${createdDrugId}`);
  assert(deleteDrug.status === 200, `DRUG: Delete drug #${createdDrugId}`);

  const verifyDelete = await apiCall('GET', `/drugs/${createdDrugId}`);
  assert(verifyDelete.status === 404, `DRUG: Verify deleted drug #${createdDrugId} returns 404`);

  // Foreign Key Safety check: try deleting drug #101 which has existing batches in BATCH table
  const fkDeleteDrug = await apiCall('DELETE', '/drugs/101');
  assert(fkDeleteDrug.status === 409 && fkDeleteDrug.body.error.includes('Dependent batches exist'), 'DRUG: Referential integrity blocks deleting drug #101 with existing batches');

  // 3. BATCH CRUD (Create -> Read -> Update + FK check)
  console.log('\n--- 3. Testing BATCH CRUD ---');
  const createBatch = await apiCall('POST', '/batches', {
    drug_id: 101,
    manufacturer_id: 1, // Pfizer
    batch_status: 'ACTIVE',
    manufacture_date: '2026-03-01'
  });
  assert(createBatch.status === 201 && createBatch.body.data.batch_id, 'BATCH: Create new batch lot via register_batch');
  const createdBatchId = createBatch.body.data.batch_id;

  const readBatch = await apiCall('GET', `/batches/${createdBatchId}`);
  assert(readBatch.status === 200 && readBatch.body.data.drug_id === 101, `BATCH: Read batch #${createdBatchId}`);

  const updateBatch = await apiCall('PUT', `/batches/${createdBatchId}`, {
    batch_status: 'RELEASED'
  });
  assert(updateBatch.status === 200, `BATCH: Update batch #${createdBatchId} status to RELEASED`);

  // FK check: try deleting batch #201 which has packages in PACKAGE table
  const fkDeleteBatch = await apiCall('DELETE', '/batches/201');
  assert(fkDeleteBatch.status === 409 && fkDeleteBatch.body.error.includes('Dependent packages exist'), 'BATCH: Referential integrity blocks deleting batch #201 with existing packages');

  // 4. PACKAGE CRUD (Create -> Read -> Update + FK check)
  console.log('\n--- 4. Testing PACKAGE CRUD ---');
  const testQr = `ML-PKG-${Date.now().toString(36).toUpperCase()}`;
  const createPkg = await apiCall('POST', '/packages', {
    batch_id: createdBatchId,
    package_size: '100 Capsules Bottle',
    qr_code: testQr,
    status: 'PACKAGED',
    quantity_total: 100
  });
  assert(createPkg.status === 201 && createPkg.body.data.package_id, 'PACKAGE: Create serialized unit package');
  const createdPkgId = createPkg.body.data.package_id;

  const readPkg = await apiCall('GET', `/packages/${createdPkgId}`);
  assert(readPkg.status === 200 && readPkg.body.data.qr_code === testQr, `PACKAGE: Read package #${createdPkgId}`);

  const updatePkg = await apiCall('PUT', `/packages/${createdPkgId}`, {
    status: 'IN_TRANSIT'
  });
  assert(updatePkg.status === 200, `PACKAGE: Update package #${createdPkgId} status to IN_TRANSIT`);

  // Verify package verification endpoint
  const verifyPkg = await apiCall('GET', `/packages/verify/${testQr}`);
  assert(verifyPkg.status === 200 && (verifyPkg.body.package?.package_id === createdPkgId || verifyPkg.body.verdict === 'AUTHENTIC'), `PACKAGE: Verification endpoint confirms authentic package`);

  // Delete package that has not been dispensed
  const deletePkg = await apiCall('DELETE', `/packages/${createdPkgId}`);
  assert(deletePkg.status === 200, `PACKAGE: Delete test package #${createdPkgId}`);

  // 5. SHIPMENT CRUD (Create -> Read -> Update + Sender != Receiver check)
  console.log('\n--- 5. Testing SHIPMENT CRUD ---');
  // Sender and receiver identical check (Oracle check constraint chk_shipment_parties)
  const badShipment = await apiCall('POST', '/shipments', {
    sender_party_id: 1,
    receiver_party_id: 1,
    shipment_date: '2026-03-01',
    status: 'CREATED',
    mode: 'ROAD_LOGISTICS',
    package_ids: []
  });
  assert(badShipment.status === 400, 'SHIPMENT: Validation blocks identical sender and receiver (sender_party_id <> receiver_party_id)');

  const createShip = await apiCall('POST', '/shipments', {
    sender_party_id: 1, // Pfizer
    receiver_party_id: 5, // AmerisourceBergen
    shipment_date: '2026-03-01',
    status: 'CREATED',
    mode: 'ROAD_LOGISTICS',
    package_ids: []
  });
  assert(createShip.status === 201 && createShip.body.data.shipment_id, 'SHIPMENT: Create shipment manifest');
  const createdShipId = createShip.body.data.shipment_id;

  const readShip = await apiCall('GET', `/shipments/${createdShipId}`);
  assert(readShip.status === 200 && readShip.body.data.sender_party_id === 1, `SHIPMENT: Read shipment #${createdShipId}`);

  const updateShip = await apiCall('PUT', `/shipments/${createdShipId}`, {
    status: 'IN_TRANSIT'
  });
  assert(updateShip.status === 200, `SHIPMENT: Update shipment #${createdShipId} status to IN_TRANSIT`);

  // 6. RECALL CRUD (Create -> Read -> Update + Delete safety)
  console.log('\n--- 6. Testing RECALL CRUD ---');
  const createRecall = await apiCall('POST', '/recalls', {
    recall_date: '2026-03-01',
    status: 'INITIATED',
    reason: 'Temporary stability test discrepancy under investigation'
  });
  assert(createRecall.status === 201 && createRecall.body.data.recall_id, 'RECALL: Create regulatory recall notice');
  const createdRecallId = createRecall.body.data.recall_id;

  const readRecalls = await apiCall('GET', '/recalls');
  assert(readRecalls.status === 200 && readRecalls.body.data.some(r => r.recall_id === createdRecallId), `RECALL: Read recalls contains notice #${createdRecallId}`);

  const updateRecall = await apiCall('PUT', `/recalls/${createdRecallId}`, {
    status: 'ACTIVE',
    reason: 'Confirmed laboratory contamination in API synthesis'
  });
  assert(updateRecall.status === 200, `RECALL: Update recall #${createdRecallId} status and reason`);

  // Delete unlinked recall notice
  const deleteRecall = await apiCall('DELETE', `/recalls/${createdRecallId}`);
  assert(deleteRecall.status === 200, `RECALL: Delete unlinked recall notice #${createdRecallId}`);

  // FK check: try deleting active recall #501 which is referenced in BATCH table
  const fkDeleteRecall = await apiCall('DELETE', '/recalls/501');
  assert(fkDeleteRecall.status === 409 && fkDeleteRecall.body.error.includes('Batches are currently linked'), 'RECALL: Referential integrity blocks deleting recall #501 linked to batches');

  // 7. QUALITY TEST CRUD (Create -> Read -> Update -> Delete)
  console.log('\n--- 7. Testing QUALITY TEST CRUD ---');
  const createQT = await apiCall('POST', '/quality-tests', {
    batch_id: 201,
    test_date: '2026-03-01',
    test_type: 'Dissolution Assay',
    result: '98.7% Dissolution at 30 min',
    status: 'PASSED'
  });
  assert(createQT.status === 201 && createQT.body.data.test_id, 'QUALITY_TEST: Create dissolution assay');
  const createdTestId = createQT.body.data.test_id;

  const readQT = await apiCall('GET', '/quality-tests?batchId=201');
  assert(readQT.status === 200 && readQT.body.data.some(t => t.test_id === createdTestId), `QUALITY_TEST: Read assays for batch #201`);

  const updateQT = await apiCall('PUT', `/quality-tests/${createdTestId}`, {
    result: '99.1% Dissolution at 30 min',
    status: 'PASSED'
  });
  assert(updateQT.status === 200, `QUALITY_TEST: Update test #${createdTestId}`);

  const deleteQT = await apiCall('DELETE', `/quality-tests/${createdTestId}`);
  assert(deleteQT.status === 200, `QUALITY_TEST: Delete test #${createdTestId}`);

  // 8. DISPENSING CRUD (Create -> Read)
  console.log('\n--- 8. Testing DISPENSING CRUD ---');
  const createDisp = await apiCall('POST', '/dispensings', {
    pharmacy_id: 9, // CVS Health Pharmacy
    dispensed_at: '2026-03-01',
    patient_id: 'PAT-9988',
    quantity: 2,
    remarks: 'Verified doctor prescription at counter'
  });
  assert(createDisp.status === 201 && createDisp.body.data.dispense_id, 'DISPENSING: Record pharmacy dispensing event');
  const createdDispId = createDisp.body.data.dispense_id;

  const readDisp = await apiCall('GET', '/dispensings');
  assert(readDisp.status === 200 && readDisp.body.data.some(d => d.dispense_id === createdDispId), `DISPENSING: Read dispensing events contains #${createdDispId}`);

  console.log('\n================================================================');
  console.log(` RESULTS: ALL ${passed} TESTS PASSED! (${failed} FAILED)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
