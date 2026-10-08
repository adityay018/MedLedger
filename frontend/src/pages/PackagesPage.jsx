import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, Edit2, Trash2, Package, Search, RefreshCw, QrCode, ShieldCheck } from 'lucide-react';

export default function PackagesPage({ onToast, onNavigateToVerify }) {
  const [packages, setPackages] = useState([]);
  const [batches, setBatches] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [qrSearch, setQrSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [formData, setFormData] = useState({
    batch_id: '',
    package_size: '10 Vials / Box',
    qr_code: '',
    status: 'PACKAGED',
    quantity_total: 10
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, bRes] = await Promise.all([
        api.getPackages(statusFilter, qrSearch),
        api.getBatches()
      ]);
      setPackages(pRes.data);
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
    const timer = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(timer);
  }, [statusFilter, qrSearch]);

  const handleOpenAdd = () => {
    setEditItem(null);
    setFormData({
      batch_id: batches[0]?.batch_id || '',
      package_size: '10 Vials / Box',
      qr_code: `QR-MED-${batches[0]?.batch_id || 202}-${Date.now().toString().slice(-4)}`,
      status: 'PACKAGED',
      quantity_total: 10
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditItem(p);
    setFormData({
      batch_id: p.batch_id,
      package_size: p.package_size,
      qr_code: p.qr_code,
      status: p.status,
      quantity_total: p.quantity_total
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.updatePackage(editItem.package_id, formData);
        if (onToast) onToast({ type: 'success', title: 'Updated', message: `Package #${editItem.package_id} updated.` });
      } else {
        await api.createPackage(formData);
        if (onToast) onToast({ type: 'success', title: 'Serialized', message: 'New package serialized with unique QR code.' });
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Save Failed', message: err.message });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deletePackage(id);
      if (onToast) onToast({ type: 'success', title: 'Deleted', message: `Package #${id} deleted.` });
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Serialized Units & QR Packages</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            PACKAGE relation (package_id PK, qr_code UNIQUE, batch_id FK, status, quantity_total)
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>Serialize New Package</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={qrSearch}
            onChange={(e) => setQrSearch(e.target.value)}
            placeholder="Search QR code..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-forest-600 focus:outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
          {['', 'PACKAGED', 'IN_TRANSIT', 'DELIVERED', 'DISPENSED', 'RECALLED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                statusFilter === s
                  ? 'bg-forest-800 text-white border-forest-800 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s ? s.replace(/_/g, ' ') : 'All Packages'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="med-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-forest-700" />
            <span>Loading packages...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full med-table">
              <thead>
                <tr>
                  <th>Pkg ID</th>
                  <th>QR Code Serial Key</th>
                  <th>Drug & Batch</th>
                  <th>Packaging Size</th>
                  <th>Units</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {packages.map((p) => (
                  <tr key={p.package_id}>
                    <td className="font-bold text-slate-900">#{p.package_id}</td>
                    <td>
                      <div className="font-mono text-xs font-semibold text-forest-900 flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-forest-700" />
                        <span>{p.qr_code}</span>
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-800">{p.drug_name}</div>
                      <div className="text-xs text-slate-400">Batch #{p.batch_id}</div>
                    </td>
                    <td className="text-xs text-slate-600">{p.package_size}</td>
                    <td className="text-xs font-bold text-slate-800">{p.quantity_total}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onNavigateToVerify && onNavigateToVerify(p.qr_code)}
                          className="btn-icon text-emerald-600 hover:text-emerald-800"
                          title="Verify Anti-Counterfeit Status"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenEdit(p)} className="btn-icon" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirmId(p.package_id)} className="btn-icon text-rose-500 hover:text-rose-700" title="Delete">
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
        title={editItem ? `Edit Package #${editItem.package_id}` : 'Serialize New Package'}
        subtitle="Individual unit digital cryptographic serialization"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {!editItem && (
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
                    Batch #{b.batch_id} - {b.drug_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Package Size Specification *</label>
            <input
              type="text"
              required
              value={formData.package_size}
              onChange={(e) => setFormData({ ...formData, package_size: e.target.value })}
              placeholder="e.g. 10 Vials / Box, 30 Tablets"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Unique QR Code Serial Key *</label>
            <input
              type="text"
              required
              value={formData.qr_code}
              onChange={(e) => setFormData({ ...formData, qr_code: e.target.value })}
              placeholder="QR-MED-..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Unit Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity_total}
                onChange={(e) => setFormData({ ...formData, quantity_total: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Package Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              >
                <option value="PACKAGED">PACKAGED</option>
                <option value="IN_TRANSIT">IN_TRANSIT</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="DISPENSED">DISPENSED</option>
                <option value="RECALLED">RECALLED</option>
                <option value="TAMPERED">TAMPERED</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editItem ? 'Save Changes' : 'Serialize Package'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Package Deletion"
        subtitle="Referential integrity action"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to delete <strong>Package #{deleteConfirmId}</strong>? Deleting this unit will also clean up associated CONTAINS shipment bridge links.
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
