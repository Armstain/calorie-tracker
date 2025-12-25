import { useQueryClient } from '@tanstack/react-query';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
import { useToast } from '@/lib/hooks/useToast';
import { type ApiError } from './types';

export function useQueryErrorHandler() {
  const { showError } = useErrorHandler();
  const { error: showErrorToast } = useToast();
  const queryClient = useQueryClient();

  const handleQueryError = (error: ApiError, context?: string) => {
    console.error(`Query error${context ? ` in ${context}` : ''}:`, error);

    let errorMessage = error.message || 'An unexpected error occurred';
    
    switch (error.type) {
      case 'network':
        errorMessage = 'Network error. Please check your internet connection and try again.';
        break;
      case 'api':
        if (error.status === 429) {
          errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
        } else if (error.status === 401 || error.status === 403) {
          errorMessage = 'API key invalid or expired. Please check your settings.';
        } else if (error.status && error.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        break;
      case 'storage':
        errorMessage = 'Storage error. Your device may be running low on space.';
        break;
      case 'validation':
        errorMessage = 'Invalid data. Please check your input and try again.';
        break;
    }

    showError(errorMessage);

    showErrorToast(errorMessage);
  };

  const handleMutationError = (error: ApiError, variables: unknown, context?: string) => {
    handleQueryError(error, context);

    if (error.type === 'storage' && context === 'saveFoodEntry') {
      showErrorToast(
        'Storage full. Consider deleting old entries or clearing cache.'
      );
    }
  };

  const clearErrors = () => {
    queryClient.resetQueries({
      predicate: (query) => query.state.status === 'error',
    });
  };

  return {
    handleQueryError,
    handleMutationError,
    clearErrors,
  };
}

export function createQueryErrorHandler() {
  return (error: Error, query: { queryKey: unknown[]; queryHash: string }) => {
    const apiError: ApiError = {
      ...error,
      type: 'api',
      message: error.message,
    };

    console.error('Global query error:', {
      error: apiError,
      queryKey: query.queryKey,
      queryHash: query.queryHash,
    });

    const silentQueries = [
      'storage.todaysEntries',
      'storage.weeklyData',
      'storage.userSettings',
    ];

    const shouldShowError = !silentQueries.some(silentQuery =>
      query.queryKey.some((key) => typeof key === 'string' && key.includes(silentQuery))
    );

    if (shouldShowError) {
      console.warn('Unhandled query error:', apiError);
    }
  };
}

export function createRetryFunction() {
  return (failureCount: number, error: Error) => {
    if (error && typeof error === 'object' && 'status' in error) {
      const status = error.status as number;
      if (status >= 400 && status < 500) {
        return false;
      }
    }

    if (error && typeof error === 'object' && 'type' in error && error.type === 'validation') {
      return false;
    }

    // Retry up to 3 times for other errors
    return failureCount < 3;
  };
}

// Utility to transform errors to ApiError format
export function transformError(error: unknown): ApiError {
  if (error instanceof Error) {
    return {
      ...error,
      type: 'api',
      message: error.message,
    };
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return {
      name: 'ApiError',
      message: String(error.message),
      type: 'api',
    };
  }

  return {
    name: 'UnknownError',
    message: 'An unknown error occurred',
    type: 'api',
  };
}
