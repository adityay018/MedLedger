import React from 'react';

export default function StatusBadge({ status }) {
  if (!status) return null;
  const s = String(status).toUpperCase();

  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['RELEASED', 'DELIVERED', 'PASSED', 'ACTIVE', 'COMPLETED', 'AUTHENTIC'].includes(s)) {
    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['RECALLED', 'FAILED', 'TAMPERED', 'RETURNED', 'INVALID'].includes(s)) {
    colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['IN_TRANSIT', 'DISPATCHED'].includes(s)) {
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['QUARANTINED', 'INVESTIGATING', 'PENDING'].includes(s)) {
    colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (['PACKAGED', 'DISPENSED', 'CREATED'].includes(s)) {
    colorClass = 'bg-sky-50 text-sky-700 border-sky-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {s.replace(/_/g, ' ')}
    </span>
  );
}
