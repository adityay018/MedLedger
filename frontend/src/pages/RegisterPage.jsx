import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  FileText, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Info
} from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'MANUFACTURER', label: 'Manufacturer', desc: 'Pharmaceutical batch production, QA lab testing, serialization' },
  { value: 'DISTRIBUTOR', label: 'Distributor', desc: 'Wholesale cold-chain logistics, freight custody transfer, transit' },
  { value: 'PHARMACY', label: 'Pharmacy', desc: 'Retail healthcare facility, patient dispensing, unit verification' },
  { value: 'REGULATOR', label: 'Regulator', desc: 'National health authority, safety surveillance, recall oversight' }
];

export default function RegisterPage({ onNavigateLogin }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    requested_role: 'MANUFACTURER',
    requested_org_name: '',
    organization_details: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const res = await register(formData);
      setSuccessData(res);
    } catch (err) {
      setErrorMessage(err.message || 'Registration request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black text-slate-100">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="bg-white py-10 px-8 shadow-2xl rounded-2xl border border-slate-200 text-slate-800 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-300">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Registration Request Submitted
            </h2>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Status: PENDING ADMINISTRATOR APPROVAL
            </div>
            <p className="mt-4 text-xs text-slate-600 leading-relaxed">
              Your application for <strong>{formData.requested_org_name || 'your organization'}</strong> with role{' '}
              <strong className="text-forest-900">{formData.requested_role}</strong> has been logged to the MedLedger security registry.
            </p>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              An authorized System Administrator will review your organization details and license credentials before granting account access.
            </p>

            <button
              type="button"
              onClick={onNavigateLogin}
              className="mt-6 w-full py-2.5 px-4 rounded-lg bg-forest-800 hover:bg-forest-900 text-white text-sm font-semibold transition-all shadow-md cursor-pointer"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-forest-800 flex items-center justify-center shadow-lg shadow-emerald-900/40 border border-emerald-500/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              MedLedger
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Registration
              </span>
            </span>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              Multi-Organization Supply Chain Ledger
            </p>
          </div>
        </div>

        <h2 className="mt-6 text-center text-xl font-bold tracking-tight text-white">
          Apply for Organization Portal Access
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Registrations require Administrator approval. Administrator privileges cannot be requested publicly.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-200 text-slate-800">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">
                {errorMessage}
              </div>
            </div>
          )}

          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Zero-Trust Onboarding Policy:</strong> All new registrations remain in <strong>PENDING</strong> status until an authorized Administrator validates your credentials and links your account to a verified organization entity.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name of Authorized Representative
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 transition-colors"
                    placeholder="Dr. Jane Doe"
                  />
                </div>
              </div>

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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 transition-colors"
                    placeholder="jane.doe@company.com"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Password (min. 8 characters)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 transition-colors"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization / Entity Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.requested_org_name}
                    onChange={(e) => setFormData({ ...formData, requested_org_name: e.target.value })}
                    className="block w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 transition-colors"
                    placeholder="e.g. Apex BioTech Laboratories Ltd"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Requested Supply Chain Operational Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {ROLE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      formData.requested_role === opt.value
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="requested_role"
                      value={opt.value}
                      checked={formData.requested_role === opt.value}
                      onChange={(e) => setFormData({ ...formData, requested_role: e.target.value })}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="font-bold">{opt.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organization Details & Regulatory Credentials
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={formData.organization_details}
                  onChange={(e) => setFormData({ ...formData, organization_details: e.target.value })}
                  className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 transition-colors"
                  placeholder="e.g. Manufacturing License: MFG-CDSCO-2026-8801 | Registered HQ: 124 Innovation Way, Boston MA | Phone: +1-617-555-0199"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Provide license numbers and corporate address for identity verification by the administrator.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-3 flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-forest-800 hover:bg-forest-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-all shadow-md shadow-emerald-950/20 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting Application...</span>
                </>
              ) : (
                <span>Submit Registration for Administrator Review</span>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            Already have an approved account?{' '}
            <button
              type="button"
              onClick={onNavigateLogin}
              className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Sign in to portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
