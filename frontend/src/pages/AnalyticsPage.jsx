import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import AnalyticsTable from '../components/analytics/AnalyticsTable';
import SqlDemoPanel from '../components/analytics/SqlDemoPanel';
import { 
  Database, 
  Play, 
  Layers, 
  RefreshCw, 
  Search, 
  AlertCircle,
  Pill,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Sparkles
} from 'lucide-react';

const CATEGORIES = [
  { id: 'ALL', label: 'All Queries', icon: Database },
  { id: 'Drug & Batch Intelligence', label: 'Drug & Batch Intelligence', icon: Pill },
  { id: 'Package Tracking', label: 'Package Tracking', icon: Package },
  { id: 'Shipment Analytics', label: 'Shipment Analytics', icon: Truck },
  { id: 'Quality & Compliance', label: 'Quality & Compliance', icon: CheckCircle2 },
  { id: 'Recall Management', label: 'Recall Management', icon: AlertTriangle },
  { id: 'Manufacturer & Pharmacy Performance', label: 'Manufacturer & Pharmacy', icon: Building2 },
];

export default function AnalyticsPage({ onToast }) {
  const [queries, setQueries] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedQId, setSelectedQId] = useState('Q1');
  const [queryResult, setQueryResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [databaseMode, setDatabaseMode] = useState(null);

  // Parameters for parameterized queries (Q13, Q15)
  const [paramInput, setParamInput] = useState('QR-MED-208-01-G1');

  // Load catalog of queries on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const res = await api.getAnalyticsList();
        setQueries(res.data);
        setDatabaseMode(res.databaseMode);
        if (res.data && res.data.length > 0) {
          executeQuery(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load query catalogue:', err);
        setError('Failed to connect to backend analytics API. Please verify server status.');
        if (onToast) onToast({ type: 'error', title: 'Connection Error', message: 'Analytics catalogue unreachable.' });
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const executeQuery = async (qId, customParam) => {
    setSelectedQId(qId);
    setError(null);
    setLoading(true);

    try {
      const qMeta = queries.find(q => q.id === qId);
      const params = {};

      if (qId === 'Q13') {
        params.packageId = customParam !== undefined ? customParam : paramInput;
      } else if (qId === 'Q15') {
        params.identifier = customParam !== undefined ? customParam : paramInput;
      }

      // Execute via backend endpoint
      const res = await api.runAnalyticsQuery(qId, params);
      setQueryResult(res);

      if (onToast) {
        onToast({ 
          type: 'success', 
          title: `Query ${qId} Executed`, 
          message: `${res.title} returned ${res.count} record(s).` 
        });
      }
    } catch (err) {
      console.error(`Execution error on ${qId}:`, err);
      setError(err.message || 'Database execution failed.');
      setQueryResult(null);
      if (onToast) {
        onToast({ 
          type: 'error', 
          title: `Execution Failed (${qId})`, 
          message: err.message || 'Error executing SQL query.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredQueries = queries.filter(q => {
    if (activeCategory === 'ALL') return true;
    return q.category === activeCategory;
  });

  const currentMeta = queries.find(q => q.id === selectedQId) || queryResult;
  const isParameterized = selectedQId === 'Q13' || selectedQId === 'Q15';

  const demoExamples = [
    { label: 'Paxlovid Pack (Valid)', value: 'QR-MED-208-01-G1' },
    { label: 'Remdesivir Lot (Recalled)', value: 'QR-MED-201-01-A1' },
    { label: 'Amoxicillin (Dispensed)', value: 'QR-MED-203-01-C1' },
    { label: 'Package #1 (Numeric ID)', value: '1' }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-forest-800 text-xs font-bold uppercase tracking-wider mb-1">
          <Database className="w-4 h-4 text-forest-700" />
          <span>Oracle Relational DBMS Analytics Module</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Supply Chain Analytics
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl mt-1.5 leading-relaxed">
          Trace pharmaceutical products, monitor quality and analyze supply-chain operations across all 13 BCNF relational entities.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                isActive
                  ? 'bg-forest-800 text-white border-forest-800 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-300' : 'text-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Query Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredQueries.map((q) => {
          const isSelected = selectedQId === q.id;
          return (
            <button
              key={q.id}
              onClick={() => executeQuery(q.id)}
              className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-forest-50/80 border-forest-600 shadow-sm ring-1 ring-forest-600'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    isSelected ? 'bg-forest-800 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {q.id}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    {q.category.split(' ')[0]}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {q.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {q.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-forest-700 font-medium truncate max-w-[200px]">
                  {q.concept.split(',')[0]}
                </span>
                <span className={`font-semibold ${isSelected ? 'text-forest-800' : 'text-slate-400'}`}>
                  {isSelected ? 'Active' : 'Run →'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Parameter Input Panel for Q13 and Q15 */}
      {isParameterized && (
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-forest-900">
            <Search className="w-4 h-4 text-forest-700" />
            <span>Parameterized Query Input (Safe Oracle Bind Variable :ident)</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={paramInput}
              onChange={(e) => setParamInput(e.target.value)}
              placeholder="Enter serialized Package ID or QR Code (e.g. QR-MED-208-01-G1)..."
              className="flex-1 px-3.5 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-forest-600 shadow-2xs"
            />
            <button
              onClick={() => executeQuery(selectedQId, paramInput)}
              disabled={loading || !paramInput.trim()}
              className="btn-primary text-xs py-2 px-4 whitespace-nowrap"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>Execute with Parameter</span>
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-500 font-medium mr-1">Quick Demo Binds:</span>
            {demoExamples.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setParamInput(ex.value);
                  executeQuery(selectedQId, ex.value);
                }}
                className="px-2 py-0.5 rounded text-[11px] bg-white border border-emerald-200 text-forest-800 hover:bg-emerald-100/60 transition-colors font-mono"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Execution Workspace Card */}
      <div className="med-card p-6 space-y-6">
        {/* Query Header Details */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-forest-100 text-forest-800 font-bold text-xs">
                {currentMeta?.id || selectedQId}
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                {currentMeta?.title || 'Relational Query'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
              {currentMeta?.description}
            </p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
              <Layers className="w-3.5 h-3.5 text-forest-700" />
              <span>DBMS Concept: <strong>{currentMeta?.concept}</strong></span>
            </div>
          </div>

          <button
            onClick={() => executeQuery(selectedQId)}
            disabled={loading}
            className="btn-primary self-start md:self-center"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{loading ? 'Executing SQL...' : 'Re-run Query'}</span>
          </button>
        </div>

        {/* Error Alert Display */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Query Execution Failed</div>
              <div className="mt-0.5 text-rose-700">{error}</div>
            </div>
          </div>
        )}

        {/* Reusable Query Results Table */}
        <AnalyticsTable
          columns={queryResult?.columns || currentMeta?.columns || []}
          rows={queryResult?.rows || []}
          loading={loading}
        />

        {/* Oracle SQL Architecture & Query Inspector Panel */}
        <SqlDemoPanel
          currentQuery={currentMeta}
          queries={queries}
          executionEngine={queryResult?.executionEngine}
        />
      </div>
    </div>
  );
}
