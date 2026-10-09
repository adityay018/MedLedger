const db = require('../config/db');

exports.getAllQualityTests = async (req, res, next) => {
  try {
    const { batchId } = req.query;
    if (db.isUsingOracle()) {
      let sql = `
        SELECT qt.test_id, qt.batch_id,
               TO_CHAR(qt.test_date, 'YYYY-MM-DD') AS test_date,
               qt.test_type, qt.result, qt.status,
               d.drug_name, b.batch_status
        FROM QUALITY_TEST qt
        INNER JOIN BATCH b ON qt.batch_id = b.batch_id
        INNER JOIN DRUG d ON b.drug_id = d.drug_id
      `;
      const binds = {};
      if (batchId) {
        sql += ` WHERE qt.batch_id = :bid`;
        binds.bid = Number(batchId);
      }
      sql += ` ORDER BY qt.test_id DESC`;
      const result = await db.execute(sql, binds);
      return res.json({ success: true, count: result.rows.length, data: result.rows });
    } else {
      const data = db.mock.getQualityTests(batchId);
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
      return res.status(201).json({ success: true, message: 'Quality test logged successfully', data: { test_id: testId, ...req.body } });
    } else {
      const newTest = db.mock.createQualityTest(req.body);
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
    if (db.isUsingOracle()) {
      await db.execute(
        `UPDATE QUALITY_TEST SET test_type = NVL(:ttype, test_type), result = NVL(:res, result), status = NVL(:status, status), test_date = NVL(TO_DATE(:tdate, 'YYYY-MM-DD'), test_date) WHERE test_id = :id`,
        { id: Number(id), ttype: test_type || null, res: result || null, status: status || null, tdate: test_date || null }
      );
      return res.json({ success: true, message: `Quality test #${id} updated successfully.` });
    } else {
      const updated = db.mock.updateQualityTest(id, req.body);
      if (!updated) return res.status(404).json({ success: false, error: 'Quality test not found' });
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

