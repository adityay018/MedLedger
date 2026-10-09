const oracledb = require('oracledb');
const mockDbService = require('../services/mockDbService');

let pool = null;
let isOracleConnected = false;
let lastOracleError = null;
let lastConnectionAttempt = null;

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
  lastConnectionAttempt = new Date().toISOString();

  if (process.env.USE_MOCK_DB === 'true') {
    console.log('\n================================================================');
    console.log(' [MEDLEDGER DB] Running in SIMULATION MODE (USE_MOCK_DB=true)');
    console.log(' Pre-loaded with complete 13-table dataset from BCNF relational schema.');
    console.log(' All CRUD, Stored Procedures, and Analytics are active in memory.');
    console.log(' WARNING: In-memory simulation data does NOT persist across restarts.');
    console.log('================================================================\n');
    isOracleConnected = false;
    lastOracleError = 'USE_MOCK_DB flag explicitly enabled in environment';
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
    lastOracleError = null;
    console.log('\n================================================================');
    console.log(' [MEDLEDGER DB] CONNECTED TO LIVE ORACLE DATABASE INSTANCE!');
    console.log(` Connected as user: ${dbConfig.user} on ${dbConfig.connectString}`);
    console.log(' Persistence: ACTIVE — Transactions commit directly to Oracle 21c.');
    console.log('================================================================\n');
    return true;
  } catch (err) {
    if (pool) {
      try { await pool.close(0); } catch (e) {}
      pool = null;
    }
    lastOracleError = err.message || String(err);
    isOracleConnected = false;

    console.warn('\n================================================================');
    console.warn(' [MEDLEDGER DB NOTICE: LIVE ORACLE INSTANCE NOT REACHABLE]');
    console.warn(` Reason: ${lastOracleError}`);
    console.warn(' >>> ACTIVATING IN-MEMORY SIMULATION STORAGE (DEVELOPMENT FALLBACK) <<<');
    console.warn(' Complete 13-table MedLedger dataset (16 parties, 12 drugs, 18 batches,');
    console.warn(' 33 packages, 16 shipments, 4 recalls, 12 dispensings) is active.');
    console.warn(' All CRUD, PL/SQL verification, and 15 Analytics queries work in-memory.');
    console.warn('');
    console.warn(' PERSISTENCE WARNING:');
    console.warn('   Changes made in this session are held in memory and will NOT persist');
    console.warn('   across server restarts. To enable persistent relational storage:');
    console.warn('   1. Ensure Oracle Database (XE / 21c) is running on port 1521.');
    console.warn('   2. Verify DB_USER, DB_PASSWORD, and DB_CONNECT_STRING in backend/.env.');
    console.warn('================================================================\n');
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
    // When Oracle is offline, operations are handled by the mockDbService fallback
    return null;
  }
}

module.exports = {
  initDB,
  execute,
  isUsingOracle: () => isOracleConnected,
  getLastOracleError: () => lastOracleError,
  getConnectionAttemptTimestamp: () => lastConnectionAttempt,
  getDbConfig: () => ({
    user: dbConfig.user,
    connectString: dbConfig.connectString,
    poolMin: dbConfig.poolMin,
    poolMax: dbConfig.poolMax
  }),
  getPool: () => pool,
  mock: mockDbService
};
