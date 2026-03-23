import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

const COLORS: Record<ToastType, string> = {
  success: 'bg-[#141414] border-green-500 text-green-400',
  error:   'bg-[#141414] border-red-500 text-red-400',
  info:    'bg-[#141414] border-white/20 text-white',
};

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    '↗',
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed top-24 right-4 z-[300] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 border-2 shadow-xl max-w-xs ${COLORS[t.type]}`}
          >
            <span className="font-mono text-sm font-bold flex-shrink-0">{ICONS[t.type]}</span>
            <span className="font-mono text-[10px] uppercase font-bold leading-tight">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
