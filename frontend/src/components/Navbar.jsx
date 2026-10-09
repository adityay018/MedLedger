import React, { useState } from 'react';
import { Database, Search, ShieldCheck, LogOut, User, Building2, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ currentTab, onQuickVerify, dbMode }) {
  const { user, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const titles = {
    dashboard: 'Supply Chain Dashboard',
    users: 'Identity & Access Control (RBAC)',
    'audit-logs': 'System Audit & Compliance Records',
    verify: 'Anti-Counterfeit Package Verification',
    parties: 'Supply Chain Parties (Superclass & Subclasses)',
    drugs: 'Pharmaceutical Drug Catalog',
    batches: 'Batch Manufacturing & QA Records',
    'quality-tests': 'Laboratory Quality Assurance Tests',
    packages: 'Serialized Packages & QR Codes',
    shipments: 'Custody Transfer Shipments',
    recalls: 'Regulatory & Manufacturer Recalls',
    dispensing: 'Retail Pharmacy Dispensing Events',
    analytics: 'Supply Chain Analytics (Q1 - Q15)'
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ADMINISTRATOR': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'MANUFACTURER': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'DISTRIBUTOR': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PHARMACY': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REGULATOR': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-base font-bold text-slate-800">{titles[currentTab] || 'MedLedger'}</h2>
        <p className="text-xs text-slate-500">Traceability, Quality & Compliance | Enterprise Relational Architecture</p>
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
          <Database className={`w-3.5 h-3.5 ${dbMode === 'ORACLE' ? 'text-forest-700' : dbMode === 'OFFLINE' ? 'text-rose-600' : 'text-amber-700'}`} />
          <span>
            Engine:{' '}
            <strong className={`font-semibold ${dbMode === 'ORACLE' ? 'text-forest-900' : dbMode === 'OFFLINE' ? 'text-rose-800' : 'text-amber-900'}`}>
              {dbMode === 'ORACLE'
                ? 'Oracle 21c (Persistent)'
                : dbMode === 'OFFLINE'
                ? 'Backend Disconnected'
                : 'Simulation Storage (Fallback)'}
            </strong>
          </span>
        </div>

        {/* User Profile Pill & Dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 pl-2.5 pr-3 py-1.5 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-all text-left shadow-xs"
            >
              <div className="w-7 h-7 rounded-lg bg-forest-800 text-white flex items-center justify-center font-bold text-xs">
                {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {user.fullName || user.email.split('@')[0]}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border uppercase ${getRoleBadgeStyle(user.role)}`}>
                    {user.role}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-xs"
                onMouseLeave={() => setProfileDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 space-y-1">
                  <p className="font-bold text-slate-900">{user.fullName || 'Authorized User'}</p>
                  <p className="text-slate-500 font-mono text-[11px] truncate">{user.email}</p>
                  {user.organizationName && (
                    <div className="flex items-center gap-1 text-slate-600 font-medium text-[11px] pt-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{user.organizationName}</span>
                    </div>
                  )}
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
