const express = require('express');
const router = express.Router();
const qualityTestController = require('../controllers/qualityTestController');

router.get('/', qualityTestController.getAllQualityTests);
router.post('/', qualityTestController.createQualityTest);
router.put('/:id', qualityTestController.updateQualityTest);
router.delete('/:id', qualityTestController.deleteQualityTest);

module.exports = router;

