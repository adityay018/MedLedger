const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/', analyticsController.getQueriesList);
router.get('/:queryId', analyticsController.runQuery);

module.exports = router;
