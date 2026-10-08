const express = require('express');
const router = express.Router();
const dispensingController = require('../controllers/dispensingController');

router.get('/', dispensingController.getAllDispensings);
router.post('/', dispensingController.createDispensing);

module.exports = router;
