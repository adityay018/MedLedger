import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, Edit2, Trash2, Package, Search, RefreshCw, QrCode, ShieldCheck, ArrowUpDown, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

export default function PackagesPage({ onToast, onNavigateToVerify }) {
  const [packages, setPackages] = useState([]);
  const [batches, setBatches] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Sorting & Pagination
  const [sortField, setSortField] = useState('package_id');
  const [sortAsc, setSortAsc] = useState(false); // Newest package first
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

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
      setError(null);
      const [pRes, bRes] = await Promise.all([
        api.getPackages(statusFilter),
        api.getBatches()
      ]);
      setPackages(pRes.data || []);
      setBatches(bRes.data || []);
      if (bRes.data?.length > 0 && !formData.batch_id) {
        setFormData(prev => ({ ...prev, batch_id: bRes.data[0].batch_id }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load packages');
      if (onToast) onToast({ type: 'error', title: 'Fetch Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Client-side Filter & Sort
  const filteredAndSortedPackages = useMemo(() => {
    let list = [...packages];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => 
        String(p.package_id).includes(q) ||
        (p.qr_code && p.qr_code.toLowerCase().includes(q)) ||
        (p.drug_name && p.drug_name.toLowerCase().includes(q)) ||
        String(p.batch_id).includes(q) ||
        (p.status && p.status.toLowerCase().includes(q)) ||
        (p.package_size && p.package_size.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [packages, search, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedPackages.length / pageSize));
  const paginatedPackages = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedPackages.slice(start, start + pageSize);
  }, [filteredAndSortedPackages, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleOpenAdd = () => {
    setEditItem(null);
    const targetBatch = batches[0]?.batch_id || 202;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      batch_id: targetBatch,
      package_size: '10 Vials / Box',
      qr_code: `QR-MED-${targetBatch}-${randomSuffix}`,
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

  const handleBatchChangeInForm = (selectedBatchId) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      ...formData,
      batch_id: selectedBatchId,
      qr_code: `QR-MED-${selectedBatchId}-${randomSuffix}`
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.batch_id || !formData.package_size || !formData.quantity_total) {
      if (onToast) onToast({ type: 'error', title: 'Validation Error', message: 'Batch, Package Size, and Total Quantity are required.' });
      return;
    }

    try {
      setSubmitting(true);
      if (editItem) {
        await api.updatePackage(editItem.package_id, formData);
        if (onToast) onToast({ type: 'success', title: '✓ Package updated successfully', message: `Package #${editItem.package_id} updated.` });
      } else {
        await api.createPackage(formData);
        if (onToast) onToast({ type: 'success', title: '✓ Package serialized successfully', message: 'New package serialized with verifiable unique QR code.' });
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Operation Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeleting(true);
      await api.deletePackage(id);
      if (onToast) onToast({ type: 'success', title: '✓ Package deleted successfully', message: `Package #${id} deleted from database.` });
      setDeleteConfirmId(null);
      loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Cannot Delete Package', message: err.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Serialized Packages & Units</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            PACKAGE relation (package_id PK, qr_code UNIQUE, batch_id FK, package_size, packaged_at, status, quantity_total)
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary" id="add-package-btn">
          <Plus className="w-4 h-4" />
          <span>+ Add Package</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search Packages by QR, Drug, or Batch..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-forest-600 focus:outline-none transition-all shadow-xs"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
          {['', 'PACKAGED', 'IN_TRANSIT', 'DELIVERED', 'DISPENSED', 'RECALLED'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setCurrentPage(1);
              }}
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

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={loadData} className="btn-secondary text-xs">Retry</button>
        </div>
      )}

      {/* Table Card */}
      <div className="med-card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-forest-700" />
            <span>Loading packages from database...</span>
          </div>
        ) : paginatedPackages.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Package className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No packages found matching search</p>
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="text-xs text-forest-700 hover:text-forest-900 font-semibold underline"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full med-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('package_id')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Package ID</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('batch_id')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Batch</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('package_size')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Package Size</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('packaged_at')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Packaged At</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('qr_code')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>QR Code</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('status')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('quantity_total')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Quantity</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPackages.map((p) => (
                  <tr key={p.package_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="font-bold text-slate-900">#{p.package_id}</td>
                    <td>
                      <div className="font-semibold text-slate-800">{p.drug_name || 'Drug'}</div>
                      <div className="text-xs text-slate-400">Batch #{p.batch_id}</div>
                    </td>
                    <td className="text-xs text-slate-600 font-medium">{p.package_size}</td>
                    <td className="text-xs text-slate-500 font-mono">{p.packaged_at || '—'}</td>
                    <td>
                      <div className="font-mono text-xs font-semibold text-forest-900 flex items-center gap-1.5 bg-forest-50 px-2.5 py-1 rounded-md border border-forest-200/60 w-fit">
                        <QrCode className="w-3.5 h-3.5 text-forest-700 flex-shrink-0" />
                        <span>{p.qr_code}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="text-xs font-bold text-slate-800">{p.quantity_total}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onNavigateToVerify && onNavigateToVerify(p.qr_code)}
                          className="btn-icon text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                          title="Verify Anti-Counterfeit Status"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(p)} 
                          className="btn-icon hover:text-forest-700" 
                          title="Edit Package"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(p.package_id)} 
                          className="btn-icon text-rose-500 hover:text-rose-700 hover:bg-rose-50" 
                          title="Delete Package"
                        >
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

        {/* Pagination Footer */}
        {!loading && paginatedPackages.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * pageSize, filteredAndSortedPackages.length)}
              </span> of <span className="font-semibold text-slate-800">{filteredAndSortedPackages.length}</span> packages
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1 rounded border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1 rounded border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Package Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={editItem ? `Edit Package #${editItem.package_id}` : 'Serialize Package'}
        subtitle="Individual unit digital cryptographic serialization in Oracle PACKAGE relation"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {!editItem && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Batch (Batch Dropdown) *</label>
              <select
                required
                value={formData.batch_id}
                onChange={(e) => handleBatchChangeInForm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              >
                {batches.map(b => (
                  <option key={b.batch_id} value={b.batch_id}>
                    Batch #{b.batch_id} - {b.drug_name} ({b.batch_status})
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Generated QR Code Serial Key *</label>
            <input
              type="text"
              required
              value={formData.qr_code}
              onChange={(e) => setFormData({ ...formData, qr_code: e.target.value })}
              placeholder="QR-MED-..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-forest-600 focus:outline-none bg-slate-50"
            />
            <p className="text-[11px] text-slate-400 mt-1">Unique QR key generated automatically for verification</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Quantity *</label>
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
            <button 
              type="button" 
              disabled={submitting}
              onClick={() => setModalOpen(false)} 
              className="btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                editItem ? 'Save Changes' : 'Serialize Package'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => !deleting && setDeleteConfirmId(null)}
        title="Confirm Package Deletion"
        subtitle="Referential integrity validation"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Safety Notice:</strong> Are you sure you want to delete <strong>Package #{deleteConfirmId}</strong>?
              If this package has already been dispensed to a patient, deletion will be rejected to protect pharmacovigilance tracking.
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button 
              disabled={deleting}
              onClick={() => setDeleteConfirmId(null)} 
              className="btn-secondary"
            >
              Cancel
            </button>
            <button 
              disabled={deleting}
              onClick={() => handleDelete(deleteConfirmId)} 
              className="btn-danger"
            >
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
