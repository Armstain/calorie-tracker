import { useMutation, useQueryClient } from '@tanstack/react-query';
import { storageService } from '@/lib/storage';
import { 
  queryKeys, 
  type SaveFoodEntryParams, 
  type UpdateUserSettingsParams,
  type MutationOptions, 
  type ApiError 
} from './types';
import { FoodEntry, UserSettings } from '@/types';

// Hook for saving food entries with optimistic updates
export function useSaveFoodEntry(options?: MutationOptions<FoodEntry, ApiError, SaveFoodEntryParams>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entry }: SaveFoodEntryParams): Promise<FoodEntry> => {
      try {
        const savedEntry = await storageService.saveFoodEntry(entry);
        return savedEntry;
      } catch (error) {
        const apiError: ApiError = error instanceof Error 
          ? { ...error, type: 'storage' as const }
          : new Error('Failed to save food entry');
        throw apiError;
      }
    },

    // Optimistic updates
    onMutate: async ({ entry }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.storage.todaysEntries() });
      await queryClient.cancelQueries({ queryKey: queryKeys.storage.weeklyData() });

      // Snapshot the previous values
      const previousTodaysEntries = queryClient.getQueryData<FoodEntry[]>(
        queryKeys.storage.todaysEntries()
      );
      const previousWeeklyData = queryClient.getQueryData(
        queryKeys.storage.weeklyData()
      );

      // Optimistically update today's entries
      if (previousTodaysEntries) {
        const optimisticEntry: FoodEntry = {
          ...entry,
          id: `temp-${Date.now()}`, // Temporary ID
        };

        queryClient.setQueryData<FoodEntry[]>(
          queryKeys.storage.todaysEntries(),
          [optimisticEntry, ...previousTodaysEntries]
        );
      }

      // Return context for rollback
      return { previousTodaysEntries, previousWeeklyData };
    },

    // On error, rollback optimistic updates
    onError: (error, variables, context) => {
      if (context?.previousTodaysEntries) {
        queryClient.setQueryData(
          queryKeys.storage.todaysEntries(),
          context.previousTodaysEntries
        );
      }
      if (context?.previousWeeklyData) {
        queryClient.setQueryData(
          queryKeys.storage.weeklyData(),
          context.previousWeeklyData
        );
      }

      options?.onError?.(error, variables);
    },

    // On success, invalidate and refetch
    onSuccess: (data, variables) => {
      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.todaysEntries() });
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.weeklyData() });
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.storageInfo() });

      options?.onSuccess?.(data, variables);
    },

    onSettled: (data, error, variables) => {
      // Always refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.all });
      options?.onSettled?.(data, error, variables);
    },
  });
}

// Hook for updating user settings
export function useUpdateUserSettings(options?: MutationOptions<UserSettings, ApiError, UpdateUserSettingsParams>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ settings }: UpdateUserSettingsParams): Promise<UserSettings> => {
      try {
        storageService.updateUserSettings(settings);
        // Get the updated settings after the update
        const updatedSettings = storageService.getUserSettings();
        return updatedSettings;
      } catch (error) {
        const apiError: ApiError = error instanceof Error
          ? { ...error, type: 'storage' as const }
          : new Error('Failed to update user settings');
        throw apiError;
      }
    },

    // Optimistic updates for settings
    onMutate: async ({ settings }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.storage.userSettings() });

      const previousSettings = queryClient.getQueryData<UserSettings>(
        queryKeys.storage.userSettings()
      );

      // Optimistically update settings
      if (previousSettings) {
        queryClient.setQueryData<UserSettings>(
          queryKeys.storage.userSettings(),
          { ...previousSettings, ...settings }
        );
      }

      return { previousSettings };
    },

    onError: (error, variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(
          queryKeys.storage.userSettings(),
          context.previousSettings
        );
      }
      options?.onError?.(error, variables);
    },

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.userSettings() });
      options?.onSuccess?.(data, variables);
    },

    onSettled: (data, error, variables) => {
      options?.onSettled?.(data, error, variables);
    },
  });
}

// Hook for deleting food entries
export function useDeleteFoodEntry(options?: MutationOptions<void, ApiError, { entryId: string }>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId }: { entryId: string }): Promise<void> => {
      try {
        storageService.deleteEntry(entryId);
      } catch (error) {
        const apiError: ApiError = error instanceof Error
          ? { ...error, type: 'storage' as const }
          : new Error('Failed to delete food entry');
        throw apiError;
      }
    },

    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.todaysEntries() });
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.weeklyData() });
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.storageInfo() });

      options?.onSuccess?.(data, variables);
    },

    onError: (error, variables) => {
      options?.onError?.(error, variables);
    },

    onSettled: (data, error, variables) => {
      options?.onSettled?.(data, error, variables);
    },
  });
}

// Hook for clearing today's entries
export function useClearTodaysEntries(options?: MutationOptions<number, ApiError, void>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<number> => {
      try {
        return storageService.clearTodaysEntries();
      } catch (error) {
        const apiError: ApiError = error instanceof Error
          ? { ...error, type: 'storage' as const }
          : new Error('Failed to clear today\'s entries');
        throw apiError;
      }
    },

    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.todaysEntries() });
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.weeklyData() });
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.storageInfo() });

      options?.onSuccess?.(data, variables);
    },

    onError: (error, variables) => {
      options?.onError?.(error, variables);
    },

    onSettled: (data, error, variables) => {
      options?.onSettled?.(data, error, variables);
    },
  });
}

// Hook for clearing week entries
export function useClearWeekEntries(options?: MutationOptions<number, ApiError, void>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<number> => {
      try {
        return storageService.clearWeekEntries();
      } catch (error) {
        const apiError: ApiError = error instanceof Error
          ? { ...error, type: 'storage' as const }
          : new Error('Failed to clear week entries');
        throw apiError;
      }
    },

    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.todaysEntries() });
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.weeklyData() });
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.storageInfo() });

      options?.onSuccess?.(data, variables);
    },

    onError: (error, variables) => {
      options?.onError?.(error, variables);
    },

    onSettled: (data, error, variables) => {
      options?.onSettled?.(data, error, variables);
    },
  });
}

// Hook for clearing all data
export function useClearAllData(options?: MutationOptions<void, ApiError, void>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      try {
        storageService.clearAllData();
      } catch (error) {
        const apiError: ApiError = error instanceof Error
          ? { ...error, type: 'storage' as const }
          : new Error('Failed to clear all data');
        throw apiError;
      }
    },

    onSuccess: (data, variables) => {
      // Invalidate all storage queries
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.all });

      options?.onSuccess?.(data, variables);
    },

    onError: (error, variables) => {
      options?.onError?.(error, variables);
    },

    onSettled: (data, error, variables) => {
      options?.onSettled?.(data, error, variables);
    },
  });
}
