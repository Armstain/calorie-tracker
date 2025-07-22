'use client';

import { Toaster } from 'sonner';

// Clean Sonner toast container with default styling
export function ToastContainer() {
  return (
    <Toaster
      position="top-right"
      expand={true}
      richColors={true}
      closeButton={false}
      toastOptions={{
        duration: 5000,
      }}
    />
  );
}

// Export types for backward compatibility
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'loading';
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}