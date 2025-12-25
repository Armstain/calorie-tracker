import { useQuery, useQueryClient } from '@tanstack/react-query';
import { storageService } from '@/lib/storage';
import { queryKeys, type StorageInfo, type QueryOptions } from './types';
import { FoodEntry, UserSettings, UserProfile, DailyData } from '@/types';

// Hook for fetching today's entries
export function useTodaysEntries(options?: QueryOptions) {
  return useQuery({
    queryKey: queryKeys.storage.todaysEntries(),
    queryFn: (): FoodEntry[] => {
      return storageService.getTodaysEntries();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - entries change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to app
    ...options,
  });
}

// Hook for fetching weekly data
export function useWeeklyData(options?: QueryOptions) {
  return useQuery({
    queryKey: queryKeys.storage.weeklyData(),
    queryFn: (): DailyData[] => {
      return storageService.getWeeklyData();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Weekly data doesn't change as frequently
    ...options,
  });
}

// Hook for fetching user settings
export function useUserSettings(options?: QueryOptions) {
  return useQuery({
    queryKey: queryKeys.storage.userSettings(),
    queryFn: (): UserSettings => {
      return storageService.getUserSettings();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - settings don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
}

// Hook for fetching user profile
export function useUserProfile(options?: QueryOptions) {
  return useQuery({
    queryKey: queryKeys.storage.userProfile(),
    queryFn: (): UserProfile | null => {
      return storageService.getUserProfile();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
}

// Hook for fetching storage information
export function useStorageInfo(options?: QueryOptions) {
  return useQuery({
    queryKey: queryKeys.storage.storageInfo(),
    queryFn: (): StorageInfo => {
      return storageService.getStorageInfo();
    },
    staleTime: 30 * 1000, // 30 seconds - storage info can change quickly
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    ...options,
  });
}

// Utility hook to invalidate all storage-related queries
export function useInvalidateStorageQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.all });
    },
    invalidateTodaysEntries: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.todaysEntries() });
    },
    invalidateWeeklyData: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.weeklyData() });
    },
    invalidateUserSettings: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.userSettings() });
    },
    invalidateUserProfile: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.userProfile() });
    },
    invalidateStorageInfo: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.storageInfo() });
    },
  };
}

// Utility hook to prefetch storage data
export function usePrefetchStorageData() {
  const queryClient = useQueryClient();

  return {
    prefetchTodaysEntries: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.storage.todaysEntries(),
        queryFn: () => storageService.getTodaysEntries(),
        staleTime: 2 * 60 * 1000,
      });
    },
    prefetchWeeklyData: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.storage.weeklyData(),
        queryFn: () => storageService.getWeeklyData(),
        staleTime: 5 * 60 * 1000,
      });
    },
    prefetchUserSettings: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.storage.userSettings(),
        queryFn: () => storageService.getUserSettings(),
        staleTime: 10 * 60 * 1000,
      });
    },
  };
}
