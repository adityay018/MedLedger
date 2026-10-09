const express = require('express');
const router = express.Router();
const recallController = require('../controllers/recallController');

router.get('/', recallController.getAllRecalls);
router.post('/', recallController.createRecall);
router.put('/:id', recallController.updateRecall);
router.delete('/:id', recallController.deleteRecall);
router.post('/:id/process', recallController.processRecall);
router.get('/:id/impact', recallController.getRecallImpact);

module.exports = router;

