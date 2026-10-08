import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-xl border border-slate-200 animate-slide-up max-w-md">
      {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
      {isError && <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
      {!isSuccess && !isError && <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />}
      
      <div className="flex-1 text-sm text-slate-800">
        <p className="font-medium">{toast.title || (isSuccess ? 'Success' : 'Notice')}</p>
        <p className="text-xs text-slate-500 mt-0.5">{toast.message}</p>
      </div>

      <button 
        onClick={onClose}
        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
