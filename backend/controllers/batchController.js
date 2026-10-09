const oracledb = require('oracledb');
const db = require('../config/db');
const auditService = require('../services/auditService');

exports.getAllBatches = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    // Organization-aware data scoping: Manufacturers only see their own batches unless Administrator or Regulator
    let mfgFilter = null;
    if (req.user && req.user.role === 'MANUFACTURER' && req.user.partyId) {
      mfgFilter = Number(req.user.partyId);
    }

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
      const where = [];

      if (status) {
        where.push(`b.batch_status = :status`);
        binds.status = status;
      }
      if (mfgFilter) {
        where.push(`b.manufacturer_id = :mfgId`);
        binds.mfgId = mfgFilter;
      }

      if (where.length > 0) {
        sql += ` WHERE ` + where.join(' AND ');
      }
      sql += ` ORDER BY b.batch_id DESC`;
      const result = await db.execute(sql, binds);
      return res.json({ success: true, count: result.rows.length, data: result.rows });
    } else {
      let data = db.mock.getBatches(status);
      if (mfgFilter) {
        data = data.filter(b => b.manufacturer_id === mfgFilter);
      }
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
      const result = await db.execute(sql, { id: Number(id) });
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

// PL/SQL register_batch procedure call with manufacturer authorization
exports.createBatch = async (req, res, next) => {
  try {
    let { drug_id, manufacturer_id, manufacture_date, batch_status, recall_id } = req.body;

    // Enforce Manufacturer organization identity: a manufacturer can ONLY register batches for its own party
    if (req.user && req.user.role === 'MANUFACTURER') {
      if (!req.user.partyId) {
        return res.status(403).json({ success: false, error: 'Account not linked to an approved manufacturer organization.' });
      }
      if (manufacturer_id && Number(manufacturer_id) !== Number(req.user.partyId)) {
        return res.status(403).json({
          success: false,
          error: 'Ownership Violation: A manufacturer cannot register batches under another organization\'s party ID.'
        });
      }
      manufacturer_id = req.user.partyId;
    }

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

      if (recall_id) {
        await db.execute(
          `UPDATE BATCH SET recall_id = :rid WHERE batch_id = :bid`,
          { rid: Number(recall_id), bid: generatedId }
        );
      }

      if (req.user) {
        await auditService.logAction({
          userId: req.user.userId,
          userEmail: req.user.email,
          action: 'BATCH_CREATED',
          entityType: 'BATCH',
          entityId: generatedId,
          details: `Registered batch #${generatedId} for drug #${drug_id} (Manufacturer #${manufacturer_id})`,
          req
        });
      }

      return res.status(201).json({
        success: true,
        message: `Batch #${generatedId} successfully registered via PL/SQL register_batch procedure`,
        data: { batch_id: generatedId, drug_id: Number(drug_id), manufacturer_id: Number(manufacturer_id), manufacture_date, batch_status: batch_status || 'RELEASED', recall_id }
      });
    } else {
      const newBatch = db.mock.registerBatch({
        drug_id,
        manufacturer_id,
        manufacture_date,
        batch_status,
        recall_id
      });

      if (req.user) {
        await auditService.logAction({
          userId: req.user.userId,
          userEmail: req.user.email,
          action: 'BATCH_CREATED',
          entityType: 'BATCH',
          entityId: newBatch.batch_id,
          details: `Registered batch #${newBatch.batch_id} for drug #${drug_id} (Manufacturer #${manufacturer_id})`,
          req
        });
      }

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

    // Verify batch existence & ownership
    let existingBatch = null;
    if (db.isUsingOracle()) {
      const checkRes = await db.execute(`SELECT batch_id, manufacturer_id FROM BATCH WHERE batch_id = :id`, { id: Number(id) });
      if (!checkRes.rows || checkRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Batch not found' });
      }
      existingBatch = { batch_id: checkRes.rows[0].BATCH_ID, manufacturer_id: checkRes.rows[0].MANUFACTURER_ID };
    } else {
      existingBatch = db.mock.getBatchById(id);
      if (!existingBatch) {
        return res.status(404).json({ success: false, error: 'Batch not found' });
      }
    }

    // Enforce Manufacturer ownership: cannot edit another manufacturer's batches
    if (req.user && req.user.role === 'MANUFACTURER') {
      if (Number(existingBatch.manufacturer_id) !== Number(req.user.partyId)) {
        return res.status(403).json({
          success: false,
          error: 'Ownership Violation: You can only modify batches manufactured by your own organization.'
        });
      }
    }

    if (db.isUsingOracle()) {
      await db.execute(
        `UPDATE BATCH SET batch_status = NVL(:status, batch_status), recall_id = :recall_id WHERE batch_id = :id`,
        { id: Number(id), status: batch_status || null, recall_id: recall_id !== undefined ? (recall_id ? Number(recall_id) : null) : null }
      );

      if (req.user) {
        await auditService.logAction({
          userId: req.user.userId,
          userEmail: req.user.email,
          action: 'BATCH_UPDATED',
          entityType: 'BATCH',
          entityId: id,
          details: `Updated batch #${id} status: ${batch_status || 'unchanged'}`,
          req
        });
      }

      return res.json({ success: true, message: 'Batch updated successfully' });
    } else {
      const updated = db.mock.updateBatch(id, req.body);
      if (!updated) return res.status(404).json({ success: false, error: 'Batch not found' });

      if (req.user) {
        await auditService.logAction({
          userId: req.user.userId,
          userEmail: req.user.email,
          action: 'BATCH_UPDATED',
          entityType: 'BATCH',
          entityId: id,
          details: `Updated batch #${id} status: ${batch_status || 'unchanged'}`,
          req
        });
      }

      return res.json({ success: true, message: 'Batch updated successfully', data: updated });
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteBatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    let existingBatch = null;
    if (db.isUsingOracle()) {
      const checkRes = await db.execute(`SELECT batch_id, manufacturer_id FROM BATCH WHERE batch_id = :id`, { id: Number(id) });
      if (!checkRes.rows || checkRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Batch not found' });
      existingBatch = { batch_id: checkRes.rows[0].BATCH_ID, manufacturer_id: checkRes.rows[0].MANUFACTURER_ID };
    } else {
      existingBatch = db.mock.getBatchById(id);
      if (!existingBatch) return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    if (req.user && req.user.role === 'MANUFACTURER') {
      if (Number(existingBatch.manufacturer_id) !== Number(req.user.partyId)) {
        return res.status(403).json({
          success: false,
          error: 'Ownership Violation: You can only delete batches manufactured by your own organization.'
        });
      }
    }

    if (db.isUsingOracle()) {
      // Check for dependent packages
      const pkgCheck = await db.execute(`SELECT COUNT(*) AS count FROM PACKAGE WHERE batch_id = :id`, { id: Number(id) });
      const pkgCount = pkgCheck.rows[0]?.COUNT || 0;
      if (pkgCount > 0) {
        return res.status(409).json({
          success: false,
          error: `Cannot delete Batch #${id}: ${pkgCount} dependent serialized package(s) exist in PACKAGE table. Referential integrity preserved.`
        });
      }
      await db.execute(`DELETE FROM BATCH WHERE batch_id = :id`, { id: Number(id) });

      if (req.user) {
        await auditService.logAction({
          userId: req.user.userId,
          userEmail: req.user.email,
          action: 'BATCH_DELETED',
          entityType: 'BATCH',
          entityId: id,
          details: `Deleted batch #${id}`,
          req
        });
      }

      return res.json({ success: true, message: 'Batch deleted successfully' });
    } else {
      db.mock.deleteBatch(id);

      if (req.user) {
        await auditService.logAction({
          userId: req.user.userId,
          userEmail: req.user.email,
          action: 'BATCH_DELETED',
          entityType: 'BATCH',
          entityId: id,
          details: `Deleted batch #${id}`,
          req
        });
      }

      return res.json({ success: true, message: 'Batch deleted successfully' });
    }
  } catch (err) {
    next(err);
  }
};
