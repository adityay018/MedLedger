const express = require('express');
const router = express.Router();
const qualityTestController = require('../controllers/qualityTestController');

router.get('/', qualityTestController.getAllQualityTests);
router.post('/', qualityTestController.createQualityTest);

module.exports = router;
