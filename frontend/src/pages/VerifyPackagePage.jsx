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
  Truck,
  Info,
  Clock,
  FlaskConical,
  Store,
  ExternalLink
} from 'lucide-react';

export default function VerifyPackagePage({ onToast }) {
  const [identifier, setIdentifier] = useState('QR-MED-208-01-G1');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async (val) => {
    const idToVerify = val !== undefined ? val : identifier;
    if (!idToVerify || !idToVerify.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.verifyPackage(idToVerify.trim());
      setResult(res);

      if (onToast) {
        if (res.verdict.startsWith('VERIFIED')) {
          onToast({ 
            type: 'success', 
            title: 'Package Verified', 
            message: 'Database-backed record found with no active recall or quality failure.' 
          });
        } else if (res.verdict === 'RECALL ALERT') {
          onToast({ 
            type: 'error', 
            title: 'Recall Alert', 
            message: 'Associated batch is under active regulatory recall.' 
          });
        } else if (res.verdict === 'QUALITY WARNING') {
          onToast({ 
            type: 'error', 
            title: 'Quality Warning', 
            message: 'Failed quality test or security breach recorded.' 
          });
        } else {
          onToast({ 
            type: 'error', 
            title: 'Not Found', 
            message: 'No matching package record exists in MedLedger.' 
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Verification execution failed.');
      setResult(null);
      if (onToast) {
        onToast({ type: 'error', title: 'Verification Error', message: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const sampleQrs = [
    { label: 'Authentic Pack (Paxlovid)', qr: 'QR-MED-208-01-G1', type: 'valid' },
    { label: 'Recalled Lot (Remdesivir)', qr: 'QR-MED-201-01-A1', type: 'recall' },
    { label: 'Failed Assay Lot (Cefixime)', qr: 'QR-MED-204-01-D1', type: 'warning' },
    { label: 'Dispensed Unit (Amoxicillin)', qr: 'QR-MED-203-01-C1', type: 'dispensed' },
    { label: 'Counterfeit / Unregistered QR', qr: 'QR-COUNTERFEIT-FAKE-999', type: 'fake' }
  ];

  // Map verdict for UI badge/card
  const getVerdictStyle = (verdict) => {
    if (!verdict) return { border: 'border-slate-300', headerBg: 'bg-slate-700', text: 'text-white', badge: 'bg-slate-100 text-slate-800' };
    if (verdict.startsWith('VERIFIED')) {
      return { 
        border: 'border-emerald-500', 
        headerBg: 'bg-emerald-600', 
        text: 'text-white', 
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: CheckCircle2 
      };
    }
    if (verdict === 'RECALL ALERT') {
      return { 
        border: 'border-rose-600', 
        headerBg: 'bg-rose-600', 
        text: 'text-white', 
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        icon: AlertTriangle 
      };
    }
    if (verdict === 'QUALITY WARNING') {
      return { 
        border: 'border-amber-500', 
        headerBg: 'bg-amber-600', 
        text: 'text-white', 
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: AlertTriangle 
      };
    }
    return { 
      border: 'border-slate-400', 
      headerBg: 'bg-slate-700', 
      text: 'text-white', 
      badge: 'bg-slate-100 text-slate-800 border-slate-300',
      icon: XCircle 
    };
  };

  const style = result ? getVerdictStyle(result.verdict) : null;
  const VerdictIcon = style?.icon || ShieldCheck;
  const pkg = result?.package;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-forest-50 border border-forest-200 text-forest-800 text-xs font-bold rounded-full">
          <ShieldCheck className="w-4 h-4 text-forest-700" />
          <span>PL/SQL verify_package Anti-Counterfeit Verification Protocol</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Package Provenance & Verification
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Verify digital authenticity of pharmaceutical packages across manufacturer, distributor, and pharmacy chain-of-custody.
        </p>
      </div>

      {/* Verification Input Box */}
      <div className="med-card p-6 shadow-md border-forest-200/80 bg-gradient-to-b from-white to-forest-50/20 space-y-5">
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
              disabled={loading || !identifier.trim()}
              className="btn-primary py-3 px-6 text-sm font-bold tracking-wide uppercase rounded-xl"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'VERIFY PACKAGE'}</span>
            </button>
          </div>

          {/* Quick Demo Preset Buttons */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Quick Verification Presets (Sample Verification Scenarios):
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
                      : s.type === 'warning'
                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
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

        {/* Prominent Verification Disclaimer */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-forest-700 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Important Audit Notice:</strong> This panel performs <em>database-backed record verification</em> against the MedLedger relational database. Record presence confirms cryptographic serialization, batch traceability, and regulatory status in the system; it does not physically replace chemical laboratory spectrometry against physical counterfeit replicas.
          </p>
        </div>
      </div>

      {/* Verification Error */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Verification Result Card */}
      {result && (
        <div className={`med-card overflow-hidden shadow-lg border-2 ${style.border}`}>
          {/* Header Banner with Priority Verdict */}
          <div className={`p-6 flex items-center justify-between ${style.headerBg} ${style.text}`}>
            <div className="flex items-center gap-3">
              <VerdictIcon className="w-9 h-9" />
              <div>
                <span className="text-xs uppercase tracking-wider font-bold opacity-80 block">
                  Verification Verdict
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  {result.verdict}
                </h2>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-black/20 backdrop-blur-xs">
                PL/SQL verify_package()
              </span>
            </div>
          </div>

          {/* Verdict Description */}
          <div className="p-5 bg-slate-50 border-b border-slate-200">
            <p className="text-sm font-medium text-slate-800 leading-relaxed">
              {result.statusText}
            </p>
          </div>

          {/* Lineage Breakdown if Record Found */}
          {pkg ? (
            <div className="p-6 space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Cryptographic & Supply Chain Lineage Report
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Package Serialization */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-forest-800 font-semibold text-xs">
                    <Package className="w-4 h-4 text-forest-700" />
                    <span>Serialized Package Unit</span>
                  </div>
                  <div className="font-mono text-sm font-bold text-slate-900">{pkg.qr_code}</div>
                  <div className="text-xs text-slate-600">
                    Package ID: <strong>#{pkg.package_id}</strong> | Size: <strong>{pkg.package_size}</strong>
                  </div>
                  <div className="text-xs text-slate-600">
                    Packaged Date: <strong>{pkg.packaged_at}</strong> | Total Units: <strong>{pkg.quantity_total}</strong>
                  </div>
                  <div className="pt-1 flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Package Status:</span>
                    <StatusBadge status={pkg.status} />
                  </div>
                </div>

                {/* 2. Drug Formulation */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-forest-800 font-semibold text-xs">
                    <Pill className="w-4 h-4 text-forest-700" />
                    <span>Formulated Drug Product</span>
                  </div>
                  <div className="text-base font-bold text-slate-900">{pkg.drug_name}</div>
                  <div className="text-xs text-slate-600">
                    Strength: <strong>{pkg.strength}</strong> | Dosage Form: <strong>{pkg.dosage_form}</strong>
                  </div>
                  <div className="text-xs text-slate-600">
                    Manufacturer: <strong>{pkg.manufacturer_name}</strong>
                  </div>
                </div>

                {/* 3. Manufactured Batch */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-forest-800 font-semibold text-xs">
                    <Layers className="w-4 h-4 text-forest-700" />
                    <span>Manufactured Batch Lot</span>
                  </div>
                  <div className="text-base font-bold text-slate-900">Batch #{pkg.batch_id}</div>
                  <div className="text-xs text-slate-600">
                    Manufacture Date: <strong>{pkg.manufacture_date}</strong>
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-500">Batch Status:</span>
                    <StatusBadge status={pkg.batch_status} />
                  </div>
                </div>

                {/* 4. Quality & Recall Summary */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-forest-800 font-semibold text-xs">
                    <FlaskConical className="w-4 h-4 text-forest-700" />
                    <span>Quality & Recall Status</span>
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div>
                      <span className="text-slate-500 block">Quality Assay:</span>
                      <strong className={`text-xs ${pkg.quality_test_status?.includes('FAILED') ? 'text-rose-700 font-bold' : 'text-slate-800'}`}>
                        {pkg.quality_test_status || 'Assay Cleared'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Recall Status:</span>
                      {pkg.recall_notice ? (
                        <div className="text-xs text-rose-700 font-bold bg-rose-50 p-1.5 rounded border border-rose-200">
                          ACTIVE RECALL: {pkg.recall_notice.reason}
                        </div>
                      ) : (
                        <span className="text-emerald-700 font-semibold">✓ No active recalls</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Dispensing Information */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 text-forest-800 font-semibold text-xs">
                  <Store className="w-4 h-4 text-forest-700" />
                  <span>Retail Dispensing Information</span>
                </div>
                {pkg.dispensing_info ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Dispensed At:</span>
                      <strong>{pkg.dispensing_info.dispensed_at}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Pharmacy:</span>
                      <strong>{pkg.dispensing_info.pharmacy_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Patient / Units:</span>
                      <strong>Patient #{pkg.dispensing_info.patient_id} ({pkg.dispensing_info.quantity} units)</strong>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">
                    Package has not been dispensed. Currently active in wholesale/retail inventory.
                  </div>
                )}
              </div>

              {/* 6. Shipment Custody Transfer History */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-forest-800 font-semibold text-xs">
                    <Truck className="w-4 h-4 text-forest-700" />
                    <span>Shipment Custody History ({pkg.shipment_history?.length || 0} Transfers)</span>
                  </div>
                </div>

                {pkg.shipment_history && pkg.shipment_history.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs med-table">
                      <thead>
                        <tr>
                          <th>Shipment ID</th>
                          <th>Shipment Date</th>
                          <th>Sender Node</th>
                          <th>Receiver Node</th>
                          <th>Transport Mode</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pkg.shipment_history.map((s, idx) => (
                          <tr key={idx}>
                            <td className="font-mono font-bold">#{s.shipment_id || s.SHIPMENT_ID}</td>
                            <td>{s.shipment_date || s.SHIPMENT_DATE}</td>
                            <td className="font-semibold">{s.sender_name || s.SENDER_NAME}</td>
                            <td className="font-semibold">{s.receiver_name || s.RECEIVER_NAME}</td>
                            <td>{s.transport_mode || s.mode || s.MODE}</td>
                            <td>
                              <StatusBadge status={s.status || s.STATUS} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    No outbound shipments registered yet for this package unit.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-sm space-y-2">
              <XCircle className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="font-bold text-slate-700">Package Record Not Found</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No matching serialized package with identifier "{identifier}" exists in the MedLedger BCNF schema.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
