import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, Pill, Search, RefreshCw } from 'lucide-react';

export default function DrugsPage({ onToast }) {
  const [drugs, setDrugs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [formData, setFormData] = useState({
    drug_name: '',
    description: '',
    strength: '',
    dosage_form: 'Film-Coated Tablet'
  });

  const loadDrugs = async () => {
    try {
      setLoading(true);
      const res = await api.getDrugs(search);
      setDrugs(res.data);
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDrugs();
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenAdd = () => {
    setEditItem(null);
    setFormData({ drug_name: '', description: '', strength: '', dosage_form: 'Film-Coated Tablet' });
    setModalOpen(true);
  };

  const handleOpenEdit = (d) => {
    setEditItem(d);
    setFormData({
      drug_name: d.drug_name || '',
      description: d.description || '',
      strength: d.strength || '',
      dosage_form: d.dosage_form || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.updateDrug(editItem.drug_id, formData);
        if (onToast) onToast({ type: 'success', title: 'Updated', message: `Drug #${editItem.drug_id} updated successfully.` });
      } else {
        await api.createDrug(formData);
        if (onToast) onToast({ type: 'success', title: 'Created', message: 'New drug created in catalog.' });
      }
      setModalOpen(false);
      loadDrugs();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Save Failed', message: err.message });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteDrug(id);
      if (onToast) onToast({ type: 'success', title: 'Deleted', message: `Drug #${id} deleted.` });
      setDeleteConfirmId(null);
      loadDrugs();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Delete Failed', message: err.message });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Formulated Drug Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            DRUG relation (drug_id PK, drug_name, description, strength, dosage_form)
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>Add New Drug</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by drug name, formulation, or strength..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="med-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-forest-700" />
            <span>Loading drugs catalog...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full med-table">
              <thead>
                <tr>
                  <th>Drug ID</th>
                  <th>Drug Formulation Name</th>
                  <th>Strength</th>
                  <th>Dosage Form</th>
                  <th>Therapeutic Description</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drugs.map((d) => (
                  <tr key={d.drug_id}>
                    <td className="font-bold text-slate-900">#{d.drug_id}</td>
                    <td className="font-bold text-forest-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-forest-50 text-forest-700 flex items-center justify-center">
                        <Pill className="w-3.5 h-3.5" />
                      </div>
                      <span>{d.drug_name}</span>
                    </td>
                    <td>
                      <span className="font-semibold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {d.strength}
                      </span>
                    </td>
                    <td className="text-xs text-slate-600">{d.dosage_form}</td>
                    <td className="text-xs text-slate-500 max-w-md truncate">{d.description || '—'}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleOpenEdit(d)} className="btn-icon" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirmId(d.drug_id)} className="btn-icon text-rose-500 hover:text-rose-700" title="Delete">
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
        title={editItem ? `Edit Drug #${editItem.drug_id}` : 'Add Formulated Drug'}
        subtitle="Catalog pharmaceutical specification"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Drug Name *</label>
            <input
              type="text"
              required
              value={formData.drug_name}
              onChange={(e) => setFormData({ ...formData, drug_name: e.target.value })}
              placeholder="e.g. Remdesivir (Veklury)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Strength *</label>
              <input
                type="text"
                required
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                placeholder="e.g. 500mg, 100 units/mL"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage Form *</label>
              <input
                type="text"
                required
                value={formData.dosage_form}
                onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                placeholder="e.g. Oral Capsule, Tablet"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Indication</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Therapeutic mechanism, indications, and pharmacodynamics..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editItem ? 'Save Changes' : 'Create Drug'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Drug Deletion"
        subtitle="Referential integrity action"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to delete <strong>Drug #{deleteConfirmId}</strong>? In Oracle, if existing batches reference this drug, foreign key constraints will safeguard the database.
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
