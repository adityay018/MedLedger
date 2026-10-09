const express = require('express');
const router = express.Router();
const drugController = require('../controllers/drugController');
const { authenticate, optionalAuth, requireRole } = require('../middleware/authMiddleware');

// Shared medicine catalogue: all users can view
router.get('/', optionalAuth, drugController.getAllDrugs);
router.get('/:id', optionalAuth, drugController.getDrugById);

// Drug registration: Manufacturer and Administrator
router.post('/', authenticate, requireRole('ADMINISTRATOR', 'MANUFACTURER'), drugController.createDrug);

// Drug catalogue governance: Administrator
router.put('/:id', authenticate, requireRole('ADMINISTRATOR'), drugController.updateDrug);
router.delete('/:id', authenticate, requireRole('ADMINISTRATOR'), drugController.deleteDrug);

module.exports = router;
