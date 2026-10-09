const db = require('../config/db');
const auditService = require('../services/auditService');

/**
 * List all users with status, role, and party information (sanitized: NO password hashes)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { status, role } = req.query;

    if (db.isUsingOracle()) {
      let sql = `
        SELECT u.user_id, u.name, u.email, u.role, u.party_id, u.status,
               u.requested_role, u.requested_org_name, u.organization_details,
               TO_CHAR(u.created_at, 'YYYY-MM-DD') AS created_at,
               TO_CHAR(u.approved_at, 'YYYY-MM-DD') AS approved_at,
               u.approved_by,
               p.party_name AS org_name
        FROM USERS u
        LEFT JOIN PARTY p ON u.party_id = p.party_id
      `;
      const binds = {};
      const where = [];
      if (status) {
        where.push(`u.status = :status`);
        binds.status = status;
      }
      if (role) {
        where.push(`u.role = :role`);
        binds.role = role;
      }
      if (where.length > 0) {
        sql += ` WHERE ` + where.join(' AND ');
      }
      sql += ` ORDER BY u.user_id DESC`;
      const result = await db.execute(sql, binds);
      return res.json({ success: true, count: result.rows.length, data: result.rows });
    } else {
      let users = db.mock.getUsers();
      if (status) users = users.filter(u => u.status === status);
      if (role) users = users.filter(u => u.role === role);
      return res.json({ success: true, count: users.length, data: users });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * List only pending user registration requests
 */
exports.getPendingRegistrations = async (req, res, next) => {
  try {
    if (db.isUsingOracle()) {
      const sql = `
        SELECT u.user_id, u.name, u.email, u.role, u.party_id, u.status,
               u.requested_role, u.requested_org_name, u.organization_details,
               TO_CHAR(u.created_at, 'YYYY-MM-DD') AS created_at
        FROM USERS u
        WHERE u.status = 'PENDING'
        ORDER BY u.user_id ASC
      `;
      const result = await db.execute(sql);
      return res.json({ success: true, count: result.rows.length, data: result.rows });
    } else {
      const pending = db.mock.getUsers().filter(u => u.status === 'PENDING');
      return res.json({ success: true, count: pending.length, data: pending });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Approve a pending registration and assign final role & organization
 */
exports.approveRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, party_id } = req.body;
    const approverId = req.user.userId;

    if (db.isUsingOracle()) {
      // Check user exists
      const checkRes = await db.execute(`SELECT user_id, email, requested_role FROM USERS WHERE user_id = :id`, { id: Number(id) });
      if (!checkRes.rows || checkRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'User registration not found.' });
      }
      const existingUser = checkRes.rows[0];
      const finalRole = role || existingUser.REQUESTED_ROLE || 'MANUFACTURER';
      const finalPartyId = party_id ? Number(party_id) : null;

      await db.execute(
        `UPDATE USERS
         SET status = 'APPROVED',
             role = :role,
             party_id = :pid,
             approved_at = SYSDATE,
             approved_by = :approver
         WHERE user_id = :id`,
        {
          id: Number(id),
          role: finalRole,
          pid: finalPartyId,
          approver: Number(approverId)
        }
      );

      await auditService.logAction({
        userId: approverId,
        userEmail: req.user.email,
        action: 'USER_REGISTRATION_APPROVED',
        entityType: 'USER',
        entityId: id,
        details: `Approved user #${id} (${existingUser.EMAIL}) with role ${finalRole} and party_id ${finalPartyId}`,
        req
      });

      return res.json({
        success: true,
        message: `User registration #${id} approved successfully as ${finalRole}.`,
        data: { userId: Number(id), role: finalRole, partyId: finalPartyId, status: 'APPROVED' }
      });
    } else {
      const user = db.mock.getUserById(id);
      if (!user) return res.status(404).json({ success: false, error: 'User registration not found.' });

      const finalRole = role || user.requested_role || 'MANUFACTURER';
      const finalPartyId = party_id !== undefined ? (party_id ? Number(party_id) : null) : user.party_id;

      const updated = db.mock.approveUser(id, {
        role: finalRole,
        party_id: finalPartyId,
        approved_by: approverId
      });

      await auditService.logAction({
        userId: approverId,
        userEmail: req.user.email,
        action: 'USER_REGISTRATION_APPROVED',
        entityType: 'USER',
        entityId: id,
        details: `Approved user #${id} (${user.email}) with role ${finalRole} and party_id ${finalPartyId}`,
        req
      });

      return res.json({
        success: true,
        message: `User registration #${id} approved successfully as ${finalRole}.`,
        data: updated
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Reject a pending registration request
 */
exports.rejectRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const approverId = req.user.userId;

    if (db.isUsingOracle()) {
      await db.execute(
        `UPDATE USERS SET status = 'REJECTED', approved_by = :approver, approved_at = SYSDATE WHERE user_id = :id`,
        { id: Number(id), approver: Number(approverId) }
      );
    } else {
      db.mock.rejectUser(id, { rejected_by: approverId });
    }

    await auditService.logAction({
      userId: approverId,
      userEmail: req.user.email,
      action: 'USER_REGISTRATION_REJECTED',
      entityType: 'USER',
      entityId: id,
      details: `Rejected registration for user #${id}`,
      req
    });

    res.json({
      success: true,
      message: `Registration request #${id} has been rejected.`
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update account status (e.g. SUSPEND or REACTIVATE)
 */
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be APPROVED or SUSPENDED.' });
    }

    if (Number(id) === req.user.userId && status === 'SUSPENDED') {
      return res.status(400).json({ success: false, error: 'Self-Action Denied: You cannot suspend your own administrator account.' });
    }

    if (db.isUsingOracle()) {
      await db.execute(
        `UPDATE USERS SET status = :status WHERE user_id = :id`,
        { id: Number(id), status }
      );
    } else {
      db.mock.setUserStatus(id, status);
    }

    await auditService.logAction({
      userId: req.user.userId,
      userEmail: req.user.email,
      action: status === 'SUSPENDED' ? 'USER_ACCOUNT_SUSPENDED' : 'USER_ACCOUNT_REACTIVATED',
      entityType: 'USER',
      entityId: id,
      details: `User #${id} account status changed to ${status}`,
      req
    });

    res.json({
      success: true,
      message: `User account #${id} status updated to ${status}.`
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update assigned role and organization
 */
exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, party_id } = req.body;

    const validRoles = ['ADMINISTRATOR', 'MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY', 'REGULATOR'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: `Invalid role. Permitted: ${validRoles.join(', ')}.` });
    }

    const pid = party_id ? Number(party_id) : null;

    if (db.isUsingOracle()) {
      await db.execute(
        `UPDATE USERS SET role = :role, party_id = :pid WHERE user_id = :id`,
        { id: Number(id), role, pid }
      );
    } else {
      db.mock.updateUser(id, { role, party_id: pid });
    }

    await auditService.logAction({
      userId: req.user.userId,
      userEmail: req.user.email,
      action: 'USER_ROLE_UPDATED',
      entityType: 'USER',
      entityId: id,
      details: `User #${id} reassigned to role ${role} and party_id ${pid}`,
      req
    });

    res.json({
      success: true,
      message: `User #${id} successfully reassigned to role ${role}.`
    });
  } catch (err) {
    next(err);
  }
};

/**
 * View system audit trail
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { limit, action, entityType } = req.query;
    const logs = await auditService.getLogs({ limit: limit || 100, action, entityType });
    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    next(err);
  }
};
