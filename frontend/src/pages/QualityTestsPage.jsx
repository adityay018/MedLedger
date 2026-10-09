import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { 
  Plus, 
  FlaskConical, 
  RefreshCw, 
  Search, 
  ArrowUpDown, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Clock,
  Filter
} from 'lucide-react';

export default function QualityTestsPage({ onToast }) {
  const [tests, setTests] = useState([]);
  const [batches, setBatches] = useState([]);
  const [batchFilter, setBatchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('test_id');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialForm = {
    batch_id: '',
    test_date: new Date().toISOString().split('T')[0],
    test_type: 'HPLC Potency Assay',
    result: '99.8% Active Pharmaceutical Ingredient',
    status: 'PASSED'
  };

  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, bRes] = await Promise.all([
        api.getQualityTests(batchFilter),
        api.getBatches()
      ]);
      setTests(tRes.data || []);
      setBatches(bRes.data || []);
      if (bRes.data?.length > 0 && !formData.batch_id) {
        setFormData(prev => ({ ...prev, batch_id: bRes.data[0].batch_id }));
      }
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Error Loading Tests', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [batchFilter]);

  const handleOpenAdd = () => {
    setFormData({
      batch_id: batches[0]?.batch_id || '',
      test_date: new Date().toISOString().split('T')[0],
      test_type: 'HPLC Potency Assay',
      result: '99.8% Active Pharmaceutical Ingredient',
      status: 'PASSED'
    });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (test) => {
    setSelectedTest(test);
    setFormData({
      batch_id: test.batch_id,
      test_date: test.test_date || new Date().toISOString().split('T')[0],
      test_type: test.test_type || '',
      result: test.result || '',
      status: test.status || 'PASSED'
    });
    setEditModalOpen(true);
  };

  const handleOpenDelete = (test) => {
    setSelectedTest(test);
    setDeleteModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.batch_id || !formData.test_type || !formData.result) {
      if (onToast) onToast({ type: 'error', title: 'Validation Error', message: 'Please fill in all required fields.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createQualityTest(formData);
      if (onToast) onToast({ type: 'success', title: 'Success', message: '✓ Quality test created successfully' });
      setAddModalOpen(false);
      loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Failed to Log Assay', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.updateQualityTest(selectedTest.test_id, formData);
      if (onToast) onToast({ type: 'success', title: 'Success', message: '✓ Quality test updated successfully' });
      setEditModalOpen(false);
      loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Update Failed', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsSubmitting(true);
      await api.deleteQualityTest(selectedTest.test_id);
      if (onToast) onToast({ type: 'success', title: 'Success', message: '✓ Quality test deleted successfully' });
      setDeleteModalOpen(false);
      loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Filter and sort
  const filteredAndSortedTests = useMemo(() => {
    let result = [...tests];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(t => 
        String(t.test_id).includes(q) ||
        String(t.batch_id).includes(q) ||
        (t.drug_name && t.drug_name.toLowerCase().includes(q)) ||
        (t.test_type && t.test_type.toLowerCase().includes(q)) ||
        (t.result && t.result.toLowerCase().includes(q)) ||
        (t.status && t.status.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [tests, searchTerm, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredAndSortedTests.length / pageSize) || 1;
  const paginatedTests = filteredAndSortedTests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-forest-700" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quality Assurance Tests</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Oracle relation QUALITY_TEST: Batch analytical assays, chemical stability, and regulatory inspection records.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>+ Add Quality Test</span>
        </button>
      </div>

      {/* Control Bar: Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Quality Tests..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filter Batch:</span>
          <select
            value={batchFilter}
            onChange={(e) => {
              setBatchFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-forest-600 font-medium"
          >
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={b.batch_id} value={b.batch_id}>
                Batch #{b.batch_id} — {b.drug_name}
              </option>
            ))}
          </select>
          <button 
            onClick={loadData} 
            title="Refresh Table" 
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-forest-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="med-card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-forest-700" />
            <span>Loading laboratory assay records from database...</span>
          </div>
        ) : paginatedTests.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm space-y-2">
            <FlaskConical className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No Quality Tests Found</p>
            <p className="text-xs text-slate-400">
              {searchTerm || batchFilter ? 'No tests match your filter criteria.' : 'No laboratory quality assays recorded in the system yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full med-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('test_id')} className="cursor-pointer hover:bg-slate-100/70">
                    <div className="flex items-center gap-1.5">
                      <span>Test ID</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('batch_id')} className="cursor-pointer hover:bg-slate-100/70">
                    <div className="flex items-center gap-1.5">
                      <span>Batch</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('test_date')} className="cursor-pointer hover:bg-slate-100/70">
                    <div className="flex items-center gap-1.5">
                      <span>Test Date</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('test_type')} className="cursor-pointer hover:bg-slate-100/70">
                    <div className="flex items-center gap-1.5">
                      <span>Test Type</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('result')} className="cursor-pointer hover:bg-slate-100/70">
                    <div className="flex items-center gap-1.5">
                      <span>Result</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('status')} className="cursor-pointer hover:bg-slate-100/70">
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTests.map((t) => {
                  const isFailed = t.status === 'FAILED';
                  return (
                    <tr 
                      key={t.test_id} 
                      className={`transition-colors ${
                        isFailed 
                          ? 'bg-rose-50/60 hover:bg-rose-50 border-l-4 border-l-rose-500' 
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="font-bold text-slate-900">#{t.test_id}</td>
                      <td>
                        <div className="font-semibold text-slate-800">Batch #{t.batch_id}</div>
                        <div className="text-xs text-slate-500">{t.drug_name || 'Pharmaceutical Batch'}</div>
                      </td>
                      <td className="text-xs text-slate-600 whitespace-nowrap">{t.test_date}</td>
                      <td>
                        <span className="font-medium text-xs text-slate-800">{t.test_type}</span>
                      </td>
                      <td>
                        <span className={`text-xs font-mono max-w-sm truncate inline-block ${
                          isFailed ? 'font-bold text-rose-700' : 'text-slate-700'
                        }`} title={t.result}>
                          {t.result}
                        </span>
                      </td>
                      <td>
                        {isFailed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-sm animate-pulse">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            FAILED
                          </span>
                        ) : t.status === 'PASSED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            PASSED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            title="Edit Quality Assay"
                            className="p-1.5 text-slate-500 hover:text-forest-700 hover:bg-forest-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(t)}
                            title="Delete Quality Assay"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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
        {!loading && filteredAndSortedTests.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * pageSize, filteredAndSortedTests.length)}
              </span> of <span className="font-semibold text-slate-700">{filteredAndSortedTests.length}</span> tests
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    currentPage === pg 
                      ? 'bg-forest-700 text-white' 
                      : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {pg}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Log Laboratory Quality Assay"
        subtitle="Batch analytical assay and stability inspection"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Batch Lot *</label>
            <select
              required
              value={formData.batch_id}
              onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            >
              {batches.map(b => (
                <option key={b.batch_id} value={b.batch_id}>
                  Batch #{b.batch_id} — {b.drug_name} ({b.batch_status})
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Analytical Result Description *</label>
            <input
              type="text"
              required
              value={formData.result}
              onChange={(e) => setFormData({ ...formData, result: e.target.value })}
              placeholder="e.g. 99.8% Potency, PASS standard specifications"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Test Status Outcome *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none font-medium"
            >
              <option value="PASSED">PASSED — Meets pharmacopeia release criteria</option>
              <option value="FAILED">FAILED — Non-compliant, quarantine lot</option>
              <option value="PENDING">PENDING — Incubation or stability ongoing</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setAddModalOpen(false)} 
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Recording...' : 'Create Quality Test'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Quality Assay #${selectedTest?.test_id}`}
        subtitle="Update inspection parameters or laboratory evaluation"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Test ID</label>
              <input
                type="text"
                disabled
                value={`#${selectedTest?.test_id}`}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-bold text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Lot</label>
              <input
                type="text"
                disabled
                value={`Batch #${selectedTest?.batch_id}`}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium text-slate-500"
              />
            </div>
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Result Summary *</label>
            <input
              type="text"
              required
              value={formData.result}
              onChange={(e) => setFormData({ ...formData, result: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none font-medium"
            >
              <option value="PASSED">PASSED</option>
              <option value="FAILED">FAILED</option>
              <option value="PENDING">PENDING</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setEditModalOpen(false)} 
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Quality Test'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Assay Deletion"
        subtitle={`Remove laboratory assay record #${selectedTest?.test_id}`}
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Delete Quality Test Record?</p>
              <p className="mt-1 leading-relaxed text-amber-800">
                You are about to permanently delete test assay <strong className="font-mono">#{selectedTest?.test_id}</strong> for Batch #{selectedTest?.batch_id}. This operation directly modifies the Oracle <strong className="font-mono">QUALITY_TEST</strong> table.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button 
              type="button" 
              onClick={() => setDeleteModalOpen(false)} 
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleDeleteConfirm} 
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Test'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
