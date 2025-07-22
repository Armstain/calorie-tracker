'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';

export function useToast() {
  const success = useCallback((title: string, description?: string, duration?: number) => {
    return toast.success(title, {
      description,
      duration: duration || 5000,
    });
  }, []);

  const error = useCallback((title: string, description?: string, duration?: number) => {
    return toast.error(title, {
      description,
      duration: duration || 5000,
    });
  }, []);

  const info = useCallback((title: string, description?: string, duration?: number) => {
    return toast.info(title, {
      description,
      duration: duration || 5000,
    });
  }, []);

  const loading = useCallback((title: string, description?: string) => {
    return toast.loading(title, {
      description,
    });
  }, []);

  // Additional Sonner methods
  const promise = useCallback(<T>(promise: Promise<T>, options: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }) => {
    return toast.promise(promise, options);
  }, []);

  const dismiss = useCallback((toastId?: string | number) => {
    return toast.dismiss(toastId);
  }, []);

  const message = useCallback((title: string, description?: string, duration?: number) => {
    return toast(title, {
      description,
      duration: duration || 5000,
    });
  }, []);

  // Backward compatibility - these methods now use Sonner internally
  const addToast = useCallback((toastData: {
    type: 'success' | 'error' | 'info' | 'loading';
    title: string;
    description?: string;
    duration?: number;
    action?: { label: string; onClick: () => void };
  }) => {
    const { type, title, description, duration, action } = toastData;

    const options: {
      description?: string;
      duration?: number;
      action?: { label: string; onClick: () => void };
    } = {
      description,
      duration: type === 'loading' ? Infinity : (duration || 5000),
    };

    if (action) {
      options.action = {
        label: action.label,
        onClick: action.onClick,
      };
    }

    switch (type) {
      case 'success':
        return toast.success(title, options);
      case 'error':
        return toast.error(title, options);
      case 'info':
        return toast.info(title, options);
      case 'loading':
        return toast.loading(title, options);
      default:
        return toast(title, options);
    }
  }, []);

  const removeToast = useCallback((id: string | number) => {
    return toast.dismiss(id);
  }, []);

  const updateToast = useCallback((id: string | number, updates: {
    type?: 'success' | 'error' | 'info' | 'loading';
    title?: string;
    description?: string;
    duration?: number;
  }) => {
    // Sonner doesn't have direct update functionality, so we dismiss and create new
    toast.dismiss(id);
    return addToast({ type: 'info', title: 'Updated', ...updates });
  }, [addToast]);

  const clearToasts = useCallback(() => {
    return toast.dismiss();
  }, []);

  return {
    // Sonner-based methods
    success,
    error,
    info,
    loading,
    promise,
    dismiss,
    message,

    // Backward compatibility methods
    addToast,
    removeToast,
    updateToast,
    clearToasts,

    // For backward compatibility, return empty array since Sonner manages toasts internally
    toasts: [],
  };
}