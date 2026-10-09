const express = require('express');
const router = express.Router();
const partyController = require('../controllers/partyController');
const { authenticate, optionalAuth, requireRole } = require('../middleware/authMiddleware');

// Public/authenticated directory of authorized supply chain parties
router.get('/', optionalAuth, partyController.getAllParties);
router.get('/:id', optionalAuth, partyController.getPartyById);

// Party organization management: Administrator only
router.post('/', authenticate, requireRole('ADMINISTRATOR'), partyController.createParty);
router.put('/:id', authenticate, requireRole('ADMINISTRATOR'), partyController.updateParty);
router.delete('/:id', authenticate, requireRole('ADMINISTRATOR'), partyController.deleteParty);

module.exports = router;
