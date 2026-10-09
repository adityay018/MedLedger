const oracledb = require('oracledb');
const db = require('../config/db');

exports.getAllPackages = async (req, res, next) => {
  try {
    const { status, qr } = req.query;
    if (db.isUsingOracle()) {
      let sql = `
        SELECT p.package_id, p.batch_id, p.dispense_id, p.package_size,
               TO_CHAR(p.packaged_at, 'YYYY-MM-DD') AS packaged_at,
               p.qr_code, p.status, p.quantity_total,
               d.drug_name, d.strength,
               mfg_p.party_name AS manufacturer_name,
               b.batch_status
        FROM PACKAGE p
        INNER JOIN BATCH b ON p.batch_id = b.batch_id
        INNER JOIN DRUG d ON b.drug_id = d.drug_id
        INNER JOIN PARTY mfg_p ON b.manufacturer_id = mfg_p.party_id
      `;
      const binds = {};
      const where = [];
      if (status) {
        where.push(`p.status = :status`);
        binds.status = status;
      }
      if (qr) {
        where.push(`LOWER(p.qr_code) LIKE :qr`);
        binds.qr = `%${qr.toLowerCase()}%`;
      }
      if (where.length > 0) {
        sql += ` WHERE ` + where.join(' AND ');
      }
      sql += ` ORDER BY p.package_id DESC`;
      const result = await db.execute(sql, binds);
      return res.json({ success: true, count: result.rows.length, data: result.rows });
    } else {
      const data = db.mock.getPackages(status, qr);
      return res.json({ success: true, count: data.length, data });
    }
  } catch (err) {
    next(err);
  }
};

exports.getPackageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (db.isUsingOracle()) {
      const sql = `
        SELECT p.package_id, p.batch_id, p.dispense_id, p.package_size,
               TO_CHAR(p.packaged_at, 'YYYY-MM-DD') AS packaged_at,
               p.qr_code, p.status, p.quantity_total,
               d.drug_name, d.strength, d.dosage_form,
               mfg_p.party_name AS manufacturer_name,
               b.batch_status
        FROM PACKAGE p
        INNER JOIN BATCH b ON p.batch_id = b.batch_id
        INNER JOIN DRUG d ON b.drug_id = d.drug_id
        INNER JOIN PARTY mfg_p ON b.manufacturer_id = mfg_p.party_id
        WHERE p.package_id = :id
      `;
      const result = await db.execute(sql, { id });
      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Package not found' });
      }
      return res.json({ success: true, data: result.rows[0] });
    } else {
      const pkg = db.mock.getPackageById(id);
      if (!pkg) return res.status(404).json({ success: false, error: 'Package not found' });
      return res.json({ success: true, data: pkg });
    }
  } catch (err) {
    next(err);
  }
};

exports.createPackage = async (req, res, next) => {
  try {
    const { batch_id, package_size, qr_code, status, quantity_total } = req.body;
    if (!batch_id || !package_size || !quantity_total) {
      return res.status(400).json({ success: false, error: 'batch_id, package_size, and quantity_total are required' });
    }

    if (db.isUsingOracle()) {
      const seqRes = await db.execute(`SELECT seq_package_id.NEXTVAL AS id FROM dual`);
      const packageId = seqRes.rows[0].ID;
      const finalQr = qr_code || `QR-MED-${batch_id}-${packageId}`;

      await db.execute(
        `INSERT INTO PACKAGE (package_id, batch_id, dispense_id, package_size, packaged_at, qr_code, status, quantity_total)
         VALUES (:id, :batch_id, NULL, :pkg_size, SYSDATE, :qr, :status, :qty)`,
        {
          id: packageId,
          batch_id: Number(batch_id),
          pkg_size: package_size,
          qr: finalQr,
          status: status || 'PACKAGED',
          qty: Number(quantity_total)
        }
      );
      return res.status(201).json({ success: true, message: 'Package serialized successfully', data: { package_id: packageId, qr_code: finalQr, ...req.body } });
    } else {
      const newPkg = db.mock.createPackage(req.body);
      return res.status(201).json({ success: true, message: 'Package serialized successfully', data: newPkg });
    }
  } catch (err) {
    next(err);
  }
};

exports.updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, dispense_id, package_size, quantity_total } = req.body;

    if (db.isUsingOracle()) {
      await db.execute(
        `UPDATE PACKAGE SET status = NVL(:status, status), dispense_id = NVL(:disp_id, dispense_id), package_size = NVL(:pkg_size, package_size), quantity_total = NVL(:qty, quantity_total) WHERE package_id = :id`,
        { id, status: status || null, disp_id: dispense_id || null, pkg_size: package_size || null, qty: quantity_total || null }
      );
      return res.json({ success: true, message: 'Package updated successfully' });
    } else {
      const updated = db.mock.updatePackage(id, req.body);
      if (!updated) return res.status(404).json({ success: false, error: 'Package not found' });
      return res.json({ success: true, message: 'Package updated successfully', data: updated });
    }
  } catch (err) {
    next(err);
  }
};

exports.deletePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (db.isUsingOracle()) {
      // Check if package is dispensed
      const dispCheck = await db.execute(`SELECT dispense_id FROM PACKAGE WHERE package_id = :id`, { id: Number(id) });
      if (dispCheck.rows && dispCheck.rows.length > 0 && dispCheck.rows[0].DISPENSE_ID) {
        return res.status(409).json({
          success: false,
          error: `Cannot delete Package #${id}: Product was already dispensed to a patient (Dispense #${dispCheck.rows[0].DISPENSE_ID}). Pharmacovigilance record preserved.`
        });
      }
      await db.execute(`DELETE FROM PACKAGE WHERE package_id = :id`, { id });
      return res.json({ success: true, message: 'Package deleted successfully' });
    } else {
      db.mock.deletePackage(id);
      return res.json({ success: true, message: 'Package deleted successfully' });
    }
  } catch (err) {
    next(err);
  }
};


// ============================================================================
// CORE FEATURE: VERIFY PACKAGE (anti-counterfeit verification via PL/SQL)
// ============================================================================
exports.verifyPackage = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({ success: false, error: 'Package ID or QR Code required' });
    }

    if (db.isUsingOracle()) {
      // Execute PL/SQL function verify_package
      const funcSql = `SELECT verify_package(:ident) AS verdict_text FROM dual`;
      const funcRes = await db.execute(funcSql, { ident: identifier.trim() });
      const verdictText = funcRes.rows[0]?.VERDICT_TEXT || 'UNKNOWN';

      let verdict = 'AUTHENTIC';
      if (verdictText.startsWith('INVALID')) verdict = 'INVALID';
      else if (verdictText.startsWith('RECALLED')) verdict = 'RECALLED';
      else if (verdictText.startsWith('TAMPERED')) verdict = 'TAMPERED';
      else if (verdictText.startsWith('FAILED_TEST')) verdict = 'FAILED_TEST';
      else if (verdictText.includes('DISPENSED')) verdict = 'AUTHENTIC (DISPENSED)';

      // Fetch package details for the lineage report
      const detailSql = `
        SELECT p.package_id, p.qr_code, p.package_size, p.status, p.quantity_total,
               TO_CHAR(p.packaged_at, 'YYYY-MM-DD') AS packaged_at,
               b.batch_id, b.batch_status, TO_CHAR(b.manufacture_date, 'YYYY-MM-DD') AS manufacture_date,
               d.drug_name, d.strength, d.dosage_form,
               mfg_p.party_name AS manufacturer_name,
               r.recall_id, r.reason AS recall_reason, TO_CHAR(r.recall_date, 'YYYY-MM-DD') AS recall_date
        FROM PACKAGE p
        INNER JOIN BATCH b ON p.batch_id = b.batch_id
        INNER JOIN DRUG d ON b.drug_id = d.drug_id
        INNER JOIN PARTY mfg_p ON b.manufacturer_id = mfg_p.party_id
        LEFT JOIN RECALL r ON b.recall_id = r.recall_id
        WHERE p.qr_code = :ident OR (REGEXP_LIKE(:ident, '^[0-9]+$') AND p.package_id = TO_NUMBER(:ident))
      `;
      const detailRes = await db.execute(detailSql, { ident: identifier.trim() });
      const pkgRow = detailRes.rows[0] || null;

      return res.json({
        success: true,
        verdict,
        statusText: verdictText,
        package: pkgRow
      });
    } else {
      const result = db.mock.verifyPackage(identifier);
      return res.json({
        success: true,
        ...result
      });
    }
  } catch (err) {
    next(err);
  }
};
