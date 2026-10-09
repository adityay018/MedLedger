const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// All admin routes strictly require valid authentication and ADMINISTRATOR role
router.use(authenticate);
router.use(requireRole('ADMINISTRATOR'));

// User accounts and registration management
router.get('/users', adminController.getAllUsers);
router.get('/pending-registrations', adminController.getPendingRegistrations);
router.post('/users/:id/approve', adminController.approveRegistration);
router.post('/users/:id/reject', adminController.rejectRegistration);
router.post('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/role', adminController.updateUserRole);

// System-wide security and business audit trail
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
