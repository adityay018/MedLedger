const db = require('../config/db');
const auditService = require('../services/auditService');

exports.getAllQualityTests = async (req, res, next) => {
  try {
    const { batchId } = req.query;

    let mfgFilter = null;
    if (req.user && req.user.role === 'MANUFACTURER' && req.user.partyId) {
      mfgFilter = Number(req.user.partyId);
    }

    if (db.isUsingOracle()) {
      let sql = `
        SELECT qt.test_id, qt.batch_id,
               TO_CHAR(qt.test_date, 'YYYY-MM-DD') AS test_date,
               qt.test_type, qt.result, qt.status,
               d.drug_name, b.batch_status, b.manufacturer_id,
               p.party_name AS manufacturer_name
        FROM QUALITY_TEST qt
        INNER JOIN BATCH b ON qt.batch_id = b.batch_id
        INNER JOIN DRUG d ON b.drug_id = d.drug_id
        INNER JOIN PARTY p ON b.manufacturer_id = p.party_id
      `;
      const binds = {};
      const where = [];

      if (batchId) {
        where.push(`qt.batch_id = :bid`);
        binds.bid = Number(batchId);
      }
      if (mfgFilter) {
        where.push(`b.manufacturer_id = :mfgId`);
        binds.mfgId = mfgFilter;
      }

      if (where.length > 0) {
        sql += ` WHERE ` + where.join(' AND ');
      }
      sql += ` ORDER BY qt.test_id DESC`;
      const result = await db.execute(sql, binds);
      return res.json({ success: true, count: result.rows.length, data: result.rows });
    } else {
      let data = db.mock.getQualityTests(batchId);
      if (mfgFilter) {
        data = data.filter(qt => {
          const b = db.mock.getBatchById(qt.batch_id);
          return b && b.manufacturer_id === mfgFilter;
        });
      }
      return res.json({ success: true, count: data.length, data });
    }
  } catch (err) {
    next(err);
  }
};

exports.createQualityTest = async (req, res, next) => {
  try {
    const { batch_id, test_date, test_type, result, status } = req.body;
    if (!batch_id || !test_type || !result) {
      return res.status(400).json({ success: false, error: 'batch_id, test_type, and result are required' });
    }

    // Verify batch existence & manufacturer ownership
    let batch = null;
    if (db.isUsingOracle()) {
      const bRes = await db.execute(`SELECT batch_id, manufacturer_id FROM BATCH WHERE batch_id = :bid`, { bid: Number(batch_id) });
      if (!bRes.rows || bRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Target batch does not exist.' });
      batch = { batch_id: bRes.rows[0].BATCH_ID, manufacturer_id: bRes.rows[0].MANUFACTURER_ID };
    } else {
      batch = db.mock.getBatchById(batch_id);
      if (!batch) return res.status(404).json({ success: false, error: 'Target batch does not exist.' });
    }

    if (req.user && req.user.role === 'MANUFACTURER') {
      if (Number(batch.manufacturer_id) !== Number(req.user.partyId)) {
        return res.status(403).json({
          success: false,
          error: 'Ownership Violation: You can only record quality assurance assays for batches manufactured by your own organization.'
        });
      }
    }

    if (db.isUsingOracle()) {
      const seqRes = await db.execute(`SELECT seq_test_id.NEXTVAL AS id FROM dual`);
      const testId = seqRes.rows[0].ID;

      await db.execute(
        `INSERT INTO QUALITY_TEST (test_id, batch_id, test_date, test_type, result, status)
         VALUES (:id, :bid, TO_DATE(:tdate, 'YYYY-MM-DD'), :ttype, :res, :status)`,
        {
          id: testId,
          bid: Number(batch_id),
          tdate: test_date || new Date().toISOString().split('T')[0],
          ttype: test_type,
          res: result,
          status: status || 'PASSED'
        }
      );

      if (req.user) {
        await auditService.logAction({
          userId: req.user.userId,
          userEmail: req.user.email,
          action: 'QUALITY_TEST_LOGGED',
          entityType: 'QUALITY_TEST',
          entityId: testId,
          details: `Recorded ${test_type} (${status || 'PASSED'}) for batch #${batch_id}`,
          req
        });
      }

      return res.status(201).json({ success: true, message: 'Quality test logged successfully', data: { test_id: testId, ...req.body } });
    } else {
      const newTest = db.mock.createQualityTest(req.body);

      if (req.user) {
        await auditService.logAction({
          userId: req.user.userId,
          userEmail: req.user.email,
          action: 'QUALITY_TEST_LOGGED',
          entityType: 'QUALITY_TEST',
          entityId: newTest.test_id,
          details: `Recorded ${test_type} (${status || 'PASSED'}) for batch #${batch_id}`,
          req
        });
      }

      return res.status(201).json({ success: true, message: 'Quality test logged successfully', data: newTest });
    }
  } catch (err) {
    next(err);
  }
};

exports.updateQualityTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { test_type, result, status, test_date } = req.body;

    // Verify ownership
    let qt = null;
    if (db.isUsingOracle()) {
      const checkRes = await db.execute(
        `SELECT qt.test_id, b.manufacturer_id FROM QUALITY_TEST qt INNER JOIN BATCH b ON qt.batch_id = b.batch_id WHERE qt.test_id = :id`,
        { id: Number(id) }
      );
      if (!checkRes.rows || checkRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Quality test not found.' });
      qt = checkRes.rows[0];
      if (req.user && req.user.role === 'MANUFACTURER' && Number(qt.MANUFACTURER_ID) !== Number(req.user.partyId)) {
        return res.status(403).json({ success: false, error: 'Ownership Violation: You can only modify tests for your own batches.' });
      }

      await db.execute(
        `UPDATE QUALITY_TEST SET test_type = NVL(:ttype, test_type), result = NVL(:res, result), status = NVL(:status, status), test_date = NVL(TO_DATE(:tdate, 'YYYY-MM-DD'), test_date) WHERE test_id = :id`,
        { id: Number(id), ttype: test_type || null, res: result || null, status: status || null, tdate: test_date || null }
      );
      return res.json({ success: true, message: `Quality test #${id} updated successfully.` });
    } else {
      const test = db.mock.getQualityTests().find(q => q.test_id === Number(id));
      if (!test) return res.status(404).json({ success: false, error: 'Quality test not found.' });
      const b = db.mock.getBatchById(test.batch_id);
      if (req.user && req.user.role === 'MANUFACTURER' && b && Number(b.manufacturer_id) !== Number(req.user.partyId)) {
        return res.status(403).json({ success: false, error: 'Ownership Violation: You can only modify tests for your own batches.' });
      }

      const updated = db.mock.updateQualityTest(id, req.body);
      return res.json({ success: true, message: `Quality test #${id} updated successfully.`, data: updated });
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteQualityTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (db.isUsingOracle()) {
      await db.execute(`DELETE FROM QUALITY_TEST WHERE test_id = :id`, { id: Number(id) });
      return res.json({ success: true, message: `Quality test #${id} deleted successfully.` });
    } else {
      db.mock.deleteQualityTest(id);
      return res.json({ success: true, message: `Quality test #${id} deleted successfully.` });
    }
  } catch (err) {
    next(err);
  }
};
