const express = require('express');
const router = express.Router();
const recallController = require('../controllers/recallController');
const { authenticate, optionalAuth, requireRole } = require('../middleware/authMiddleware');

// Recalls are public health critical: viewing is open to all
router.get('/', optionalAuth, recallController.getAllRecalls);
router.get('/:id/impact', optionalAuth, recallController.getRecallImpact);

// Issue recall notice: Regulator, Administrator, or Manufacturer
router.post('/', authenticate, requireRole('ADMINISTRATOR', 'REGULATOR', 'MANUFACTURER'), recallController.createRecall);

// Execute quarantine workflow (PL/SQL process_recall procedure): Regulator or Administrator
router.post('/:id/process', authenticate, requireRole('ADMINISTRATOR', 'REGULATOR'), recallController.processRecall);
router.put('/:id', authenticate, requireRole('ADMINISTRATOR', 'REGULATOR'), recallController.updateRecall);
router.delete('/:id', authenticate, requireRole('ADMINISTRATOR'), recallController.deleteRecall);

module.exports = router;
