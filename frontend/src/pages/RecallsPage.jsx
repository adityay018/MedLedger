import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, Edit2, Trash2, AlertTriangle, RefreshCw, Zap, ShieldAlert, Search, ArrowUpDown, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

export default function RecallsPage({ onToast }) {
  const [recalls, setRecalls] = useState([]);
  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [impactModalOpen, setImpactModalOpen] = useState(false);
  const [impactData, setImpactData] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Sorting & Pagination
  const [sortField, setSortField] = useState('recall_id');
  const [sortAsc, setSortAsc] = useState(false); // Newest recall first
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [formData, setFormData] = useState({
    recall_date: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'ACTIVE',
    batch_ids: []
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rRes, bRes] = await Promise.all([
        api.getRecalls(),
        api.getBatches()
      ]);
      setRecalls(rRes.data || []);
      setBatches(bRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load recall notices');
      if (onToast) onToast({ type: 'error', title: 'Fetch Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter & Sort
  const filteredAndSortedRecalls = useMemo(() => {
    let list = [...recalls];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => 
        String(r.recall_id).includes(q) ||
        (r.reason && r.reason.toLowerCase().includes(q)) ||
        (r.status && r.status.toLowerCase().includes(q)) ||
        (r.recall_date && r.recall_date.toLowerCase().includes(q))
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
  }, [recalls, search, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRecalls.length / pageSize));
  const paginatedRecalls = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRecalls.slice(start, start + pageSize);
  }, [filteredAndSortedRecalls, currentPage, pageSize]);

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
      recall_date: new Date().toISOString().split('T')[0],
      reason: '',
      status: 'ACTIVE',
      batch_ids: []
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (r) => {
    setEditItem(r);
    setFormData({
      recall_date: r.recall_date,
      reason: r.reason,
      status: r.status,
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
          message: res.message || `Recall #${recallId} executed: Batches and packages quarantined in Oracle.`
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
    if (!formData.reason.trim()) {
      if (onToast) onToast({ type: 'error', title: 'Validation Error', message: 'Recall justification / reason is required.' });
      return;
    }

    try {
      setSubmitting(true);
      if (editItem) {
        await api.updateRecall(editItem.recall_id, {
          reason: formData.reason,
          status: formData.status,
          recall_date: formData.recall_date
        });
        if (onToast) onToast({ type: 'success', title: '✓ Recall updated successfully', message: `Recall #${editItem.recall_id} notice updated in database.` });
      } else {
        await api.createRecall(formData);
        if (onToast) onToast({ type: 'success', title: '✓ Recall notice issued successfully', message: 'Regulatory recall notice published in Oracle database.' });
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
      await api.deleteRecall(id);
      if (onToast) onToast({ type: 'success', title: '✓ Recall deleted successfully', message: `Recall notice #${id} deleted.` });
      setDeleteConfirmId(null);
      loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Cannot Delete Recall', message: err.message });
    } finally {
      setDeleting(false);
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Regulatory Recalls</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            RECALL relation executed with PL/SQL process_recall procedure and recall_impact function
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary" id="add-recall-btn">
          <Plus className="w-4 h-4" />
          <span>+ Add Recall</span>
        </button>
      </div>

      {/* Search Bar & Total */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search Recalls by Reason or Status..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-forest-600 focus:outline-none transition-all shadow-xs"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total Recalls: <span className="font-bold text-slate-900">{recalls.length}</span>
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
            <span>Loading recall notices from database...</span>
          </div>
        ) : paginatedRecalls.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No recall notices found</p>
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
                  <th onClick={() => handleSort('recall_id')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Recall ID</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('recall_date')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Recall Date</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th>Reason / Regulatory Defect</th>
                  <th onClick={() => handleSort('status')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th>Impact & Actions</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRecalls.map((r) => {
                  const isActive = r.status === 'ACTIVE';
                  return (
                    <tr key={r.recall_id} className={`hover:bg-slate-50/80 transition-colors ${isActive ? 'bg-rose-50/20' : ''}`}>
                      <td className="font-bold text-slate-900">#{r.recall_id}</td>
                      <td className="text-xs text-slate-500 font-mono">{r.recall_date}</td>
                      <td className="text-xs font-semibold text-slate-800 max-w-sm truncate" title={r.reason}>
                        <div className="flex items-center gap-1.5">
                          {isActive && <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />}
                          <span>{r.reason}</span>
                        </div>
                      </td>
                      <td>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                            ACTIVE RECALL
                          </span>
                        ) : (
                          <StatusBadge status={r.status} />
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCheckImpact(r.recall_id)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-200"
                            title="Execute PL/SQL recall_impact() function"
                          >
                            Blast Radius
                          </button>
                          <button
                            onClick={() => handleProcessRecall(r.recall_id)}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1"
                            title="Execute PL/SQL process_recall() procedure"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Process</span>
                          </button>
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleOpenEdit(r)} 
                            className="btn-icon hover:text-forest-700" 
                            title="Edit Recall"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmId(r.recall_id)} 
                            className="btn-icon text-rose-500 hover:text-rose-700 hover:bg-rose-50" 
                            title="Delete Recall"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && paginatedRecalls.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * pageSize, filteredAndSortedRecalls.length)}
              </span> of <span className="font-semibold text-slate-800">{filteredAndSortedRecalls.length}</span> notices
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

      {/* Add / Edit Recall Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={editItem ? `Edit Recall #${editItem.recall_id}` : 'Create Recall Notice'}
        subtitle="Publishes regulatory or manufacturer recall in Oracle RECALL relation"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Defect Description *</label>
            <textarea
              required
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Sub-potent active pharmaceutical ingredient detected, Particulate contamination..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Recall Date *</label>
              <input
                type="date"
                required
                value={formData.recall_date}
                onChange={(e) => setFormData({ ...formData, recall_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE (Immediate quarantine)</option>
                <option value="INITIATED">INITIATED (Preliminary notification)</option>
                <option value="INVESTIGATING">INVESTIGATING (Audit in progress)</option>
                <option value="COMPLETED">COMPLETED (Quarantine resolved)</option>
              </select>
            </div>
          </div>

          {!editItem && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Compromised Batches (Optional)
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
          )}

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
                editItem ? 'Save Changes' : 'Publish Recall'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Impact Calculation Modal */}
      <Modal
        isOpen={impactModalOpen}
        onClose={() => setImpactModalOpen(false)}
        title="PL/SQL recall_impact() Function Output"
        subtitle="Computed supply chain quarantine blast radius"
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
              This function dynamically aggregates the total number of compromised manufactured batches and in-circulation package units that must be immediately impounded.
            </p>
            <div className="flex justify-end pt-2">
              <button onClick={() => setImpactModalOpen(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => !deleting && setDeleteConfirmId(null)}
        title="Confirm Recall Deletion"
        subtitle="Referential integrity action"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Safety Notice:</strong> Are you sure you want to delete <strong>Recall #{deleteConfirmId}</strong>?
              If manufactured batches in Oracle are currently linked to this recall notice, deletion will be blocked to maintain audit trails.
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
