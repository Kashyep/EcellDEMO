"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

interface ToastItem {
  id: string;
  text: string;
}

interface ToastContextType {
  showToast: (text: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((text: string) => {
    if (!text) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, text }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-[calc(24px+env(safe-area-inset-bottom,0px))] left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex max-w-[calc(100vw-32px)] items-center gap-2.5 rounded-[var(--radius)] bg-[var(--panel)] px-4 py-3 text-[0.95rem] text-[var(--panel-fg)] shadow-[4px_4px_0_var(--mark)] animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            <span
              className="h-2 w-2 flex-none rounded-full bg-[var(--ok)]"
              aria-hidden="true"
            />
            <span>{toast.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
