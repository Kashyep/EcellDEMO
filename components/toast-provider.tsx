"use client";

import { toast } from "sonner";

interface ToastContextType {
  showToast: (text: string) => void;
}

const api: ToastContextType = {
  showToast: (text: string) => {
    if (text) toast(text);
  },
};

/** Compatibility shim: toasts are rendered by Sonner's <Toaster /> in app/layout.tsx. */
export function useToast(): ToastContextType {
  return api;
}
