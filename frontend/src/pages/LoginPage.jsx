import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Building2, 
  Truck, 
  Store, 
  Award,
  Eye,
  EyeOff,
  Clock,
  Sparkles
} from 'lucide-react';

const DEMO_PRESETS = [
  {
    role: 'ADMINISTRATOR',
    label: 'Administrator',
    email: 'admin@medledger.io',
    pass: 'AdminPass123!',
    desc: 'System governance, approvals, and audit trails',
    icon: Award,
    color: 'border-purple-200 bg-purple-50/50 text-purple-800 hover:bg-purple-100/60'
  },
  {
    role: 'MANUFACTURER',
    label: 'Manufacturer',
    email: 'pfizer@medledger.io',
    pass: 'MfgPass123!',
    desc: 'Pfizer Global Supply (Batches & QA)',
    icon: Building2,
    color: 'border-emerald-200 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/60'
  },
  {
    role: 'DISTRIBUTOR',
    label: 'Distributor',
    email: 'distributor@medledger.io',
    pass: 'DistPass123!',
    desc: 'AmerisourceBergen (Logistics & Custody)',
    icon: Truck,
    color: 'border-blue-200 bg-blue-50/50 text-blue-800 hover:bg-blue-100/60'
  },
  {
    role: 'PHARMACY',
    label: 'Pharmacy',
    email: 'pharmacy@medledger.io',
    pass: 'PharmPass123!',
    desc: 'CVS Health #104 (Dispensing & Inventory)',
    icon: Store,
    color: 'border-teal-200 bg-teal-50/50 text-teal-800 hover:bg-teal-100/60'
  },
  {
    role: 'REGULATOR',
    label: 'Regulator',
    email: 'regulator@medledger.io',
    pass: 'RegPass123!',
    desc: 'US FDA (Recalls & System Traceability)',
    icon: ShieldCheck,
    color: 'border-amber-200 bg-amber-50/50 text-amber-800 hover:bg-amber-100/60'
  },
  {
    role: 'PENDING',
    label: 'Pending Applicant',
    email: 'pending@medledger.io',
    pass: 'PendingPass123!',
    desc: 'Apex Biotech (Awaiting Admin Approval)',
    icon: Clock,
    color: 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200/80'
  }
];

export default function LoginPage({ onNavigateRegister, onNavigatePublicVerify }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@medledger.io');
  const [password, setPassword] = useState('AdminPass123!');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setEmail(preset.email);
    setPassword(preset.pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-forest-800 flex items-center justify-center shadow-lg shadow-emerald-900/40 border border-emerald-500/30">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              MedLedger
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Enterprise
              </span>
            </span>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              Pharmaceutical Supply Chain Intelligence
            </p>
          </div>
        </div>

        <h2 className="mt-8 text-center text-xl font-bold tracking-tight text-white">
          Sign in to your organization portal
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Role-Based Access Control & Multi-Organization Supply Chain Ledger
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-200 text-slate-800">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">
                {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 transition-colors"
                  placeholder="name@organization.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 transition-colors"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-forest-800 hover:bg-forest-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-all shadow-md shadow-emerald-950/20 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick Demo Switcher
              </span>
              <span className="text-[10px] text-slate-400">Click to autofill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_PRESETS.map((p) => {
                const Icon = p.icon;
                const isSelected = email === p.email;
                return (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`text-left p-2 rounded-lg border text-xs transition-all ${p.color} ${
                      isSelected ? 'ring-2 ring-emerald-500 ring-offset-1' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{p.label}</span>
                    </div>
                    <div className="text-[10px] opacity-75 truncate mt-0.5">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer actions */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2.5 text-center text-xs text-slate-600">
            <div>
              New organization or regulatory body?{' '}
              <button
                type="button"
                onClick={onNavigateRegister}
                className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
              >
                Register an account
              </button>
            </div>
            <div>
              Patient or retail verification?{' '}
              <button
                type="button"
                onClick={onNavigatePublicVerify}
                className="font-medium text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
              >
                Verify a package without signing in →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
