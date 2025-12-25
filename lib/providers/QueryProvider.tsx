'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a function to generate a new QueryClient with optimized settings
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes by default
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        
        // Retry configuration optimized for the caloriemeter app
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          if (error && typeof error === 'object' && 'status' in error) {
            const status = error.status as number;
            if (status >= 400 && status < 500) {
              return false;
            }
          }
          
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Don't refetch on window focus for better UX in PWA
        refetchOnWindowFocus: false,
        
        // Refetch on reconnect for data consistency
        refetchOnReconnect: true,
        
        // Don't refetch on mount if data is fresh
        refetchOnMount: 'always',
      },
      mutations: {
        // Retry mutations once for network errors
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error && typeof error === 'object' && 'status' in error) {
            const status = error.status as number;
            if (status >= 400 && status < 500) {
              return false;
            }
          }
          
          // Retry once for other errors
          return failureCount < 1;
        },
        
        retryDelay: 1000,
      },
    },
  });
}

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create QueryClient instance using useState to ensure it's only created once
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  );
}

// Export the QueryClient type for use in other files
export type { QueryClient } from '@tanstack/react-query';

// Export commonly used hooks for convenience
export {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
