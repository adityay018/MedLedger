// MedLedger Simulation Database Service
// Mirrors all 13 Oracle relations, PL/SQL functions, procedures, and queries Q1-Q12
const initialData = require('../db/initialData');
const analyticsService = require('./analyticsService');

// In-memory clone of initial state
let parties = JSON.parse(JSON.stringify(initialData.parties));
let manufacturers = JSON.parse(JSON.stringify(initialData.manufacturers));
let distributors = JSON.parse(JSON.stringify(initialData.distributors));
let pharmacies = JSON.parse(JSON.stringify(initialData.pharmacies));
let regulators = JSON.parse(JSON.stringify(initialData.regulators));
let drugs = JSON.parse(JSON.stringify(initialData.drugs));
let batches = JSON.parse(JSON.stringify(initialData.batches));
let qualityTests = JSON.parse(JSON.stringify(initialData.qualityTests));
let recalls = JSON.parse(JSON.stringify(initialData.recalls));
let packages = JSON.parse(JSON.stringify(initialData.packages));
let shipments = JSON.parse(JSON.stringify(initialData.shipments));
let contains = JSON.parse(JSON.stringify(initialData.contains));
let dispensings = JSON.parse(JSON.stringify(initialData.dispensings));
let users = JSON.parse(JSON.stringify(initialData.users || []));
let auditLogs = JSON.parse(JSON.stringify(initialData.auditLogs || []));

// Helper: resolve party role
function resolvePartyRole(partyId) {
  if (manufacturers.some(m => m.party_id === partyId)) return 'MANUFACTURER';
  if (distributors.some(d => d.party_id === partyId)) return 'DISTRIBUTOR';
  if (pharmacies.some(p => p.party_id === partyId)) return 'PHARMACY';
  if (regulators.some(r => r.party_id === partyId)) return 'REGULATOR';
  return 'PARTY';
}

const mockDbService = {
  // --------------------------------------------------------------------------
  // PARTIES (Superclass + Subclasses)
  // --------------------------------------------------------------------------
  getParties: (roleFilter) => {
    return parties.map(p => {
      const role = resolvePartyRole(p.party_id);
      let details = {};
      if (role === 'MANUFACTURER') {
        const m = manufacturers.find(x => x.party_id === p.party_id);
        details.manufacturing_license_no = m?.manufacturing_license_no;
      } else if (role === 'DISTRIBUTOR') {
        const d = distributors.find(x => x.party_id === p.party_id);
        details.distributor_license_no = d?.distributor_license_no;
      } else if (role === 'PHARMACY') {
        const ph = pharmacies.find(x => x.party_id === p.party_id);
        details.pharmacy_license_no = ph?.pharmacy_license_no;
        details.hq = ph?.hq;
      } else if (role === 'REGULATOR') {
        const r = regulators.find(x => x.party_id === p.party_id);
        details.regulator_code = r?.regulator_code;
      }
      return { ...p, role, ...details };
    }).filter(p => !roleFilter || p.role === roleFilter);
  },

  getPartyById: (id) => {
    const numId = Number(id);
    const p = parties.find(x => x.party_id === numId);
    if (!p) return null;
    const role = resolvePartyRole(numId);
    let details = {};
    if (role === 'MANUFACTURER') details = manufacturers.find(x => x.party_id === numId) || {};
    if (role === 'DISTRIBUTOR') details = distributors.find(x => x.party_id === numId) || {};
    if (role === 'PHARMACY') details = pharmacies.find(x => x.party_id === numId) || {};
    if (role === 'REGULATOR') details = regulators.find(x => x.party_id === numId) || {};
    return { ...p, role, ...details };
  },

  createParty: (data) => {
    const nextId = Math.max(...parties.map(p => p.party_id), 0) + 1;
    const newParty = {
      party_id: nextId,
      party_name: data.party_name,
      address: data.address,
      phone: data.phone,
      email: data.email,
      role: data.role || 'MANUFACTURER'
    };
    parties.push(newParty);

    if (data.role === 'MANUFACTURER') {
      manufacturers.push({ party_id: nextId, manufacturing_license_no: data.manufacturing_license_no || `MFG-${nextId}` });
    } else if (data.role === 'DISTRIBUTOR') {
      distributors.push({ party_id: nextId, distributor_license_no: data.distributor_license_no || `DST-${nextId}` });
    } else if (data.role === 'PHARMACY') {
      pharmacies.push({ party_id: nextId, pharmacy_license_no: data.pharmacy_license_no || `PHM-${nextId}`, hq: data.hq || 'Headquarters' });
    } else if (data.role === 'REGULATOR') {
      regulators.push({ party_id: nextId, regulator_code: data.regulator_code || `REG-${nextId}` });
    }
    return mockDbService.getPartyById(nextId);
  },

  updateParty: (id, data) => {
    const numId = Number(id);
    const idx = parties.findIndex(p => p.party_id === numId);
    if (idx === -1) return null;
    parties[idx] = { ...parties[idx], ...data, party_id: numId };

    const role = resolvePartyRole(numId);
    if (role === 'MANUFACTURER' && data.manufacturing_license_no) {
      const mIdx = manufacturers.findIndex(m => m.party_id === numId);
      if (mIdx !== -1) manufacturers[mIdx].manufacturing_license_no = data.manufacturing_license_no;
    } else if (role === 'PHARMACY') {
      const pIdx = pharmacies.findIndex(ph => ph.party_id === numId);
      if (pIdx !== -1) {
        if (data.pharmacy_license_no) pharmacies[pIdx].pharmacy_license_no = data.pharmacy_license_no;
        if (data.hq) pharmacies[pIdx].hq = data.hq;
      }
    }
    return mockDbService.getPartyById(numId);
  },

  deleteParty: (id) => {
    const numId = Number(id);
    parties = parties.filter(p => p.party_id !== numId);
    manufacturers = manufacturers.filter(m => m.party_id !== numId);
    distributors = distributors.filter(d => d.party_id !== numId);
    pharmacies = pharmacies.filter(p => p.party_id !== numId);
    regulators = regulators.filter(r => r.party_id !== numId);
    return true;
  },

  // --------------------------------------------------------------------------
  // DRUGS
  // --------------------------------------------------------------------------
  getDrugs: (search) => {
    if (!search) return drugs;
    const term = search.toLowerCase();
    return drugs.filter(d => 
      d.drug_name.toLowerCase().includes(term) ||
      (d.description && d.description.toLowerCase().includes(term)) ||
      d.strength.toLowerCase().includes(term) ||
      d.dosage_form.toLowerCase().includes(term)
    );
  },

  getDrugById: (id) => {
    return drugs.find(d => d.drug_id === Number(id)) || null;
  },

  createDrug: (data) => {
    const cleanName = (data.drug_name || '').trim().toLowerCase();
    const cleanStrength = (data.strength || '').trim().toLowerCase();
    const cleanDosage = (data.dosage_form || '').trim().toLowerCase();

    const duplicate = drugs.find(d => 
      d.drug_name.trim().toLowerCase() === cleanName &&
      d.strength.trim().toLowerCase() === cleanStrength &&
      d.dosage_form.trim().toLowerCase() === cleanDosage
    );
    if (duplicate) {
      const err = new Error(`Catalogue Conflict: A drug with name "${data.drug_name}", strength "${data.strength}", and dosage form "${data.dosage_form}" already exists in the shared catalogue.`);
      err.statusCode = 409;
      throw err;
    }

    const nextId = Math.max(...drugs.map(d => d.drug_id), 100) + 1;
    const newDrug = {
      drug_id: nextId,
      drug_name: data.drug_name.trim(),
      description: data.description || '',
      strength: data.strength.trim(),
      dosage_form: data.dosage_form.trim()
    };
    drugs.push(newDrug);
    return newDrug;
  },

  updateDrug: (id, data) => {
    const numId = Number(id);
    const idx = drugs.findIndex(d => d.drug_id === numId);
    if (idx === -1) return null;
    drugs[idx] = { ...drugs[idx], ...data, drug_id: numId };
    return drugs[idx];
  },

  deleteDrug: (id) => {
    const numId = Number(id);
    const hasBatches = batches.some(b => b.drug_id === numId);
    if (hasBatches) {
      const err = new Error(`Cannot delete Drug #${id}: Dependent batches exist in the BATCH relation. Referential integrity preserved.`);
      err.statusCode = 409;
      throw err;
    }
    drugs = drugs.filter(d => d.drug_id !== numId);
    return true;
  },

  // --------------------------------------------------------------------------
  // BATCHES (with PL/SQL PROCEDURE register_batch logic)
  // --------------------------------------------------------------------------
  getBatches: (statusFilter) => {
    return batches.map(b => {
      const drug = drugs.find(d => d.drug_id === b.drug_id);
      const mfg = parties.find(p => p.party_id === b.manufacturer_id);
      const recall = recalls.find(r => r.recall_id === b.recall_id);
      return {
        ...b,
        drug_name: drug?.drug_name || 'Unknown Drug',
        strength: drug?.strength || '',
        dosage_form: drug?.dosage_form || '',
        manufacturer_name: mfg?.party_name || 'Unknown Manufacturer',
        recall_reason: recall?.reason || null
      };
    }).filter(b => !statusFilter || b.batch_status === statusFilter);
  },

  getBatchById: (id) => {
    const b = batches.find(x => x.batch_id === Number(id));
    if (!b) return null;
    const drug = drugs.find(d => d.drug_id === b.drug_id);
    const mfg = parties.find(p => p.party_id === b.manufacturer_id);
    const recall = recalls.find(r => r.recall_id === b.recall_id);
    return {
      ...b,
      drug_name: drug?.drug_name,
      manufacturer_name: mfg?.party_name,
      recall_reason: recall?.reason
    };
  },

  // PL/SQL register_batch implementation
  registerBatch: (data) => {
    const drugId = Number(data.drug_id);
    const mfgId = Number(data.manufacturer_id);

    // Validate manufacturer exists in MANUFACTURER relation
    const isMfg = manufacturers.some(m => m.party_id === mfgId);
    if (!isMfg) {
      const err = new Error('Invalid Manufacturer: Party ID does not exist in MANUFACTURER table.');
      err.code = -20001;
      throw err;
    }

    // Validate drug exists in DRUG relation
    const isDrug = drugs.some(d => d.drug_id === drugId);
    if (!isDrug) {
      const err = new Error('Invalid Drug: Drug ID does not exist in DRUG table.');
      err.code = -20002;
      throw err;
    }

    // Check for duplicate ID if manual ID was passed
    if (data.batch_id) {
      const dup = batches.some(b => b.batch_id === Number(data.batch_id));
      if (dup) {
        const err = new Error(`Duplicate Batch ID: Batch with ID ${data.batch_id} already exists.`);
        err.code = -20006;
        throw err;
      }
    }

    const nextId = data.batch_id ? Number(data.batch_id) : (Math.max(...batches.map(b => b.batch_id), 200) + 1);
    const newBatch = {
      batch_id: nextId,
      drug_id: drugId,
      manufacturer_id: mfgId,
      recall_id: data.recall_id ? Number(data.recall_id) : null,
      batch_status: data.batch_status || 'RELEASED',
      manufacture_date: data.manufacture_date || new Date().toISOString().split('T')[0]
    };
    batches.push(newBatch);
    return mockDbService.getBatchById(nextId);
  },

  updateBatch: (id, data) => {
    const numId = Number(id);
    const idx = batches.findIndex(b => b.batch_id === numId);
    if (idx === -1) return null;
    
    const oldStatus = batches[idx].batch_status;
    const recallVal = data.recall_id !== undefined ? (data.recall_id ? Number(data.recall_id) : null) : batches[idx].recall_id;
    batches[idx] = { ...batches[idx], ...data, recall_id: recallVal, batch_id: numId };

    // Trigger simulation: trg_batch_recall_cascade
    if (batches[idx].batch_status === 'RECALLED' && oldStatus !== 'RECALLED') {
      packages.forEach(pkg => {
        if (pkg.batch_id === numId && pkg.status !== 'DISPENSED') {
          pkg.status = 'RECALLED';
        }
      });
    }

    return mockDbService.getBatchById(numId);
  },

  deleteBatch: (id) => {
    const numId = Number(id);
    const hasPkgs = packages.some(p => p.batch_id === numId);
    if (hasPkgs) {
      const err = new Error(`Cannot delete Batch #${id}: Dependent packages exist in the PACKAGE relation. Referential integrity preserved.`);
      err.statusCode = 409;
      throw err;
    }
    batches = batches.filter(b => b.batch_id !== numId);
    return true;
  },

  // --------------------------------------------------------------------------
  // QUALITY TESTS
  // --------------------------------------------------------------------------
  getQualityTests: (batchIdFilter) => {
    return qualityTests.map(qt => {
      const b = batches.find(x => x.batch_id === qt.batch_id);
      const d = b ? drugs.find(x => x.drug_id === b.drug_id) : null;
      return {
        ...qt,
        drug_name: d?.drug_name || 'N/A',
        batch_status: b?.batch_status || 'N/A'
      };
    }).filter(qt => !batchIdFilter || qt.batch_id === Number(batchIdFilter));
  },

  createQualityTest: (data) => {
    const nextId = Math.max(...qualityTests.map(q => q.test_id), 300) + 1;
    const newTest = {
      test_id: nextId,
      batch_id: Number(data.batch_id),
      test_date: data.test_date || new Date().toISOString().split('T')[0],
      test_type: data.test_type,
      result: data.result,
      status: data.status || 'PASSED'
    };
    qualityTests.push(newTest);
    return newTest;
  },

  updateQualityTest: (id, data) => {
    const numId = Number(id);
    const idx = qualityTests.findIndex(q => q.test_id === numId);
    if (idx === -1) return null;
    qualityTests[idx] = { ...qualityTests[idx], ...data, test_id: numId };
    return qualityTests[idx];
  },

  deleteQualityTest: (id) => {
    const numId = Number(id);
    qualityTests = qualityTests.filter(q => q.test_id !== numId);
    return true;
  },


  // --------------------------------------------------------------------------
  // PACKAGES (with PL/SQL FUNCTION verify_package logic)
  // --------------------------------------------------------------------------
  getPackages: (statusFilter, qrFilter) => {
    return packages.map(pkg => {
      const b = batches.find(x => x.batch_id === pkg.batch_id);
      const d = b ? drugs.find(x => x.drug_id === b.drug_id) : null;
      const mfg = b ? parties.find(x => x.party_id === b.manufacturer_id) : null;
      return {
        ...pkg,
        drug_name: d?.drug_name || 'Unknown',
        strength: d?.strength || '',
        manufacturer_name: mfg?.party_name || 'Unknown',
        batch_status: b?.batch_status || 'UNKNOWN'
      };
    }).filter(p => {
      let match = true;
      if (statusFilter && p.status !== statusFilter) match = false;
      if (qrFilter && !p.qr_code.toLowerCase().includes(qrFilter.toLowerCase())) match = false;
      return match;
    });
  },

  getPackageById: (id) => {
    const pkg = packages.find(p => p.package_id === Number(id));
    if (!pkg) return null;
    const b = batches.find(x => x.batch_id === pkg.batch_id);
    const d = b ? drugs.find(x => x.drug_id === b.drug_id) : null;
    const mfg = b ? parties.find(x => x.party_id === b.manufacturer_id) : null;
    return {
      ...pkg,
      drug_name: d?.drug_name,
      strength: d?.strength,
      manufacturer_name: mfg?.party_name,
      batch_status: b?.batch_status
    };
  },

  createPackage: (data) => {
    // Trigger simulation: trg_check_package_qty
    const qty = Number(data.quantity_total);
    if (!qty || qty <= 0) {
      const err = new Error('Package quantity_total must be strictly greater than zero.');
      err.code = -20004;
      throw err;
    }

    const nextId = Math.max(...packages.map(p => p.package_id), 400) + 1;
    const newPkg = {
      package_id: nextId,
      batch_id: Number(data.batch_id),
      dispense_id: null,
      package_size: data.package_size || 'Standard Unit',
      packaged_at: data.packaged_at || new Date().toISOString().split('T')[0],
      qr_code: data.qr_code || `QR-MED-${data.batch_id}-${nextId}`,
      status: data.status || 'PACKAGED',
      quantity_total: qty
    };
    packages.push(newPkg);
    return mockDbService.getPackageById(nextId);
  },

  updatePackage: (id, data) => {
    const numId = Number(id);
    const idx = packages.findIndex(p => p.package_id === numId);
    if (idx === -1) return null;

    const oldStatus = packages[idx].status;
    const newStatus = data.status || oldStatus;

    // Trigger simulation: trg_package_state_transition
    if (newStatus === 'DISPENSED' && oldStatus === 'RECALLED') {
      const err = new Error('Safety Violation: Cannot dispense a RECALLED package unit. Quarantined for patient safety.');
      err.code = -20020;
      throw err;
    }
    if (oldStatus === 'DISPENSED' && ['PACKAGED', 'IN_TRANSIT'].includes(newStatus)) {
      const err = new Error('Lifecycle Violation: Dispensed package cannot re-enter active supply chain distribution.');
      err.code = -20021;
      throw err;
    }

    packages[idx] = { ...packages[idx], ...data, package_id: numId };
    return mockDbService.getPackageById(numId);
  },

  deletePackage: (id) => {
    const numId = Number(id);
    const pkg = packages.find(p => p.package_id === numId);
    if (pkg && (pkg.dispense_id || pkg.status === 'DISPENSED')) {
      const err = new Error(`Cannot delete Package #${id}: Product was already dispensed to a patient. Pharmacovigilance record preserved.`);
      err.statusCode = 409;
      throw err;
    }
    packages = packages.filter(p => p.package_id !== numId);
    contains = contains.filter(c => c.package_id !== numId);
    return true;
  },


  // PL/SQL verify_package logic
  verifyPackage: (identifier) => {
    if (!identifier) {
      return {
        verdict: 'NOT FOUND',
        statusText: 'No package identifier or QR code provided for verification.',
        package: null
      };
    }
    const cleanId = String(identifier).trim();
    // Search by QR code or numeric package_id
    const pkg = packages.find(p => 
      p.qr_code.toLowerCase() === cleanId.toLowerCase() || 
      String(p.package_id) === cleanId
    );

    if (!pkg) {
      return {
        verdict: 'NOT FOUND',
        statusText: 'NOT FOUND: No matching serialized package or QR code exists in the MedLedger database.',
        package: null
      };
    }

    const batch = batches.find(b => b.batch_id === pkg.batch_id);
    const drug = batch ? drugs.find(d => d.drug_id === batch.drug_id) : null;
    const mfg = batch ? parties.find(p => p.party_id === batch.manufacturer_id) : null;
    const recall = batch && batch.recall_id ? recalls.find(r => r.recall_id === batch.recall_id) : null;
    const bQualityTests = batch ? qualityTests.filter(qt => qt.batch_id === batch.batch_id) : [];
    const failedTests = bQualityTests.filter(qt => qt.status === 'FAILED');
    const pendingTests = bQualityTests.filter(qt => qt.status === 'PENDING');

    // Resolve dispensing info
    let dispensingInfo = null;
    if (pkg.dispense_id) {
      const disp = dispensings.find(d => d.dispense_id === pkg.dispense_id);
      if (disp) {
        const ph = parties.find(p => p.party_id === disp.pharmacy_id);
        dispensingInfo = {
          dispense_id: disp.dispense_id,
          dispensed_at: disp.dispensed_at,
          patient_id: disp.patient_id,
          quantity: disp.quantity,
          pharmacy_name: ph?.party_name || 'Retail Pharmacy',
          remarks: disp.remarks
        };
      }
    }

    // Resolve shipment history
    const relatedShipmentIds = contains.filter(c => c.package_id === pkg.package_id).map(c => c.shipment_id);
    const shipmentHistory = shipments.filter(s => relatedShipmentIds.includes(s.shipment_id)).map(s => {
      const sender = parties.find(p => p.party_id === s.sender_party_id);
      const receiver = parties.find(p => p.party_id === s.receiver_party_id);
      return {
        shipment_id: s.shipment_id,
        shipment_date: s.shipment_date,
        sender_name: sender?.party_name || 'N/A',
        receiver_name: receiver?.party_name || 'N/A',
        transport_mode: s.mode,
        status: s.status
      };
    }).sort((a, b) => b.shipment_date.localeCompare(a.shipment_date));

    // Priority-based verdict determination
    let verdict = 'VERIFIED';
    let statusText = 'VERIFIED: Database-backed record found and verified with no active recall or quality failure.';

    const hasActiveRecall = (recall && recall.status === 'ACTIVE') || (batch && batch.batch_status === 'RECALLED' && (!recall || recall.status === 'ACTIVE')) || pkg.status === 'RECALLED';

    if (hasActiveRecall) {
      verdict = 'RECALL ALERT';
      statusText = `RECALL ALERT: Associated batch is under an active regulatory recall. Reason: ${recall?.reason || 'Batch quarantined for patient safety'}`;
    } else if (failedTests.length > 0) {
      verdict = 'QUALITY WARNING';
      statusText = `QUALITY WARNING: Associated batch failed ${failedTests.length} laboratory quality assurance test(s). Product quarantined.`;
    } else if (pkg.status === 'TAMPERED') {
      verdict = 'QUALITY WARNING';
      statusText = 'QUALITY WARNING: Security seal or physical custody reported as TAMPERED.';
    } else if (pkg.status === 'DISPENSED' || dispensingInfo) {
      verdict = 'VERIFIED (DISPENSED)';
      statusText = 'VERIFIED: Authentic pharmaceutical record verified. Product has already been dispensed to a registered patient.';
    } else if (pkg.status === 'IN_TRANSIT') {
      verdict = 'VERIFIED (IN TRANSIT)';
      statusText = 'VERIFIED: Authentic pharmaceutical record verified. Package is actively moving in authorized custody.';
    }

    const qualityStatusSummary = failedTests.length > 0 
      ? `FAILED (${failedTests.length} test failure(s))` 
      : pendingTests.length > 0 
      ? `PENDING REVIEW (${pendingTests.length} pending)` 
      : bQualityTests.length > 0 
      ? `PASSED (${bQualityTests.length} test(s) cleared)` 
      : 'NO TESTS RECORDED';

    return {
      verdict,
      statusText,
      package: {
        package_id: pkg.package_id,
        qr_code: pkg.qr_code,
        package_size: pkg.package_size,
        status: pkg.status,
        quantity_total: pkg.quantity_total,
        packaged_at: pkg.packaged_at,
        batch_id: batch?.batch_id,
        batch_status: batch?.batch_status,
        manufacture_date: batch?.manufacture_date,
        drug_name: drug?.drug_name,
        strength: drug?.strength,
        dosage_form: drug?.dosage_form,
        manufacturer_name: mfg?.party_name,
        quality_test_status: qualityStatusSummary,
        quality_tests: bQualityTests,
        recall_status: recall ? 'ACTIVE RECALL' : 'NO ACTIVE RECALL',
        recall_notice: recall ? { recall_id: recall.recall_id, reason: recall.reason, recall_date: recall.recall_date } : null,
        dispensing_info: dispensingInfo,
        shipment_history: shipmentHistory
      }
    };
  },

  // --------------------------------------------------------------------------
  // SHIPMENTS
  // --------------------------------------------------------------------------
  getShipments: (statusFilter) => {
    return shipments.map(s => {
      const sender = parties.find(p => p.party_id === s.sender_party_id);
      const receiver = parties.find(p => p.party_id === s.receiver_party_id);
      const pkgCount = contains.filter(c => c.shipment_id === s.shipment_id).length;
      return {
        ...s,
        sender_name: sender?.party_name || 'Unknown',
        receiver_name: receiver?.party_name || 'Unknown',
        total_packages: pkgCount
      };
    }).filter(s => !statusFilter || s.status === statusFilter);
  },

  getShipmentById: (id) => {
    const s = shipments.find(x => x.shipment_id === Number(id));
    if (!s) return null;
    const sender = parties.find(p => p.party_id === s.sender_party_id);
    const receiver = parties.find(p => p.party_id === s.receiver_party_id);
    const shipmentPkgs = contains
      .filter(c => c.shipment_id === s.shipment_id)
      .map(c => mockDbService.getPackageById(c.package_id));
    return {
      ...s,
      sender_name: sender?.party_name,
      receiver_name: receiver?.party_name,
      packages: shipmentPkgs
    };
  },

  // PL/SQL register_shipment implementation
  registerShipment: (data) => {
    const senderId = Number(data.sender_party_id);
    const receiverId = Number(data.receiver_party_id);

    if (!senderId || !receiverId) {
      const err = new Error('Required Parties Missing: sender_party_id and receiver_party_id must be provided.');
      err.code = -20010;
      throw err;
    }
    if (senderId === receiverId) {
      const err = new Error('Invalid Shipment: Sender and Receiver parties cannot be identical.');
      err.code = -20011;
      throw err;
    }

    const senderExists = parties.some(p => p.party_id === senderId);
    if (!senderExists) {
      const err = new Error('Invalid Sender: Party ID does not exist in PARTY table.');
      err.code = -20012;
      throw err;
    }
    const receiverExists = parties.some(p => p.party_id === receiverId);
    if (!receiverExists) {
      const err = new Error('Invalid Receiver: Party ID does not exist in PARTY table.');
      err.code = -20013;
      throw err;
    }

    const validModes = ['AIR_CARGO', 'COLD_CHAIN_TRUCK', 'EXPRESS_COURIER', 'MARITIME', 'ROAD_LOGISTICS'];
    const mode = data.mode || 'ROAD_LOGISTICS';
    if (!validModes.includes(mode)) {
      const err = new Error('Invalid Mode: Transport mode not permitted by domain constraint.');
      err.code = -20014;
      throw err;
    }

    const nextId = Math.max(...shipments.map(s => s.shipment_id), 400) + 1;
    const newShipment = {
      shipment_id: nextId,
      sender_party_id: senderId,
      receiver_party_id: receiverId,
      shipment_date: data.shipment_date || new Date().toISOString().split('T')[0],
      status: data.status || 'CREATED',
      mode
    };
    shipments.push(newShipment);

    if (Array.isArray(data.package_ids)) {
      data.package_ids.forEach(pkgId => {
        contains.push({ package_id: Number(pkgId), shipment_id: nextId });
      });
    }
    return mockDbService.getShipmentById(nextId);
  },

  createShipment: (data) => {
    return mockDbService.registerShipment(data);
  },

  updateShipment: (id, data) => {
    const numId = Number(id);
    const idx = shipments.findIndex(s => s.shipment_id === numId);
    if (idx === -1) return null;
    shipments[idx] = { ...shipments[idx], ...data, shipment_id: numId };
    return mockDbService.getShipmentById(numId);
  },

  deleteShipment: (id) => {
    const numId = Number(id);
    shipments = shipments.filter(s => s.shipment_id !== numId);
    contains = contains.filter(c => c.shipment_id !== numId);
    return true;
  },

  // --------------------------------------------------------------------------
  // RECALLS (with PL/SQL PROCEDURE process_recall & FUNCTION recall_impact)
  // --------------------------------------------------------------------------
  getRecalls: () => {
    return recalls.map(r => {
      const affectedBatches = batches.filter(b => b.recall_id === r.recall_id);
      const affectedBatchIds = affectedBatches.map(b => b.batch_id);
      const affectedPkgs = packages.filter(p => affectedBatchIds.includes(p.batch_id));
      return {
        ...r,
        affected_batches_count: affectedBatches.length,
        affected_packages_count: affectedPkgs.length,
        impact_summary: mockDbService.recallImpact(r.recall_id)
      };
    });
  },

  createRecall: (data) => {
    const nextId = Math.max(...recalls.map(r => r.recall_id), 500) + 1;
    const newRecall = {
      recall_id: nextId,
      recall_date: data.recall_date || new Date().toISOString().split('T')[0],
      status: data.status || 'INITIATED',
      reason: data.reason
    };
    recalls.push(newRecall);

    // If batch_ids specified, link them
    if (Array.isArray(data.batch_ids)) {
      data.batch_ids.forEach(bid => {
        const b = batches.find(x => x.batch_id === Number(bid));
        if (b) b.recall_id = nextId;
      });
    }

    return newRecall;
  },

  updateRecall: (id, data) => {
    const numId = Number(id);
    const idx = recalls.findIndex(r => r.recall_id === numId);
    if (idx === -1) return null;
    recalls[idx] = { ...recalls[idx], ...data, recall_id: numId };
    return recalls[idx];
  },

  deleteRecall: (id) => {
    const numId = Number(id);
    const hasBatches = batches.some(b => b.recall_id === numId);
    if (hasBatches) {
      const err = new Error(`Cannot delete Recall #${id}: Batches are currently linked to this recall notice. Referential integrity preserved.`);
      err.statusCode = 409;
      throw err;
    }
    recalls = recalls.filter(r => r.recall_id !== numId);
    return true;
  },

  // PL/SQL process_recall procedure logic

  processRecall: (recallId) => {
    const numId = Number(recallId);
    const recall = recalls.find(r => r.recall_id === numId);
    if (!recall) {
      throw new Error(`Recall notice #${numId} not found.`);
    }

    let batchCount = 0;
    let pkgCount = 0;

    batches.forEach(b => {
      if (b.recall_id === numId) {
        b.batch_status = 'RECALLED';
        batchCount++;

        // Update all associated packages
        packages.forEach(pkg => {
          if (pkg.batch_id === b.batch_id && pkg.status !== 'DISPENSED') {
            pkg.status = 'RECALLED';
            pkgCount++;
          }
        });
      }
    });

    recall.status = 'ACTIVE';

    return {
      recall_id: numId,
      status: 'ACTIVE',
      batches_recalled: batchCount,
      packages_quarantined: pkgCount,
      message: `Recall #${numId} processed successfully: ${batchCount} batches marked RECALLED, ${pkgCount} packages quarantined.`
    };
  },

  // PL/SQL recall_impact / get_recall_impact function logic
  recallImpact: (recallId) => {
    const numId = Number(recallId);
    const affBatches = batches.filter(b => b.recall_id === numId);
    const affBatchIds = affBatches.map(b => b.batch_id);
    const affPkgs = packages.filter(p => affBatchIds.includes(p.batch_id));
    const totalUnits = affPkgs.reduce((acc, p) => acc + (p.quantity_total || 0), 0);

    return `Batches Affected: ${affBatches.length} | Packages Quarantined: ${affPkgs.length} | Total Units: ${totalUnits}`;
  },

  getRecallImpact: (recallId) => {
    return mockDbService.recallImpact(recallId);
  },

  // --------------------------------------------------------------------------
  // DISPENSING
  // --------------------------------------------------------------------------
  getDispensings: () => {
    return dispensings.map(d => {
      const ph = parties.find(p => p.party_id === d.pharmacy_id);
      const pkg = packages.find(p => p.dispense_id === d.dispense_id);
      const batch = pkg ? batches.find(b => b.batch_id === pkg.batch_id) : null;
      const drug = batch ? drugs.find(dr => dr.drug_id === batch.drug_id) : null;
      return {
        ...d,
        pharmacy_name: ph?.party_name || 'Unknown Pharmacy',
        package_id: pkg?.package_id || null,
        qr_code: pkg?.qr_code || null,
        drug_name: drug?.drug_name || 'Prescription Drug'
      };
    });
  },

  createDispensing: (data) => {
    const nextId = Math.max(...dispensings.map(d => d.dispense_id), 600) + 1;
    const newDisp = {
      dispense_id: nextId,
      pharmacy_id: Number(data.pharmacy_id),
      dispensed_at: data.dispensed_at || new Date().toISOString().split('T')[0],
      patient_id: data.patient_id,
      quantity: Number(data.quantity) || 1,
      remarks: data.remarks || 'Standard prescription filled'
    };
    dispensings.push(newDisp);

    // If package_id provided, mark package DISPENSED
    if (data.package_id) {
      const pkg = packages.find(p => p.package_id === Number(data.package_id));
      if (pkg) {
        pkg.dispense_id = nextId;
        pkg.status = 'DISPENSED';
      }
    }
    return newDisp;
  },

  // --------------------------------------------------------------------------
  // SQL ANALYTICS (Executes Q1 to Q12)
  // --------------------------------------------------------------------------
  runAnalyticsQuery: (queryId, params = {}) => {
    return analyticsService.executeSimulatedQuery(queryId, params, {
      parties,
      manufacturers,
      distributors,
      pharmacies,
      regulators,
      drugs,
      batches,
      qualityTests,
      recalls,
      packages,
      shipments,
      contains,
      dispensings
    });
    switch (queryId) {
      case 'Q1': {
        const rows = [];
        drugs.forEach(d => {
          const bList = batches.filter(b => b.drug_id === d.drug_id);
          bList.forEach(b => {
            const p = parties.find(party => party.party_id === b.manufacturer_id);
            rows.push({
              DRUG_ID: d.drug_id,
              DRUG_NAME: d.drug_name,
              STRENGTH: d.strength,
              DOSAGE_FORM: d.dosage_form,
              BATCH_ID: b.batch_id,
              BATCH_STATUS: b.batch_status,
              MFG_DATE: b.manufacture_date,
              MANUFACTURER_NAME: p?.party_name || 'Unknown'
            });
          });
        });
        return {
          queryId: 'Q1',
          title: 'Display all drugs with their manufactured batches',
          concept: '3-Table INNER JOIN, ORDER BY',
          sql: `SELECT d.drug_id, d.drug_name, d.strength, d.dosage_form, b.batch_id, b.batch_status, TO_CHAR(b.manufacture_date, 'YYYY-MM-DD') AS mfg_date, p.party_name AS manufacturer_name
FROM DRUG d
INNER JOIN BATCH b ON d.drug_id = b.drug_id
INNER JOIN PARTY p ON b.manufacturer_id = p.party_id
ORDER BY d.drug_id, b.manufacture_date DESC;`,
          columns: ['DRUG_ID', 'DRUG_NAME', 'STRENGTH', 'DOSAGE_FORM', 'BATCH_ID', 'BATCH_STATUS', 'MFG_DATE', 'MANUFACTURER_NAME'],
          rows
        };
      }
      case 'Q2': {
        const rows = manufacturers.map(m => {
          const p = parties.find(x => x.party_id === m.party_id);
          const mfgBatches = batches.filter(b => b.manufacturer_id === m.party_id);
          const dates = mfgBatches.map(b => b.manufacture_date).sort();
          return {
            MFG_ID: m.party_id,
            MANUFACTURER_NAME: p?.party_name || 'N/A',
            MANUFACTURING_LICENSE_NO: m.manufacturing_license_no,
            TOTAL_BATCHES_PRODUCED: mfgBatches.length,
            RELEASED_BATCHES: mfgBatches.filter(b => b.batch_status === 'RELEASED').length,
            RECALLED_BATCHES: mfgBatches.filter(b => b.batch_status === 'RECALLED').length,
            EARLIEST_BATCH_DATE: dates[0] || 'N/A',
            LATEST_BATCH_DATE: dates[dates.length - 1] || 'N/A'
          };
        });
        return {
          queryId: 'Q2',
          title: 'Display manufacturer-wise batch production summary',
          concept: 'INNER JOIN, GROUP BY, Aggregates (COUNT, MAX, MIN)',
          sql: `SELECT m.party_id AS mfg_id, p.party_name AS manufacturer_name, m.manufacturing_license_no,
       COUNT(b.batch_id) AS total_batches_produced,
       SUM(CASE WHEN b.batch_status = 'RELEASED' THEN 1 ELSE 0 END) AS released_batches,
       SUM(CASE WHEN b.batch_status = 'RECALLED' THEN 1 ELSE 0 END) AS recalled_batches,
       MIN(b.manufacture_date) AS earliest_batch_date,
       MAX(b.manufacture_date) AS latest_batch_date
FROM MANUFACTURER m
INNER JOIN PARTY p ON m.party_id = p.party_id
LEFT JOIN BATCH b ON m.party_id = b.manufacturer_id
GROUP BY m.party_id, p.party_name, m.manufacturing_license_no
ORDER BY total_batches_produced DESC;`,
          columns: ['MFG_ID', 'MANUFACTURER_NAME', 'MANUFACTURING_LICENSE_NO', 'TOTAL_BATCHES_PRODUCED', 'RELEASED_BATCHES', 'RECALLED_BATCHES', 'EARLIEST_BATCH_DATE', 'LATEST_BATCH_DATE'],
          rows
        };
      }
      case 'Q3': {
        const inTransitPkgs = packages.filter(pkg => {
          const cEntries = contains.filter(c => c.package_id === pkg.package_id);
          const sInTransit = cEntries.some(c => {
            const sh = shipments.find(s => s.shipment_id === c.shipment_id);
            return sh && sh.status === 'IN_TRANSIT';
          });
          return pkg.status === 'IN_TRANSIT' || sInTransit;
        });
        const rows = inTransitPkgs.map(pkg => {
          const b = batches.find(x => x.batch_id === pkg.batch_id);
          const d = b ? drugs.find(x => x.drug_id === b.drug_id) : null;
          const c = contains.find(x => x.package_id === pkg.package_id);
          const s = c ? shipments.find(x => x.shipment_id === c.shipment_id) : null;
          const sender = s ? parties.find(p => p.party_id === s.sender_party_id) : null;
          const receiver = s ? parties.find(p => p.party_id === s.receiver_party_id) : null;
          return {
            PACKAGE_ID: pkg.package_id,
            QR_CODE: pkg.qr_code,
            PACKAGE_SIZE: pkg.package_size,
            PACKAGE_STATUS: pkg.status,
            DRUG_NAME: d?.drug_name || 'N/A',
            BATCH_ID: b?.batch_id,
            SHIPMENT_ID: s?.shipment_id || 'N/A',
            TRANSPORT_MODE: s?.mode || 'N/A',
            SENDER: sender?.party_name || 'N/A',
            RECEIVER: receiver?.party_name || 'N/A',
            DISPATCH_DATE: s?.shipment_date || 'N/A'
          };
        });
        return {
          queryId: 'Q3',
          title: 'Display all packages currently in transit',
          concept: '5-Table Join, Complex Predicate Filtering',
          sql: `SELECT pkg.package_id, pkg.qr_code, pkg.package_size, pkg.status AS package_status,
       d.drug_name, b.batch_id, s.shipment_id, s.mode AS transport_mode,
       sender.party_name AS sender, receiver.party_name AS receiver,
       TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS dispatch_date
FROM PACKAGE pkg
INNER JOIN BATCH b ON pkg.batch_id = b.batch_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
INNER JOIN CONTAINS c ON pkg.package_id = c.package_id
INNER JOIN SHIPMENT s ON c.shipment_id = s.shipment_id
INNER JOIN PARTY sender ON s.sender_party_id = sender.party_id
INNER JOIN PARTY receiver ON s.receiver_party_id = receiver.party_id
WHERE pkg.status = 'IN_TRANSIT' OR s.status = 'IN_TRANSIT'
ORDER BY s.shipment_date DESC;`,
          columns: ['PACKAGE_ID', 'QR_CODE', 'PACKAGE_SIZE', 'PACKAGE_STATUS', 'DRUG_NAME', 'BATCH_ID', 'SHIPMENT_ID', 'TRANSPORT_MODE', 'SENDER', 'RECEIVER', 'DISPATCH_DATE'],
          rows
        };
      }
      case 'Q4': {
        const rows = shipments.map(s => {
          const sender = parties.find(p => p.party_id === s.sender_party_id);
          const receiver = parties.find(p => p.party_id === s.receiver_party_id);
          return {
            SHIPMENT_ID: s.shipment_id,
            SHIPMENT_DATE: s.shipment_date,
            MODE: s.mode,
            SHIPMENT_STATUS: s.status,
            SENDER_PARTY_ID: s.sender_party_id,
            SENDER_ORGANIZATION: sender?.party_name || 'N/A',
            RECEIVER_PARTY_ID: s.receiver_party_id,
            RECEIVER_ORGANIZATION: receiver?.party_name || 'N/A'
          };
        });
        return {
          queryId: 'Q4',
          title: 'Display shipment details with sender and receiver names',
          concept: 'Dual Joins on the same superclass table (PARTY) using table aliases',
          sql: `SELECT s.shipment_id, TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS shipment_date,
       s.mode, s.status AS shipment_status, s.sender_party_id,
       p_sender.party_name AS sender_organization, s.receiver_party_id,
       p_receiver.party_name AS receiver_organization
FROM SHIPMENT s
INNER JOIN PARTY p_sender ON s.sender_party_id = p_sender.party_id
INNER JOIN PARTY p_receiver ON s.receiver_party_id = p_receiver.party_id
ORDER BY s.shipment_id;`,
          columns: ['SHIPMENT_ID', 'SHIPMENT_DATE', 'MODE', 'SHIPMENT_STATUS', 'SENDER_PARTY_ID', 'SENDER_ORGANIZATION', 'RECEIVER_PARTY_ID', 'RECEIVER_ORGANIZATION'],
          rows
        };
      }
      case 'Q5': {
        const rows = qualityTests.filter(qt => [201, 204].includes(qt.batch_id)).map(qt => {
          const b = batches.find(x => x.batch_id === qt.batch_id);
          const d = b ? drugs.find(x => x.drug_id === b.drug_id) : null;
          return {
            TEST_ID: qt.test_id,
            BATCH_ID: qt.batch_id,
            DRUG_NAME: d?.drug_name || 'N/A',
            TEST_DATE: qt.test_date,
            TEST_TYPE: qt.test_type,
            RESULT: qt.result,
            TEST_STATUS: qt.status
          };
        });
        return {
          queryId: 'Q5',
          title: 'Display all quality tests for particular batches (Batches 201 & 204)',
          concept: 'Parameterized Lookup, JOIN, Conditional Case Projection',
          sql: `SELECT qt.test_id, qt.batch_id, d.drug_name, TO_CHAR(qt.test_date, 'YYYY-MM-DD') AS test_date,
       qt.test_type, qt.result, qt.status AS test_status
FROM QUALITY_TEST qt
INNER JOIN BATCH b ON qt.batch_id = b.batch_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
WHERE b.batch_id IN (201, 204)
ORDER BY qt.batch_id, qt.test_date;`,
          columns: ['TEST_ID', 'BATCH_ID', 'DRUG_NAME', 'TEST_DATE', 'TEST_TYPE', 'RESULT', 'TEST_STATUS'],
          rows
        };
      }
      case 'Q6': {
        const rows = [];
        recalls.forEach(r => {
          const rBatches = batches.filter(b => b.recall_id === r.recall_id);
          rBatches.forEach(b => {
            const d = drugs.find(x => x.drug_id === b.drug_id);
            const mfg = parties.find(x => x.party_id === b.manufacturer_id);
            rows.push({
              RECALL_ID: r.recall_id,
              RECALL_DATE: r.recall_date,
              RECALL_STATUS: r.status,
              RECALL_JUSTIFICATION: r.reason,
              BATCH_ID: b.batch_id,
              BATCH_STATUS: b.batch_status,
              DRUG_NAME: d?.drug_name || 'N/A',
              STRENGTH: d?.strength || 'N/A',
              MANUFACTURER: mfg?.party_name || 'N/A'
            });
          });
        });
        return {
          queryId: 'Q6',
          title: 'Display all recalled batches and affected drugs',
          concept: '4-Table Join, Temporal and Status Filtering',
          sql: `SELECT r.recall_id, TO_CHAR(r.recall_date, 'YYYY-MM-DD') AS recall_date,
       r.status AS recall_status, r.reason AS recall_justification,
       b.batch_id, b.batch_status, d.drug_name, d.strength,
       mfg_p.party_name AS manufacturer
FROM RECALL r
INNER JOIN BATCH b ON r.recall_id = b.recall_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
INNER JOIN PARTY mfg_p ON b.manufacturer_id = mfg_p.party_id
ORDER BY r.recall_date DESC;`,
          columns: ['RECALL_ID', 'RECALL_DATE', 'RECALL_STATUS', 'RECALL_JUSTIFICATION', 'BATCH_ID', 'BATCH_STATUS', 'DRUG_NAME', 'STRENGTH', 'MANUFACTURER'],
          rows
        };
      }
      case 'Q7': {
        const activePharmacyIds = [...new Set(dispensings.map(d => d.pharmacy_id))];
        const rows = pharmacies
          .filter(ph => activePharmacyIds.includes(ph.party_id))
          .map(ph => {
            const p = parties.find(x => x.party_id === ph.party_id);
            return {
              PARTY_ID: ph.party_id,
              PHARMACY_NAME: p?.party_name || 'N/A',
              PHARMACY_LICENSE_NO: ph.pharmacy_license_no,
              HEADQUARTERS: ph.hq,
              PHONE: p?.phone || 'N/A',
              EMAIL: p?.email || 'N/A'
            };
          });
        return {
          queryId: 'Q7',
          title: 'Find pharmacies that performed dispensing',
          concept: 'Subquery with IN / EXISTS clause, Distinct entity extraction',
          sql: `SELECT p.party_id, p.party_name AS pharmacy_name, ph.pharmacy_license_no,
       ph.hq AS headquarters, p.phone, p.email
FROM PHARMACY ph
INNER JOIN PARTY p ON ph.party_id = p.party_id
WHERE EXISTS (
    SELECT 1 FROM DISPENSING d WHERE d.pharmacy_id = ph.party_id
)
ORDER BY p.party_name;`,
          columns: ['PARTY_ID', 'PHARMACY_NAME', 'PHARMACY_LICENSE_NO', 'HEADQUARTERS', 'PHONE', 'EMAIL'],
          rows
        };
      }
      case 'Q8': {
        const counts = {};
        contains.forEach(c => {
          counts[c.package_id] = (counts[c.package_id] || 0) + 1;
        });
        const rows = [];
        Object.keys(counts).forEach(pkgId => {
          if (counts[pkgId] > 1) {
            const pkg = packages.find(p => p.package_id === Number(pkgId));
            const b = pkg ? batches.find(x => x.batch_id === pkg.batch_id) : null;
            const d = b ? drugs.find(x => x.drug_id === b.drug_id) : null;
            rows.push({
              PACKAGE_ID: Number(pkgId),
              QR_CODE: pkg?.qr_code || 'N/A',
              DRUG_NAME: d?.drug_name || 'N/A',
              CURRENT_STATUS: pkg?.status || 'N/A',
              SHIPMENT_HOPS_COUNT: counts[pkgId]
            });
          }
        });
        rows.sort((a, b) => b.SHIPMENT_HOPS_COUNT - a.SHIPMENT_HOPS_COUNT);
        return {
          queryId: 'Q8',
          title: 'Find packages that were shipped more than once (Multi-hop supply chain)',
          concept: 'Bridge table aggregation, GROUP BY, HAVING COUNT(*) > 1',
          sql: `SELECT c.package_id, pkg.qr_code, d.drug_name, pkg.status AS current_status,
       COUNT(c.shipment_id) AS shipment_hops_count
FROM CONTAINS c
INNER JOIN PACKAGE pkg ON c.package_id = pkg.package_id
INNER JOIN BATCH b ON pkg.batch_id = b.batch_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
GROUP BY c.package_id, pkg.qr_code, d.drug_name, pkg.status
HAVING COUNT(c.shipment_id) > 1
ORDER BY shipment_hops_count DESC, c.package_id;`,
          columns: ['PACKAGE_ID', 'QR_CODE', 'DRUG_NAME', 'CURRENT_STATUS', 'SHIPMENT_HOPS_COUNT'],
          rows
        };
      }
      case 'Q9': {
        const failedBatches = qualityTests.filter(qt => qt.status === 'FAILED').map(qt => qt.batch_id);
        const map = {};
        batches.forEach(b => {
          if (failedBatches.includes(b.batch_id)) {
            map[b.drug_id] = (map[b.drug_id] || 0) + qualityTests.filter(qt => qt.batch_id === b.batch_id && qt.status === 'FAILED').length;
          }
        });
        const rows = Object.keys(map).map(drugId => {
          const d = drugs.find(x => x.drug_id === Number(drugId));
          return {
            DRUG_ID: Number(drugId),
            DRUG_NAME: d?.drug_name || 'N/A',
            DOSAGE_FORM: d?.dosage_form || 'N/A',
            TOTAL_FAILED_TESTS: map[drugId]
          };
        }).sort((a, b) => b.TOTAL_FAILED_TESTS - a.TOTAL_FAILED_TESTS);
        return {
          queryId: 'Q9',
          title: 'Find drugs with failed quality tests',
          concept: 'Correlated Subquery / IN with Subquery, Aggregation',
          sql: `SELECT d.drug_id, d.drug_name, d.dosage_form, COUNT(qt.test_id) AS total_failed_tests
FROM DRUG d
INNER JOIN BATCH b ON d.drug_id = b.drug_id
INNER JOIN QUALITY_TEST qt ON b.batch_id = qt.batch_id
WHERE qt.status = 'FAILED'
GROUP BY d.drug_id, d.drug_name, d.dosage_form
ORDER BY total_failed_tests DESC;`,
          columns: ['DRUG_ID', 'DRUG_NAME', 'DOSAGE_FORM', 'TOTAL_FAILED_TESTS'],
          rows
        };
      }
      case 'Q10': {
        const rows = shipments.map(s => {
          const sender = parties.find(p => p.party_id === s.sender_party_id);
          const receiver = parties.find(p => p.party_id === s.receiver_party_id);
          const count = contains.filter(c => c.shipment_id === s.shipment_id).length;
          return {
            SHIPMENT_ID: s.shipment_id,
            SHIPMENT_DATE: s.shipment_date,
            SHIPMENT_STATUS: s.status,
            MODE: s.mode,
            SENDER: sender?.party_name || 'N/A',
            RECEIVER: receiver?.party_name || 'N/A',
            TOTAL_PACKAGES_LOADED: count
          };
        }).sort((a, b) => b.TOTAL_PACKAGES_LOADED - a.TOTAL_PACKAGES_LOADED);
        return {
          queryId: 'Q10',
          title: 'Find the number of packages associated with each shipment',
          concept: 'LEFT OUTER JOIN, GROUP BY, Aggregate COUNT, Handling NULLs',
          sql: `SELECT s.shipment_id, TO_CHAR(s.shipment_date, 'YYYY-MM-DD') AS shipment_date,
       s.status AS shipment_status, s.mode,
       sender.party_name AS sender, receiver.party_name AS receiver,
       COUNT(c.package_id) AS total_packages_loaded
FROM SHIPMENT s
INNER JOIN PARTY sender ON s.sender_party_id = sender.party_id
INNER JOIN PARTY receiver ON s.receiver_party_id = receiver.party_id
LEFT JOIN CONTAINS c ON s.shipment_id = c.shipment_id
GROUP BY s.shipment_id, s.shipment_date, s.status, s.mode, sender.party_name, receiver.party_name
ORDER BY total_packages_loaded DESC, s.shipment_id;`,
          columns: ['SHIPMENT_ID', 'SHIPMENT_DATE', 'SHIPMENT_STATUS', 'MODE', 'SENDER', 'RECEIVER', 'TOTAL_PACKAGES_LOADED'],
          rows
        };
      }
      case 'Q11': {
        const drugDispMap = {};
        packages.forEach(pkg => {
          if (pkg.dispense_id) {
            const disp = dispensings.find(d => d.dispense_id === pkg.dispense_id);
            const batch = batches.find(b => b.batch_id === pkg.batch_id);
            if (disp && batch) {
              if (!drugDispMap[batch.drug_id]) {
                drugDispMap[batch.drug_id] = { events: new Set(), totalUnits: 0 };
              }
              drugDispMap[batch.drug_id].events.add(disp.dispense_id);
              drugDispMap[batch.drug_id].totalUnits += disp.quantity;
            }
          }
        });
        const rows = Object.keys(drugDispMap).map(drugId => {
          const d = drugs.find(x => x.drug_id === Number(drugId));
          return {
            DRUG_ID: Number(drugId),
            DRUG_NAME: d?.drug_name || 'N/A',
            STRENGTH: d?.strength || 'N/A',
            DOSAGE_FORM: d?.dosage_form || 'N/A',
            TOTAL_DISPENSING_EVENTS: drugDispMap[drugId].events.size,
            TOTAL_UNITS_DISPENSED: drugDispMap[drugId].totalUnits
          };
        }).sort((a, b) => b.TOTAL_UNITS_DISPENSED - a.TOTAL_UNITS_DISPENSED);
        return {
          queryId: 'Q11',
          title: 'Find the most frequently dispensed drugs',
          concept: '4-Table Join, GROUP BY, SUM Aggregate, ORDER BY DESC',
          sql: `SELECT d.drug_id, d.drug_name, d.strength, d.dosage_form,
       COUNT(DISTINCT disp.dispense_id) AS total_dispensing_events,
       SUM(disp.quantity) AS total_units_dispensed
FROM DRUG d
INNER JOIN BATCH b ON d.drug_id = b.drug_id
INNER JOIN PACKAGE pkg ON b.batch_id = pkg.batch_id
INNER JOIN DISPENSING disp ON pkg.dispense_id = disp.dispense_id
GROUP BY d.drug_id, d.drug_name, d.strength, d.dosage_form
ORDER BY total_units_dispensed DESC;`,
          columns: ['DRUG_ID', 'DRUG_NAME', 'STRENGTH', 'DOSAGE_FORM', 'TOTAL_DISPENSING_EVENTS', 'TOTAL_UNITS_DISPENSED'],
          rows
        };
      }
      case 'Q12': {
        const rows = [];
        recalls.forEach(r => {
          const rBatches = batches.filter(b => b.recall_id === r.recall_id);
          rBatches.forEach(b => {
            const d = drugs.find(x => x.drug_id === b.drug_id);
            const rPkgs = packages.filter(p => p.batch_id === b.batch_id);
            rPkgs.forEach(pkg => {
              rows.push({
                RECALL_ID: r.recall_id,
                RECALL_DATE: r.recall_date,
                REASON: r.reason,
                BATCH_ID: b.batch_id,
                DRUG_NAME: d?.drug_name || 'N/A',
                PACKAGE_ID: pkg.package_id,
                QR_CODE: pkg.qr_code,
                PACKAGE_SIZE: pkg.package_size,
                PACKAGE_STATUS: pkg.status,
                QUANTITY_TOTAL: pkg.quantity_total
              });
            });
          });
        });
        return {
          queryId: 'Q12',
          title: 'Find all packages affected by a recall',
          concept: 'Hierarchical Multi-Table Join (RECALL -> BATCH -> PACKAGE)',
          sql: `SELECT r.recall_id, TO_CHAR(r.recall_date, 'YYYY-MM-DD') AS recall_date,
       r.reason, b.batch_id, d.drug_name, pkg.package_id, pkg.qr_code,
       pkg.package_size, pkg.status AS package_status, pkg.quantity_total
FROM RECALL r
INNER JOIN BATCH b ON r.recall_id = b.recall_id
INNER JOIN DRUG d ON b.drug_id = d.drug_id
INNER JOIN PACKAGE pkg ON b.batch_id = pkg.batch_id
ORDER BY r.recall_id, pkg.package_id;`,
          columns: ['RECALL_ID', 'RECALL_DATE', 'REASON', 'BATCH_ID', 'DRUG_NAME', 'PACKAGE_ID', 'QR_CODE', 'PACKAGE_SIZE', 'PACKAGE_STATUS', 'QUANTITY_TOTAL'],
          rows
        };
      }
      default:
        throw new Error(`Query ${queryId} not found in catalogue.`);
    }
  },

  // --------------------------------------------------------------------------
  // DASHBOARD AGGREGATES
  // --------------------------------------------------------------------------
  getDashboardStats: () => {
    // KPI Cards
    const kpi = {
      partiesCount: parties.length,
      drugsCount: drugs.length,
      batchesCount: batches.length,
      activeBatchesCount: batches.filter(b => b.batch_status === 'RELEASED').length,
      packagesCount: packages.length,
      shipmentsCount: shipments.length,
      recallsCount: recalls.length,
      activeRecallsCount: recalls.filter(r => r.status === 'ACTIVE').length,
      dispensingsCount: dispensings.length,
      dispensedPackagesCount: packages.filter(p => p.status === 'DISPENSED').length
    };

    const totalQ = qualityTests.length;
    const passedQ = qualityTests.filter(t => t.status === 'PASSED').length;
    const failedQ = qualityTests.filter(t => t.status === 'FAILED').length;
    const pendingQ = qualityTests.filter(t => t.status === 'PENDING').length;
    const passRate = totalQ > 0 ? Math.round((passedQ / totalQ) * 100) : 0;

    const qualityTestSummary = {
      total: totalQ,
      passed: passedQ,
      failed: failedQ,
      pending: pendingQ,
      passRate
    };

    // Distributions
    const batchStatusCounts = {};
    batches.forEach(b => {
      batchStatusCounts[b.batch_status] = (batchStatusCounts[b.batch_status] || 0) + 1;
    });

    const shipmentStatusCounts = {};
    shipments.forEach(s => {
      shipmentStatusCounts[s.status] = (shipmentStatusCounts[s.status] || 0) + 1;
    });

    const packageStatusCounts = {};
    packages.forEach(p => {
      packageStatusCounts[p.status] = (packageStatusCounts[p.status] || 0) + 1;
    });

    // Recent events
    const recentShipments = shipments.slice(-5).reverse().map(s => {
      const sender = parties.find(p => p.party_id === s.sender_party_id);
      const receiver = parties.find(p => p.party_id === s.receiver_party_id);
      return {
        ...s,
        sender_name: sender?.party_name,
        receiver_name: receiver?.party_name
      };
    });

    const recentRecalls = recalls.slice(-5).reverse();
    const recentDispensings = dispensings.slice(-5).reverse().map(d => {
      const ph = parties.find(p => p.party_id === d.pharmacy_id);
      return {
        ...d,
        pharmacy_name: ph?.party_name
      };
    });

    return {
      kpi,
      qualityTestSummary,
      batchStatusCounts,
      shipmentStatusCounts,
      packageStatusCounts,
      recentShipments,
      recentRecalls,
      recentDispensings
    };
  },

  // --------------------------------------------------------------------------
  // USER AUTHENTICATION & ACCESS CONTROL (Simulation Storage)
  // --------------------------------------------------------------------------
  getUsers: () => {
    return users.map(u => {
      const p = u.party_id ? parties.find(x => x.party_id === u.party_id) : null;
      const { password_hash, ...safeUser } = u;
      return {
        ...safeUser,
        org_name: p ? p.party_name : u.requested_org_name || null
      };
    });
  },

  getUserById: (id, includeHash = false) => {
    const numId = Number(id);
    const u = users.find(x => x.user_id === numId);
    if (!u) return null;
    const p = u.party_id ? parties.find(x => x.party_id === u.party_id) : null;
    if (includeHash) {
      return { ...u, org_name: p ? p.party_name : u.requested_org_name || null };
    }
    const { password_hash, ...safeUser } = u;
    return { ...safeUser, org_name: p ? p.party_name : u.requested_org_name || null };
  },

  getUserByEmail: (email) => {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const u = users.find(x => x.email.toLowerCase() === cleanEmail);
    if (!u) return null;
    const p = u.party_id ? parties.find(x => x.party_id === u.party_id) : null;
    return { ...u, org_name: p ? p.party_name : u.requested_org_name || null };
  },

  createUser: (userData) => {
    const nextId = Math.max(...users.map(u => u.user_id), 0) + 1;
    const newUser = {
      user_id: nextId,
      name: userData.name,
      email: userData.email.trim().toLowerCase(),
      password_hash: userData.password_hash,
      role: userData.role || 'PENDING',
      party_id: userData.party_id ? Number(userData.party_id) : null,
      status: userData.status || 'PENDING',
      requested_role: userData.requested_role || userData.role,
      requested_org_name: userData.requested_org_name || null,
      organization_details: userData.organization_details || null,
      created_at: new Date().toISOString().split('T')[0],
      approved_at: userData.approved_at || null,
      approved_by: userData.approved_by || null
    };
    users.push(newUser);
    return mockDbService.getUserById(nextId);
  },

  updateUser: (id, updates) => {
    const numId = Number(id);
    const idx = users.findIndex(u => u.user_id === numId);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates, user_id: numId };
    return mockDbService.getUserById(numId);
  },

  approveUser: (id, { role, party_id, approved_by }) => {
    const numId = Number(id);
    const user = users.find(u => u.user_id === numId);
    if (!user) return null;
    user.status = 'APPROVED';
    if (role) user.role = role;
    if (party_id !== undefined) user.party_id = party_id ? Number(party_id) : null;
    user.approved_at = new Date().toISOString().split('T')[0];
    user.approved_by = approved_by ? Number(approved_by) : 1;
    return mockDbService.getUserById(numId);
  },

  rejectUser: (id, { rejected_by, reason } = {}) => {
    const numId = Number(id);
    const user = users.find(u => u.user_id === numId);
    if (!user) return null;
    user.status = 'REJECTED';
    user.approved_by = rejected_by ? Number(rejected_by) : null;
    user.approved_at = new Date().toISOString().split('T')[0];
    return mockDbService.getUserById(numId);
  },

  setUserStatus: (id, status) => {
    const numId = Number(id);
    const user = users.find(u => u.user_id === numId);
    if (!user) return null;
    user.status = status;
    return mockDbService.getUserById(numId);
  },

  // --------------------------------------------------------------------------
  // AUDIT LOGS (Simulation Storage)
  // --------------------------------------------------------------------------
  createAuditLog: (logData) => {
    const nextId = Math.max(...auditLogs.map(l => l.log_id), 0) + 1;
    const newLog = {
      log_id: nextId,
      user_id: logData.user_id || null,
      user_email: logData.user_email || 'anonymous',
      action: logData.action,
      entity_type: logData.entity_type || null,
      entity_id: logData.entity_id != null ? String(logData.entity_id) : null,
      details: typeof logData.details === 'object' ? JSON.stringify(logData.details) : logData.details,
      ip_address: logData.ip_address || '127.0.0.1',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    auditLogs.push(newLog);
    return newLog;
  },

  getAuditLogs: ({ limit = 50, action, entityType, userId } = {}) => {
    let result = [...auditLogs];
    if (action) {
      result = result.filter(l => l.action.toLowerCase() === action.toLowerCase());
    }
    if (entityType) {
      result = result.filter(l => l.entity_type && l.entity_type.toLowerCase() === entityType.toLowerCase());
    }
    if (userId) {
      result = result.filter(l => l.user_id === Number(userId));
    }
    result.sort((a, b) => b.log_id - a.log_id);
    return result.slice(0, Number(limit)).map(l => ({
      ...l,
      timestamp: l.created_at
    }));
  }

};

module.exports = mockDbService;
