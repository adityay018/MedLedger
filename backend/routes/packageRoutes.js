const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { authenticate, optionalAuth, requireRole } = require('../middleware/authMiddleware');

// Verification endpoint: available to public, patients, and all supply chain actors
router.get('/verify/:identifier', optionalAuth, packageController.verifyPackage);

// Package inventory: authenticated/optional
router.get('/', optionalAuth, packageController.getAllPackages);
router.get('/:id', optionalAuth, packageController.getPackageById);

// Package serialization: Manufacturer and Administrator
router.post('/', authenticate, requireRole('ADMINISTRATOR', 'MANUFACTURER'), packageController.createPackage);
router.put('/:id', authenticate, packageController.updatePackage);
router.delete('/:id', authenticate, requireRole('ADMINISTRATOR'), packageController.deletePackage);

module.exports = router;
