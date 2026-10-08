import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import { Plus, Receipt, RefreshCw, QrCode, UserCheck } from 'lucide-react';

export default function DispensingPage({ onToast }) {
  const [dispensings, setDispensings] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    pharmacy_id: '',
    dispensed_at: new Date().toISOString().split('T')[0],
    patient_id: '',
    quantity: 1,
    package_id: '',
    remarks: 'Verified doctor prescription at retail counter.'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [dRes, phRes, pkgRes] = await Promise.all([
        api.getDispensings(),
        api.getParties('PHARMACY'),
        api.getPackages('DELIVERED') // Available delivered packages
      ]);
      setDispensings(dRes.data);
      setPharmacies(phRes.data);
      setPackages(pkgRes.data);

      if (phRes.data.length > 0 && !formData.pharmacy_id) {
        setFormData(prev => ({ ...prev, pharmacy_id: phRes.data[0].party_id }));
      }
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      pharmacy_id: pharmacies[0]?.party_id || '',
      dispensed_at: new Date().toISOString().split('T')[0],
      patient_id: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
      quantity: 1,
      package_id: packages[0]?.package_id || '',
      remarks: 'Verified doctor prescription at retail counter.'
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createDispensing(formData);
      if (onToast) onToast({ type: 'success', title: 'Dispensing Recorded', message: 'Handover to patient confirmed. Package marked DISPENSED.' });
      setModalOpen(false);
      loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Retail Pharmacy Dispensing Events</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            DISPENSING relation (dispense_id PK, pharmacy_id FK, patient_id, quantity, remarks)
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>Record Counter Dispensing</span>
        </button>
      </div>

      {/* Table */}
      <div className="med-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-forest-700" />
            <span>Loading dispensing records...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full med-table">
              <thead>
                <tr>
                  <th>Dispense ID</th>
                  <th>Dispensing Pharmacy</th>
                  <th>Patient ID</th>
                  <th>Dispensed Drug / Package</th>
                  <th>Units</th>
                  <th>Date</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dispensings.map((d) => (
                  <tr key={d.dispense_id}>
                    <td className="font-bold text-slate-900">#{d.dispense_id}</td>
                    <td className="font-semibold text-slate-800">{d.pharmacy_name}</td>
                    <td>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 flex items-center gap-1 w-fit">
                        <UserCheck className="w-3 h-3 text-forest-700" />
                        <span>{d.patient_id}</span>
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-800">{d.drug_name}</div>
                      {d.qr_code && (
                        <div className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                          <QrCode className="w-3 h-3" />
                          <span>{d.qr_code}</span>
                        </div>
                      )}
                    </td>
                    <td className="font-bold text-forest-900 text-xs">{d.quantity} units</td>
                    <td className="text-xs text-slate-500">{d.dispensed_at}</td>
                    <td className="text-xs text-slate-500 max-w-xs truncate" title={d.remarks}>
                      {d.remarks || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Pharmacy Dispensing"
        subtitle="Patient handover event with serial package verification"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dispensing Pharmacy *</label>
            <select
              required
              value={formData.pharmacy_id}
              onChange={(e) => setFormData({ ...formData, pharmacy_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            >
              {pharmacies.map(p => (
                <option key={p.party_id} value={p.party_id}>
                  #{p.party_id} - {p.party_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Identifier *</label>
              <input
                type="text"
                required
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                placeholder="PAT-1049"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dispensed Units *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Link Serialized Package Unit (Optional)
            </label>
            <select
              value={formData.package_id}
              onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none font-mono"
            >
              <option value="">-- No specific serialized package linked --</option>
              {packages.map(pkg => (
                <option key={pkg.package_id} value={pkg.package_id}>
                  #{pkg.package_id} - {pkg.qr_code} ({pkg.drug_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Remarks</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Record Dispensing
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
