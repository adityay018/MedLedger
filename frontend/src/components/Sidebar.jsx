import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Pill, 
  Layers, 
  FlaskConical, 
  Package, 
  Truck, 
  AlertTriangle, 
  Receipt, 
  Database, 
  ShieldCheck,
  UserCheck,
  FileText,
  Building2
} from 'lucide-react';

export default function Sidebar({ currentTab, onSelectTab, dbMode, user }) {
  // Define full catalogue of modules with allowed role matrix
  const allMenuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      roles: ['ADMINISTRATOR', 'MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY', 'REGULATOR'] 
    },
    { 
      id: 'users', 
      label: 'User Accounts & RBAC', 
      icon: UserCheck, 
      badge: 'Admin',
      roles: ['ADMINISTRATOR'] 
    },
    { 
      id: 'audit-logs', 
      label: 'Audit & Compliance', 
      icon: FileText,
      badge: 'CFR 21',
      roles: ['ADMINISTRATOR', 'REGULATOR'] 
    },
    { 
      id: 'drugs', 
      label: 'Medicine Catalog', 
      icon: Pill,
      roles: ['ADMINISTRATOR', 'MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY', 'REGULATOR'] 
    },
    { 
      id: 'batches', 
      label: 'Batches', 
      icon: Layers,
      roles: ['ADMINISTRATOR', 'MANUFACTURER', 'DISTRIBUTOR', 'REGULATOR'] 
    },
    { 
      id: 'packages', 
      label: 'Packages & QR', 
      icon: Package,
      roles: ['ADMINISTRATOR', 'MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY', 'REGULATOR'] 
    },
    { 
      id: 'shipments', 
      label: 'Shipments', 
      icon: Truck,
      roles: ['ADMINISTRATOR', 'MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY', 'REGULATOR'] 
    },
    { 
      id: 'quality-tests', 
      label: 'Quality Tests', 
      icon: FlaskConical,
      roles: ['ADMINISTRATOR', 'MANUFACTURER', 'REGULATOR'] 
    },
    { 
      id: 'recalls', 
      label: 'Safety Recalls', 
      icon: AlertTriangle,
      roles: ['ADMINISTRATOR', 'MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY', 'REGULATOR'] 
    },
    { 
      id: 'dispensing', 
      label: 'Dispensing Events', 
      icon: Receipt,
      roles: ['ADMINISTRATOR', 'PHARMACY', 'REGULATOR'] 
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: Database, 
      badge: '15 Qs',
      roles: ['ADMINISTRATOR', 'MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY', 'REGULATOR'] 
    },
    { 
      id: 'verify', 
      label: 'Package Verification', 
      icon: ShieldCheck, 
      highlight: true,
      roles: ['ADMINISTRATOR', 'MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY', 'REGULATOR'] 
    },
    { 
      id: 'parties', 
      label: 'Supply Chain Parties', 
      icon: Users,
      roles: ['ADMINISTRATOR', 'REGULATOR'] 
    },
  ];

  const userRole = user?.role || 'ADMINISTRATOR';

  // Filter items visible to this specific role
  const visibleItems = allMenuItems.filter((item) => 
    !item.roles || item.roles.includes(userRole)
  );

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-forest-800 text-white flex items-center justify-center shadow-md shadow-forest-900/10">
          <ShieldCheck className="w-6 h-6 text-emerald-300" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-lg text-slate-900 tracking-tight">MedLedger</h1>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-forest-100 text-forest-800">v1.2</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-tight">Supply Chain Intelligence</p>
        </div>
      </div>

      {/* User Scope Card */}
      {user && (
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="uppercase font-bold tracking-wider text-[10px] text-slate-400">Active Scope</span>
            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
              {user.role}
            </span>
          </div>
          {user.organizationName ? (
            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-slate-800 truncate">
              <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{user.organizationName}</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 mt-1 italic">
              {user.role === 'ADMINISTRATOR' ? 'System-Wide Jurisdiction' : 'Regulatory Authority'}
            </div>
          )}
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
          Authorized Modules
        </div>

        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-forest-800 text-white shadow-sm'
                  : item.highlight
                  ? 'text-forest-800 bg-forest-50/70 hover:bg-forest-100/70 border border-forest-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-forest-700' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-forest-950/40 text-emerald-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Database Status Indicator Card */}
      <div className="p-4 border-t border-slate-100 m-3 bg-slate-50 rounded-xl border border-slate-200/60">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Database Layer</span>
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
            dbMode === 'ORACLE' ? 'text-emerald-700' : dbMode === 'OFFLINE' ? 'text-rose-600' : 'text-amber-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              dbMode === 'ORACLE' ? 'bg-emerald-500 animate-pulse' : dbMode === 'OFFLINE' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
            }`}></span>
            {dbMode === 'ORACLE' ? 'Oracle 21c (Live)' : dbMode === 'OFFLINE' ? 'Offline' : 'Simulation (Ready)'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 leading-tight">
          {dbMode === 'OFFLINE'
            ? 'Backend API unreachable or offline.'
            : '13 BCNF tables active with referential integrity.'}
        </p>
      </div>
    </aside>
  );
}
