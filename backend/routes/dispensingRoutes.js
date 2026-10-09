const express = require('express');
const router = express.Router();
const dispensingController = require('../controllers/dispensingController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// Dispensing operations contain private prescription data: strictly protected
router.get('/', authenticate, requireRole('ADMINISTRATOR', 'REGULATOR', 'PHARMACY'), dispensingController.getAllDispensings);
router.post('/', authenticate, requireRole('ADMINISTRATOR', 'PHARMACY'), dispensingController.createDispensing);

module.exports = router;
