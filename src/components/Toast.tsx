import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: number;
  kind: 'error' | 'success' | 'info';
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

const STYLES = {
  error: { box: 'border-rose-500/40 bg-rose-950/80 text-rose-100', Icon: AlertCircle },
  success: { box: 'border-emerald-500/40 bg-emerald-950/80 text-emerald-100', Icon: CheckCircle2 },
  info: { box: 'border-indigo-500/40 bg-indigo-950/80 text-indigo-100', Icon: Info },
} as const;

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, toast.kind === 'error' ? 7000 : 4000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  const { box, Icon } = STYLES[toast.kind];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md flex items-start gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl text-xs ${box}`}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <p className="flex-1 leading-relaxed">{toast.text}</p>
      <button onClick={onClose} aria-label="Close" className="opacity-70 hover:opacity-100 cursor-pointer">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
