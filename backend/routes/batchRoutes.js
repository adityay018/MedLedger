const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const { authenticate, optionalAuth, requireRole } = require('../middleware/authMiddleware');

// Batch viewing: All authenticated or optional public probes
router.get('/', optionalAuth, batchController.getAllBatches);
router.get('/:id', optionalAuth, batchController.getBatchById);

// Batch creation & modification: Strictly restricted to Administrator and authorized Manufacturer
router.post('/', authenticate, requireRole('ADMINISTRATOR', 'MANUFACTURER'), batchController.createBatch);
router.put('/:id', authenticate, requireRole('ADMINISTRATOR', 'MANUFACTURER'), batchController.updateBatch);
router.delete('/:id', authenticate, requireRole('ADMINISTRATOR', 'MANUFACTURER'), batchController.deleteBatch);

module.exports = router;
