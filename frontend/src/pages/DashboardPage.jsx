import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { 
  Pill, 
  Layers, 
  Package, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  FlaskConical,
  XCircle,
  Activity,
  Calendar,
  Building2
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
      setError(err.message || 'Failed to load dashboard metrics');
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
          <RefreshCw className="w-8 h-8 text-[#166534] animate-spin" />
          <p className="text-sm font-medium text-[#64748B]">Querying Oracle database aggregates & telemetry...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={fetchStats} className="btn-secondary text-xs">Retry</button>
        </div>
      </div>
    );
  }

  const { 
    kpi = {}, 
    qualityTestSummary = { total: 0, passed: 0, failed: 0, pending: 0, passRate: 0 }, 
    shipmentStatusCounts = {}, 
    recentShipments = [], 
    recentRecalls = [] 
  } = stats || {};

  // Exact 6 KPI cards requested in section 10
  const mainCards = [
    {
      title: 'TOTAL DRUGS',
      value: kpi.drugsCount ?? 0,
      icon: Pill,
      tab: 'drugs',
      description: 'Approved chemical formulations in catalog'
    },
    {
      title: 'ACTIVE BATCHES',
      value: kpi.activeBatchesCount ?? 0,
      icon: Layers,
      tab: 'batches',
      description: `Released lots (${kpi.batchesCount ?? 0} total created)`
    },
    {
      title: 'PACKAGES',
      value: kpi.packagesCount ?? 0,
      icon: Package,
      tab: 'packages',
      description: 'Serialized units with QR codes'
    },
    {
      title: 'SHIPMENTS',
      value: kpi.shipmentsCount ?? 0,
      icon: Truck,
      tab: 'shipments',
      description: 'Custody transfer manifests'
    },
    {
      title: 'ACTIVE RECALLS',
      value: kpi.activeRecallsCount ?? 0,
      icon: AlertTriangle,
      tab: 'recalls',
      description: `${kpi.recallsCount ?? 0} total regulatory safety orders`,
      highlight: (kpi.activeRecallsCount || 0) > 0
    },
    {
      title: 'DISPENSED PACKAGES',
      value: kpi.dispensedPackagesCount ?? 0,
      icon: CheckCircle2,
      tab: 'dispensing',
      description: `Patient handovers (${kpi.dispensingsCount ?? 0} events)`
    }
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] flex items-center justify-center text-[#166534]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">MedLedger Operations Dashboard</h1>
              <p className="text-xs text-[#64748B]">
                Live Oracle DBMS supply chain telemetry • Real-time relational tracking from manufacture to point-of-care
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchStats}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-[#0F172A] hover:bg-slate-100 flex items-center gap-1.5 transition-colors bg-white shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#166534]" />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* 6 Core KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {mainCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx}
              onClick={() => onNavigate(card.tab)}
              className={`p-5 rounded-xl border bg-white shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group ${
                card.highlight 
                  ? 'border-rose-300 bg-rose-50/30' 
                  : 'border-slate-200 hover:border-[#166534]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold tracking-wider text-[#64748B] uppercase">
                  {card.title}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  card.highlight 
                    ? 'bg-rose-100 text-rose-700' 
                    : 'bg-[#DCFCE7] text-[#166534] group-hover:bg-[#166534] group-hover:text-white'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-3xl font-extrabold ${card.highlight ? 'text-rose-700' : 'text-[#0F172A]'}`}>
                {card.value}
              </div>
              <p className="text-[11px] text-[#64748B] mt-2 line-clamp-1">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Lower Quadrant: 4 Core Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 1: RECENT SHIPMENTS */}
        <div className="med-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#166534]" />
                <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">
                  Recent Shipments
                </h2>
              </div>
              <button 
                onClick={() => onNavigate('shipments')} 
                className="text-xs font-semibold text-[#166534] hover:text-[#22C55E] flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentShipments.length === 0 ? (
              <p className="text-xs text-[#64748B] py-6 text-center">No custody shipments recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[#64748B] font-semibold">
                      <th className="pb-2.5">ID</th>
                      <th className="pb-2.5">Sender</th>
                      <th className="pb-2.5">Receiver</th>
                      <th className="pb-2.5">Mode</th>
                      <th className="pb-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentShipments.slice(0, 5).map(s => (
                      <tr key={s.shipment_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 font-bold text-[#0F172A]">#{s.shipment_id}</td>
                        <td className="py-2.5 text-[#0F172A] font-medium max-w-[130px] truncate" title={s.sender_name}>
                          {s.sender_name}
                        </td>
                        <td className="py-2.5 text-[#64748B] max-w-[130px] truncate" title={s.receiver_name}>
                          {s.receiver_name}
                        </td>
                        <td className="py-2.5 text-[#64748B] text-[11px] whitespace-nowrap">
                          {s.mode}
                        </td>
                        <td className="py-2.5 text-right whitespace-nowrap">
                          <StatusBadge status={s.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-[#64748B] flex items-center justify-between">
            <span>Verified custody handover bridge</span>
            <span className="font-semibold text-[#166534]">Oracle SHIPMENT + CONTAINS</span>
          </div>
        </div>

        {/* SECTION 2: RECENT RECALLS */}
        <div className="med-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">
                  Recent Recalls
                </h2>
              </div>
              <button 
                onClick={() => onNavigate('recalls')} 
                className="text-xs font-semibold text-[#166534] hover:text-[#22C55E] flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentRecalls.length === 0 ? (
              <p className="text-xs text-[#64748B] py-6 text-center">No regulatory recall notices on record.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[#64748B] font-semibold">
                      <th className="pb-2.5">Notice ID</th>
                      <th className="pb-2.5">Date</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentRecalls.slice(0, 5).map(r => {
                      const isActive = r.status === 'ACTIVE';
                      return (
                        <tr 
                          key={r.recall_id} 
                          className={`transition-colors ${isActive ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50/70'}`}
                        >
                          <td className="py-2.5 font-bold text-[#0F172A]">#{r.recall_id}</td>
                          <td className="py-2.5 text-[#64748B] whitespace-nowrap">{r.recall_date}</td>
                          <td className="py-2.5 whitespace-nowrap">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                ACTIVE RECALL
                              </span>
                            ) : (
                              <StatusBadge status={r.status} />
                            )}
                          </td>
                          <td className="py-2.5 text-[#64748B] max-w-xs truncate" title={r.reason}>
                            {r.reason}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-[#64748B] flex items-center justify-between">
            <span>Automated batch quarantine protocol</span>
            <span className="font-semibold text-rose-700">PL/SQL Blast Radius Active</span>
          </div>
        </div>

        {/* SECTION 3: QUALITY TEST SUMMARY */}
        <div className="med-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[#166534]" />
                <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">
                  Quality Test Summary
                </h2>
              </div>
              <button 
                onClick={() => onNavigate('quality-tests')} 
                className="text-xs font-semibold text-[#166534] hover:text-[#22C55E] flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quality Test Metrics Grid */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div className="text-[10px] font-semibold text-[#64748B] uppercase">Total Tests</div>
                <div className="text-xl font-bold text-[#0F172A] mt-0.5">{qualityTestSummary.total}</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                <div className="text-[10px] font-semibold text-emerald-800 uppercase">Passed</div>
                <div className="text-xl font-bold text-emerald-700 mt-0.5 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{qualityTestSummary.passed}</span>
                </div>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-center">
                <div className="text-[10px] font-semibold text-rose-800 uppercase">Failed</div>
                <div className="text-xl font-bold text-rose-700 mt-0.5 flex items-center justify-center gap-1">
                  <XCircle className="w-4 h-4" />
                  <span>{qualityTestSummary.failed}</span>
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                <div className="text-[10px] font-semibold text-amber-800 uppercase">Pending</div>
                <div className="text-xl font-bold text-amber-700 mt-0.5 flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{qualityTestSummary.pending}</span>
                </div>
              </div>
            </div>

            {/* Pass Rate Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#0F172A]">Batch Analytical Compliance Rate</span>
                <span className="font-bold text-[#166534]">{qualityTestSummary.passRate}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                <div 
                  className="h-full rounded-full bg-[#22C55E] transition-all duration-500" 
                  style={{ width: `${qualityTestSummary.passRate}%` }}
                />
              </div>
              <p className="text-[11px] text-[#64748B] pt-1">
                Quality tests ensure chemical potency, sterility, and dissolution compliance prior to batch release.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-[#64748B] flex items-center justify-between">
            <span>Assay Validation Standard</span>
            <span className="font-semibold text-[#166534]">Oracle QUALITY_TEST check domain</span>
          </div>
        </div>

        {/* SECTION 4: SHIPMENT STATUS */}
        <div className="med-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#166534]" />
                <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">
                  Shipment Status
                </h2>
              </div>
              <button 
                onClick={() => onNavigate('shipments')} 
                className="text-xs font-semibold text-[#166534] hover:text-[#22C55E] flex items-center gap-1"
              >
                Details <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {['DELIVERED', 'IN_TRANSIT', 'DISPATCHED', 'CREATED', 'RETURNED'].map(status => {
                const count = shipmentStatusCounts[status] || 0;
                const total = kpi.shipmentsCount || 1;
                const pct = Math.round((count / total) * 100);

                const colorClass = 
                  status === 'DELIVERED' ? 'bg-[#22C55E]' :
                  status === 'IN_TRANSIT' ? 'bg-amber-500' :
                  status === 'DISPATCHED' ? 'bg-sky-500' :
                  status === 'RETURNED' ? 'bg-rose-500' : 'bg-slate-400';

                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#0F172A]">{status}</span>
                      <span className="text-[#64748B] font-mono">
                        {count} shipments ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${colorClass}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-[#64748B] flex items-center justify-between">
            <span>Multi-modal logistics telemetry</span>
            <span className="font-semibold text-[#166534]">Cold-chain & Carrier Monitoring</span>
          </div>
        </div>

      </div>
    </div>
  );
}
