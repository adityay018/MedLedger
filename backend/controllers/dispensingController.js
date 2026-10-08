const db = require('../config/db');

exports.getAllDispensings = async (req, res, next) => {
  try {
    if (db.isUsingOracle()) {
      const sql = `
        SELECT disp.dispense_id, disp.pharmacy_id,
               TO_CHAR(disp.dispensed_at, 'YYYY-MM-DD') AS dispensed_at,
               disp.patient_id, disp.quantity, disp.remarks,
               p.party_name AS pharmacy_name,
               pkg.package_id, pkg.qr_code,
               d.drug_name
        FROM DISPENSING disp
        INNER JOIN PHARMACY ph ON disp.pharmacy_id = ph.party_id
        INNER JOIN PARTY p ON ph.party_id = p.party_id
        LEFT JOIN PACKAGE pkg ON disp.dispense_id = pkg.dispense_id
        LEFT JOIN BATCH b ON pkg.batch_id = b.batch_id
        LEFT JOIN DRUG d ON b.drug_id = d.drug_id
        ORDER BY disp.dispense_id DESC
      `;
      const result = await db.execute(sql);
      return res.json({ success: true, count: result.rows.length, data: result.rows });
    } else {
      const data = db.mock.getDispensings();
      return res.json({ success: true, count: data.length, data });
    }
  } catch (err) {
    next(err);
  }
};

exports.createDispensing = async (req, res, next) => {
  try {
    const { pharmacy_id, patient_id, quantity, remarks, package_id } = req.body;
    if (!pharmacy_id || !patient_id || !quantity) {
      return res.status(400).json({ success: false, error: 'pharmacy_id, patient_id, and quantity are required' });
    }

    if (db.isUsingOracle()) {
      const seqRes = await db.execute(`SELECT seq_dispense_id.NEXTVAL AS id FROM dual`);
      const dispenseId = seqRes.rows[0].ID;

      await db.execute(
        `INSERT INTO DISPENSING (dispense_id, pharmacy_id, dispensed_at, patient_id, quantity, remarks)
         VALUES (:id, :pharm, SYSDATE, :patient, :qty, :remarks)`,
        {
          id: dispenseId,
          pharm: Number(pharmacy_id),
          patient: patient_id,
          qty: Number(quantity),
          remarks: remarks || 'Dispensed at pharmacy counter'
        }
      );

      // Link package if provided
      if (package_id) {
        await db.execute(
          `UPDATE PACKAGE SET dispense_id = :did, status = 'DISPENSED' WHERE package_id = :pid`,
          { did: dispenseId, pid: Number(package_id) }
        );
      }

      return res.status(201).json({ success: true, message: 'Dispensing recorded successfully', data: { dispense_id: dispenseId, ...req.body } });
    } else {
      const newDisp = db.mock.createDispensing(req.body);
      return res.status(201).json({ success: true, message: 'Dispensing recorded successfully', data: newDisp });
    }
  } catch (err) {
    next(err);
  }
};
