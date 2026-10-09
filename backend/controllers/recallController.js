const db = require('../config/db');

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

      return res.status(201).json({ success: true, message: 'Recall notice issued successfully', data: { recall_id: recallId, ...req.body } });
    } else {
      const newRecall = db.mock.createRecall(req.body);
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
      return res.json({
        success: true,
        message: `Recall #${id} executed via PL/SQL procedure process_recall. Batches & Packages quarantined.`
      });
    } else {
      const result = db.mock.processRecall(id);
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
      const summary = db.mock.recallImpact(id);
      return res.json({ success: true, recall_id: Number(id), impact_summary: summary });
    }
  } catch (err) {
    next(err);
  }
};

exports.updateRecall = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, status, recall_date } = req.body;
    if (db.isUsingOracle()) {
      await db.execute(
        `UPDATE RECALL SET reason = NVL(:reason, reason), status = NVL(:status, status), recall_date = NVL(TO_DATE(:rdate, 'YYYY-MM-DD'), recall_date) WHERE recall_id = :id`,
        { id: Number(id), reason: reason || null, status: status || null, rdate: recall_date || null }
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
      const checkRes = await db.execute(`SELECT COUNT(*) AS count FROM BATCH WHERE recall_id = :id`, { id: Number(id) });
      const count = checkRes.rows[0]?.COUNT || 0;
      if (count > 0) {
        return res.status(409).json({
          success: false,
          error: `Cannot delete Recall #${id}: ${count} manufactured batch(es) are linked to this recall. Referential integrity preserved.`
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

