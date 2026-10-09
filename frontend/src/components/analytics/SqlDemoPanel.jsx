import React, { useState } from 'react';
import { Code2, Copy, Check, Info, ShieldCheck, Database, BookOpen } from 'lucide-react';

export default function SqlDemoPanel({ currentQuery, queries = [], executionEngine }) {
  const [copied, setCopied] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);

  const handleCopySql = () => {
    if (!currentQuery?.sql) return;
    navigator.clipboard.writeText(currentQuery.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Information Banner on Oracle SQL Execution Architecture */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/80 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-forest-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800">
              Enterprise Oracle SQL Architecture & Query Inspector
            </span>
            <p className="text-slate-600">
              Every query displayed in this analytics console executes through the Express backend against the Oracle relational schema (<code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">database/04_queries.sql</code>).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 flex items-center gap-1.5 shadow-2xs">
            <Database className="w-3.5 h-3.5 text-forest-700" />
            <span>{executionEngine || 'Oracle 21c Database Engine'}</span>
          </span>
          <button
            onClick={() => setShowCatalog(!showCatalog)}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium flex items-center gap-1 shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>{showCatalog ? 'Hide Query Index' : 'View All 15 Queries'}</span>
          </button>
        </div>
      </div>

      {/* Expandable 15 Query Index */}
      {showCatalog && (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-forest-700" />
              <span>Full 15 Oracle SQL Query Catalogue (BCNF Schema Compliance)</span>
            </h4>
            <span className="text-xs text-slate-400">15 / 15 Implemented</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {queries.map((q) => (
              <div 
                key={q.id}
                className={`p-2.5 rounded-lg border text-xs transition-colors ${
                  currentQuery?.id === q.id 
                    ? 'bg-forest-50 border-forest-300 text-forest-900 font-medium'
                    : 'bg-slate-50/70 border-slate-200/80 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-forest-800">{q.id}:</span>
                  <span className="text-slate-400 text-[10px] uppercase font-mono">{q.category.split(' ')[0]}</span>
                </div>
                <div className="font-semibold text-slate-800 truncate mt-0.5">{q.title}</div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">{q.concept}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SQL Code Block */}
      {currentQuery && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Verified Oracle SQL Syntax ({currentQuery.id})</span>
            </span>
            <button
              onClick={handleCopySql}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">SQL Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-500" />
                  <span>Copy SQL</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 bg-slate-900 text-emerald-300 font-mono text-xs rounded-xl overflow-x-auto shadow-inner leading-relaxed border border-slate-800">
            <code>{currentQuery.sql || '-- SQL definition not loaded'}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
