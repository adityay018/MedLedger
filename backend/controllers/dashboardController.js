const db = require('../config/db');

exports.getDashboardStats = async (req, res, next) => {
  try {
    if (db.isUsingOracle()) {
      // 1. KPI Counts
      const [partiesRes, drugsRes, batchesRes, pkgsRes, shipmentsRes, recallsRes, dispRes] = await Promise.all([
        db.execute(`SELECT COUNT(*) AS total FROM PARTY`),
        db.execute(`SELECT COUNT(*) AS total FROM DRUG`),
        db.execute(`SELECT COUNT(*) AS total, SUM(CASE WHEN batch_status = 'RELEASED' THEN 1 ELSE 0 END) AS active FROM BATCH`),
        db.execute(`SELECT COUNT(*) AS total FROM PACKAGE`),
        db.execute(`SELECT COUNT(*) AS total FROM SHIPMENT`),
        db.execute(`SELECT COUNT(*) AS total FROM RECALL`),
        db.execute(`SELECT COUNT(*) AS total FROM DISPENSING`)
      ]);

      const kpi = {
        partiesCount: partiesRes.rows[0].TOTAL,
        drugsCount: drugsRes.rows[0].TOTAL,
        batchesCount: batchesRes.rows[0].TOTAL,
        activeBatchesCount: batchesRes.rows[0].ACTIVE || 0,
        packagesCount: pkgsRes.rows[0].TOTAL,
        shipmentsCount: shipmentsRes.rows[0].TOTAL,
        recallsCount: recallsRes.rows[0].TOTAL,
        dispensingsCount: dispRes.rows[0].TOTAL
      };

      // 2. Distributions
      const [batchDistRes, shipDistRes, pkgDistRes] = await Promise.all([
        db.execute(`SELECT batch_status, COUNT(*) AS count FROM BATCH GROUP BY batch_status`),
        db.execute(`SELECT status, COUNT(*) AS count FROM SHIPMENT GROUP BY status`),
        db.execute(`SELECT status, COUNT(*) AS count FROM PACKAGE GROUP BY status`)
      ]);

      const batchStatusCounts = {};
      batchDistRes.rows.forEach(r => batchStatusCounts[r.BATCH_STATUS] = r.COUNT);

      const shipmentStatusCounts = {};
      shipDistRes.rows.forEach(r => shipmentStatusCounts[r.STATUS] = r.COUNT);

      const packageStatusCounts = {};
      pkgDistRes.rows.forEach(r => packageStatusCounts[r.STATUS] = r.COUNT);

      // 3. Recent Events
      const recentShipSql = `
        SELECT s.shipment_id, TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS shipment_date, s.status, s.mode,
               p1.party_name AS sender_name, p2.party_name AS receiver_name
        FROM SHIPMENT s
        INNER JOIN PARTY p1 ON s.sender_party_id = p1.party_id
        INNER JOIN PARTY p2 ON s.receiver_party_id = p2.party_id
        ORDER BY s.shipment_id DESC
        FETCH FIRST 5 ROWS ONLY
      `;
      const recentShipRes = await db.execute(recentShipSql);

      const recentRecallSql = `
        SELECT recall_id, TO_CHAR(recall_date, 'YYYY-MM-DD') AS recall_date, status, reason
        FROM RECALL
        ORDER BY recall_id DESC
        FETCH FIRST 3 ROWS ONLY
      `;
      const recentRecallRes = await db.execute(recentRecallSql);

      const recentDispSql = `
        SELECT d.dispense_id, TO_CHAR(d.dispensed_at, 'YYYY-MM-DD') AS dispensed_at, d.patient_id, d.quantity,
               p.party_name AS pharmacy_name
        FROM DISPENSING d
        INNER JOIN PHARMACY ph ON d.pharmacy_id = ph.party_id
        INNER JOIN PARTY p ON ph.party_id = p.party_id
        ORDER BY d.dispense_id DESC
        FETCH FIRST 5 ROWS ONLY
      `;
      const recentDispRes = await db.execute(recentDispSql);

      return res.json({
        success: true,
        databaseMode: 'ORACLE',
        data: {
          kpi,
          batchStatusCounts,
          shipmentStatusCounts,
          packageStatusCounts,
          recentShipments: recentShipRes.rows,
          recentRecalls: recentRecallRes.rows,
          recentDispensings: recentDispRes.rows
        }
      });
    } else {
      const stats = db.mock.getDashboardStats();
      return res.json({
        success: true,
        databaseMode: 'SIMULATION',
        data: stats
      });
    }
  } catch (err) {
    next(err);
  }
};
