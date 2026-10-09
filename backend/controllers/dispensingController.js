const db = require('../config/db');
const auditService = require('../services/auditService');

exports.getAllDispensings = async (req, res, next) => {
  try {
    // Multi-tenant privacy rule: A pharmacy can ONLY see its own dispensing records
    let pharmacyFilter = null;
    if (req.user && req.user.role === 'PHARMACY') {
      pharmacyFilter = Number(req.user.partyId);
    } else if (req.user && !['ADMINISTRATOR', 'REGULATOR'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Prescription dispensing records are restricted to the dispensing Pharmacy, Regulator, and Administrator.'
      });
    }

    if (db.isUsingOracle()) {
      let sql = `
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
      `;
      const binds = {};
      if (pharmacyFilter) {
        sql += ` WHERE disp.pharmacy_id = :phId`;
        binds.phId = pharmacyFilter;
      }
      sql += ` ORDER BY disp.dispense_id DESC`;
      const result = await db.execute(sql, binds);
      return res.json({ success: true, count: result.rows.length, data: result.rows });
    } else {
      let data = db.mock.getDispensings();
      if (pharmacyFilter) {
        data = data.filter(d => Number(d.pharmacy_id) === pharmacyFilter);
      }
      return res.json({ success: true, count: data.length, data });
    }
  } catch (err) {
    next(err);
  }
};

exports.createDispensing = async (req, res, next) => {
  try {
    let { pharmacy_id, patient_id, quantity, remarks, package_id } = req.body;

    // Enforce Pharmacy authenticated organization ID
    if (req.user && req.user.role === 'PHARMACY') {
      if (!req.user.partyId) {
        return res.status(403).json({ success: false, error: 'Account is not linked to an approved retail pharmacy.' });
      }
      if (pharmacy_id && Number(pharmacy_id) !== Number(req.user.partyId)) {
        return res.status(403).json({
          success: false,
          error: 'Ownership Violation: A pharmacy cannot record dispensing operations under another pharmacy\'s license or party ID.'
        });
      }
      pharmacy_id = req.user.partyId;
    }

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

      if (req.user) {
        await auditService.logAction({
          userId: req.user.userId,
          userEmail: req.user.email,
          action: 'DISPENSING_RECORDED',
          entityType: 'DISPENSING',
          entityId: dispenseId,
          details: `Pharmacy #${pharmacy_id} dispensed ${quantity} units (Package #${package_id || 'unlinked'})`,
          req
        });
      }

      return res.status(201).json({ success: true, message: 'Dispensing recorded successfully', data: { dispense_id: dispenseId, ...req.body } });
    } else {
      const newDisp = db.mock.createDispensing({
        pharmacy_id,
        patient_id,
        quantity,
        remarks,
        package_id
      });

      if (req.user) {
        await auditService.logAction({
          userId: req.user.userId,
          userEmail: req.user.email,
          action: 'DISPENSING_RECORDED',
          entityType: 'DISPENSING',
          entityId: newDisp.dispense_id,
          details: `Pharmacy #${pharmacy_id} dispensed ${quantity} units (Package #${package_id || 'unlinked'})`,
          req
        });
      }

      return res.status(201).json({ success: true, message: 'Dispensing recorded successfully', data: newDisp });
    }
  } catch (err) {
    next(err);
  }
};
