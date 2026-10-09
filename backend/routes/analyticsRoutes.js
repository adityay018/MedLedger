const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Catalog Listing & Metadata
router.get('/', analyticsController.getQueriesList);

// Phase 3 Dedicated Endpoints
router.get('/drug-catalogue', analyticsController.getDrugCatalogue);
router.get('/batch-traceability', analyticsController.getBatchTraceability);
router.get('/package-inventory', analyticsController.getPackageInventory);
router.get('/shipment-tracking', analyticsController.getShipmentTracking);
router.get('/in-transit-shipments', analyticsController.getInTransitShipments);
router.get('/failed-quality-tests', analyticsController.getFailedQualityTests);
router.get('/active-recalls', analyticsController.getActiveRecalls);
router.get('/recall-impact', analyticsController.getRecallImpact);
router.get('/manufacturer-performance', analyticsController.getManufacturerPerformance);
router.get('/pharmacy-dispensing', analyticsController.getPharmacyDispensing);
router.get('/top-drugs', analyticsController.getTopDrugs);
router.get('/undispensed-packages', analyticsController.getUndispensedPackages);
router.get('/package-shipment-history', analyticsController.getPackageShipmentHistory);
router.get('/package-shipment-history/:packageId', analyticsController.getPackageShipmentHistory);
router.get('/pending-quality-tests', analyticsController.getPendingQualityTests);
router.get('/verify-package', analyticsController.getVerifyPackage);

// Query by ID fallback (Q1 to Q15) or Slug
router.get('/:queryId', analyticsController.runQuery);

module.exports = router;
