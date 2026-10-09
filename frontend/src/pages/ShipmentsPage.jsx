import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, Edit2, Trash2, Truck, RefreshCw, Eye, Search, ArrowUpDown, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

export default function ShipmentsPage({ onToast }) {
  const [shipments, setShipments] = useState([]);
  const [parties, setParties] = useState([]);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Sorting & Pagination
  const [sortField, setSortField] = useState('shipment_id');
  const [sortAsc, setSortAsc] = useState(false); // Newest shipment first
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [formData, setFormData] = useState({
    sender_party_id: '',
    receiver_party_id: '',
    shipment_date: new Date().toISOString().split('T')[0],
    status: 'IN_TRANSIT',
    mode: 'COLD_CHAIN_TRUCK',
    package_ids: []
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sRes, pRes, pkgRes] = await Promise.all([
        api.getShipments(statusFilter),
        api.getParties(),
        api.getPackages()
      ]);
      setShipments(sRes.data || []);
      setParties(pRes.data || []);
      setAvailablePackages(pkgRes.data || []);

      if (pRes.data?.length >= 2 && !formData.sender_party_id) {
        setFormData(prev => ({
          ...prev,
          sender_party_id: pRes.data[0].party_id,
          receiver_party_id: pRes.data[1].party_id
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load shipments');
      if (onToast) onToast({ type: 'error', title: 'Fetch Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Client-side Filter & Sort
  const filteredAndSortedShipments = useMemo(() => {
    let list = [...shipments];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => 
        String(s.shipment_id).includes(q) ||
        (s.sender_name && s.sender_name.toLowerCase().includes(q)) ||
        (s.receiver_name && s.receiver_name.toLowerCase().includes(q)) ||
        (s.status && s.status.toLowerCase().includes(q)) ||
        (s.mode && s.mode.toLowerCase().includes(q))
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
  }, [shipments, search, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedShipments.length / pageSize));
  const paginatedShipments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedShipments.slice(start, start + pageSize);
  }, [filteredAndSortedShipments, currentPage, pageSize]);

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
      sender_party_id: parties[0]?.party_id || '',
      receiver_party_id: parties[1]?.party_id || '',
      shipment_date: new Date().toISOString().split('T')[0],
      status: 'IN_TRANSIT',
      mode: 'COLD_CHAIN_TRUCK',
      package_ids: []
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditItem(s);
    setFormData({
      sender_party_id: s.sender_party_id,
      receiver_party_id: s.receiver_party_id,
      shipment_date: s.shipment_date,
      status: s.status,
      mode: s.mode,
      package_ids: []
    });
    setModalOpen(true);
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await api.getShipmentById(id);
      setSelectedShipment(res.data);
      setDetailModalOpen(true);
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(formData.sender_party_id) === Number(formData.receiver_party_id)) {
      if (onToast) onToast({ type: 'error', title: 'Invalid Parties', message: 'Sender and Receiver cannot be identical (Database Check Constraint).' });
      return;
    }

    try {
      setSubmitting(true);
      if (editItem) {
        await api.updateShipment(editItem.shipment_id, {
          status: formData.status,
          mode: formData.mode
        });
        if (onToast) onToast({ type: 'success', title: '✓ Shipment updated successfully', message: `Shipment #${editItem.shipment_id} status updated.` });
      } else {
        await api.createShipment(formData);
        if (onToast) onToast({ type: 'success', title: '✓ Shipment dispatched successfully', message: 'Custody shipment logged and CONTAINS mapping created.' });
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeleting(true);
      await api.deleteShipment(id);
      if (onToast) onToast({ type: 'success', title: '✓ Shipment deleted successfully', message: `Shipment #${id} deleted from database.` });
      setDeleteConfirmId(null);
      loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setDeleting(false);
    }
  };

  const togglePackageSelection = (pkgId) => {
    const exists = formData.package_ids.includes(pkgId);
    if (exists) {
      setFormData({ ...formData, package_ids: formData.package_ids.filter(id => id !== pkgId) });
    } else {
      setFormData({ ...formData, package_ids: [...formData.package_ids, pkgId] });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Custody Shipments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            SHIPMENT relation (sender & receiver FKs to PARTY) and CONTAINS M:N bridge table
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary" id="add-shipment-btn">
          <Plus className="w-4 h-4" />
          <span>+ Add Shipment</span>
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
            placeholder="Search Shipments by Sender or Receiver..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-forest-600 focus:outline-none transition-all shadow-xs"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
          {['', 'IN_TRANSIT', 'DELIVERED', 'DISPATCHED', 'CREATED', 'RETURNED'].map((s) => (
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
              {s ? s.replace(/_/g, ' ') : 'All Shipments'}
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
            <span>Loading shipments from database...</span>
          </div>
        ) : paginatedShipments.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Truck className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No shipments found matching filter</p>
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
                  <th onClick={() => handleSort('shipment_id')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Shipment ID</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('sender_name')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Sender</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('receiver_name')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Receiver</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('shipment_date')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Shipment Date</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('status')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('mode')} className="cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <span>Mode</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedShipments.map((s) => (
                  <tr key={s.shipment_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="font-bold text-slate-900">#{s.shipment_id}</td>
                    <td className="font-medium text-slate-800">{s.sender_name}</td>
                    <td className="font-medium text-slate-800">{s.receiver_name}</td>
                    <td className="text-xs text-slate-500 font-mono">{s.shipment_date}</td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="text-xs text-slate-600 font-semibold">{s.mode}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleViewDetails(s.shipment_id)} 
                          className="btn-icon text-forest-700 hover:text-forest-900 hover:bg-forest-50" 
                          title="View Manifest"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(s)} 
                          className="btn-icon hover:text-forest-700" 
                          title="Edit Shipment"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(s.shipment_id)} 
                          className="btn-icon text-rose-500 hover:text-rose-700 hover:bg-rose-50" 
                          title="Delete Shipment"
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
        {!loading && paginatedShipments.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * pageSize, filteredAndSortedShipments.length)}
              </span> of <span className="font-semibold text-slate-800">{filteredAndSortedShipments.length}</span> shipments
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

      {/* Add / Edit Shipment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={editItem ? `Edit Shipment #${editItem.shipment_id}` : 'Dispatch Custody Shipment'}
        subtitle="Registers SHIPMENT and links CONTAINS bridge records in Oracle"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {!editItem ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sender Party *</label>
                <select
                  required
                  value={formData.sender_party_id}
                  onChange={(e) => setFormData({ ...formData, sender_party_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
                >
                  {parties.map(p => (
                    <option key={p.party_id} value={p.party_id}>
                      #{p.party_id} - {p.party_name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Receiver Party *</label>
                <select
                  required
                  value={formData.receiver_party_id}
                  onChange={(e) => setFormData({ ...formData, receiver_party_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
                >
                  {parties.map(p => (
                    <option key={p.party_id} value={p.party_id}>
                      #{p.party_id} - {p.party_name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div><strong>Sender:</strong> {editItem.sender_name}</div>
              <div><strong>Receiver:</strong> {editItem.receiver_name}</div>
              <div><strong>Date:</strong> {editItem.shipment_date}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shipment Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              >
                <option value="IN_TRANSIT">IN_TRANSIT</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="DISPATCHED">DISPATCHED</option>
                <option value="CREATED">CREATED</option>
                <option value="RETURNED">RETURNED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mode of Transport *</label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              >
                <option value="COLD_CHAIN_TRUCK">COLD_CHAIN_TRUCK (Road)</option>
                <option value="AIR_CARGO">AIR_CARGO (Air)</option>
                <option value="EXPRESS_COURIER">EXPRESS_COURIER (Rail/Road)</option>
                <option value="ROAD_LOGISTICS">ROAD_LOGISTICS (Road)</option>
                <option value="MARITIME">MARITIME (Sea)</option>
              </select>
            </div>
          </div>

          {!editItem && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shipment Date *</label>
                <input
                  type="date"
                  required
                  value={formData.shipment_date}
                  onChange={(e) => setFormData({ ...formData, shipment_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Load Packages (CONTAINS Bridge Table)
                </label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                  {availablePackages.map(pkg => (
                    <label key={pkg.package_id} className="flex items-center gap-2 text-xs text-slate-700 p-1 hover:bg-white rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.package_ids.includes(pkg.package_id)}
                        onChange={() => togglePackageSelection(pkg.package_id)}
                        className="rounded text-forest-800 focus:ring-forest-600"
                      />
                      <span className="font-mono font-semibold">#{pkg.package_id} - {pkg.qr_code}</span>
                      <span className="text-slate-400">({pkg.drug_name})</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
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
                  <span>Processing...</span>
                </>
              ) : (
                editItem ? 'Save Changes' : 'Dispatch Shipment'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manifest Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedShipment ? `Cargo Manifest #${selectedShipment.shipment_id}` : 'Manifest'}
        subtitle="CONTAINS package manifest details"
      >
        {selectedShipment && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div><strong>Sender:</strong> {selectedShipment.sender_name}</div>
              <div><strong>Receiver:</strong> {selectedShipment.receiver_name}</div>
              <div><strong>Mode:</strong> {selectedShipment.mode}</div>
              <div><strong>Date:</strong> {selectedShipment.shipment_date}</div>
              <div><strong>Status:</strong> <StatusBadge status={selectedShipment.status} /></div>
            </div>

            <div>
              <h4 className="font-bold text-slate-700 mb-2 uppercase tracking-wider text-[11px]">
                Packages Assigned in CONTAINS Table ({selectedShipment.packages?.length || 0}):
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedShipment.packages && selectedShipment.packages.length > 0 ? (
                  selectedShipment.packages.map(p => (
                    <div key={p.package_id} className="p-2 bg-white rounded border border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-800">#{p.package_id} - {p.drug_name}</div>
                        <div className="font-mono text-slate-500 text-[11px]">{p.qr_code}</div>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">No packages loaded in this shipment manifest.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => !deleting && setDeleteConfirmId(null)}
        title="Confirm Shipment Deletion"
        subtitle="Referential integrity action"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to delete <strong>Shipment #{deleteConfirmId}</strong>?
            In Oracle, cascading foreign keys will remove associated CONTAINS rows while preserving packages.
          </p>
          <div className="flex justify-end gap-2 pt-3">
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
