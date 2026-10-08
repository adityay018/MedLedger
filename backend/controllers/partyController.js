const db = require('../config/db');

exports.getAllParties = async (req, res, next) => {
  try {
    const { role } = req.query;
    if (db.isUsingOracle()) {
      let sql = `
        SELECT p.party_id, p.party_name, p.address, p.phone, p.email,
               CASE 
                 WHEN m.party_id IS NOT NULL THEN 'MANUFACTURER'
                 WHEN d.party_id IS NOT NULL THEN 'DISTRIBUTOR'
                 WHEN ph.party_id IS NOT NULL THEN 'PHARMACY'
                 WHEN r.party_id IS NOT NULL THEN 'REGULATOR'
                 ELSE 'PARTY'
               END AS role,
               m.manufacturing_license_no,
               d.distributor_license_no,
               ph.pharmacy_license_no, ph.hq,
               r.regulator_code
        FROM PARTY p
        LEFT JOIN MANUFACTURER m ON p.party_id = m.party_id
        LEFT JOIN DISTRIBUTOR d ON p.party_id = d.party_id
        LEFT JOIN PHARMACY ph ON p.party_id = ph.party_id
        LEFT JOIN REGULATOR r ON p.party_id = r.party_id
      `;
      const binds = {};
      if (role) {
        sql += ` WHERE (
          CASE 
            WHEN m.party_id IS NOT NULL THEN 'MANUFACTURER'
            WHEN d.party_id IS NOT NULL THEN 'DISTRIBUTOR'
            WHEN ph.party_id IS NOT NULL THEN 'PHARMACY'
            WHEN r.party_id IS NOT NULL THEN 'REGULATOR'
            ELSE 'PARTY'
          END) = :role`;
        binds.role = role;
      }
      sql += ` ORDER BY p.party_id`;
      const result = await db.execute(sql, binds);
      return res.json({ success: true, count: result.rows.length, data: result.rows });
    } else {
      const data = db.mock.getParties(role);
      return res.json({ success: true, count: data.length, data });
    }
  } catch (err) {
    next(err);
  }
};

exports.getPartyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (db.isUsingOracle()) {
      const sql = `
        SELECT p.party_id, p.party_name, p.address, p.phone, p.email,
               m.manufacturing_license_no,
               d.distributor_license_no,
               ph.pharmacy_license_no, ph.hq,
               r.regulator_code
        FROM PARTY p
        LEFT JOIN MANUFACTURER m ON p.party_id = m.party_id
        LEFT JOIN DISTRIBUTOR d ON p.party_id = d.party_id
        LEFT JOIN PHARMACY ph ON p.party_id = ph.party_id
        LEFT JOIN REGULATOR r ON p.party_id = r.party_id
        WHERE p.party_id = :id
      `;
      const result = await db.execute(sql, { id });
      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Party not found' });
      }
      return res.json({ success: true, data: result.rows[0] });
    } else {
      const party = db.mock.getPartyById(id);
      if (!party) return res.status(404).json({ success: false, error: 'Party not found' });
      return res.json({ success: true, data: party });
    }
  } catch (err) {
    next(err);
  }
};

exports.createParty = async (req, res, next) => {
  try {
    const { party_name, address, phone, email, role, ...extra } = req.body;
    if (!party_name || !address || !phone || !email || !role) {
      return res.status(400).json({ success: false, error: 'party_name, address, phone, email, and role are required.' });
    }

    if (db.isUsingOracle()) {
      // Insert into superclass and then subclass
      const seqRes = await db.execute(`SELECT seq_party_id.NEXTVAL AS id FROM dual`);
      const partyId = seqRes.rows[0].ID;

      await db.execute(
        `INSERT INTO PARTY (party_id, party_name, address, phone, email) VALUES (:id, :name, :addr, :phone, :email)`,
        { id: partyId, name: party_name, addr: address, phone, email }
      );

      if (role === 'MANUFACTURER') {
        await db.execute(
          `INSERT INTO MANUFACTURER (party_id, manufacturing_license_no) VALUES (:id, :lic)`,
          { id: partyId, lic: extra.manufacturing_license_no || `MFG-${partyId}` }
        );
      } else if (role === 'DISTRIBUTOR') {
        await db.execute(
          `INSERT INTO DISTRIBUTOR (party_id, distributor_license_no) VALUES (:id, :lic)`,
          { id: partyId, lic: extra.distributor_license_no || `DST-${partyId}` }
        );
      } else if (role === 'PHARMACY') {
        await db.execute(
          `INSERT INTO PHARMACY (party_id, pharmacy_license_no, hq) VALUES (:id, :lic, :hq)`,
          { id: partyId, lic: extra.pharmacy_license_no || `PHM-${partyId}`, hq: extra.hq || 'Headquarters' }
        );
      } else if (role === 'REGULATOR') {
        await db.execute(
          `INSERT INTO REGULATOR (party_id, regulator_code) VALUES (:id, :code)`,
          { id: partyId, code: extra.regulator_code || `REG-${partyId}` }
        );
      }

      return res.status(201).json({ success: true, message: 'Party created successfully', data: { party_id: partyId, ...req.body } });
    } else {
      const newParty = db.mock.createParty(req.body);
      return res.status(201).json({ success: true, message: 'Party created successfully', data: newParty });
    }
  } catch (err) {
    next(err);
  }
};

exports.updateParty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { party_name, address, phone, email, ...extra } = req.body;

    if (db.isUsingOracle()) {
      await db.execute(
        `UPDATE PARTY SET party_name = NVL(:name, party_name), address = NVL(:addr, address), phone = NVL(:phone, phone), email = NVL(:email, email) WHERE party_id = :id`,
        { id, name: party_name || null, addr: address || null, phone: phone || null, email: email || null }
      );
      if (extra.manufacturing_license_no) {
        await db.execute(`UPDATE MANUFACTURER SET manufacturing_license_no = :lic WHERE party_id = :id`, { id, lic: extra.manufacturing_license_no });
      }
      if (extra.pharmacy_license_no || extra.hq) {
        await db.execute(`UPDATE PHARMACY SET pharmacy_license_no = NVL(:lic, pharmacy_license_no), hq = NVL(:hq, hq) WHERE party_id = :id`, { id, lic: extra.pharmacy_license_no || null, hq: extra.hq || null });
      }
      return res.json({ success: true, message: 'Party updated successfully' });
    } else {
      const updated = db.mock.updateParty(id, req.body);
      if (!updated) return res.status(404).json({ success: false, error: 'Party not found' });
      return res.json({ success: true, message: 'Party updated successfully', data: updated });
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteParty = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (db.isUsingOracle()) {
      await db.execute(`DELETE FROM PARTY WHERE party_id = :id`, { id });
      return res.json({ success: true, message: 'Party deleted successfully' });
    } else {
      db.mock.deleteParty(id);
      return res.json({ success: true, message: 'Party deleted successfully' });
    }
  } catch (err) {
    next(err);
  }
};
