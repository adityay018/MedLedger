const oracledb = require('oracledb');
const db = require('../config/db');

exports.getAllBatches = async (req, res, next) => {
  try {
    const { status } = req.query;
    if (db.isUsingOracle()) {
      let sql = `
        SELECT b.batch_id, b.drug_id, b.manufacturer_id, b.recall_id, b.batch_status,
               TO_CHAR(b.manufacture_date, 'YYYY-MM-DD') AS manufacture_date,
               d.drug_name, d.strength, d.dosage_form,
               p.party_name AS manufacturer_name,
               r.reason AS recall_reason
        FROM BATCH b
        INNER JOIN DRUG d ON b.drug_id = d.drug_id
        INNER JOIN PARTY p ON b.manufacturer_id = p.party_id
        LEFT JOIN RECALL r ON b.recall_id = r.recall_id
      `;
      const binds = {};
      if (status) {
        sql += ` WHERE b.batch_status = :status`;
        binds.status = status;
      }
      sql += ` ORDER BY b.batch_id DESC`;
      const result = await db.execute(sql, binds);
      return res.json({ success: true, count: result.rows.length, data: result.rows });
    } else {
      const data = db.mock.getBatches(status);
      return res.json({ success: true, count: data.length, data });
    }
  } catch (err) {
    next(err);
  }
};

exports.getBatchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (db.isUsingOracle()) {
      const sql = `
        SELECT b.batch_id, b.drug_id, b.manufacturer_id, b.recall_id, b.batch_status,
               TO_CHAR(b.manufacture_date, 'YYYY-MM-DD') AS manufacture_date,
               d.drug_name, d.strength, d.dosage_form,
               p.party_name AS manufacturer_name,
               r.reason AS recall_reason
        FROM BATCH b
        INNER JOIN DRUG d ON b.drug_id = d.drug_id
        INNER JOIN PARTY p ON b.manufacturer_id = p.party_id
        LEFT JOIN RECALL r ON b.recall_id = r.recall_id
        WHERE b.batch_id = :id
      `;
      const result = await db.execute(sql, { id });
      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Batch not found' });
      }
      return res.json({ success: true, data: result.rows[0] });
    } else {
      const batch = db.mock.getBatchById(id);
      if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
      return res.json({ success: true, data: batch });
    }
  } catch (err) {
    next(err);
  }
};

// PL/SQL register_batch procedure call
exports.createBatch = async (req, res, next) => {
  try {
    const { drug_id, manufacturer_id, manufacture_date, batch_status } = req.body;
    if (!drug_id || !manufacturer_id) {
      return res.status(400).json({ success: false, error: 'drug_id and manufacturer_id are required' });
    }

    if (db.isUsingOracle()) {
      const plsql = `
        BEGIN
          register_batch(
            p_drug_id          => :drug_id,
            p_manufacturer_id  => :mfg_id,
            p_manufacture_date => TO_DATE(:mfg_date, 'YYYY-MM-DD'),
            p_batch_status     => :status,
            p_new_batch_id     => :new_batch_id
          );
        END;
      `;
      const binds = {
        drug_id: Number(drug_id),
        mfg_id: Number(manufacturer_id),
        mfg_date: manufacture_date || new Date().toISOString().split('T')[0],
        status: batch_status || 'RELEASED',
        new_batch_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      };

      const result = await db.execute(plsql, binds);
      const generatedId = result.outBinds.new_batch_id;
      return res.status(201).json({
        success: true,
        message: `Batch #${generatedId} successfully registered via PL/SQL register_batch procedure`,
        data: { batch_id: generatedId, ...req.body }
      });
    } else {
      const newBatch = db.mock.registerBatch(req.body);
      return res.status(201).json({
        success: true,
        message: `Batch #${newBatch.batch_id} registered successfully via register_batch`,
        data: newBatch
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.updateBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { batch_status, recall_id } = req.body;

    if (db.isUsingOracle()) {
      await db.execute(
        `UPDATE BATCH SET batch_status = NVL(:status, batch_status), recall_id = NVL(:recall_id, recall_id) WHERE batch_id = :id`,
        { id, status: batch_status || null, recall_id: recall_id || null }
      );
      return res.json({ success: true, message: 'Batch updated successfully' });
    } else {
      const updated = db.mock.updateBatch(id, req.body);
      if (!updated) return res.status(404).json({ success: false, error: 'Batch not found' });
      return res.json({ success: true, message: 'Batch updated successfully', data: updated });
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (db.isUsingOracle()) {
      await db.execute(`DELETE FROM BATCH WHERE batch_id = :id`, { id });
      return res.json({ success: true, message: 'Batch deleted successfully' });
    } else {
      db.mock.deleteBatch(id);
      return res.json({ success: true, message: 'Batch deleted successfully' });
    }
  } catch (err) {
    next(err);
  }
};
