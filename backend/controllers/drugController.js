const db = require('../config/db');

exports.getAllDrugs = async (req, res, next) => {
  try {
    const { search } = req.query;
    if (db.isUsingOracle()) {
      let sql = `SELECT drug_id, drug_name, description, strength, dosage_form FROM DRUG`;
      const binds = {};
      if (search) {
        sql += ` WHERE LOWER(drug_name) LIKE :term OR LOWER(description) LIKE :term OR LOWER(strength) LIKE :term`;
        binds.term = `%${search.toLowerCase()}%`;
      }
      sql += ` ORDER BY drug_id`;
      const result = await db.execute(sql, binds);
      return res.json({ success: true, count: result.rows.length, data: result.rows });
    } else {
      const data = db.mock.getDrugs(search);
      return res.json({ success: true, count: data.length, data });
    }
  } catch (err) {
    next(err);
  }
};

exports.getDrugById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (db.isUsingOracle()) {
      const sql = `SELECT drug_id, drug_name, description, strength, dosage_form FROM DRUG WHERE drug_id = :id`;
      const result = await db.execute(sql, { id });
      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Drug not found' });
      }
      return res.json({ success: true, data: result.rows[0] });
    } else {
      const drug = db.mock.getDrugById(id);
      if (!drug) return res.status(404).json({ success: false, error: 'Drug not found' });
      return res.json({ success: true, data: drug });
    }
  } catch (err) {
    next(err);
  }
};

exports.createDrug = async (req, res, next) => {
  try {
    const { drug_name, description, strength, dosage_form } = req.body;
    if (!drug_name || !strength || !dosage_form) {
      return res.status(400).json({ success: false, error: 'drug_name, strength, and dosage_form are required' });
    }

    if (db.isUsingOracle()) {
      const seqRes = await db.execute(`SELECT seq_drug_id.NEXTVAL AS id FROM dual`);
      const drugId = seqRes.rows[0].ID;

      await db.execute(
        `INSERT INTO DRUG (drug_id, drug_name, description, strength, dosage_form) VALUES (:id, :name, :desc, :strength, :dosage)`,
        { id: drugId, name: drug_name, desc: description || null, strength, dosage: dosage_form }
      );
      return res.status(201).json({ success: true, message: 'Drug created successfully', data: { drug_id: drugId, ...req.body } });
    } else {
      const newDrug = db.mock.createDrug(req.body);
      return res.status(201).json({ success: true, message: 'Drug created successfully', data: newDrug });
    }
  } catch (err) {
    next(err);
  }
};

exports.updateDrug = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { drug_name, description, strength, dosage_form } = req.body;

    if (db.isUsingOracle()) {
      await db.execute(
        `UPDATE DRUG SET drug_name = NVL(:name, drug_name), description = NVL(:desc, description), strength = NVL(:strength, strength), dosage_form = NVL(:dosage, dosage_form) WHERE drug_id = :id`,
        { id, name: drug_name || null, desc: description || null, strength: strength || null, dosage: dosage_form || null }
      );
      return res.json({ success: true, message: 'Drug updated successfully' });
    } else {
      const updated = db.mock.updateDrug(id, req.body);
      if (!updated) return res.status(404).json({ success: false, error: 'Drug not found' });
      return res.json({ success: true, message: 'Drug updated successfully', data: updated });
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteDrug = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (db.isUsingOracle()) {
      await db.execute(`DELETE FROM DRUG WHERE drug_id = :id`, { id });
      return res.json({ success: true, message: 'Drug deleted successfully' });
    } else {
      db.mock.deleteDrug(id);
      return res.json({ success: true, message: 'Drug deleted successfully' });
    }
  } catch (err) {
    next(err);
  }
};
