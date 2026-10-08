const oracledb = require('oracledb');
const mockDbService = require('../services/mockDbService');

let pool = null;
let isOracleConnected = false;

// Oracle output format
try {
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  oracledb.autoCommit = true;
} catch (e) {
  // Ignore driver load warnings
}

const dbConfig = {
  user: process.env.DB_USER || 'medledger',
  password: process.env.DB_PASSWORD || 'medledger_pass',
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/XEPDB1',
  poolMin: 1,
  poolMax: 5,
  poolIncrement: 1
};

async function initDB() {
  if (process.env.USE_MOCK_DB === 'true') {
    console.log('\n================================================================');
    console.log(' [MEDLEDGER DB] Running in SIMULATION MODE (USE_MOCK_DB=true)');
    console.log(' Pre-loaded with complete 13-table dataset from DA1 BCNF schema.');
    console.log(' All CRUD, Stored Procedures, and Analytics are 100% active!');
    console.log('================================================================\n');
    isOracleConnected = false;
    return false;
  }

  try {
    console.log(`[MEDLEDGER DB] Attempting connection to Oracle Database at ${dbConfig.connectString}...`);
    pool = await oracledb.createPool(dbConfig);
    // Ping Oracle to verify real connectivity
    const testConn = await pool.getConnection();
    await testConn.ping();
    await testConn.close();

    isOracleConnected = true;
    console.log('\n================================================================');
    console.log(' [MEDLEDGER DB] CONNECTED TO LIVE ORACLE DATABASE INSTANCE!');
    console.log(` Connected as user: ${dbConfig.user} on ${dbConfig.connectString}`);
    console.log('================================================================\n');
    return true;
  } catch (err) {
    if (pool) {
      try { await pool.close(0); } catch (e) {}
      pool = null;
    }
    console.warn('\n================================================================');
    console.warn(' [MEDLEDGER DB NOTICE: LIVE ORACLE INSTANCE NOT REACHABLE]');
    console.warn(` Reason: ${err.message}`);
    console.warn(' >>> SEAMLESSLY ACTIVATING IN-MEMORY SIMULATION STORAGE <<<');
    console.warn(' Complete 13-table MedLedger dataset (16 parties, 12 drugs, 18 batches,');
    console.warn(' 32 packages, 16 shipments, 4 recalls, 12 dispensings) is active.');
    console.warn(' Full CRUD, PL/SQL verification, and Analytics work out-of-the-box!');
    console.warn(' Configure .env with live Oracle credentials whenever ready.');
    console.warn('================================================================\n');
    isOracleConnected = false;
    return false;
  }
}

async function execute(sql, binds = {}, options = {}) {
  if (isOracleConnected && pool) {
    let connection;
    try {
      connection = await pool.getConnection();
      const result = await connection.execute(sql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: true,
        ...options
      });
      return result;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (e) {
          console.error('Error closing Oracle connection:', e);
        }
      }
    }
  } else {
    // Transparently simulated when Oracle is offline
    return null;
  }
}

module.exports = {
  initDB,
  execute,
  isUsingOracle: () => isOracleConnected,
  getPool: () => pool,
  mock: mockDbService
};
