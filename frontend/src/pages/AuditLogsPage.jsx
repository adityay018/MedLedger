import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  Filter, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  User, 
  Layers, 
  Truck, 
  AlertTriangle, 
  Lock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export default function AuditLogsPage({ onToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({ limit: 150 });
      setLogs(res.data || []);
    } catch (err) {
      if (onToast) onToast({ type: 'error', message: err.message || 'Failed to fetch audit records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const actorStr = `${log.actorEmail || ''} ${log.actorRole || ''} ${log.action || ''} ${log.entityType || ''}`.toLowerCase();
    const matchesSearch = actorStr.includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || log.action.includes(actionFilter);
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action) => {
    if (action.includes('AUTH') || action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('REGISTER')) {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }
    if (action.includes('USER') || action.includes('APPROVE') || action.includes('REJECT') || action.includes('STATUS')) {
      return 'bg-purple-50 text-purple-800 border-purple-200';
    }
    if (action.includes('BATCH') || action.includes('DRUG') || action.includes('QUALITY')) {
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    }
    if (action.includes('RECALL') || action.includes('QUARANTINE')) {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    if (action.includes('SHIPMENT') || action.includes('DISPENSE')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    return 'bg-slate-50 text-slate-800 border-slate-200';
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title & Compliance Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-forest-100 flex items-center justify-center text-forest-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit & Compliance Trail</h1>
              <p className="text-xs text-slate-500">
                Immutable activity logging conforming to FDA 21 CFR Part 11 and DSCSA data integrity standards
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchLogs}
            disabled={loading}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors bg-white shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-forest-700 ${loading ? 'animate-spin' : ''}`} />
            Refresh Audit Stream
          </button>
        </div>
      </div>

      {/* Security Statement Banner */}
      <div className="p-4 bg-forest-50/60 border border-forest-200/80 rounded-xl flex items-start gap-3 text-xs text-forest-900">
        <Lock className="w-4 h-4 text-forest-700 mt-0.5 flex-shrink-0" />
        <div className="space-y-0.5">
          <span className="font-bold">Automated Redaction & Least-Privilege Traceability</span>
          <p className="text-forest-800/90 text-[11px] leading-relaxed">
            Every critical state-changing operation across authentication, batch manufacturing, shipment custody transfers, quality test submissions, and recall orders is timestamped with the authenticated actor, IP address, and entity identifier. All sensitive credentials, session tokens, and passwords are permanently redacted before recording.
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by actor, role, action, or entity..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="py-2 px-3 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-800/20"
          >
            <option value="ALL">All Event Types</option>
            <option value="AUTH">Authentication (Login/Logout)</option>
            <option value="USER">User & Permissions</option>
            <option value="BATCH">Manufacturing Batches</option>
            <option value="SHIPMENT">Shipments & Custody</option>
            <option value="QUALITY">Quality Tests</option>
            <option value="RECALL">Recalls & Safety</option>
            <option value="DISPENSE">Pharmacy Dispensing</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="w-10 px-3 py-3"></th>
                <th className="px-4 py-3">Timestamp (UTC)</th>
                <th className="px-4 py-3">Actor & Identity</th>
                <th className="px-4 py-3">Operation / Action</th>
                <th className="px-4 py-3">Target Entity</th>
                <th className="px-4 py-3">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  let parsedDetails = null;
                  try {
                    parsedDetails = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                  } catch (e) {
                    parsedDetails = log.details;
                  }

                  return (
                    <React.Fragment key={log.id}>
                      <tr 
                        onClick={() => toggleExpand(log.id)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-slate-50' : ''
                        }`}
                      >
                        <td className="px-3 py-3 text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-forest-800" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800">{log.actorEmail || 'System'}</div>
                          <div className="text-slate-400 text-[10px] flex items-center gap-1 font-mono">
                            <span>{log.actorRole || 'SYSTEM'}</span>
                            {log.actorPartyId && <span>• Org #{log.actorPartyId}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-md font-bold font-mono text-[11px] border ${getActionBadge(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {log.entityType ? (
                            <span>
                              {log.entityType} <strong className="font-mono text-slate-900">#{log.entityId}</strong>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {log.status === 'SUCCESS' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              SUCCESS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              FAILED
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Metadata Detail Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90">
                          <td colSpan="6" className="px-8 py-3.5 border-t border-slate-100">
                            <div className="bg-slate-900 text-slate-200 rounded-lg p-3 text-[11px] font-mono overflow-x-auto space-y-1">
                              <div className="text-emerald-400 font-semibold mb-1">
                                // Immutable Audit Record #{log.id} • IP: {log.ipAddress || 'Internal'}
                              </div>
                              <pre className="text-slate-300 whitespace-pre-wrap">
                                {JSON.stringify(parsedDetails || {}, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
