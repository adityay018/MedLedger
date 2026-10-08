import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { 
  Users, 
  Pill, 
  Layers, 
  Package, 
  Truck, 
  AlertTriangle, 
  Receipt, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Clock
} from 'lucide-react';

export default function DashboardPage({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboard();
      setStats(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-forest-700 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Retrieving supply chain telemetry from database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchStats} className="btn-secondary text-xs">Retry</button>
        </div>
      </div>
    );
  }

  const { kpi, batchStatusCounts, shipmentStatusCounts, packageStatusCounts, recentShipments, recentRecalls, recentDispensings } = stats;

  const kpis = [
    { label: 'Total Parties', val: kpi.partiesCount, icon: Users, tab: 'parties', sub: 'Mfgs, Distros, Pharmacies' },
    { label: 'Formulated Drugs', val: kpi.drugsCount, icon: Pill, tab: 'drugs', sub: 'Active drug catalog' },
    { label: 'Total Batches', val: kpi.batchesCount, icon: Layers, tab: 'batches', sub: `${kpi.activeBatchesCount} Released lots` },
    { label: 'Serialized Packages', val: kpi.packagesCount, icon: Package, tab: 'packages', sub: 'With verified QR codes' },
    { label: 'Custody Shipments', val: kpi.shipmentsCount, icon: Truck, tab: 'shipments', sub: 'Multi-party transit' },
    { label: 'Active Recalls', val: kpi.recallsCount, icon: AlertTriangle, tab: 'recalls', sub: 'Regulatory notices' },
    { label: 'Patient Dispensings', val: kpi.dispensingsCount, icon: Receipt, tab: 'dispensing', sub: 'Verified counter events' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-forest-900 via-forest-800 to-forest-950 text-white p-7 rounded-2xl shadow-lg border border-forest-700">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold mb-3 border border-emerald-400/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            Blockchain-Anchored Anti-Counterfeit Architecture
          </span>
          <h1 className="text-2xl font-bold tracking-tight">MedLedger Supply Chain Overview</h1>
          <p className="text-forest-100 text-sm mt-1 leading-relaxed">
            Relational DBMS implementation tracking end-to-end pharmaceutical provenance from synthesis, quality testing, cold-chain logistics, to patient dispensing.
          </p>
          <div className="flex items-center gap-3 mt-5">
            <button 
              onClick={() => onNavigate('verify')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              Verify Package Authenticity
            </button>
            <button 
              onClick={() => onNavigate('analytics')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors border border-white/20 flex items-center gap-1.5"
            >
              View SQL Queries (Q1-Q12)
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {kpis.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={idx}
              onClick={() => onNavigate(item.tab)}
              className="med-card p-4 cursor-pointer hover:border-forest-600/60 group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">{item.label}</span>
                <div className="w-7 h-7 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center group-hover:bg-forest-800 group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{item.val}</div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">{item.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Distribution Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Batch Status */}
        <div className="med-card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
            <span>Batch Life-Cycle Status</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </h3>
          <div className="space-y-3">
            {Object.entries(batchStatusCounts).map(([status, count]) => {
              const total = kpi.batchesCount || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{status}</span>
                    <span className="text-slate-500 font-semibold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        status === 'RELEASED' ? 'bg-emerald-500' :
                        status === 'RECALLED' ? 'bg-rose-500' :
                        status === 'IN_TRANSIT' ? 'bg-amber-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipment Status */}
        <div className="med-card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
            <span>Logistics & Custody</span>
            <Truck className="w-4 h-4 text-slate-400" />
          </h3>
          <div className="space-y-3">
            {Object.entries(shipmentStatusCounts).map(([status, count]) => {
              const total = kpi.shipmentsCount || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{status}</span>
                    <span className="text-slate-500 font-semibold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        status === 'DELIVERED' ? 'bg-emerald-500' :
                        status === 'IN_TRANSIT' ? 'bg-amber-500' :
                        status === 'DISPATCHED' ? 'bg-sky-500' : 'bg-rose-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Package Inventory Status */}
        <div className="med-card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
            <span>Package Inventory Status</span>
            <Package className="w-4 h-4 text-slate-400" />
          </h3>
          <div className="space-y-3">
            {Object.entries(packageStatusCounts).map(([status, count]) => {
              const total = kpi.packagesCount || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{status}</span>
                    <span className="text-slate-500 font-semibold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        status === 'DISPENSED' ? 'bg-sky-500' :
                        status === 'DELIVERED' ? 'bg-emerald-500' :
                        status === 'RECALLED' ? 'bg-rose-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Supply Chain Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Shipments */}
        <div className="med-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Recent Custody Shipments</h3>
            <button onClick={() => onNavigate('shipments')} className="text-xs text-forest-700 hover:text-forest-900 font-semibold flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Sender</th>
                  <th className="pb-2">Receiver</th>
                  <th className="pb-2">Mode</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentShipments.map(s => (
                  <tr key={s.shipment_id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 font-bold text-slate-800">#{s.shipment_id}</td>
                    <td className="py-2.5 text-slate-600 truncate max-w-[120px]">{s.sender_name}</td>
                    <td className="py-2.5 text-slate-600 truncate max-w-[120px]">{s.receiver_name}</td>
                    <td className="py-2.5 text-slate-500">{s.mode}</td>
                    <td className="py-2.5"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Dispensing */}
        <div className="med-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Recent Pharmacy Dispensings</h3>
            <button onClick={() => onNavigate('dispensing')} className="text-xs text-forest-700 hover:text-forest-900 font-semibold flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Pharmacy</th>
                  <th className="pb-2">Patient ID</th>
                  <th className="pb-2">Units</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentDispensings.map(d => (
                  <tr key={d.dispense_id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 font-bold text-slate-800">#{d.dispense_id}</td>
                    <td className="py-2.5 text-slate-600 truncate max-w-[140px]">{d.pharmacy_name}</td>
                    <td className="py-2.5 font-mono text-slate-700">{d.patient_id}</td>
                    <td className="py-2.5 font-semibold text-forest-800">{d.quantity}</td>
                    <td className="py-2.5 text-slate-500">{d.dispensed_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
