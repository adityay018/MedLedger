const oracledb = require('oracledb');
const db = require('../config/db');

exports.getAllShipments = async (req, res, next) => {
  try {
    const { status } = req.query;
    if (db.isUsingOracle()) {
      let sql = `
        SELECT s.shipment_id, s.sender_party_id, s.receiver_party_id,
               TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS shipment_date,
               s.status, s.mode,
               p_sender.party_name AS sender_name,
               p_receiver.party_name AS receiver_name,
               COUNT(c.package_id) AS total_packages
        FROM SHIPMENT s
        INNER JOIN PARTY p_sender ON s.sender_party_id = p_sender.party_id
        INNER JOIN PARTY p_receiver ON s.receiver_party_id = p_receiver.party_id
        LEFT JOIN CONTAINS c ON s.shipment_id = c.shipment_id
      `;
      const binds = {};
      if (status) {
        sql += ` WHERE s.status = :status`;
        binds.status = status;
      }
      sql += ` GROUP BY s.shipment_id, s.sender_party_id, s.receiver_party_id, s.shipment_date, s.status, s.mode, p_sender.party_name, p_receiver.party_name
               ORDER BY s.shipment_id DESC`;
      const result = await db.execute(sql, binds);
      return res.json({ success: true, count: result.rows.length, data: result.rows });
    } else {
      const data = db.mock.getShipments(status);
      return res.json({ success: true, count: data.length, data });
    }
  } catch (err) {
    next(err);
  }
};

exports.getShipmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (db.isUsingOracle()) {
      const sql = `
        SELECT s.shipment_id, s.sender_party_id, s.receiver_party_id,
               TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS shipment_date,
               s.status, s.mode,
               p_sender.party_name AS sender_name,
               p_receiver.party_name AS receiver_name
        FROM SHIPMENT s
        INNER JOIN PARTY p_sender ON s.sender_party_id = p_sender.party_id
        INNER JOIN PARTY p_receiver ON s.receiver_party_id = p_receiver.party_id
        WHERE s.shipment_id = :id
      `;
      const result = await db.execute(sql, { id });
      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Shipment not found' });
      }

      // Fetch contained packages
      const pkgSql = `
        SELECT p.package_id, p.qr_code, p.status, p.package_size, d.drug_name
        FROM CONTAINS c
        INNER JOIN PACKAGE p ON c.package_id = p.package_id
        INNER JOIN BATCH b ON p.batch_id = b.batch_id
        INNER JOIN DRUG d ON b.drug_id = d.drug_id
        WHERE c.shipment_id = :id
      `;
      const pkgRes = await db.execute(pkgSql, { id });
      const shipment = { ...result.rows[0], packages: pkgRes.rows };
      return res.json({ success: true, data: shipment });
    } else {
      const s = db.mock.getShipmentById(id);
      if (!s) return res.status(404).json({ success: false, error: 'Shipment not found' });
      return res.json({ success: true, data: s });
    }
  } catch (err) {
    next(err);
  }
};

exports.createShipment = async (req, res, next) => {
  try {
    const { sender_party_id, receiver_party_id, shipment_date, status, mode, package_ids } = req.body;
    if (!sender_party_id || !receiver_party_id) {
      return res.status(400).json({ success: false, error: 'sender_party_id and receiver_party_id are required' });
    }
    if (Number(sender_party_id) === Number(receiver_party_id)) {
      return res.status(400).json({ success: false, error: 'Sender and receiver parties cannot be identical' });
    }

    const validModes = ['AIR_CARGO', 'COLD_CHAIN_TRUCK', 'EXPRESS_COURIER', 'MARITIME', 'ROAD_LOGISTICS'];
    if (mode && !validModes.includes(mode)) {
      return res.status(400).json({ success: false, error: 'Invalid Mode: Transport mode not permitted by domain constraint.' });
    }

    if (db.isUsingOracle()) {
      const plsql = `
        BEGIN
          register_shipment(
            p_sender_id       => :sender,
            p_receiver_id     => :receiver,
            p_shipment_date   => TO_DATE(:sdate, 'YYYY-MM-DD'),
            p_status          => :status,
            p_mode            => :mode,
            p_new_shipment_id => :new_shipment_id
          );
        END;
      `;
      const binds = {
        sender: Number(sender_party_id),
        receiver: Number(receiver_party_id),
        sdate: shipment_date || new Date().toISOString().split('T')[0],
        status: status || 'CREATED',
        mode: mode || 'ROAD_LOGISTICS',
        new_shipment_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      };

      const result = await db.execute(plsql, binds);
      const shipmentId = result.outBinds.new_shipment_id;

      // Populate CONTAINS bridge table
      if (Array.isArray(package_ids)) {
        for (const pkgId of package_ids) {
          await db.execute(
            `INSERT INTO CONTAINS (package_id, shipment_id) VALUES (:pid, :sid)`,
            { pid: Number(pkgId), sid: shipmentId }
          );
        }
      }

      return res.status(201).json({
        success: true,
        message: `Shipment #${shipmentId} registered successfully via PL/SQL register_shipment procedure`,
        data: { shipment_id: shipmentId, ...req.body }
      });
    } else {
      const newShipment = db.mock.registerShipment(req.body);
      return res.status(201).json({
        success: true,
        message: `Shipment #${newShipment.shipment_id} registered successfully via register_shipment`,
        data: newShipment
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.updateShipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, mode } = req.body;

    if (db.isUsingOracle()) {
      await db.execute(
        `UPDATE SHIPMENT SET status = NVL(:status, status), mode = NVL(:mode, mode) WHERE shipment_id = :id`,
        { id, status: status || null, mode: mode || null }
      );
      return res.json({ success: true, message: 'Shipment updated successfully' });
    } else {
      const updated = db.mock.updateShipment(id, req.body);
      if (!updated) return res.status(404).json({ success: false, error: 'Shipment not found' });
      return res.json({ success: true, message: 'Shipment updated successfully', data: updated });
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteShipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (db.isUsingOracle()) {
      await db.execute(`DELETE FROM SHIPMENT WHERE shipment_id = :id`, { id });
      return res.json({ success: true, message: 'Shipment deleted successfully' });
    } else {
      db.mock.deleteShipment(id);
      return res.json({ success: true, message: 'Shipment deleted successfully' });
    }
  } catch (err) {
    next(err);
  }
};
