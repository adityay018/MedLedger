import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Plus, Edit2, Trash2, Truck, RefreshCw, Eye } from 'lucide-react';

export default function ShipmentsPage({ onToast }) {
  const [shipments, setShipments] = useState([]);
  const [parties, setParties] = useState([]);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

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
      const [sRes, pRes, pkgRes] = await Promise.all([
        api.getShipments(statusFilter),
        api.getParties(),
        api.getPackages()
      ]);
      setShipments(sRes.data);
      setParties(pRes.data);
      setAvailablePackages(pkgRes.data);

      if (pRes.data.length >= 2 && !formData.sender_party_id) {
        setFormData(prev => ({
          ...prev,
          sender_party_id: pRes.data[0].party_id,
          receiver_party_id: pRes.data[1].party_id
        }));
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
    if (formData.sender_party_id === formData.receiver_party_id) {
      if (onToast) onToast({ type: 'error', title: 'Invalid Parties', message: 'Sender and receiver cannot be identical.' });
      return;
    }
    try {
      await api.createShipment(formData);
      if (onToast) onToast({ type: 'success', title: 'Shipment Created', message: 'Custody shipment and CONTAINS mappings logged.' });
      setModalOpen(false);
      loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Save Failed', message: err.message });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteShipment(id);
      if (onToast) onToast({ type: 'success', title: 'Deleted', message: `Shipment #${id} deleted.` });
      setDeleteConfirmId(null);
      loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Delete Failed', message: err.message });
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Custody Transfer Shipments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            SHIPMENT relation (sender & receiver FKs to PARTY) and CONTAINS M:N bridge table
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>Dispatch New Shipment</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['', 'IN_TRANSIT', 'DELIVERED', 'DISPATCHED', 'CREATED', 'RETURNED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
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

      {/* Table */}
      <div className="med-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-forest-700" />
            <span>Loading shipments...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full med-table">
              <thead>
                <tr>
                  <th>Shipment ID</th>
                  <th>Origin / Sender</th>
                  <th>Destination / Receiver</th>
                  <th>Shipment Date</th>
                  <th>Mode of Transport</th>
                  <th>Packages Loaded</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shipments.map((s) => (
                  <tr key={s.shipment_id}>
                    <td className="font-bold text-slate-900">#{s.shipment_id}</td>
                    <td className="font-medium text-slate-800">{s.sender_name}</td>
                    <td className="font-medium text-slate-800">{s.receiver_name}</td>
                    <td className="text-xs text-slate-500">{s.shipment_date}</td>
                    <td className="text-xs text-slate-600">
                      <span className="font-semibold">{s.mode}</span>
                    </td>
                    <td>
                      <span className="font-bold text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {s.total_packages || 0} packages
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleViewDetails(s.shipment_id)} className="btn-icon text-forest-700 hover:text-forest-900" title="Manifest Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirmId(s.shipment_id)} className="btn-icon text-rose-500 hover:text-rose-700" title="Delete">
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

      {/* Add Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Dispatch Custody Shipment"
        subtitle="Registers SHIPMENT and links CONTAINS bridge records"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Origin Sender *</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Receiver *</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shipment Date *</label>
              <input
                type="date"
                required
                value={formData.shipment_date}
                onChange={(e) => setFormData({ ...formData, shipment_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Logistics Transport Mode *</label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              >
                <option value="COLD_CHAIN_TRUCK">COLD_CHAIN_TRUCK</option>
                <option value="AIR_CARGO">AIR_CARGO</option>
                <option value="EXPRESS_COURIER">EXPRESS_COURIER</option>
                <option value="ROAD_LOGISTICS">ROAD_LOGISTICS</option>
                <option value="MARITIME">MARITIME</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Shipment Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            >
              <option value="CREATED">CREATED</option>
              <option value="DISPATCHED">DISPATCHED</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="DELIVERED">DELIVERED</option>
            </select>
          </div>

          {/* Package Selection for CONTAINS */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Packages to Load (CONTAINS Bridge Table)
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

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Dispatch Shipment
            </button>
          </div>
        </form>
      </Modal>

      {/* Manifest Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedShipment ? `Cargo Manifest #${selectedShipment.shipment_id}` : 'Manifest'}
        subtitle="CONTAINS package manifest"
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
                  <p className="text-slate-400 italic">No packages associated with this shipment.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Shipment Deletion"
        subtitle="Referential integrity action"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to delete <strong>Shipment #{deleteConfirmId}</strong>? In Oracle, cascading foreign keys will remove associated CONTAINS rows.
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
