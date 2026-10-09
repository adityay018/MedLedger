import React, { useState, useMemo } from 'react';
import StatusBadge from '../StatusBadge';
import { Search, Copy, Check, FilterX } from 'lucide-react';

export default function AnalyticsTable({ columns = [], rows = [], loading = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedQr, setCopiedQr] = useState(null);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedQr(text);
    setTimeout(() => setCopiedQr(null), 2000);
  };

  // Filter rows based on search term across all cells
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase().trim();
    return rows.filter(row => {
      return columns.some(col => {
        const val = row[col];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(term);
      });
    });
  }, [rows, columns, searchTerm]);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <div className="inline-block w-8 h-8 border-3 border-forest-800 border-t-transparent rounded-full animate-spin mb-3"></div>
        <div className="text-sm font-semibold text-slate-800">Executing Relational SQL Query...</div>
        <div className="text-xs text-slate-400 mt-1">Retrieving verified tuples from database engine</div>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
          0
        </div>
        <div className="text-sm font-semibold text-slate-700">No Tuples Returned</div>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          The query executed successfully, but no records currently satisfy the SQL predicate condition in the database.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Table Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Results Manifest
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
            {filteredRows.length} of {rows.length} {rows.length === 1 ? 'row' : 'rows'}
          </span>
        </div>

        {/* Search Filter */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter returned records..."
            className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-forest-600 focus:border-forest-600"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      {filteredRows.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500 flex flex-col items-center gap-2">
          <FilterX className="w-6 h-6 text-slate-400" />
          <span>No records match filter term "{searchTerm}"</span>
          <button
            onClick={() => setSearchTerm('')}
            className="text-forest-700 hover:underline font-semibold"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs bg-white">
          <table className="w-full text-xs med-table">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className="whitespace-nowrap">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                  {columns.map((col, cIdx) => {
                    const val = row[col];
                    const isStatus = col.includes('STATUS') && val;
                    const isQr = col === 'QR_CODE' && val;
                    const isNull = val === null || val === undefined;

                    return (
                      <td key={cIdx}>
                        {isNull ? (
                          <span className="text-slate-300 italic font-mono">NULL</span>
                        ) : isStatus ? (
                          <StatusBadge status={String(val)} />
                        ) : isQr ? (
                          <div className="flex items-center gap-1.5 font-mono text-slate-800 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80 w-max">
                            <span>{val}</span>
                            <button
                              onClick={() => handleCopy(val)}
                              className="text-slate-400 hover:text-forest-700 transition-colors"
                              title="Copy QR code"
                            >
                              {copiedQr === val ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className={typeof val === 'number' ? 'font-mono' : ''}>
                            {String(val)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
