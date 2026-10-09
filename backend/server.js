require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const {
  initDB,
  isUsingOracle,
  getLastOracleError,
  getConnectionAttemptTimestamp,
  getDbConfig
} = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const partyRoutes = require('./routes/partyRoutes');
const drugRoutes = require('./routes/drugRoutes');
const batchRoutes = require('./routes/batchRoutes');
const packageRoutes = require('./routes/packageRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const recallRoutes = require('./routes/recallRoutes');
const dispensingRoutes = require('./routes/dispensingRoutes');
const qualityTestRoutes = require('./routes/qualityTestRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Process-level safety guards to prevent unhandled process crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('[MEDLEDGER PROCESS ERROR] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[MEDLEDGER PROCESS ERROR] Uncaught Exception:', err);
});

// Middleware
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Truthful health check distinguishing persistent Oracle from in-memory fallback
app.get('/api/health', (req, res) => {
  const oracleActive = isUsingOracle();
  res.json({
    status: 'online',
    project: 'MedLedger Pharmaceutical Supply Chain Management',
    version: '1.0.0',
    databaseMode: oracleActive ? 'ORACLE_21C_LIVE' : 'SIMULATION_STORAGE',
    database: {
      mode: oracleActive ? 'ORACLE' : 'SIMULATION_FALLBACK',
      isOracleConnected: oracleActive,
      isPersistent: oracleActive,
      storageType: oracleActive
        ? 'Oracle 21c Database (Persistent)'
        : 'In-Memory Volatile (Development Fallback)',
      connectString: getDbConfig().connectString,
      notice: oracleActive
        ? 'Connected to live Oracle Database. Relational transactions and constraints are active and persistent.'
        : 'Operating in volatile in-memory fallback mode because live Oracle is unreachable. Data does NOT persist across restarts.',
      lastOracleError: oracleActive ? null : getLastOracleError(),
      lastAttempt: getConnectionAttemptTimestamp()
    },
    server: {
      port: Number(PORT),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    },
    timestamp: new Date().toISOString()
  });
});

// Mount Entity & Feature API Routes
app.use('/api/parties', partyRoutes);
app.use('/api/drugs', drugRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/recalls', recallRoutes);
app.use('/api/dispensings', dispensingRoutes);
app.use('/api/quality-tests', qualityTestRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global Error Handler
app.use(errorHandler);

// HTTP Server creation with explicit EventEmitter error handling
const server = http.createServer(app);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('\n================================================================');
    console.error(` [MEDLEDGER STARTUP ERROR: PORT ${PORT} IS ALREADY IN USE]`);
    console.error(` Error Code: EADDRINUSE (Address already in use on port ${PORT})`);
    console.error(` Another process or previous instance is currently bound to port ${PORT}.`);
    console.error('');
    console.error(' How to resolve:');
    console.error(` 1. Terminate the existing process using port ${PORT}:`);
    console.error(`    PowerShell: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`);
    console.error(` 2. Or configure an alternate port in backend/.env:`);
    console.error(`    PORT=5001`);
    console.error('================================================================\n');
    process.exit(1);
  } else {
    console.error('[MEDLEDGER SERVER ERROR]', err);
    process.exit(1);
  }
});

// Graceful termination
const handleShutdown = () => {
  console.log('\n[MEDLEDGER] Graceful shutdown initiated. Closing HTTP server...');
  server.close(() => {
    console.log('[MEDLEDGER] Server stopped cleanly.');
    process.exit(0);
  });
};
process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

// Start Server
async function startServer() {
  try {
    // Attempt Oracle DB connection (falls back cleanly if unreachable)
    await initDB();

    server.listen(PORT, () => {
      const oracleActive = isUsingOracle();
      console.log(`================================================================`);
      console.log(` MedLedger Backend Server is running on: http://localhost:${PORT}`);
      console.log(` Health Check API: http://localhost:${PORT}/api/health`);
      console.log(` Database Mode:    ${oracleActive ? 'ORACLE (Persistent Live)' : 'SIMULATION (In-Memory Fallback)'}`);
      if (!oracleActive) {
        console.log(` Note:             In-memory data does not persist across restarts.`);
      }
      console.log(`================================================================`);
    });

    return server;
  } catch (error) {
    console.error('Failed to start MedLedger server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };
