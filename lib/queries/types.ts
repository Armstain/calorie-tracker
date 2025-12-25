import { FoodEntry, UserSettings } from '@/types';

export const queryKeys = {
  storage: {
    all: ['storage'] as const,
    todaysEntries: () => [...queryKeys.storage.all, 'todaysEntries'] as const,
    weeklyData: () => [...queryKeys.storage.all, 'weeklyData'] as const,
    userSettings: () => [...queryKeys.storage.all, 'userSettings'] as const,
    userProfile: () => [...queryKeys.storage.all, 'userProfile'] as const,
    storageInfo: () => [...queryKeys.storage.all, 'storageInfo'] as const,
  },

  analysis: {
    all: ['analysis'] as const,
    food: (imageData: string) => [...queryKeys.analysis.all, 'food', imageData] as const,
  },

  foodDatabase: {
    all: ['foodDatabase'] as const,
    search: (query: string) => [...queryKeys.foodDatabase.all, 'search', query] as const,
    byCategory: (categoryId: string) => [...queryKeys.foodDatabase.all, 'category', categoryId] as const,
    byId: (id: string) => [...queryKeys.foodDatabase.all, 'byId', id] as const,
  },
} as const;

export interface FoodAnalysisParams {
  imageData: string;
  apiKey: string;
  signal?: AbortSignal;
}

export interface SaveFoodEntryParams {
  entry: Omit<FoodEntry, 'id'>;
}

export interface UpdateUserSettingsParams {
  settings: Partial<UserSettings>;
}

export interface SearchFoodParams {
  query: string;
}

export interface GetFoodByCategoryParams {
  categoryId: string;
}

export interface StorageInfo {
  used: number;
  available: number;
  percentage: number;
}

export interface WeeklyData {
  [date: string]: {
    totalCalories: number;
    entries: FoodEntry[];
  };
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  type?: 'network' | 'api' | 'validation' | 'storage';
}

export interface QueryOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
}

export interface MutationOptions<TData = unknown, TError = ApiError, TVariables = unknown> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void;
}

export interface QueryResult<TData> {
  data: TData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  refetch: () => void;
  isRefetching: boolean;
}

export interface MutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  data: TData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  reset: () => void;
  isSuccess: boolean;
}
