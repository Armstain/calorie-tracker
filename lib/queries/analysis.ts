import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type FoodAnalysisParams, type MutationOptions } from './types';
import { FoodAnalysisResult, AppError, ApiError } from '@/types';

export function useFoodAnalysis(options?: MutationOptions<FoodAnalysisResult, AppError, FoodAnalysisParams>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ imageData, apiKey, signal }: FoodAnalysisParams): Promise<FoodAnalysisResult> => {
      try {
        const response = await fetch('/api/gemini-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({
            imageData,
            apiKey: apiKey && apiKey.trim() ? apiKey.trim() : undefined,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          if (errorBody && typeof errorBody === 'object' && 'type' in errorBody && 'message' in errorBody) {
            throw errorBody as AppError;
          }
          throw {
            type: 'api',
            message: 'Food analysis failed. Please try again.',
            statusCode: response.status,
          } as ApiError;
        }

        const result = (await response.json()) as FoodAnalysisResult;

        // Cache the result for potential reuse
        queryClient.setQueryData(
          queryKeys.analysis.food(imageData),
          result,
          {
            updatedAt: Date.now(),
          }
        );

        return result;
      } catch (error) {
        // User-canceled request
        if (error && typeof error === 'object' && 'name' in error && (error as { name: unknown }).name === 'AbortError') {
          throw {
            type: 'api',
            message: 'Canceled',
            code: 'canceled',
            statusCode: 499,
          } as ApiError;
        }

        // Transform error to proper AppError format for useErrorHandler
        let apiError: AppError;

        if (error && typeof error === 'object' && 'type' in error && 'message' in error) {
          // Already a properly formatted error from geminiService
          apiError = error as AppError;
        } else if (error instanceof Error) {
          // Check for specific error types
          if (error.message.includes('No API key available') || error.message.includes('API key not configured')) {
            apiError = {
              type: 'network',
              message: 'API key not configured. Please check your settings.'
            };
          } else if (error.message.includes('Invalid API key')) {
            apiError = {
              type: 'api',
              message: 'Invalid API key. Please check your Gemini API key in settings.'
            };
          } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            apiError = {
              type: 'network',
              message: 'Network error. Please check your internet connection and try again.'
            };
          } else {
            // Generic error transformation
            apiError = {
              type: 'api',
              message: error.message || 'Food analysis failed. Please try again.'
            };
          }
        } else {
          // Unknown error type - treat as network error
          apiError = {
            type: 'network',
            message: 'Network error occurred during food analysis. Please check your connection and try again.'
          };
        }

        // Keep cancellation silent for callers that want it
        if (apiError && apiError.type === 'api' && apiError.code === 'canceled') {
          throw apiError;
        }

        // A 422 here means the service completed but couldn't recognize any food.
        // Treat it as a normal outcome (no noisy console error).
        if (apiError && apiError.type === 'api') {
          const statusCode = (apiError as ApiError).statusCode;
          if (statusCode === 422) {
            throw apiError;
          }
        }

        console.error('Food analysis error:', apiError);
        throw apiError;
      }
    },
    
    // Retry configuration for analysis
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx)
      if (error && 'statusCode' in error && typeof error.statusCode === 'number') {
        if (error.statusCode >= 400 && error.statusCode < 500) {
          return false;
        }
      }
      
      // Retry up to 2 times for network/server errors
      return failureCount < 2;
    },
    
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    
    // Merge with user-provided options
    ...options,
    
    onSuccess: (data, variables) => {
      // Call user's onSuccess if provided
      options?.onSuccess?.(data, variables);
      
      // Additional success handling can be added here
      console.log('Food analysis completed successfully');
    },
    
    onError: (error, variables) => {
      // Call user's onError if provided
      options?.onError?.(error, variables);

      // Additional error handling (keep common/expected flows quiet)
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const statusCode = (error as { statusCode?: unknown }).statusCode;
        if (statusCode === 422) return;
        if (statusCode === 499) return;
      }

      console.error('Food analysis failed:', error);
    },
  });
}

// Hook for getting cached analysis result
export function useCachedFoodAnalysis(imageData: string) {
  const queryClient = useQueryClient();
  
  return queryClient.getQueryData<FoodAnalysisResult>(
    queryKeys.analysis.food(imageData)
  );
}

// Hook for invalidating analysis cache
export function useInvalidateAnalysisQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analysis.all });
    },
    invalidateFood: (imageData: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analysis.food(imageData) });
    },
    removeFood: (imageData: string) => {
      queryClient.removeQueries({ queryKey: queryKeys.analysis.food(imageData) });
    },
  };
}

// Hook for prefetching analysis (useful for preloading)
export function usePrefetchFoodAnalysis() {
  const queryClient = useQueryClient();

  return {
    prefetch: (imageData: string, apiKey: string) => {
      // Only prefetch if not already cached
      const existingData = queryClient.getQueryData(queryKeys.analysis.food(imageData));
      
      if (!existingData) {
        return queryClient.prefetchQuery({
          queryKey: queryKeys.analysis.food(imageData),
          queryFn: async () => {
            const response = await fetch('/api/gemini-analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageData,
                apiKey: apiKey && apiKey.trim() ? apiKey.trim() : undefined,
              }),
            });

            if (!response.ok) {
              const errorBody = await response.json().catch(() => null);
              if (errorBody && typeof errorBody === 'object' && 'type' in errorBody && 'message' in errorBody) {
                throw errorBody as AppError;
              }
              throw {
                type: 'api',
                message: 'Food analysis failed. Please try again.',
                statusCode: response.status,
              } as ApiError;
            }

            return (await response.json()) as FoodAnalysisResult;
          },
          staleTime: 10 * 60 * 1000, // 10 minutes
        });
      }
    },
  };
}
