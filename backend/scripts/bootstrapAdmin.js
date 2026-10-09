require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function bootstrap() {
  console.log('================================================================');
  console.log(' MedLedger Administrator Bootstrap Procedure');
  console.log('================================================================\n');

  // Attempt DB initialization
  await db.initDB();

  const email = (process.env.ADMIN_EMAIL || 'admin@medledger.io').trim().toLowerCase();
  const name = process.env.ADMIN_NAME || 'Primary System Administrator';
  let password = process.env.ADMIN_PASSWORD;
  let wasGenerated = false;

  if (!password) {
    // Generate cryptographically random 16-character password
    password = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, 'A') + '!9a';
    wasGenerated = true;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  if (db.isUsingOracle()) {
    console.log(`[BOOTSTRAP] Connecting to live Oracle database to provision administrator...`);
    
    // Check if user already exists
    const checkRes = await db.execute(`SELECT user_id, role, status FROM USERS WHERE LOWER(email) = :email`, { email });
    if (checkRes.rows && checkRes.rows.length > 0) {
      const existing = checkRes.rows[0];
      await db.execute(
        `UPDATE USERS SET password_hash = :phash, role = 'ADMINISTRATOR', status = 'APPROVED', approved_at = SYSDATE WHERE user_id = :id`,
        { phash: passwordHash, id: existing.USER_ID }
      );
      console.log(`[BOOTSTRAP] Existing user #${existing.USER_ID} elevated to ADMINISTRATOR and password updated.`);
    } else {
      const seqRes = await db.execute(`SELECT seq_user_id.NEXTVAL AS id FROM dual`);
      const newId = seqRes.rows[0].ID;

      await db.execute(
        `INSERT INTO USERS (
           user_id, name, email, password_hash, role, party_id, status,
           requested_role, requested_org_name, created_at, approved_at
         ) VALUES (
           :id, :name, :email, :phash, 'ADMINISTRATOR', NULL, 'APPROVED',
           'ADMINISTRATOR', 'MedLedger Governance Authority', SYSDATE, SYSDATE
         )`,
        { id: newId, name, email, phash: passwordHash }
      );
      console.log(`[BOOTSTRAP] New ADMINISTRATOR user #${newId} created successfully in Oracle.`);
    }
  } else {
    console.log(`[BOOTSTRAP] Provisioning administrator in simulation database...`);
    const existing = db.mock.getUserByEmail(email);
    if (existing) {
      db.mock.updateUser(existing.user_id, {
        password_hash: passwordHash,
        role: 'ADMINISTRATOR',
        status: 'APPROVED'
      });
      console.log(`[BOOTSTRAP] Simulation user #${existing.user_id} updated with administrator credentials.`);
    } else {
      const created = db.mock.createUser({
        name,
        email,
        password_hash: passwordHash,
        role: 'ADMINISTRATOR',
        status: 'APPROVED',
        requested_role: 'ADMINISTRATOR',
        requested_org_name: 'MedLedger Governance Authority'
      });
      console.log(`[BOOTSTRAP] Simulation administrator user #${created.user_id} created.`);
    }
  }

  console.log('\n----------------------------------------------------------------');
  console.log(' ADMINISTRATOR CREDENTIALS PROVISIONED SUCCESSFULLY');
  console.log('----------------------------------------------------------------');
  console.log(` Email:    ${email}`);
  console.log(` Password: ${password}`);
  if (wasGenerated) {
    console.log(` [NOTE] A cryptographically strong password was generated.`);
    console.log(` Please copy and store this password in a secure password manager.`);
  } else {
    console.log(` [NOTE] Password supplied from environment variable ADMIN_PASSWORD.`);
  }
  console.log(` Role:     ADMINISTRATOR`);
  console.log(` Status:   APPROVED`);
  console.log('----------------------------------------------------------------\n');

  process.exit(0);
}

bootstrap().catch(err => {
  console.error('[BOOTSTRAP ERROR] Failed to bootstrap administrator:', err);
  process.exit(1);
});
