const db = require('../config/db');
const auditService = require('../services/auditService');

exports.getAllRecalls = async (req, res, next) => {
  try {
    if (db.isUsingOracle()) {
      const sql = `
        SELECT r.recall_id, TO_CHAR(r.recall_date, 'YYYY-MM-DD') AS recall_date,
               r.status, r.reason,
               COUNT(DISTINCT b.batch_id) AS affected_batches_count,
               COUNT(p.package_id) AS affected_packages_count,
               recall_impact(r.recall_id) AS impact_summary
        FROM RECALL r
        LEFT JOIN BATCH b ON r.recall_id = b.recall_id
        LEFT JOIN PACKAGE p ON b.batch_id = p.batch_id
        GROUP BY r.recall_id, r.recall_date, r.status, r.reason
        ORDER BY r.recall_id DESC
      `;
      const result = await db.execute(sql);
      return res.json({ success: true, count: result.rows.length, data: result.rows });
    } else {
      const data = db.mock.getRecalls();
      return res.json({ success: true, count: data.length, data });
    }
  } catch (err) {
    next(err);
  }
};

exports.createRecall = async (req, res, next) => {
  try {
    const { recall_date, reason, status, batch_ids } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, error: 'Recall reason is required' });
    }

    // Role check: if Manufacturer, ensure they only recall batches belonging to their organization
    if (req.user && req.user.role === 'MANUFACTURER' && Array.isArray(batch_ids) && batch_ids.length > 0) {
      const userPartyId = Number(req.user.partyId);
      for (const bid of batch_ids) {
        let b = null;
        if (db.isUsingOracle()) {
          const bRes = await db.execute(`SELECT manufacturer_id FROM BATCH WHERE batch_id = :bid`, { bid: Number(bid) });
          if (bRes.rows && bRes.rows.length > 0) b = { manufacturer_id: bRes.rows[0].MANUFACTURER_ID };
        } else {
          b = db.mock.getBatchById(bid);
        }
        if (b && Number(b.manufacturer_id) !== userPartyId) {
          return res.status(403).json({
            success: false,
            error: `Ownership Violation: You cannot recall Batch #${bid} because it belongs to another manufacturer.`
          });
        }
      }
    }

    if (db.isUsingOracle()) {
      const seqRes = await db.execute(`SELECT seq_recall_id.NEXTVAL AS id FROM dual`);
      const recallId = seqRes.rows[0].ID;

      await db.execute(
        `INSERT INTO RECALL (recall_id, recall_date, status, reason)
         VALUES (:id, TO_DATE(:rdate, 'YYYY-MM-DD'), :status, :reason)`,
        {
          id: recallId,
          rdate: recall_date || new Date().toISOString().split('T')[0],
          status: status || 'INITIATED',
          reason
        }
      );

      // Link batches if provided
      if (Array.isArray(batch_ids)) {
        for (const bid of batch_ids) {
          await db.execute(`UPDATE BATCH SET recall_id = :rid WHERE batch_id = :bid`, { rid: recallId, bid: Number(bid) });
        }
      }

      if (req.user) {
        await auditService.logAction({
          userId: req.user.userId,
          userEmail: req.user.email,
          action: 'RECALL_INITIATED',
          entityType: 'RECALL',
          entityId: recallId,
          details: `Issued recall notice #${recallId}: "${reason}"`,
          req
        });
      }

      return res.status(201).json({ success: true, message: 'Recall notice issued successfully', data: { recall_id: recallId, ...req.body } });
    } else {
      const newRecall = db.mock.createRecall(req.body);

      if (req.user) {
        await auditService.logAction({
          userId: req.user.userId,
          userEmail: req.user.email,
          action: 'RECALL_INITIATED',
          entityType: 'RECALL',
          entityId: newRecall.recall_id,
          details: `Issued recall notice #${newRecall.recall_id}: "${reason}"`,
          req
        });
      }

      return res.status(201).json({ success: true, message: 'Recall notice issued successfully', data: newRecall });
    }
  } catch (err) {
    next(err);
  }
};

// PL/SQL process_recall procedure call
exports.processRecall = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (db.isUsingOracle()) {
      const plsql = `
        BEGIN
          process_recall(p_recall_id => :rid);
        END;
      `;
      await db.execute(plsql, { rid: Number(id) });

      if (req.user) {
        await auditService.logAction({
          userId: req.user.userId,
          userEmail: req.user.email,
          action: 'RECALL_PROCESSED',
          entityType: 'RECALL',
          entityId: id,
          details: `Executed PL/SQL process_recall procedure for Recall #${id}. Quarantine applied.`,
          req
        });
      }

      return res.json({
        success: true,
        message: `Recall #${id} executed via PL/SQL procedure process_recall. Batches & Packages quarantined.`
      });
    } else {
      const result = db.mock.processRecall(id);

      if (req.user) {
        await auditService.logAction({
          userId: req.user.userId,
          userEmail: req.user.email,
          action: 'RECALL_PROCESSED',
          entityType: 'RECALL',
          entityId: id,
          details: `Executed process_recall for Recall #${id}. ${result.message}`,
          req
        });
      }

      return res.json({ success: true, ...result });
    }
  } catch (err) {
    next(err);
  }
};

// PL/SQL recall_impact function call
exports.getRecallImpact = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (db.isUsingOracle()) {
      const sql = `SELECT recall_impact(:rid) AS impact_summary FROM dual`;
      const result = await db.execute(sql, { rid: Number(id) });
      const summary = result.rows[0]?.IMPACT_SUMMARY || 'No impact recorded';
      return res.json({ success: true, recall_id: Number(id), impact_summary: summary });
    } else {
      const summary = db.mock.getRecallImpact(id);
      return res.json({ success: true, recall_id: Number(id), impact_summary: summary });
    }
  } catch (err) {
    next(err);
  }
};

exports.updateRecall = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    if (db.isUsingOracle()) {
      await db.execute(
        `UPDATE RECALL SET status = NVL(:status, status), reason = NVL(:reason, reason) WHERE recall_id = :id`,
        { id: Number(id), status: status || null, reason: reason || null }
      );
      return res.json({ success: true, message: `Recall #${id} updated successfully.` });
    } else {
      const updated = db.mock.updateRecall(id, req.body);
      if (!updated) return res.status(404).json({ success: false, error: 'Recall not found' });
      return res.json({ success: true, message: `Recall #${id} updated successfully.`, data: updated });
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteRecall = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (db.isUsingOracle()) {
      // Check for dependent batches
      const checkRes = await db.execute(`SELECT COUNT(*) AS count FROM BATCH WHERE recall_id = :id`, { id: Number(id) });
      const count = checkRes.rows[0]?.COUNT || 0;
      if (count > 0) {
        return res.status(409).json({
          success: false,
          error: `Cannot delete Recall #${id}: Batches are currently linked to this recall notice. Referential integrity preserved.`
        });
      }
      await db.execute(`DELETE FROM RECALL WHERE recall_id = :id`, { id: Number(id) });
      return res.json({ success: true, message: `Recall #${id} deleted successfully.` });
    } else {
      db.mock.deleteRecall(id);
      return res.json({ success: true, message: `Recall #${id} deleted successfully.` });
    }
  } catch (err) {
    next(err);
  }
};
