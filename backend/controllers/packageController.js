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

      // Fetch package details for the lineage report
      const detailSql = `
        SELECT p.package_id, p.qr_code, p.package_size, p.status, p.quantity_total,
               TO_CHAR(p.packaged_at, 'YYYY-MM-DD') AS packaged_at,
               b.batch_id, b.batch_status, TO_CHAR(b.manufacture_date, 'YYYY-MM-DD') AS manufacture_date,
               d.drug_name, d.strength, d.dosage_form,
               mfg_p.party_name AS manufacturer_name,
               r.recall_id, r.status AS recall_status, r.reason AS recall_reason, TO_CHAR(r.recall_date, 'YYYY-MM-DD') AS recall_date,
               disp.dispense_id, disp.patient_id, disp_p.party_name AS dispensing_pharmacy, TO_CHAR(disp.dispensed_at, 'YYYY-MM-DD') AS dispensed_at,
               (SELECT COUNT(*) FROM QUALITY_TEST qt WHERE qt.batch_id = b.batch_id) AS total_quality_tests,
               (SELECT COUNT(*) FROM QUALITY_TEST qt WHERE qt.batch_id = b.batch_id AND qt.status = 'PASSED') AS passed_quality_tests,
               (SELECT COUNT(*) FROM QUALITY_TEST qt WHERE qt.batch_id = b.batch_id AND qt.status = 'FAILED') AS failed_quality_tests,
               (SELECT COUNT(*) FROM QUALITY_TEST qt WHERE qt.batch_id = b.batch_id AND qt.status = 'PENDING') AS pending_quality_tests
        FROM PACKAGE p
        INNER JOIN BATCH b ON p.batch_id = b.batch_id
        INNER JOIN DRUG d ON b.drug_id = d.drug_id
        INNER JOIN PARTY mfg_p ON b.manufacturer_id = mfg_p.party_id
        LEFT JOIN RECALL r ON b.recall_id = r.recall_id
        LEFT JOIN DISPENSING disp ON p.dispense_id = disp.dispense_id
        LEFT JOIN PARTY disp_p ON disp.pharmacy_id = disp_p.party_id
        WHERE p.qr_code = :ident OR (REGEXP_LIKE(:ident, '^[0-9]+$') AND p.package_id = TO_NUMBER(:ident))
      `;
      const detailRes = await db.execute(detailSql, { ident: identifier.trim() });
      const pkgRow = detailRes.rows[0] || null;

      if (!pkgRow) {
        return res.json({
          success: true,
          verdict: 'NOT FOUND',
          statusText: 'NOT FOUND: No matching serialized package record found in MedLedger database.',
          package: null
        });
      }

      // Fetch shipment history for this package
      const shipSql = `
        SELECT s.shipment_id, TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS shipment_date,
               sender.party_name AS sender_name, receiver.party_name AS receiver_name,
               s.mode AS transport_mode, s.status
        FROM CONTAINS c
        INNER JOIN SHIPMENT s ON c.shipment_id = s.shipment_id
        INNER JOIN PARTY sender ON s.sender_party_id = sender.party_id
        INNER JOIN PARTY receiver ON s.receiver_party_id = receiver.party_id
        WHERE c.package_id = :pkgId
        ORDER BY s.shipment_date DESC
      `;
      const shipRes = await db.execute(shipSql, { pkgId: pkgRow.PACKAGE_ID });

      let verdict = 'VERIFIED';
      let statusText = 'VERIFIED: Database-backed record found and verified with no active recall or quality failure.';

      const hasActiveRecall = (pkgRow.RECALL_ID && pkgRow.RECALL_STATUS === 'ACTIVE') || (pkgRow.BATCH_STATUS === 'RECALLED' && (!pkgRow.RECALL_STATUS || pkgRow.RECALL_STATUS === 'ACTIVE')) || pkgRow.STATUS === 'RECALLED';

      if (hasActiveRecall) {
        verdict = 'RECALL ALERT';
        statusText = `RECALL ALERT: Associated batch is under an active regulatory recall (${pkgRow.RECALL_REASON || 'Batch quarantined'}).`;
      } else if (pkgRow.FAILED_QUALITY_TESTS > 0) {
        verdict = 'QUALITY WARNING';
        statusText = `QUALITY WARNING: Associated batch failed ${pkgRow.FAILED_QUALITY_TESTS} laboratory quality assurance test(s).`;
      } else if (pkgRow.STATUS === 'TAMPERED') {
        verdict = 'QUALITY WARNING';
        statusText = 'QUALITY WARNING: Physical package custody marked as TAMPERED.';
      } else if (pkgRow.STATUS === 'DISPENSED' || pkgRow.DISPENSE_ID) {
        verdict = 'VERIFIED (DISPENSED)';
        statusText = 'VERIFIED: Legitimate pharmaceutical product already dispensed to patient.';
      } else if (pkgRow.STATUS === 'IN_TRANSIT') {
        verdict = 'VERIFIED (IN TRANSIT)';
        statusText = 'VERIFIED: Authentic pharmaceutical record verified. Product is in transit.';
      }

      const qualityStatusSummary = pkgRow.FAILED_QUALITY_TESTS > 0
        ? `FAILED (${pkgRow.FAILED_QUALITY_TESTS} failure(s))`
        : pkgRow.PENDING_QUALITY_TESTS > 0
        ? `PENDING (${pkgRow.PENDING_QUALITY_TESTS} pending)`
        : pkgRow.PASSED_QUALITY_TESTS > 0
        ? `PASSED (${pkgRow.PASSED_QUALITY_TESTS} cleared)`
        : 'NO TESTS RECORDED';

      const enrichedPkg = {
        package_id: pkgRow.PACKAGE_ID,
        qr_code: pkgRow.QR_CODE,
        package_size: pkgRow.PACKAGE_SIZE,
        status: pkgRow.STATUS,
        quantity_total: pkgRow.QUANTITY_TOTAL,
        packaged_at: pkgRow.PACKAGED_AT,
        batch_id: pkgRow.BATCH_ID,
        batch_status: pkgRow.BATCH_STATUS,
        manufacture_date: pkgRow.MANUFACTURE_DATE,
        drug_name: pkgRow.DRUG_NAME,
        strength: pkgRow.STRENGTH,
        dosage_form: pkgRow.DOSAGE_FORM,
        manufacturer_name: pkgRow.MANUFACTURER_NAME,
        quality_test_status: qualityStatusSummary,
        recall_status: pkgRow.RECALL_ID ? 'ACTIVE RECALL' : 'NO ACTIVE RECALL',
        recall_notice: pkgRow.RECALL_ID ? { recall_id: pkgRow.RECALL_ID, reason: pkgRow.RECALL_REASON, recall_date: pkgRow.RECALL_DATE } : null,
        dispensing_info: pkgRow.DISPENSE_ID ? {
          dispense_id: pkgRow.DISPENSE_ID,
          dispensed_at: pkgRow.DISPENSED_AT,
          patient_id: pkgRow.PATIENT_ID,
          pharmacy_name: pkgRow.DISPENSING_PHARMACY
        } : null,
        shipment_history: shipRes.rows || []
      };

      return res.json({
        success: true,
        verdict,
        statusText,
        package: enrichedPkg
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
