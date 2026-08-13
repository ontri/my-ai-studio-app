import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  const borderColors = {
    success: 'border-emerald-200 bg-white text-slate-800 shadow-lg shadow-emerald-500/5',
    error: 'border-rose-200 bg-white text-slate-800 shadow-lg shadow-rose-500/5',
    info: 'border-blue-200 bg-white text-slate-800 shadow-lg shadow-blue-500/5',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border ${borderColors[toast.type]} transition-all duration-200 animate-slide-up`}
    >
      <div className="flex items-center gap-2.5">
        {icons[toast.type]}
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
