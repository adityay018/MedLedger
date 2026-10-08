require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initDB, isUsingOracle } = require('./config/db');
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

// Middleware
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check and root route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    project: 'MedLedger Pharmaceutical Supply Chain Management',
    version: '1.0.0',
    databaseMode: isUsingOracle() ? 'ORACLE_21C_LIVE' : 'SIMULATION_STORAGE',
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

// Start Server
async function startServer() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`================================================================`);
      console.log(` MedLedger Backend Server is running on: http://localhost:${PORT}`);
      console.log(` Health Check API: http://localhost:${PORT}/api/health`);
      console.log(` Database Mode:    ${isUsingOracle() ? 'ORACLE (Live)' : 'SIMULATION (Active Fallback)'}`);
      console.log(`================================================================`);
    });
  } catch (error) {
    console.error('Failed to start MedLedger server:', error);
    process.exit(1);
  }
}

startServer();
