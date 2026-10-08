import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Database, Play, Code2, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';

export default function AnalyticsPage({ onToast }) {
  const [queries, setQueries] = useState([]);
  const [selectedQ, setSelectedQ] = useState('Q1');
  const [queryResult, setQueryResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoadingList(true);
        const res = await api.getAnalyticsList();
        setQueries(res.data);
        if (res.data.length > 0) {
          executeCurrentQuery(res.data[0].id);
        }
      } catch (err) {
        if (onToast) onToast({ type: 'error', title: 'Error', message: 'Failed to load queries list' });
      } finally {
        setLoadingList(false);
      }
    }
    loadCatalog();
  }, []);

  const executeCurrentQuery = async (qId) => {
    setSelectedQ(qId);
    try {
      setLoading(true);
      const res = await api.runAnalyticsQuery(qId);
      setQueryResult(res);
      if (onToast) onToast({ type: 'success', title: 'Query Executed', message: `Query ${qId} executed successfully.` });
    } catch (err) {
      if (onToast) onToast({ type: 'error', title: 'Query Error', message: err.message || 'Execution failed' });
    } finally {
      setLoading(false);
    }
  };

  const currentMeta = queries.find(q => q.id === selectedQ);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-forest-800 text-xs font-bold uppercase tracking-wider mb-1">
          <Database className="w-4 h-4 text-forest-700" />
          <span>Relational DBMS Query Catalogue</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SQL Analytics & Advanced Queries</h1>
        <p className="text-sm text-slate-500 max-w-3xl mt-1">
          Demonstrates advanced Oracle SQL concepts: 3-5 table INNER/LEFT joins, self-joins on ISA superclasses, aggregations, GROUP BY, HAVING, subqueries, and EXISTS predicates.
        </p>
      </div>

      {/* Query Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {queries.map((q) => (
          <button
            key={q.id}
            onClick={() => executeCurrentQuery(q.id)}
            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
              selectedQ === q.id
                ? 'bg-forest-800 text-white border-forest-800 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="font-bold mr-1.5">{q.id}:</span>
            <span>{q.title.split(' ')[0]} {q.title.split(' ')[1] || ''}...</span>
          </button>
        ))}
      </div>

      {/* Query Execution Workspace */}
      {currentMeta && (
        <div className="med-card p-6 space-y-6">
          {/* Query Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-forest-100 text-forest-800 font-bold text-xs">{currentMeta.id}</span>
                <h2 className="text-lg font-bold text-slate-900">{currentMeta.title}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">{currentMeta.description}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                <Layers className="w-3.5 h-3.5 text-forest-700" />
                <span>DBMS Concept: <strong>{currentMeta.concept}</strong></span>
              </div>
            </div>

            <button
              onClick={() => executeCurrentQuery(selectedQ)}
              disabled={loading}
              className="btn-primary self-start md:self-center"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{loading ? 'Executing...' : 'Run Query'}</span>
            </button>
          </div>

          {/* SQL Syntax Viewer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                Oracle SQL Syntax (database/05_queries.sql)
              </span>
            </div>
            <pre className="p-4 bg-slate-900 text-emerald-300 font-mono text-xs rounded-xl overflow-x-auto shadow-inner leading-relaxed">
              <code>{queryResult?.sql || 'Loading SQL syntax...'}</code>
            </pre>
          </div>

          {/* Results Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Query Output ({queryResult?.count || 0} rows retrieved)
              </span>
              {queryResult?.executionEngine && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {queryResult.executionEngine}
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-forest-700" />
                <span>Executing relational query against database engine...</span>
              </div>
            ) : queryResult && queryResult.rows && queryResult.rows.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs med-table">
                  <thead>
                    <tr>
                      {queryResult.columns.map((col, idx) => (
                        <th key={idx}>{col.replace(/_/g, ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queryResult.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {queryResult.columns.map((col, cIdx) => (
                          <td key={cIdx}>
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-slate-300 italic">NULL</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm bg-slate-50 rounded-xl">
                No matching records returned for this query predicate.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
