const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const auditService = require('../services/auditService');

// Allowed self-registration roles (ADMINISTRATOR is strictly prohibited from public self-registration)
const ALLOWED_REGISTRATION_ROLES = ['MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY', 'REGULATOR'];

// Centralized permission matrix for client introspection
function getPermissionsForRole(role) {
  const permissions = {
    ADMINISTRATOR: [
      'manage_users', 'approve_registrations', 'manage_roles', 'view_audit_logs',
      'manage_parties', 'manage_drugs', 'manage_batches', 'manage_quality_tests',
      'manage_packages', 'manage_shipments', 'manage_recalls', 'manage_dispensing',
      'view_analytics', 'system_admin'
    ],
    MANUFACTURER: [
      'view_drug_catalogue', 'register_drug', 'create_own_batch', 'update_own_batch',
      'create_quality_test', 'view_own_quality_tests', 'create_outbound_shipment',
      'view_own_shipments', 'view_own_packages', 'initiate_batch_recall',
      'view_recalls', 'view_analytics', 'verify_package'
    ],
    DISTRIBUTOR: [
      'view_drug_catalogue', 'view_assigned_shipments', 'update_shipment_status',
      'view_custody_packages', 'view_recalls', 'verify_package', 'view_analytics'
    ],
    PHARMACY: [
      'view_drug_catalogue', 'view_inbound_shipments', 'view_pharmacy_packages',
      'record_dispensing', 'view_own_dispensing', 'view_recalls', 'verify_package',
      'view_analytics'
    ],
    REGULATOR: [
      'view_drug_catalogue', 'view_all_batches', 'view_all_quality_tests',
      'view_all_shipments', 'view_all_packages', 'issue_recall', 'process_recall',
      'view_recalls', 'view_recall_impact', 'view_all_dispensing', 'view_analytics',
      'view_compliance_audit_logs', 'verify_package'
    ]
  };
  return permissions[role] || ['verify_package'];
}

/**
 * Public User Login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = null;

    if (db.isUsingOracle()) {
      const sql = `
        SELECT u.user_id, u.name, u.email, u.password_hash, u.role, u.party_id, u.status,
               p.party_name AS org_name
        FROM USERS u
        LEFT JOIN PARTY p ON u.party_id = p.party_id
        WHERE LOWER(u.email) = :email
      `;
      const result = await db.execute(sql, { email: cleanEmail });
      if (result.rows && result.rows.length > 0) {
        user = result.rows[0];
      }
    } else {
      user = db.mock.getUserByEmail(cleanEmail);
    }

    // Generic error to prevent account enumeration
    if (!user) {
      await auditService.logAction({
        userEmail: cleanEmail,
        action: 'LOGIN_FAILED',
        entityType: 'AUTH',
        details: 'Failed authentication attempt: user does not exist',
        req
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const passwordHash = user.PASSWORD_HASH || user.password_hash;
    const isMatch = await bcrypt.compare(password, passwordHash);

    if (!isMatch) {
      await auditService.logAction({
        userId: user.USER_ID || user.user_id,
        userEmail: cleanEmail,
        action: 'LOGIN_FAILED',
        entityType: 'AUTH',
        details: 'Failed authentication attempt: incorrect password',
        req
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const status = user.STATUS || user.status;
    const userId = user.USER_ID || user.user_id;
    const role = user.ROLE || user.role;
    const partyId = user.PARTY_ID != null ? Number(user.PARTY_ID) : (user.party_id != null ? Number(user.party_id) : null);
    const name = user.NAME || user.name;
    const orgName = user.ORG_NAME || user.org_name || null;

    // Check account status
    if (status === 'PENDING') {
      await auditService.logAction({
        userId,
        userEmail: cleanEmail,
        action: 'LOGIN_BLOCKED_PENDING',
        entityType: 'AUTH',
        details: 'Login blocked: Account is pending Administrator approval',
        req
      });
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_PENDING',
        error: 'Your account registration is currently pending Administrator approval. Please await administrator verification before logging in.'
      });
    }

    if (status === 'SUSPENDED') {
      await auditService.logAction({
        userId,
        userEmail: cleanEmail,
        action: 'LOGIN_BLOCKED_SUSPENDED',
        entityType: 'AUTH',
        details: 'Login blocked: Account suspended by administrator',
        req
      });
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        error: 'Your account has been suspended by a compliance administrator.'
      });
    }

    if (status === 'REJECTED') {
      await auditService.logAction({
        userId,
        userEmail: cleanEmail,
        action: 'LOGIN_BLOCKED_REJECTED',
        entityType: 'AUTH',
        details: 'Login blocked: Registration request was rejected',
        req
      });
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_REJECTED',
        error: 'Your account registration was not approved by the organization administrator.'
      });
    }

    // Generate signed JWT token
    const token = jwt.sign(
      {
        userId,
        email: cleanEmail,
        role,
        partyId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await auditService.logAction({
      userId,
      userEmail: cleanEmail,
      action: 'LOGIN_SUCCESS',
      entityType: 'AUTH',
      details: `User logged in with role ${role}`,
      req
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        userId,
        name,
        email: cleanEmail,
        role,
        partyId,
        orgName,
        status,
        permissions: getPermissionsForRole(role)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Public User Registration
 * New users can request an operational role, but account defaults to PENDING approval.
 * Self-registration as ADMINISTRATOR is strictly prevented.
 */
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      requested_role,
      requested_org_name,
      party_id,
      organization_details
    } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Full name is required (minimum 2 characters).' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
    }

    const cleanRole = (requested_role || '').trim().toUpperCase();

    // Critical security check: Prevent privilege escalation via public self-registration
    if (cleanRole === 'ADMINISTRATOR' || req.body.role === 'ADMINISTRATOR') {
      await auditService.logAction({
        userEmail: email.trim().toLowerCase(),
        action: 'PRIVILEGE_ESCALATION_ATTEMPT',
        entityType: 'SECURITY',
        details: 'Attempted to register as ADMINISTRATOR via public registration endpoint.',
        req
      });
      return res.status(400).json({
        success: false,
        error: 'Privilege Violation: The Administrator role cannot be requested or self-assigned through public registration. Administrators must be provisioned through secure bootstrap.'
      });
    }

    if (!ALLOWED_REGISTRATION_ROLES.includes(cleanRole)) {
      return res.status(400).json({
        success: false,
        error: `Invalid requested role. Allowed roles: ${ALLOWED_REGISTRATION_ROLES.join(', ')}.`
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check for existing user with this email
    let existingUser = null;
    if (db.isUsingOracle()) {
      const checkSql = `SELECT user_id FROM USERS WHERE LOWER(email) = :email`;
      const checkRes = await db.execute(checkSql, { email: cleanEmail });
      if (checkRes.rows && checkRes.rows.length > 0) existingUser = checkRes.rows[0];
    } else {
      existingUser = db.mock.getUserByEmail(cleanEmail);
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in or use a different email.'
      });
    }

    // Secure password hashing
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let createdId;
    if (db.isUsingOracle()) {
      const seqRes = await db.execute(`SELECT seq_user_id.NEXTVAL AS id FROM dual`);
      createdId = seqRes.rows[0].ID;

      await db.execute(
        `INSERT INTO USERS (
           user_id, name, email, password_hash, role, party_id, status,
           requested_role, requested_org_name, organization_details, created_at
         ) VALUES (
           :id, :name, :email, :phash, :role, :pid, 'PENDING',
           :req_role, :req_org, :org_details, SYSDATE
         )`,
        {
          id: createdId,
          name: name.trim(),
          email: cleanEmail,
          phash: passwordHash,
          role: cleanRole,
          pid: party_id ? Number(party_id) : null,
          req_role: cleanRole,
          req_org: requested_org_name ? requested_org_name.trim() : null,
          org_details: organization_details ? organization_details.trim() : null
        }
      );
    } else {
      const newUser = db.mock.createUser({
        name: name.trim(),
        email: cleanEmail,
        password_hash: passwordHash,
        role: cleanRole,
        party_id: party_id ? Number(party_id) : null,
        status: 'PENDING',
        requested_role: cleanRole,
        requested_org_name: requested_org_name ? requested_org_name.trim() : null,
        organization_details: organization_details ? organization_details.trim() : null
      });
      createdId = newUser.user_id;
    }

    await auditService.logAction({
      userId: createdId,
      userEmail: cleanEmail,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: createdId,
      details: `New registration request for role ${cleanRole} at organization "${requested_org_name || 'N/A'}"`,
      req
    });

    res.status(201).json({
      success: true,
      message: 'Registration request submitted successfully. Your account is pending Administrator approval.',
      data: {
        userId: createdId,
        name: name.trim(),
        email: cleanEmail,
        requestedRole: cleanRole,
        status: 'PENDING'
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get current authenticated user profile
 */
exports.getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }

    res.json({
      success: true,
      user: {
        ...req.user,
        permissions: getPermissionsForRole(req.user.role)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Logout
 */
exports.logout = async (req, res, next) => {
  try {
    if (req.user) {
      await auditService.logAction({
        userId: req.user.userId,
        userEmail: req.user.email,
        action: 'LOGOUT',
        entityType: 'AUTH',
        details: 'User logged out',
        req
      });
    }
    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err) {
    next(err);
  }
};
