'use client';

import { useState, useCallback } from 'react';
import { AppError, CameraError, ApiError, StorageError } from '@/types';
import { errorUtils } from '@/lib/utils';

interface ErrorState {
  error: AppError | null;
  isVisible: boolean;
  retryCount: number;
}

interface UseErrorHandlerReturn {
  error: AppError | null;
  isVisible: boolean;
  showError: (error: AppError | Error | string) => void;
  hideError: () => void;
  retry: (retryFn?: () => void | Promise<void>) => Promise<void>;
  canRetry: boolean;
}

export function useErrorHandler(maxRetries: number = 3): UseErrorHandlerReturn {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isVisible: false,
    retryCount: 0
  });

  const showError = useCallback((error: AppError | Error | string) => {
    let appError: AppError;

    if (typeof error === 'string') {
      appError = {
        type: 'network',
        message: error
      };
    } else if (error instanceof Error) {
      // Try to determine error type based on error properties
      if (error.name === 'NotAllowedError' || error.message.includes('camera') || error.message.includes('permission')) {
        appError = {
          type: 'camera',
          message: error.message
        } as CameraError;
      } else if (error.message.includes('API') || error.message.includes('fetch')) {
        appError = {
          type: 'api',
          message: error.message
        } as ApiError;
      } else if (error.message.includes('storage') || error.message.includes('localStorage')) {
        appError = {
          type: 'storage',
          message: error.message
        } as StorageError;
      } else {
        appError = {
          type: 'network',
          message: error.message
        };
      }
    } else {
      appError = error;
    }

    setErrorState(prev => ({
      error: appError,
      isVisible: true,
      retryCount: prev.error?.message === appError.message ? prev.retryCount : 0
    }));

    // Log error for debugging
    errorUtils.logError(appError, 'useErrorHandler');
  }, []);

  const hideError = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  const retry = useCallback(async (retryFn?: () => void | Promise<void>) => {
    if (errorState.retryCount >= maxRetries) {
      return;
    }

    setErrorState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      isVisible: false
    }));

    if (retryFn) {
      try {
        await retryFn();
        // If retry succeeds, clear the error
        setErrorState({
          error: null,
          isVisible: false,
          retryCount: 0
        });
      } catch (error) {
        // If retry fails, show the error again
        showError(error as Error);
      }
    }
  }, [errorState.retryCount, maxRetries, showError]);

  return {
    error: errorState.error,
    isVisible: errorState.isVisible,
    showError,
    hideError,
    retry,
    canRetry: errorState.retryCount < maxRetries
  };
}