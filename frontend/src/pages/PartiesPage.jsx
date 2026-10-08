import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, Users, Search, RefreshCw, Building } from 'lucide-react';

export default function PartiesPage({ onToast }) {
  const [parties, setParties] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    party_name: '',
    address: '',
    phone: '',
    email: '',
    role: 'MANUFACTURER',
    manufacturing_license_no: '',
    distributor_license_no: '',
    pharmacy_license_no: '',
    hq: '',
    regulator_code: ''
  });

  const loadParties = async () => {
    try {
      setLoading(true);
      const res = await api.getParties(roleFilter);
      setParties(res.data);
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, [roleFilter]);

  const handleOpenAdd = () => {
    setEditItem(null);
    setFormData({
      party_name: '',
      address: '',
      phone: '',
      email: '',
      role: 'MANUFACTURER',
      manufacturing_license_no: '',
      distributor_license_no: '',
      pharmacy_license_no: '',
      hq: '',
      regulator_code: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditItem(p);
    setFormData({
      party_name: p.party_name || '',
      address: p.address || '',
      phone: p.phone || '',
      email: p.email || '',
      role: p.role || 'MANUFACTURER',
      manufacturing_license_no: p.manufacturing_license_no || '',
      distributor_license_no: p.distributor_license_no || '',
      pharmacy_license_no: p.pharmacy_license_no || '',
      hq: p.hq || '',
      regulator_code: p.regulator_code || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.updateParty(editItem.party_id, formData);
        if (onToast) onToast({ type: 'success', title: 'Updated', message: `Party #${editItem.party_id} updated.` });
      } else {
        await api.createParty(formData);
        if (onToast) onToast({ type: 'success', title: 'Created', message: `New party created successfully.` });
      }
      setModalOpen(false);
      loadParties();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Save Failed', message: err.message });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteParty(id);
      if (onToast) onToast({ type: 'success', title: 'Deleted', message: `Party #${id} deleted.` });
      setDeleteConfirmId(null);
      loadParties();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Delete Failed', message: err.message });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Supply Chain Parties</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            EER Specialization (PARTY Superclass → MANUFACTURER, DISTRIBUTOR, PHARMACY, REGULATOR Subclasses)
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>Add New Party</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['', 'MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY', 'REGULATOR'].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              roleFilter === r
                ? 'bg-forest-800 text-white border-forest-800 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {r || 'All Roles'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="med-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-forest-700" />
            <span>Loading parties...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full med-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Organization Name</th>
                  <th>Role (Subclass)</th>
                  <th>Licence / Code</th>
                  <th>Address</th>
                  <th>Contact Info</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parties.map((p) => (
                  <tr key={p.party_id}>
                    <td className="font-bold text-slate-900">#{p.party_id}</td>
                    <td className="font-semibold text-slate-800">{p.party_name}</td>
                    <td>
                      <span className={`badge ${
                        p.role === 'MANUFACTURER' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        p.role === 'DISTRIBUTOR' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        p.role === 'PHARMACY' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-600">
                      {p.manufacturing_license_no || p.distributor_license_no || p.pharmacy_license_no || p.regulator_code || '—'}
                    </td>
                    <td className="text-xs text-slate-500 max-w-xs truncate">{p.address}</td>
                    <td className="text-xs text-slate-500">
                      <div>{p.phone}</div>
                      <div className="text-slate-400">{p.email}</div>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleOpenEdit(p)} className="btn-icon" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirmId(p.party_id)} className="btn-icon text-rose-500 hover:text-rose-700" title="Delete">
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
        title={editItem ? `Edit Party #${editItem.party_id}` : 'Register New Party'}
        subtitle="Party Superclass and Subclass ISA hierarchy"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Name *</label>
            <input
              type="text"
              required
              value={formData.party_name}
              onChange={(e) => setFormData({ ...formData, party_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          {!editItem && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Party Role (Subclass) *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              >
                <option value="MANUFACTURER">MANUFACTURER</option>
                <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                <option value="PHARMACY">PHARMACY</option>
                <option value="REGULATOR">REGULATOR</option>
              </select>
            </div>
          )}

          {formData.role === 'MANUFACTURER' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturing Licence No</label>
              <input
                type="text"
                value={formData.manufacturing_license_no}
                onChange={(e) => setFormData({ ...formData, manufacturing_license_no: e.target.value })}
                placeholder="MFG-USA-FDA-2026-..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
          )}

          {formData.role === 'PHARMACY' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pharmacy Licence No</label>
                <input
                  type="text"
                  value={formData.pharmacy_license_no}
                  onChange={(e) => setFormData({ ...formData, pharmacy_license_no: e.target.value })}
                  placeholder="PHM-IND-..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">HQ Location</label>
                <input
                  type="text"
                  value={formData.hq}
                  onChange={(e) => setFormData({ ...formData, hq: e.target.value })}
                  placeholder="HQ Office"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editItem ? 'Save Changes' : 'Create Party'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Party Deletion"
        subtitle="Referential integrity action"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to delete <strong>Party #{deleteConfirmId}</strong>? In Oracle, cascading foreign keys will remove associated subclass records.
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
