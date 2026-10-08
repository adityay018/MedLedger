import React from 'react';
import { Database, Search, ShieldCheck } from 'lucide-react';

export default function Navbar({ currentTab, onQuickVerify, dbMode }) {
  const titles = {
    dashboard: 'Supply Chain Dashboard',
    verify: 'Anti-Counterfeit Package Verification',
    parties: 'Supply Chain Parties (Superclass & Subclasses)',
    drugs: 'Pharmaceutical Drug Catalog',
    batches: 'Batch Manufacturing & QA Records',
    'quality-tests': 'Laboratory Quality Assurance Tests',
    packages: 'Serialized Packages & QR Codes',
    shipments: 'Custody Transfer Shipments',
    recalls: 'Regulatory & Manufacturer Recalls',
    dispensing: 'Retail Pharmacy Dispensing Events',
    analytics: 'Relational Database SQL Analytics (Q1 - Q12)'
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-base font-bold text-slate-800">{titles[currentTab] || 'MedLedger'}</h2>
        <p className="text-xs text-slate-500">Oracle DBMS Relational Architecture | DA2 University Project</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Verify Bar */}
        <button
          onClick={onQuickVerify}
          className="flex items-center gap-2 px-3 py-1.5 bg-forest-50 hover:bg-forest-100 text-forest-800 border border-forest-200 text-xs font-semibold rounded-lg transition-colors shadow-xs"
        >
          <ShieldCheck className="w-4 h-4 text-forest-700" />
          <span>Quick Verify QR</span>
        </button>

        {/* Database indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700 border border-slate-200">
          <Database className="w-3.5 h-3.5 text-forest-700" />
          <span>Engine: <strong className="text-forest-900">{dbMode === 'ORACLE' ? 'Oracle DB 21c' : 'Active Relational DB'}</strong></span>
        </div>
      </div>
    </header>
  );
}
