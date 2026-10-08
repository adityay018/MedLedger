import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, FlaskConical, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

export default function QualityTestsPage({ onToast }) {
  const [tests, setTests] = useState([]);
  const [batches, setBatches] = useState([]);
  const [batchFilter, setBatchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    batch_id: '',
    test_date: new Date().toISOString().split('T')[0],
    test_type: 'HPLC Assay',
    result: '99.5% API Potency',
    status: 'PASSED'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, bRes] = await Promise.all([
        api.getQualityTests(batchFilter),
        api.getBatches()
      ]);
      setTests(tRes.data);
      setBatches(bRes.data);
      if (bRes.data.length > 0 && !formData.batch_id) {
        setFormData(prev => ({ ...prev, batch_id: bRes.data[0].batch_id }));
      }
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [batchFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createQualityTest(formData);
      if (onToast) onToast({ type: 'success', title: 'Test Logged', message: 'New laboratory quality test recorded.' });
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laboratory Quality Assurance Tests</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            QUALITY_TEST relation (test_id PK, batch_id FK, test_date, test_type, result, status)
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>Log Laboratory Assay</span>
        </button>
      </div>

      {/* Filter by Batch */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-500">Filter by Batch:</span>
        <select
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-forest-600"
        >
          <option value="">All Batches</option>
          {batches.map(b => (
            <option key={b.batch_id} value={b.batch_id}>
              Batch #{b.batch_id} ({b.drug_name})
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="med-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-forest-700" />
            <span>Loading lab test assay records...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full med-table">
              <thead>
                <tr>
                  <th>Test ID</th>
                  <th>Batch Lot</th>
                  <th>Drug Formulation</th>
                  <th>Test Date</th>
                  <th>Assay Type</th>
                  <th>Analytical Result</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tests.map((t) => (
                  <tr key={t.test_id}>
                    <td className="font-bold text-slate-900">#{t.test_id}</td>
                    <td className="font-semibold text-slate-800">Batch #{t.batch_id}</td>
                    <td className="text-slate-600 text-xs">{t.drug_name}</td>
                    <td className="text-xs text-slate-500">{t.test_date}</td>
                    <td>
                      <span className="font-medium text-xs text-slate-800">{t.test_type}</span>
                    </td>
                    <td className="text-xs font-mono text-slate-600 max-w-sm truncate" title={t.result}>
                      {t.result}
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
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
        title="Log Quality Control Test"
        subtitle="Batch analytical assay and stability inspection"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Batch *</label>
            <select
              required
              value={formData.batch_id}
              onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            >
              {batches.map(b => (
                <option key={b.batch_id} value={b.batch_id}>
                  Batch #{b.batch_id} - {b.drug_name} ({b.batch_status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assay Date *</label>
              <input
                type="date"
                required
                value={formData.test_date}
                onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assay Type *</label>
              <input
                type="text"
                required
                value={formData.test_type}
                onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                placeholder="e.g. HPLC Assay, Sterility Test"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quantitative / Qualitative Result *</label>
            <input
              type="text"
              required
              value={formData.result}
              onChange={(e) => setFormData({ ...formData, result: e.target.value })}
              placeholder="e.g. 99.8% Potency, No microbial growth"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Inspection Outcome *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            >
              <option value="PASSED">PASSED (Compliant with pharmacopeia standards)</option>
              <option value="FAILED">FAILED (Non-compliant, triggers quarantine/recall)</option>
              <option value="PENDING">PENDING (Incubation / long-term stability)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Log Test Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
