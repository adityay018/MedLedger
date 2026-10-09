import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import { 
  Plus, 
  Receipt, 
  RefreshCw, 
  QrCode, 
  UserCheck, 
  Search, 
  ArrowUpDown, 
  Filter, 
  Building2,
  Calendar,
  Pill,
  Sparkles
} from 'lucide-react';

export default function DispensingPage({ onToast }) {
  const [dispensings, setDispensings] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [packages, setPackages] = useState([]);
  const [pharmacyFilter, setPharmacyFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('dispense_id');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    pharmacy_id: '',
    dispensed_at: new Date().toISOString().split('T')[0],
    patient_id: '',
    quantity: 1,
    package_id: '',
    remarks: 'Verified doctor prescription at retail counter.'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [dRes, phRes, pkgRes] = await Promise.all([
        api.getDispensings(),
        api.getParties('PHARMACY'),
        api.getPackages('DELIVERED') // Available delivered packages to dispense
      ]);
      setDispensings(dRes.data || []);
      setPharmacies(phRes.data || []);
      setPackages(pkgRes.data || []);

      if (phRes.data?.length > 0 && !formData.pharmacy_id) {
        setFormData(prev => ({ ...prev, pharmacy_id: phRes.data[0].party_id }));
      }
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Error Loading Data', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    const randomPatId = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData({
      pharmacy_id: pharmacies[0]?.party_id || '',
      dispensed_at: new Date().toISOString().split('T')[0],
      patient_id: randomPatId,
      quantity: 1,
      package_id: packages[0]?.package_id || '',
      remarks: 'Verified doctor prescription at retail counter.'
    });
    setModalOpen(true);
  };

  const handleGeneratePatientId = () => {
    setFormData(prev => ({
      ...prev,
      patient_id: `PAT-${Math.floor(1000 + Math.random() * 9000)}`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.pharmacy_id || !formData.patient_id || !formData.quantity) {
      if (onToast) onToast({ type: 'error', title: 'Validation Error', message: 'Pharmacy, Patient ID, and Quantity are required.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createDispensing(formData);
      if (onToast) onToast({ 
        type: 'success', 
        title: 'Success', 
        message: '✓ Dispensing recorded successfully' 
      });
      setModalOpen(false);
      loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Dispensing Failed', message: err.message });
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
  const filteredAndSortedDispensings = useMemo(() => {
    let result = [...dispensings];

    if (pharmacyFilter) {
      result = result.filter(d => String(d.pharmacy_id) === String(pharmacyFilter));
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(d => 
        String(d.dispense_id).includes(q) ||
        (d.pharmacy_name && d.pharmacy_name.toLowerCase().includes(q)) ||
        (d.patient_id && d.patient_id.toLowerCase().includes(q)) ||
        (d.drug_name && d.drug_name.toLowerCase().includes(q)) ||
        (d.remarks && d.remarks.toLowerCase().includes(q)) ||
        (d.qr_code && d.qr_code.toLowerCase().includes(q))
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
  }, [dispensings, searchTerm, pharmacyFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedDispensings.length / pageSize) || 1;
  const paginatedDispensings = filteredAndSortedDispensings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-forest-700" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Retail Pharmacy Dispensing</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Oracle relation DISPENSING: Point-of-care patient handover events with anonymous synthetic identifiers.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>+ Record Dispensing</span>
        </button>
      </div>

      {/* Control Bar: Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Dispensing Events..."
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
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filter Pharmacy:</span>
          <select
            value={pharmacyFilter}
            onChange={(e) => {
              setPharmacyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-forest-600 font-medium"
          >
            <option value="">All Pharmacies</option>
            {pharmacies.map(p => (
              <option key={p.party_id} value={p.party_id}>
                {p.party_name}
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
            <span>Loading dispensing records from database...</span>
          </div>
        ) : paginatedDispensings.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No Dispensing Records Found</p>
            <p className="text-xs text-slate-400">
              {searchTerm || pharmacyFilter ? 'No dispensing matches your filter criteria.' : 'No counter dispensings logged yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full med-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('dispense_id')} className="cursor-pointer hover:bg-slate-100/70">
                    <div className="flex items-center gap-1.5">
                      <span>Dispense ID</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('pharmacy_name')} className="cursor-pointer hover:bg-slate-100/70">
                    <div className="flex items-center gap-1.5">
                      <span>Pharmacy</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('dispensed_at')} className="cursor-pointer hover:bg-slate-100/70">
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('patient_id')} className="cursor-pointer hover:bg-slate-100/70">
                    <div className="flex items-center gap-1.5">
                      <span>Patient ID</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th>Drug / Serial Unit</th>
                  <th onClick={() => handleSort('quantity')} className="cursor-pointer hover:bg-slate-100/70">
                    <div className="flex items-center gap-1.5">
                      <span>Quantity</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedDispensings.map((d) => (
                  <tr key={d.dispense_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="font-bold text-slate-900">#{d.dispense_id}</td>
                    <td>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                        <span>{d.pharmacy_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">Party #{d.pharmacy_id}</div>
                    </td>
                    <td className="text-xs text-slate-600 whitespace-nowrap">{d.dispensed_at}</td>
                    <td>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 inline-flex items-center gap-1 border border-slate-200">
                        <UserCheck className="w-3 h-3 text-forest-700" />
                        <span>{d.patient_id}</span>
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-800 text-xs">{d.drug_name || 'Prescription Item'}</div>
                      {d.qr_code && (
                        <div className="font-mono text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <QrCode className="w-3 h-3 text-forest-600" />
                          <span>{d.qr_code}</span>
                        </div>
                      )}
                    </td>
                    <td className="font-bold text-forest-900 text-xs whitespace-nowrap">
                      {d.quantity} units
                    </td>
                    <td className="text-xs text-slate-500 max-w-xs truncate" title={d.remarks}>
                      {d.remarks || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && filteredAndSortedDispensings.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * pageSize, filteredAndSortedDispensings.length)}
              </span> of <span className="font-semibold text-slate-700">{filteredAndSortedDispensings.length}</span> events
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

      {/* Record Dispensing Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Pharmacy Dispensing"
        subtitle="Counter prescription fulfillment with anonymous patient token"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dispensing Pharmacy *</label>
            <select
              required
              value={formData.pharmacy_id}
              onChange={(e) => setFormData({ ...formData, pharmacy_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            >
              {pharmacies.map(p => (
                <option key={p.party_id} value={p.party_id}>
                  #{p.party_id} — {p.party_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dispensing Date *</label>
              <input
                type="date"
                required
                value={formData.dispensed_at}
                onChange={(e) => setFormData({ ...formData, dispensed_at: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity (Units) *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Synthetic Patient Identifier *
              </label>
              <button
                type="button"
                onClick={handleGeneratePatientId}
                className="text-[11px] text-forest-700 hover:text-forest-900 font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Regenerate ID
              </button>
            </div>
            <input
              type="text"
              required
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              placeholder="PAT-1049"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Synthetic pseudonym prevents exposure of Personally Identifiable Information (PII) under healthcare privacy regulations.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Link Serialized Unit Package (Optional)
            </label>
            <select
              value={formData.package_id}
              onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none font-mono"
            >
              <option value="">-- No specific package linked --</option>
              {packages.map(pkg => (
                <option key={pkg.package_id} value={pkg.package_id}>
                  Package #{pkg.package_id} — {pkg.qr_code} ({pkg.drug_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pharmacist Clinical Remarks</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Doctor prescription verified, patient counseled on dosage..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setModalOpen(false)} 
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
              {isSubmitting ? 'Recording...' : 'Record Dispensing'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
