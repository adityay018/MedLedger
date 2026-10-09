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
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Process-level safety guards to prevent unhandled process crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('[MEDLEDGER PROCESS ERROR] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[MEDLEDGER PROCESS ERROR] Uncaught Exception:', err);
});

// Configure CORS for production Netlify frontend, Render backend, local development, and custom domains
const defaultAllowedOrigins = [
  'https://med-ledger.netlify.app',
  'https://medledger-backend-wasd.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173'
];

const customOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...customOrigins]));

const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests (curl, server-to-server health checks)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow any Netlify deploy preview or custom domain on netlify.app
    if (/^https:\/\/[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.netlify\.app$/.test(origin)) {
      return callback(null, true);
    }

    // Permissive fallback during local development
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    callback(new Error(`CORS blocked request from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Helper to generate comprehensive health telemetry separating backend and database status
function generateHealthPayload() {
  const oracleActive = isUsingOracle();
  const uptime = Math.floor(process.uptime());
  return {
    status: 'online',
    service: 'MedLedger Pharmaceutical Supply Chain Intelligence Backend',
    version: '1.0.0',
    databaseMode: oracleActive ? 'ORACLE_21C_LIVE' : 'SIMULATION_STORAGE',
    timestamp: new Date().toISOString(),
    uptimeSeconds: uptime,
    backend: {
      status: 'healthy',
      port: Number(PORT),
      host: HOST,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      pid: process.pid,
      memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
    },
    database: {
      status: oracleActive ? 'connected' : 'disconnected (fallback active)',
      mode: oracleActive ? 'ORACLE_21C_LIVE' : 'SIMULATION_STORAGE',
      isOracleConnected: oracleActive,
      isPersistent: oracleActive,
      storageType: oracleActive
        ? 'Oracle 21c Database (Persistent)'
        : 'In-Memory Volatile (Development Fallback)',
      connectString: getDbConfig().connectString,
      configuredUser: getDbConfig().user,
      lastOracleError: oracleActive ? null : getLastOracleError(),
      lastAttempt: getConnectionAttemptTimestamp(),
      notice: oracleActive
        ? 'Connected to live Oracle Database. Relational transactions and constraints are active and persistent.'
        : 'Operating in volatile in-memory fallback mode because live Oracle is unreachable or not configured. Data does NOT persist across restarts.'
    }
  };
}

// Health check endpoints for load balancers and frontend telemetry
app.get('/api/health', (req, res) => res.json(generateHealthPayload()));
app.get('/health', (req, res) => res.json(generateHealthPayload()));

// Root landing endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MedLedger Pharmaceutical Supply Chain Intelligence API',
    status: 'online',
    health: '/api/health',
    documentation: '/api/analytics',
    timestamp: new Date().toISOString()
  });
});

// Mount Entity & Feature API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
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

// Graceful termination handlers
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

    server.listen(PORT, HOST, () => {
      const oracleActive = isUsingOracle();
      console.log(`================================================================`);
      console.log(` MedLedger Backend Server is running on: http://${HOST}:${PORT}`);
      console.log(` Health Check API: http://${HOST}:${PORT}/api/health`);
      console.log(` Allowed CORS Origins: ${allowedOrigins.join(', ')}`);
      console.log(` Database Mode:    ${oracleActive ? 'ORACLE (Persistent Live)' : 'SIMULATION (In-Memory Fallback)'}`);
      if (!oracleActive) {
        console.log(` Notice:           In-memory data does not persist across restarts.`);
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
