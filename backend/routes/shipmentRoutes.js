const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');
const { authenticate, optionalAuth, requireRole } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, shipmentController.getAllShipments);
router.get('/:id', optionalAuth, shipmentController.getShipmentById);
router.post('/', authenticate, requireRole('ADMINISTRATOR', 'MANUFACTURER', 'DISTRIBUTOR'), shipmentController.createShipment);
router.put('/:id', authenticate, requireRole('ADMINISTRATOR', 'MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY'), shipmentController.updateShipment);
router.delete('/:id', authenticate, requireRole('ADMINISTRATOR'), shipmentController.deleteShipment);

module.exports = router;
