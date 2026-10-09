import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, Pill, Search, RefreshCw, ArrowUpDown, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

export default function DrugsPage({ onToast }) {
  const [drugs, setDrugs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Sorting & Pagination
  const [sortField, setSortField] = useState('drug_id');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [formData, setFormData] = useState({
    drug_name: '',
    description: '',
    strength: '',
    dosage_form: 'Film-Coated Tablet'
  });

  const loadDrugs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDrugs(search);
      setDrugs(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load drugs catalogue');
      if (onToast) onToast({ type: 'error', title: 'Fetch Failed', message: err.message });
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

  // Client-side Sorting & Filtering
  const sortedDrugs = useMemo(() => {
    const copy = [...drugs];
    copy.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
    return copy;
  }, [drugs, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedDrugs.length / pageSize));
  const paginatedDrugs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedDrugs.slice(start, start + pageSize);
  }, [sortedDrugs, currentPage, pageSize]);

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
    if (!formData.drug_name.trim() || !formData.strength.trim() || !formData.dosage_form.trim()) {
      if (onToast) onToast({ type: 'error', title: 'Validation Error', message: 'Drug Name, Strength, and Dosage Form are required fields.' });
      return;
    }

    try {
      setSubmitting(true);
      if (editItem) {
        await api.updateDrug(editItem.drug_id, formData);
        if (onToast) onToast({ type: 'success', title: '✓ Drug updated successfully', message: `Drug #${editItem.drug_id} updated in database.` });
      } else {
        await api.createDrug(formData);
        if (onToast) onToast({ type: 'success', title: '✓ Drug created successfully', message: 'New pharmaceutical formulation registered in database.' });
      }
      setModalOpen(false);
      loadDrugs();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeleting(true);
      await api.deleteDrug(id);
      if (onToast) onToast({ type: 'success', title: '✓ Drug deleted successfully', message: `Drug #${id} removed from database.` });
      setDeleteConfirmId(null);
      loadDrugs();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Cannot Delete Drug', message: err.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Drug Formulations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            DRUG Catalog Relation (drug_id PK, drug_name, description, strength, dosage_form)
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary" id="add-drug-btn">
          <Plus className="w-4 h-4" />
          <span>+ Add Drug</span>
        </button>
      </div>

      {/* Search Bar & Total Count */}
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
            placeholder="Search Drugs..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none transition-all shadow-xs"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total Drugs: <span className="font-bold text-slate-900">{drugs.length}</span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={loadDrugs} className="btn-secondary text-xs">Retry</button>
        </div>
      )}

      {/* Table Card */}
      <div className="med-card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-forest-700" />
            <span>Loading drugs from database...</span>
          </div>
        ) : paginatedDrugs.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Pill className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No drugs found matching criteria</p>
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
                  <th onClick={() => handleSort('drug_id')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Drug ID</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('drug_name')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Drug Name</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('strength')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Strength</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('dosage_form')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Dosage Form</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th>Description</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedDrugs.map((d) => (
                  <tr key={d.drug_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="font-bold text-slate-900">#{d.drug_id}</td>
                    <td className="font-bold text-forest-900">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-forest-50 text-forest-700 flex items-center justify-center flex-shrink-0">
                          <Pill className="w-3.5 h-3.5" />
                        </div>
                        <span>{d.drug_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-semibold text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {d.strength}
                      </span>
                    </td>
                    <td className="text-xs text-slate-600 font-medium">{d.dosage_form}</td>
                    <td className="text-xs text-slate-500 max-w-sm truncate" title={d.description}>
                      {d.description || '—'}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleOpenEdit(d)} 
                          className="btn-icon hover:text-forest-700" 
                          title="Edit Drug"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(d.drug_id)} 
                          className="btn-icon text-rose-500 hover:text-rose-700 hover:bg-rose-50" 
                          title="Delete Drug"
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
        {!loading && paginatedDrugs.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * pageSize, sortedDrugs.length)}
              </span> of <span className="font-semibold text-slate-800">{sortedDrugs.length}</span> drugs
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={editItem ? `Edit Drug #${editItem.drug_id}` : 'Add Drug'}
        subtitle="Catalog pharmaceutical specification in Oracle DRUG relation"
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
                placeholder="e.g. Film-Coated Tablet, Oral Suspension"
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
                editItem ? 'Save Changes' : 'Create Drug'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => !deleting && setDeleteConfirmId(null)}
        title="Confirm Drug Deletion"
        subtitle="Referential integrity validation"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Safety Notice:</strong> Are you sure you want to delete <strong>Drug #{deleteConfirmId}</strong>?
              If dependent manufactured batches reference this drug in Oracle, the foreign key constraint will block deletion to prevent orphan records.
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
