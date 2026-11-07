import React from 'react';
import useToastStore from '../store/toastStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: 'bg-emerald-600 text-white shadow-emerald-500/20 border-emerald-500',
  error: 'bg-rose-600 text-white shadow-rose-500/20 border-rose-500',
  info: 'bg-indigo-600 text-white shadow-indigo-500/20 border-indigo-500',
  warning: 'bg-amber-600 text-white shadow-amber-500/20 border-amber-500',
};

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4">
      {toasts.map((t) => {
        const Icon = icons[t.type] || Info;
        const colorClass = styles[t.type] || styles.info;

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl shadow-xl border text-xs sm:text-sm font-semibold tracking-wide transition-all transform animate-in slide-in-from-top-3 fade-in duration-200 w-full ${colorClass}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

