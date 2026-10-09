import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, Edit2, Trash2, Layers, RefreshCw, AlertTriangle, Search, ArrowUpDown, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

export default function BatchesPage({ onToast }) {
  const [batches, setBatches] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [recalls, setRecalls] = useState([]);
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
  const [sortField, setSortField] = useState('batch_id');
  const [sortAsc, setSortAsc] = useState(false); // Newest batch first by default
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [formData, setFormData] = useState({
    drug_id: '',
    manufacturer_id: '',
    manufacture_date: new Date().toISOString().split('T')[0],
    batch_status: 'RELEASED',
    recall_id: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [batchRes, drugRes, mfgRes, recallRes] = await Promise.all([
        api.getBatches(statusFilter),
        api.getDrugs(),
        api.getParties('MANUFACTURER'),
        api.getRecalls()
      ]);
      setBatches(batchRes.data || []);
      setDrugs(drugRes.data || []);
      setManufacturers(mfgRes.data || []);
      setRecalls(recallRes.data || []);

      if (drugRes.data?.length > 0 && !formData.drug_id) {
        setFormData(prev => ({ ...prev, drug_id: drugRes.data[0].drug_id }));
      }
      if (mfgRes.data?.length > 0 && !formData.manufacturer_id) {
        setFormData(prev => ({ ...prev, manufacturer_id: mfgRes.data[0].party_id }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load batches');
      if (onToast) onToast({ type: 'error', title: 'Fetch Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Client-side Filter & Sort
  const filteredAndSortedBatches = useMemo(() => {
    let list = [...batches];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b => 
        String(b.batch_id).includes(q) ||
        (b.drug_name && b.drug_name.toLowerCase().includes(q)) ||
        (b.manufacturer_name && b.manufacturer_name.toLowerCase().includes(q)) ||
        (b.batch_status && b.batch_status.toLowerCase().includes(q)) ||
        (b.recall_reason && b.recall_reason.toLowerCase().includes(q))
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
  }, [batches, search, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedBatches.length / pageSize));
  const paginatedBatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedBatches.slice(start, start + pageSize);
  }, [filteredAndSortedBatches, currentPage, pageSize]);

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
    setFormData({
      drug_id: drugs[0]?.drug_id || '',
      manufacturer_id: manufacturers[0]?.party_id || '',
      manufacture_date: new Date().toISOString().split('T')[0],
      batch_status: 'RELEASED',
      recall_id: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditItem(b);
    setFormData({
      drug_id: b.drug_id,
      manufacturer_id: b.manufacturer_id,
      manufacture_date: b.manufacture_date,
      batch_status: b.batch_status,
      recall_id: b.recall_id ? String(b.recall_id) : ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.drug_id || !formData.manufacturer_id) {
      if (onToast) onToast({ type: 'error', title: 'Validation Error', message: 'Drug and Manufacturer selections are required.' });
      return;
    }

    try {
      setSubmitting(true);
      if (editItem) {
        await api.updateBatch(editItem.batch_id, {
          batch_status: formData.batch_status,
          recall_id: formData.recall_id ? Number(formData.recall_id) : null
        });
        if (onToast) onToast({ type: 'success', title: '✓ Batch updated successfully', message: `Batch #${editItem.batch_id} record updated.` });
      } else {
        const payload = {
          drug_id: Number(formData.drug_id),
          manufacturer_id: Number(formData.manufacturer_id),
          manufacture_date: formData.manufacture_date,
          batch_status: formData.batch_status,
          recall_id: formData.recall_id ? Number(formData.recall_id) : null
        };
        const res = await api.createBatch(payload);
        if (onToast) onToast({ type: 'success', title: '✓ Batch registered successfully', message: res.message || 'Batch lot safely registered via PL/SQL register_batch.' });
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
      await api.deleteBatch(id);
      if (onToast) onToast({ type: 'success', title: '✓ Batch deleted successfully', message: `Batch #${id} deleted from database.` });
      setDeleteConfirmId(null);
      loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Cannot Delete Batch', message: err.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manufactured Batches</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            BATCH relation (batch_id PK, drug_id FK, manufacturer_id FK, recall_id FK, batch_status, manufacture_date)
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary" id="add-batch-btn">
          <Plus className="w-4 h-4" />
          <span>+ Add Batch</span>
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
            placeholder="Search Batches..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-forest-600 focus:outline-none transition-all shadow-xs"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
          {['', 'RELEASED', 'IN_TRANSIT', 'QUARANTINED', 'RECALLED'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setCurrentPage(1);
              }}
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
            <span>Loading batch records from database...</span>
          </div>
        ) : paginatedBatches.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Layers className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No batches found matching filter</p>
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
                  <th onClick={() => handleSort('batch_id')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Batch ID</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('drug_name')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Drug</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('manufacturer_name')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Manufacturer</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('manufacture_date')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Manufacture Date</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('batch_status')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Batch Status</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th>Recall Association</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedBatches.map((b) => (
                  <tr key={b.batch_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="font-bold text-slate-900">#{b.batch_id}</td>
                    <td>
                      <div className="font-semibold text-slate-800">{b.drug_name}</div>
                      <div className="text-xs text-slate-400">{b.strength} - {b.dosage_form}</div>
                    </td>
                    <td className="text-xs text-slate-600 font-medium">{b.manufacturer_name}</td>
                    <td className="text-xs text-slate-500 font-mono">{b.manufacture_date}</td>
                    <td>
                      <StatusBadge status={b.batch_status} />
                    </td>
                    <td>
                      {b.recall_id ? (
                        <div className="flex items-center gap-1.5 text-xs text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded border border-rose-200 w-fit">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                          <span className="truncate max-w-[150px]" title={b.recall_reason || `Recall #${b.recall_id}`}>
                            Recall #{b.recall_id}: {b.recall_reason || 'Quarantined'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleOpenEdit(b)} 
                          className="btn-icon hover:text-forest-700" 
                          title="Edit Batch"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(b.batch_id)} 
                          className="btn-icon text-rose-500 hover:text-rose-700 hover:bg-rose-50" 
                          title="Delete Batch"
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
        {!loading && paginatedBatches.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * pageSize, filteredAndSortedBatches.length)}
              </span> of <span className="font-semibold text-slate-800">{filteredAndSortedBatches.length}</span> batches
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

      {/* Add / Edit Batch Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={editItem ? `Edit Batch #${editItem.batch_id}` : 'Register Manufactured Batch'}
        subtitle="Invokes PL/SQL register_batch procedure with referential checks"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {!editItem ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Drug (DRUG Dropdown) *</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Licensed Manufacturer (MANUFACTURER Dropdown) *</label>
                <select
                  required
                  value={formData.manufacturer_id}
                  onChange={(e) => setFormData({ ...formData, manufacturer_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
                >
                  {manufacturers.map(m => (
                    <option key={m.party_id} value={m.party_id}>
                      #{m.party_id} - {m.party_name} ({m.manufacturing_license_no || 'Licensed'})
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none font-mono"
                />
              </div>
            </>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div><strong>Drug:</strong> {editItem.drug_name} ({editItem.strength})</div>
              <div><strong>Manufacturer:</strong> {editItem.manufacturer_name}</div>
              <div><strong>Date:</strong> {editItem.manufacture_date}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Lifecycle Status *</label>
            <select
              value={formData.batch_status}
              onChange={(e) => setFormData({ ...formData, batch_status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            >
              <option value="RELEASED">RELEASED (Approved for market distribution)</option>
              <option value="IN_TRANSIT">IN_TRANSIT (In logistics network)</option>
              <option value="QUARANTINED">QUARANTINED (Under lab assay review)</option>
              <option value="RECALLED">RECALLED (Compromised / regulatory pull)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Recall Association (Recall Dropdown)</label>
            <select
              value={formData.recall_id}
              onChange={(e) => setFormData({ ...formData, recall_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            >
              <option value="">-- None / Not Recalled --</option>
              {recalls.map(r => (
                <option key={r.recall_id} value={r.recall_id}>
                  Recall #{r.recall_id} - {r.reason} ({r.status})
                </option>
              ))}
            </select>
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
                  <span>Processing...</span>
                </>
              ) : (
                editItem ? 'Save Changes' : 'Execute register_batch'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => !deleting && setDeleteConfirmId(null)}
        title="Confirm Batch Deletion"
        subtitle="Referential integrity validation"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Safety Notice:</strong> Are you sure you want to delete <strong>Batch #{deleteConfirmId}</strong>?
              If packages exist referencing this batch in Oracle, the foreign key constraint protects the database from orphan serialized packages.
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
