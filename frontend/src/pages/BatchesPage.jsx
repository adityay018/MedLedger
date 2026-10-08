import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, Edit2, Trash2, Layers, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function BatchesPage({ onToast }) {
  const [batches, setBatches] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [formData, setFormData] = useState({
    drug_id: '',
    manufacturer_id: '',
    manufacture_date: new Date().toISOString().split('T')[0],
    batch_status: 'RELEASED'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [batchRes, drugRes, mfgRes] = await Promise.all([
        api.getBatches(statusFilter),
        api.getDrugs(),
        api.getParties('MANUFACTURER')
      ]);
      setBatches(batchRes.data);
      setDrugs(drugRes.data);
      setManufacturers(mfgRes.data);
      if (drugRes.data.length > 0 && !formData.drug_id) {
        setFormData(prev => ({ ...prev, drug_id: drugRes.data[0].drug_id }));
      }
      if (mfgRes.data.length > 0 && !formData.manufacturer_id) {
        setFormData(prev => ({ ...prev, manufacturer_id: mfgRes.data[0].party_id }));
      }
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleOpenAdd = () => {
    setEditItem(null);
    setFormData({
      drug_id: drugs[0]?.drug_id || '',
      manufacturer_id: manufacturers[0]?.party_id || '',
      manufacture_date: new Date().toISOString().split('T')[0],
      batch_status: 'RELEASED'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditItem(b);
    setFormData({
      drug_id: b.drug_id,
      manufacturer_id: b.manufacturer_id,
      manufacture_date: b.manufacture_date,
      batch_status: b.batch_status
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.updateBatch(editItem.batch_id, { batch_status: formData.batch_status });
        if (onToast) onToast({ type: 'success', title: 'Updated', message: `Batch #${editItem.batch_id} updated.` });
      } else {
        const res = await api.createBatch(formData);
        if (onToast) onToast({ type: 'success', title: 'Batch Registered', message: res.message || 'Batch created successfully via register_batch.' });
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Operation Failed', message: err.message });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteBatch(id);
      if (onToast) onToast({ type: 'success', title: 'Deleted', message: `Batch #${id} deleted.` });
      setDeleteConfirmId(null);
      loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Delete Failed', message: err.message });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manufactured Lots & Batches</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            BATCH relation managed via PL/SQL register_batch procedure with referential checks
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>Register New Batch</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['', 'RELEASED', 'IN_TRANSIT', 'QUARANTINED', 'RECALLED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              statusFilter === s
                ? 'bg-forest-800 text-white border-forest-800 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s ? s.replace(/_/g, ' ') : 'All Batches'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="med-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-forest-700" />
            <span>Loading batch lots...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full med-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Drug Product</th>
                  <th>Manufacturer</th>
                  <th>Manufacture Date</th>
                  <th>Batch Status</th>
                  <th>Recall Association</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b.batch_id}>
                    <td className="font-bold text-slate-900">#{b.batch_id}</td>
                    <td>
                      <div className="font-semibold text-slate-800">{b.drug_name}</div>
                      <div className="text-xs text-slate-400">{b.strength} - {b.dosage_form}</div>
                    </td>
                    <td className="text-xs text-slate-600 font-medium">{b.manufacturer_name}</td>
                    <td className="text-xs text-slate-500">{b.manufacture_date}</td>
                    <td>
                      <StatusBadge status={b.batch_status} />
                    </td>
                    <td>
                      {b.recall_id ? (
                        <div className="flex items-center gap-1.5 text-xs text-rose-700 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                          <span className="truncate max-w-[160px]" title={b.recall_reason}>
                            Recall #{b.recall_id}: {b.recall_reason}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleOpenEdit(b)} className="btn-icon" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirmId(b.batch_id)} className="btn-icon text-rose-500 hover:text-rose-700" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? `Edit Batch #${editItem.batch_id}` : 'Register Batch (PL/SQL)'}
        subtitle="Invokes PL/SQL register_batch procedure"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {!editItem ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Drug *</label>
                <select
                  required
                  value={formData.drug_id}
                  onChange={(e) => setFormData({ ...formData, drug_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
                >
                  {drugs.map(d => (
                    <option key={d.drug_id} value={d.drug_id}>
                      #{d.drug_id} - {d.drug_name} ({d.strength})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Licensed Manufacturer *</label>
                <select
                  required
                  value={formData.manufacturer_id}
                  onChange={(e) => setFormData({ ...formData, manufacturer_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
                >
                  {manufacturers.map(m => (
                    <option key={m.party_id} value={m.party_id}>
                      #{m.party_id} - {m.party_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacture Date *</label>
                <input
                  type="date"
                  required
                  value={formData.manufacture_date}
                  onChange={(e) => setFormData({ ...formData, manufacture_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
                >
                </input>
              </div>
            </>
          ) : (
            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div><strong>Drug:</strong> {editItem.drug_name}</div>
              <div><strong>Manufacturer:</strong> {editItem.manufacturer_name}</div>
              <div><strong>Date:</strong> {editItem.manufacture_date}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Life-Cycle Status *</label>
            <select
              value={formData.batch_status}
              onChange={(e) => setFormData({ ...formData, batch_status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            >
              <option value="RELEASED">RELEASED (Approved for market distribution)</option>
              <option value="IN_TRANSIT">IN_TRANSIT (In logistics network)</option>
              <option value="QUARANTINED">QUARANTINED (Under investigation)</option>
              <option value="RECALLED">RECALLED (Cascade recall trigger)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editItem ? 'Save Changes' : 'Execute register_batch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Batch Deletion"
        subtitle="Referential integrity action"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to delete <strong>Batch #{deleteConfirmId}</strong>? Deleting a batch will cascade to related quality tests and require package verification updates.
          </p>
          <div className="flex justify-end gap-2 pt-3">
            <button onClick={() => setDeleteConfirmId(null)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={() => handleDelete(deleteConfirmId)} className="btn-danger">
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
