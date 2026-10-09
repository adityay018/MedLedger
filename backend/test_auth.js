const http = require('http');

let adminToken = null;
let mfgToken = null;
let distToken = null;
let pharmToken = null;
let regToken = null;

function apiCall(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:5000/api${path}`);
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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

async function runAuthTests() {
  console.log('================================================================');
  console.log(' STARTING MEDLEDGER AUTHENTICATION, RBAC & MULTI-ORG TEST SUITE');
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

  // --- 1. AUTHENTICATION & LOGIN ---
  console.log('--- 1. Testing Authentication & Session Security ---');
  
  // Failed login
  const badLogin = await apiCall('POST', '/auth/login', { email: 'admin@medledger.io', password: 'WrongPassword999!' });
  assert(badLogin.status === 401 && badLogin.body.success === false, 'Failed login with invalid password returns HTTP 401 Unauthorized');
  assert(badLogin.body.error === 'Invalid email or password.', 'Failed login returns generic error message to prevent enumeration');

  // Successful login as Admin
  const adminLogin = await apiCall('POST', '/auth/login', { email: 'admin@medledger.io', password: 'AdminPass123!' });
  assert(adminLogin.status === 200 && adminLogin.body.token, 'Successful login returns signed JWT access token');
  assert(adminLogin.body.user.role === 'ADMINISTRATOR', 'Admin profile correctly populated with role ADMINISTRATOR');
  adminToken = adminLogin.body.token;

  // Login other roles
  const mfgLogin = await apiCall('POST', '/auth/login', { email: 'pfizer@medledger.io', password: 'MfgPass123!' });
  assert(mfgLogin.status === 200 && mfgLogin.body.user.partyId === 1, 'Manufacturer logs in with associated party_id 1 (Pfizer)');
  mfgToken = mfgLogin.body.token;

  const distLogin = await apiCall('POST', '/auth/login', { email: 'distributor@medledger.io', password: 'DistPass123!' });
  distToken = distLogin.body.token;

  const pharmLogin = await apiCall('POST', '/auth/login', { email: 'pharmacy@medledger.io', password: 'PharmPass123!' });
  pharmToken = pharmLogin.body.token;

  const regLogin = await apiCall('POST', '/auth/login', { email: 'regulator@medledger.io', password: 'RegPass123!' });
  regToken = regLogin.body.token;

  // Unauthenticated and expired/invalid token handling
  const noTokenReq = await apiCall('POST', '/batches', { drug_id: 101, manufacturer_id: 1 });
  assert(noTokenReq.status === 401, 'Protected endpoint denies unauthenticated request with HTTP 401');

  const invalidTokenReq = await apiCall('GET', '/auth/me', null, 'invalid.jwt.token.here');
  assert(invalidTokenReq.status === 401, 'Endpoint with invalid/tampered token returns HTTP 401');

  // --- 2. REGISTRATION & APPROVAL WORKFLOW ---
  console.log('\n--- 2. Testing Registration, Role Guards & Approval Workflow ---');

  // Privilege escalation guard: Cannot register as ADMINISTRATOR
  const adminEscalation = await apiCall('POST', '/auth/register', {
    name: 'Malicious Actor',
    email: 'hacker@evil.com',
    password: 'Password123#',
    requested_role: 'ADMINISTRATOR'
  });
  assert(adminEscalation.status === 400, 'Public registration blocks Administrator self-registration with HTTP 400');

  // Valid registration
  const testRegEmail = `biotech_${Date.now()}@testpharma.com`;
  const validReg = await apiCall('POST', '/auth/register', {
    name: 'Dr. Marcus Vance',
    email: testRegEmail,
    password: 'SecurePassword123!',
    requested_role: 'MANUFACTURER',
    requested_org_name: 'Vance BioTherapeutics'
  });
  assert(validReg.status === 201 && validReg.body.data.status === 'PENDING', 'Valid registration succeeds with default status PENDING');
  const newUserId = validReg.body.data.userId;

  // Duplicate email registration guard
  const duplicateReg = await apiCall('POST', '/auth/register', {
    name: 'Duplicate Vance',
    email: testRegEmail,
    password: 'SecurePassword123!',
    requested_role: 'MANUFACTURER'
  });
  assert(duplicateReg.status === 409, 'Duplicate registration attempt with same email returns HTTP 409 Conflict');

  // PENDING user cannot log in
  const pendingLogin = await apiCall('POST', '/auth/login', { email: testRegEmail, password: 'SecurePassword123!' });
  assert(pendingLogin.status === 403 && pendingLogin.body.code === 'ACCOUNT_PENDING', 'Pending user login blocked with HTTP 403 ACCOUNT_PENDING');

  // Admin approves user
  const approveRes = await apiCall('POST', `/admin/users/${newUserId}/approve`, {
    role: 'MANUFACTURER',
    party_id: 2
  }, adminToken);
  assert(approveRes.status === 200 && approveRes.body.data.status === 'APPROVED', 'Administrator successfully approves registration and assigns role/party');

  // Approved user can now log in
  const approvedLogin = await apiCall('POST', '/auth/login', { email: testRegEmail, password: 'SecurePassword123!' });
  assert(approvedLogin.status === 200 && approvedLogin.body.user.role === 'MANUFACTURER', 'Approved user can now authenticate successfully');

  // --- 3. MULTI-ORGANIZATION DATA ISOLATION & RBAC ---
  console.log('\n--- 3. Testing Multi-Organization Data Isolation & Permission Matrix ---');

  // Manufacturer A (Pfizer, party 1) CANNOT update Manufacturer B's batch (Batch 203 belongs to party 3)
  const crossOrgBatchUpdate = await apiCall('PUT', '/batches/203', { batch_status: 'QUARANTINED' }, mfgToken);
  assert(crossOrgBatchUpdate.status === 403, 'Manufacturer A blocked from modifying Manufacturer B\'s batches (HTTP 403)');

  // Manufacturer A CAN update its own batch (Batch 202 belongs to party 1)
  const ownBatchUpdate = await apiCall('PUT', '/batches/202', { batch_status: 'RELEASED' }, mfgToken);
  assert(ownBatchUpdate.status === 200, 'Manufacturer A successfully modifies its own manufactured batch');

  // Pharmacy A (CVS, party 9) CANNOT record dispensing for Pharmacy B (Walgreens, party 10)
  const crossPharmacyDispense = await apiCall('POST', '/dispensings', {
    pharmacy_id: 10,
    patient_id: 'PAT-ATTEMPT-01',
    quantity: 1
  }, pharmToken);
  assert(crossPharmacyDispense.status === 403, 'Pharmacy blocked from recording dispensing under another pharmacy ID (HTTP 403)');

  // Pharmacy A CAN record dispensing for its own organization
  const ownDispense = await apiCall('POST', '/dispensings', {
    pharmacy_id: 9,
    patient_id: 'PAT-AUTH-909',
    quantity: 2,
    remarks: 'Authorized pharmacy test dispense'
  }, pharmToken);
  assert(ownDispense.status === 201, 'Pharmacy successfully records dispensing under its own approved party ID');

  // Manufacturer CANNOT access dispensing records (patient confidentiality)
  const mfgViewDispense = await apiCall('GET', '/dispensings', null, mfgToken);
  assert(mfgViewDispense.status === 403, 'Non-dispensing roles blocked from viewing patient dispensing records (HTTP 403)');

  // Distributor cannot alter shipments not assigned to it
  // Shipment 701 is between party 1 (Pfizer) and party 5 (AmerisourceBergen).
  // Attempt with another party or unauthorized distributor if not assigned:
  const distShipmentUpdate = await apiCall('PUT', '/shipments/701', { status: 'DELIVERED' }, distToken);
  assert(distShipmentUpdate.status === 200, 'Assigned Distributor can update shipment status for assigned freight');

  // --- 4. SHARED MEDICINE CATALOGUE & DUPLICATE PREVENTION ---
  console.log('\n--- 4. Testing Shared Medicine Catalogue & Duplicate Governance ---');

  // All roles can view shared catalogue
  const sharedCatView = await apiCall('GET', '/drugs', null, distToken);
  assert(sharedCatView.status === 200 && sharedCatView.body.count > 0, 'Shared medicine catalogue is visible across the supply chain');

  // Prevent accidental duplicate drug entry
  // Drug 101 is "Remdesivir (Veklury)" with strength "100mg" and dosage "Lyophilized Powder for Injection"
  const duplicateDrug = await apiCall('POST', '/drugs', {
    drug_name: 'Remdesivir (Veklury)',
    strength: '100mg',
    dosage_form: 'Lyophilized Powder for Injection',
    description: 'Attempted duplicate entry'
  }, mfgToken);
  assert(duplicateDrug.status === 409, 'Duplicate drug registration blocked with HTTP 409 Conflict');

  // --- 5. ACCOUNT SUSPENSION & AUDIT TRAIL ---
  console.log('\n--- 5. Testing Account Suspension & Audit Trail ---');

  // Admin suspends user
  const suspendRes = await apiCall('POST', `/admin/users/${newUserId}/status`, { status: 'SUSPENDED' }, adminToken);
  assert(suspendRes.status === 200, 'Administrator successfully suspends user account');

  // Suspended user login blocked
  const suspendedLogin = await apiCall('POST', '/auth/login', { email: testRegEmail, password: 'SecurePassword123!' });
  assert(suspendedLogin.status === 403 && suspendedLogin.body.code === 'ACCOUNT_SUSPENDED', 'Suspended account is blocked from login (HTTP 403 ACCOUNT_SUSPENDED)');

  // Verify Audit Log records actions
  const auditLogs = await apiCall('GET', '/admin/audit-logs', null, adminToken);
  assert(auditLogs.status === 200 && auditLogs.body.count > 0, 'Audit log retrieves recorded security and operational events');
  const hasLoginEvent = auditLogs.body.data.some(l => l.action.includes('LOGIN'));
  const hasRegEvent = auditLogs.body.data.some(l => l.action.includes('REGISTER') || l.action.includes('APPROV'));
  assert(hasLoginEvent && hasRegEvent, 'Audit trail contains verified login and user registration events');

  console.log('\n================================================================');
  console.log(` AUTHENTICATION & ACCESS CONTROL TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthTests().catch(err => {
  console.error('[TEST ERROR]', err);
  process.exit(1);
});
