import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, AlertTriangle, RefreshCw, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function RecallsPage({ onToast }) {
  const [recalls, setRecalls] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [impactModalOpen, setImpactModalOpen] = useState(false);
  const [impactData, setImpactData] = useState(null);

  const [formData, setFormData] = useState({
    recall_date: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'ACTIVE',
    batch_ids: []
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [rRes, bRes] = await Promise.all([
        api.getRecalls(),
        api.getBatches()
      ]);
      setRecalls(rRes.data);
      setBatches(bRes.data);
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
      recall_date: new Date().toISOString().split('T')[0],
      reason: '',
      status: 'ACTIVE',
      batch_ids: []
    });
    setModalOpen(true);
  };

  const handleProcessRecall = async (recallId) => {
    try {
      const res = await api.processRecall(recallId);
      if (onToast) {
        onToast({
          type: 'success',
          title: 'PL/SQL process_recall Executed',
          message: res.message || `Recall #${recallId} propagated: Affected batches and packages quarantined.`
        });
      }
      loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Procedure Error', message: err.message });
    }
  };

  const handleCheckImpact = async (recallId) => {
    try {
      const res = await api.getRecallImpact(recallId);
      setImpactData(res);
      setImpactModalOpen(true);
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Impact Error', message: err.message });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createRecall(formData);
      if (onToast) onToast({ type: 'success', title: 'Recall Issued', message: 'Regulatory recall notice published.' });
      setModalOpen(false);
      loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const toggleBatch = (bid) => {
    const exists = formData.batch_ids.includes(bid);
    if (exists) {
      setFormData({ ...formData, batch_ids: formData.batch_ids.filter(id => id !== bid) });
    } else {
      setFormData({ ...formData, batch_ids: [...formData.batch_ids, bid] });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Regulatory & Manufacturer Recalls</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            RECALL relation executed with PL/SQL process_recall procedure and recall_impact function
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>Publish Recall Notice</span>
        </button>
      </div>

      {/* Table */}
      <div className="med-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-forest-700" />
            <span>Loading recall notices...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full med-table">
              <thead>
                <tr>
                  <th>Recall ID</th>
                  <th>Date Issued</th>
                  <th>Regulatory Reason / Defect</th>
                  <th>Status</th>
                  <th>Affected Lots</th>
                  <th>Quarantine Impact (PL/SQL)</th>
                  <th className="text-right">PL/SQL Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recalls.map((r) => (
                  <tr key={r.recall_id}>
                    <td className="font-bold text-slate-900">#{r.recall_id}</td>
                    <td className="text-xs text-slate-500">{r.recall_date}</td>
                    <td className="text-xs font-semibold text-slate-800 max-w-md truncate" title={r.reason}>
                      {r.reason}
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      <span className="font-bold text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        {r.affected_batches_count || 0} batches ({r.affected_packages_count || 0} pkgs)
                      </span>
                    </td>
                    <td className="text-xs font-mono text-slate-600 max-w-xs truncate" title={r.impact_summary}>
                      {r.impact_summary || 'N/A'}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleCheckImpact(r.recall_id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                          title="Call recall_impact() function"
                        >
                          Blast Radius
                        </button>
                        <button
                          onClick={() => handleProcessRecall(r.recall_id)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1"
                          title="Execute process_recall() procedure"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Process Recall</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Recall Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Issue Product Recall Notice"
        subtitle="Notifies supply chain participants and locks inventory"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Defect Reason / Regulatory Justification *</label>
            <textarea
              required
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Sub-potent API detected in stability testing, Particulate contamination..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date *</label>
              <input
                type="date"
                required
                value={formData.recall_date}
                onChange={(e) => setFormData({ ...formData, recall_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE (Immediate quarantine)</option>
                <option value="INVESTIGATING">INVESTIGATING (Audit in progress)</option>
                <option value="INITIATED">INITIATED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Compromised Batches (AFFECTS 1:N Relationship)
            </label>
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
              {batches.map(b => (
                <label key={b.batch_id} className="flex items-center gap-2 text-xs text-slate-700 p-1 hover:bg-white rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.batch_ids.includes(b.batch_id)}
                    onChange={() => toggleBatch(b.batch_id)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-semibold">Batch #{b.batch_id} - {b.drug_name}</span>
                  <span className="text-slate-400">({b.batch_status})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Issue Recall Notice
            </button>
          </div>
        </form>
      </Modal>

      {/* Impact Calculation Modal */}
      <Modal
        isOpen={impactModalOpen}
        onClose={() => setImpactModalOpen(false)}
        title="PL/SQL recall_impact() Function Output"
        subtitle="Computed supply chain blast radius"
      >
        {impactData && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-forest-50 border border-forest-200 rounded-xl space-y-2">
              <div className="font-bold text-forest-900 text-sm">Recall Notice #{impactData.recall_id}</div>
              <p className="font-mono text-slate-800 bg-white p-3 rounded-lg border border-forest-100">
                {impactData.impact_summary}
              </p>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              This function computes in real-time the exact count of batches flagged and in-circulation package serials that must be immediately quarantined across the entire wholesale and retail network.
            </p>
            <div className="flex justify-end pt-2">
              <button onClick={() => setImpactModalOpen(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
