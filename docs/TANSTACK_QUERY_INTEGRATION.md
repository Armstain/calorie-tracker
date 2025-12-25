# TanStack Query Integration Guide

This document explains the TanStack Query (React Query) integration in the CalorieMeter application, providing examples and best practices for data fetching and state management.

## Overview

TanStack Query has been integrated to improve data management, caching, and user experience. It replaces the previous direct localStorage approach with a more robust, cached solution that provides:

- **Automatic caching** with configurable stale times
- **Background refetching** for data consistency
- **Optimistic updates** for better UX
- **Error handling** with retry logic
- **Loading states** management
- **DevTools** for debugging

## Architecture

### Query Client Configuration

The QueryClient is configured with optimized defaults in `lib/providers/QueryProvider.tsx`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false, // Better for PWA
      refetchOnReconnect: true,
    },
  },
});
```

### Query Keys

Centralized query key management in `lib/queries/types.ts`:

```typescript
export const queryKeys = {
  storage: {
    all: ['storage'] as const,
    todaysEntries: () => [...queryKeys.storage.all, 'todaysEntries'] as const,
    weeklyData: () => [...queryKeys.storage.all, 'weeklyData'] as const,
    userSettings: () => [...queryKeys.storage.all, 'userSettings'] as const,
  },
  analysis: {
    all: ['analysis'] as const,
    food: (imageData: string) => [...queryKeys.analysis.all, 'food', imageData] as const,
  },
};
```

## Available Hooks

### Query Hooks (Data Fetching)

#### `useTodaysEntries()`
Fetches today's food entries from localStorage.

```typescript
import { useTodaysEntries } from '@/lib/queries';

function MyComponent() {
  const { data: entries, isLoading, error, refetch } = useTodaysEntries();
  
  if (isLoading) return <div>Loading entries...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {entries.map(entry => (
        <div key={entry.id}>{entry.totalCalories} calories</div>
      ))}
    </div>
  );
}
```

#### `useWeeklyData()`
Fetches weekly aggregated data.

```typescript
const { data: weeklyData, isLoading } = useWeeklyData();
```

#### `useUserSettings()`
Fetches user settings with longer cache time.

```typescript
const { data: settings, isLoading } = useUserSettings();
```

### Mutation Hooks (Data Modification)

#### `useFoodAnalysis()`
Analyzes food images using Gemini AI.

```typescript
import { useFoodAnalysis } from '@/lib/queries';

function CameraComponent() {
  const foodAnalysis = useFoodAnalysis({
    onSuccess: (result) => {
      console.log('Analysis complete:', result);
    },
    onError: (error) => {
      console.error('Analysis failed:', error);
    },
  });

  const handleAnalyze = (imageData: string, apiKey: string) => {
    foodAnalysis.mutate({ imageData, apiKey });
  };

  return (
    <div>
      <button 
        onClick={() => handleAnalyze(image, key)}
        disabled={foodAnalysis.isPending}
      >
        {foodAnalysis.isPending ? 'Analyzing...' : 'Analyze Food'}
      </button>
    </div>
  );
}
```

#### `useSaveFoodEntry()`
Saves food entries with optimistic updates.

```typescript
import { useSaveFoodEntry } from '@/lib/queries';

function ResultsComponent({ analysisResult }) {
  const saveFoodEntry = useSaveFoodEntry({
    onSuccess: () => {
      toast.success('Entry saved!');
    },
  });

  const handleSave = () => {
    const entry = {
      timestamp: analysisResult.timestamp,
      foods: analysisResult.foods,
      totalCalories: analysisResult.totalCalories,
      imageData: analysisResult.imageUrl,
      date: getCurrentDate(),
    };

    saveFoodEntry.mutate({ entry });
  };

  return (
    <button 
      onClick={handleSave}
      disabled={saveFoodEntry.isPending}
    >
      {saveFoodEntry.isPending ? 'Saving...' : 'Add to Daily'}
    </button>
  );
}
```

#### `useUpdateUserSettings()`
Updates user settings with optimistic updates.

```typescript
const updateSettings = useUpdateUserSettings();

const handleGoalUpdate = (newGoal: number) => {
  updateSettings.mutate({
    settings: { dailyCalorieGoal: newGoal }
  });
};
```

## Best Practices

### 1. Error Handling

Use the integrated error handling system:

```typescript
import { useQueryErrorHandler } from '@/lib/queries/errorHandling';

function MyComponent() {
  const { handleQueryError } = useQueryErrorHandler();
  
  const { data, error } = useTodaysEntries({
    onError: (error) => handleQueryError(error, 'todaysEntries'),
  });
}
```

### 2. Loading States

Handle loading states appropriately:

```typescript
function MyComponent() {
  const { data, isLoading, isFetching } = useTodaysEntries();
  
  // isLoading: true on first load
  // isFetching: true during any fetch (including background refetch)
  
  return (
    <div>
      {isLoading ? (
        <Skeleton />
      ) : (
        <div>
          {isFetching && <RefreshIndicator />}
          {/* Render data */}
        </div>
      )}
    </div>
  );
}
```

### 3. Optimistic Updates

For better UX, mutations include optimistic updates:

```typescript
// This is handled automatically in useSaveFoodEntry
// The UI updates immediately, then rolls back if the mutation fails
```

### 4. Cache Invalidation

Mutations automatically invalidate related queries:

```typescript
// After saving a food entry, these queries are invalidated:
// - todaysEntries
// - weeklyData  
// - storageInfo
```

### 5. Custom Options

All hooks accept custom options:

```typescript
const { data } = useTodaysEntries({
  enabled: shouldFetch, // Conditional fetching
  staleTime: 1000, // Custom stale time
  refetchOnWindowFocus: true, // Override default
});
```

## DevTools

In development, TanStack Query DevTools are available:

- **Position**: Bottom-right corner
- **Toggle**: Click the floating button
- **Features**: Query inspection, cache visualization, network monitoring

## Migration Notes

The integration maintains backward compatibility:

- All existing functionality is preserved
- Components receive the same data structure
- Error handling integrates with existing `useErrorHandler`
- Toast notifications work as before

## Performance Considerations

- **Stale Time**: Configured per query type (2min for entries, 10min for settings)
- **Cache Time**: Automatic garbage collection after 10 minutes
- **Background Refetch**: Only on reconnect, not on window focus
- **Retry Logic**: Smart retry based on error type

## Testing

Tests are available in `__tests__/queries/`:

```bash
npm test queries
```

Example test structure:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useTodaysEntries } from '@/lib/queries';

test('should fetch entries successfully', async () => {
  const { result } = renderHook(() => useTodaysEntries(), { wrapper });
  
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });
  
  expect(result.current.data).toEqual(mockEntries);
});
```
