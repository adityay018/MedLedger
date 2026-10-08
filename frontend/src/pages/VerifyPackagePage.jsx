import React, { useState } from 'react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { 
  ShieldCheck, 
  Search, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  QrCode, 
  Pill, 
  Layers, 
  Building2, 
  Calendar,
  Package,
  Sparkles
} from 'lucide-react';

export default function VerifyPackagePage({ onToast }) {
  const [identifier, setIdentifier] = useState('QR-MED-208-01-G1');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async (val) => {
    const idToVerify = val !== undefined ? val : identifier;
    if (!idToVerify.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.verifyPackage(idToVerify);
      setResult(res);
      if (onToast) {
        if (res.verdict.startsWith('AUTHENTIC')) {
          onToast({ type: 'success', title: 'Package Verified', message: 'Legitimate authenticity confirmed via MedLedger.' });
        } else {
          onToast({ type: 'error', title: 'Verification Alert', message: res.statusText });
        }
      }
    } catch (err) {
      setError(err.message || 'Verification failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const sampleQrs = [
    { label: 'Authentic Pack (Paxlovid)', qr: 'QR-MED-208-01-G1', type: 'valid' },
    { label: 'Recalled Lot (Remdesivir)', qr: 'QR-MED-201-01-A1', type: 'recall' },
    { label: 'Dispensed Unit (Amoxicillin)', qr: 'QR-MED-203-01-C1', type: 'dispensed' },
    { label: 'Counterfeit / Unregistered QR', qr: 'QR-COUNTERFEIT-FAKE-999', type: 'fake' }
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-forest-50 border border-forest-200 text-forest-800 text-xs font-bold rounded-full">
          <ShieldCheck className="w-4 h-4 text-forest-700" />
          <span>PL/SQL verify_package Anti-Counterfeit Protocol</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Package Provenance & Verification</h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Verify digital authenticity of pharmaceutical packages across manufacturer, distributor, and pharmacy chain-of-custody.
        </p>
      </div>

      {/* Verification Input Box */}
      <div className="med-card p-6 shadow-md border-forest-200/80 bg-gradient-to-b from-white to-forest-50/20">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <QrCode className="w-5 h-5 text-forest-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Scan or enter QR Code (e.g. QR-MED-208-01-G1) or Package ID..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600 shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-3 px-6 text-sm font-semibold rounded-xl"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Verify Authenticity'}</span>
            </button>
          </div>

          {/* Quick Demo Buttons */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Quick Test Cases (University Review Demo):
            </p>
            <div className="flex flex-wrap gap-2">
              {sampleQrs.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIdentifier(s.qr);
                    handleVerify(s.qr);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                    s.type === 'valid'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : s.type === 'recall'
                      ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                      : s.type === 'dispensed'
                      ? 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Verification Result Card */}
      {result && (
        <div className={`med-card overflow-hidden shadow-lg border-2 ${
          result.verdict.startsWith('AUTHENTIC')
            ? 'border-emerald-500'
            : result.verdict === 'RECALLED'
            ? 'border-rose-500'
            : result.verdict === 'INVALID'
            ? 'border-slate-400'
            : 'border-amber-500'
        }`}>
          {/* Header Banner */}
          <div className={`p-6 flex items-center justify-between ${
            result.verdict.startsWith('AUTHENTIC')
              ? 'bg-emerald-600 text-white'
              : result.verdict === 'RECALLED'
              ? 'bg-rose-600 text-white'
              : result.verdict === 'INVALID'
              ? 'bg-slate-700 text-white'
              : 'bg-amber-600 text-white'
          }`}>
            <div className="flex items-center gap-3">
              {result.verdict.startsWith('AUTHENTIC') && <CheckCircle2 className="w-8 h-8 text-emerald-200" />}
              {result.verdict === 'RECALLED' && <AlertTriangle className="w-8 h-8 text-rose-200" />}
              {result.verdict === 'INVALID' && <XCircle className="w-8 h-8 text-slate-300" />}
              <div>
                <span className="text-xs uppercase tracking-wider font-bold opacity-80">Verification Verdict</span>
                <h2 className="text-xl font-extrabold tracking-tight">{result.verdict}</h2>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-black/20 backdrop-blur-xs">
                PL/SQL verify_package()
              </span>
            </div>
          </div>

          {/* Verdict Description */}
          <div className="p-6 bg-slate-50 border-b border-slate-200/80">
            <p className="text-sm font-medium text-slate-800 leading-relaxed">
              {result.statusText}
            </p>
          </div>

          {/* Detailed Lineage Report */}
          {result.package ? (
            <div className="p-6 space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Cryptographic & Supply Chain Lineage
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Formulation */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                  <div className="flex items-center gap-2 text-forest-800 font-semibold text-xs">
                    <Pill className="w-4 h-4" />
                    <span>Formulated Product</span>
                  </div>
                  <div className="text-base font-bold text-slate-800">{result.package.DRUG_NAME || result.package.drug_name}</div>
                  <div className="text-xs text-slate-600">
                    Strength: <strong className="text-slate-800">{result.package.STRENGTH || result.package.strength}</strong> | Form: <strong className="text-slate-800">{result.package.DOSAGE_FORM || result.package.dosage_form}</strong>
                  </div>
                </div>

                {/* Batch & Manufacturing */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                  <div className="flex items-center gap-2 text-forest-800 font-semibold text-xs">
                    <Layers className="w-4 h-4" />
                    <span>Manufactured Batch</span>
                  </div>
                  <div className="text-base font-bold text-slate-800">Batch #{result.package.BATCH_ID || result.package.batch_id}</div>
                  <div className="text-xs text-slate-600">
                    Mfg: <strong className="text-slate-800">{result.package.MANUFACTURER_NAME || result.package.manufacturer_name}</strong>
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-500">Lot Status:</span>
                    <StatusBadge status={result.package.BATCH_STATUS || result.package.batch_status} />
                  </div>
                </div>

                {/* Package Serialization */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                  <div className="flex items-center gap-2 text-forest-800 font-semibold text-xs">
                    <Package className="w-4 h-4" />
                    <span>Serialized Unit</span>
                  </div>
                  <div className="font-mono text-sm font-bold text-slate-800">{result.package.QR_CODE || result.package.qr_code}</div>
                  <div className="text-xs text-slate-600">
                    Package ID: #{result.package.PACKAGE_ID || result.package.package_id} | Size: {result.package.PACKAGE_SIZE || result.package.package_size}
                  </div>
                  <div className="text-xs text-slate-600">
                    Total Units: {result.package.QUANTITY_TOTAL || result.package.quantity_total} | Packaged: {result.package.PACKAGED_AT || result.package.packaged_at}
                  </div>
                </div>

                {/* Regulatory / Recall Status */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                  <div className="flex items-center gap-2 text-forest-800 font-semibold text-xs">
                    <Building2 className="w-4 h-4" />
                    <span>Recall Assessment</span>
                  </div>
                  {(result.package.RECALL_ID || result.package.recall_notice) ? (
                    <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200 space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>ACTIVE REGULATORY RECALL NOTICE</span>
                      </div>
                      <p>{result.package.RECALL_REASON || result.package.recall_notice?.reason}</p>
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 font-medium">
                      ✓ No active recall notices registered against this batch.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              No matching package record or serial key exists in the MedLedger database.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
