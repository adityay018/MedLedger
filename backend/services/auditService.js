const db = require('../config/db');

// Sensitive keys to redact from audit logs
const REDACTED_KEYS = ['password', 'password_hash', 'token', 'access_token', 'refresh_token', 'secret', 'authorization'];

function sanitizeDetails(details) {
  if (!details) return null;
  if (typeof details === 'string') {
    return details;
  }
  try {
    const clone = JSON.parse(JSON.stringify(details));
    const redactObject = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      for (const key of Object.keys(obj)) {
        if (REDACTED_KEYS.some(rk => key.toLowerCase().includes(rk))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          redactObject(obj[key]);
        }
      }
    };
    redactObject(clone);
    const jsonStr = JSON.stringify(clone);
    return jsonStr.length > 950 ? jsonStr.substring(0, 947) + '...' : jsonStr;
  } catch (e) {
    return String(details);
  }
}

/**
 * Record a security or business audit log entry
 * @param {Object} entry
 * @param {number|null} entry.userId - Authenticated user ID
 * @param {string} entry.userEmail - User email
 * @param {string} entry.action - Action identifier (e.g. LOGIN_SUCCESS, BATCH_CREATED)
 * @param {string} [entry.entityType] - Entity affected (e.g. BATCH, SHIPMENT, USER)
 * @param {string|number} [entry.entityId] - ID of affected record
 * @param {string|Object} [entry.details] - Additional contextual details
 * @param {Object} [entry.req] - Express request for IP resolution
 */
async function logAction({ userId, userEmail, action, entityType, entityId, details, req }) {
  try {
    const ipAddress = req 
      ? (req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1')
      : 'SYSTEM';

    const cleanDetails = sanitizeDetails(details);
    const cleanEntityId = entityId != null ? String(entityId) : null;

    if (db.isUsingOracle()) {
      const seqRes = await db.execute(`SELECT seq_audit_id.NEXTVAL AS id FROM dual`);
      const logId = seqRes.rows[0].ID;

      await db.execute(
        `INSERT INTO AUDIT_LOG (log_id, user_id, user_email, action, entity_type, entity_id, details, ip_address, created_at)
         VALUES (:id, :uid, :email, :action, :etype, :eid, :details, :ip, SYSDATE)`,
        {
          id: logId,
          uid: userId ? Number(userId) : null,
          email: userEmail || 'anonymous',
          action,
          etype: entityType || null,
          eid: cleanEntityId,
          details: cleanDetails,
          ip: ipAddress
        }
      );
      return { log_id: logId, action, timestamp: new Date().toISOString() };
    } else {
      // In-memory simulation audit log
      return db.mock.createAuditLog({
        user_id: userId ? Number(userId) : null,
        user_email: userEmail || 'anonymous',
        action,
        entity_type: entityType || null,
        entity_id: cleanEntityId,
        details: cleanDetails,
        ip_address: ipAddress
      });
    }
  } catch (err) {
    // Non-blocking logger error handling
    console.error('[AUDIT LOG ERROR] Failed to record audit log:', err.message);
    return null;
  }
}

/**
 * Retrieve audit logs with optional filtering
 */
async function getLogs({ limit = 50, action, entityType, userId } = {}) {
  try {
    if (db.isUsingOracle()) {
      let sql = `
        SELECT log_id, user_id, user_email, action, entity_type, entity_id, details, ip_address,
               TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS timestamp
        FROM AUDIT_LOG
      `;
      const binds = {};
      const where = [];
      if (action) {
        where.push(`action = :action`);
        binds.action = action;
      }
      if (entityType) {
        where.push(`entity_type = :entityType`);
        binds.entityType = entityType;
      }
      if (userId) {
        where.push(`user_id = :userId`);
        binds.userId = Number(userId);
      }
      if (where.length > 0) {
        sql += ` WHERE ` + where.join(' AND ');
      }
      sql += ` ORDER BY log_id DESC FETCH FIRST :limit ROWS ONLY`;
      binds.limit = Number(limit);

      const result = await db.execute(sql, binds);
      return result.rows || [];
    } else {
      return db.mock.getAuditLogs({ limit, action, entityType, userId });
    }
  } catch (err) {
    console.error('[AUDIT LOG RETRIEVAL ERROR]:', err);
    return [];
  }
}

module.exports = {
  logAction,
  getLogs
};
