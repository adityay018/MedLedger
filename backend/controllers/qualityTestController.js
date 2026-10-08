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
