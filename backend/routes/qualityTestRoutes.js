const express = require('express');
const router = express.Router();
const qualityTestController = require('../controllers/qualityTestController');
const { authenticate, optionalAuth, requireRole } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, qualityTestController.getAllQualityTests);
router.post('/', authenticate, requireRole('ADMINISTRATOR', 'MANUFACTURER'), qualityTestController.createQualityTest);
router.put('/:id', authenticate, requireRole('ADMINISTRATOR', 'MANUFACTURER'), qualityTestController.updateQualityTest);
router.delete('/:id', authenticate, requireRole('ADMINISTRATOR'), qualityTestController.deleteQualityTest);

module.exports = router;
