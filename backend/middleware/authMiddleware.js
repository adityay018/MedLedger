const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'medledger_jwt_secure_secret_prod_key_2026';

/**
 * Helper to fetch user record by ID (from Oracle or simulation)
 */
async function findUserById(userId) {
  const numId = Number(userId);
  if (db.isUsingOracle()) {
    const sql = `
      SELECT u.user_id, u.name, u.email, u.role, u.party_id, u.status, u.requested_role,
             p.party_name AS org_name
      FROM USERS u
      LEFT JOIN PARTY p ON u.party_id = p.party_id
      WHERE u.user_id = :id
    `;
    const result = await db.execute(sql, { id: numId });
    if (!result.rows || result.rows.length === 0) return null;
    return result.rows[0];
  } else {
    return db.mock.getUserById(numId);
  }
}

/**
 * Authentication middleware: verifies JWT and loads active user profile
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        error: 'Authentication required. Please provide a valid Bearer token.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED_OR_INVALID',
        error: 'Your authentication token is invalid or has expired. Please sign in again.'
      });
    }

    const user = await findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        error: 'Authenticated user account was not found.'
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        error: 'Your MedLedger account has been suspended by an administrator.'
      });
    }

    if (user.status === 'PENDING') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_PENDING',
        error: 'Your registration is pending Administrator approval.'
      });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_REJECTED',
        error: 'Your account registration request was not approved.'
      });
    }

    // Attach authenticated identity to request
    req.user = {
      userId: user.USER_ID || user.user_id,
      name: user.NAME || user.name,
      email: user.EMAIL || user.email,
      role: user.ROLE || user.role,
      partyId: user.PARTY_ID != null ? Number(user.PARTY_ID) : (user.party_id != null ? Number(user.party_id) : null),
      orgName: user.ORG_NAME || user.org_name || null,
      status: user.STATUS || user.status
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication middleware for endpoints accessible publicly or with added context
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await findUserById(decoded.userId);
        if (user && user.status === 'APPROVED') {
          req.user = {
            userId: user.USER_ID || user.user_id,
            name: user.NAME || user.name,
            email: user.EMAIL || user.email,
            role: user.ROLE || user.role,
            partyId: user.PARTY_ID != null ? Number(user.PARTY_ID) : (user.party_id != null ? Number(user.party_id) : null),
            orgName: user.ORG_NAME || user.org_name || null,
            status: user.STATUS || user.status
          };
        }
      } catch (e) {
        // Ignore invalid token in optional auth
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role-based access control middleware
 * Rejects requests if user does not possess one of the allowed roles
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        error: 'Authentication required for this operation.'
      });
    }

    // Administrators always have root operational access
    if (req.user.role === 'ADMINISTRATOR') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        error: `Permission Denied: Your role (${req.user.role}) is not authorized to perform this operation. Allowed roles: ${allowedRoles.join(', ')}.`
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  JWT_SECRET
};
