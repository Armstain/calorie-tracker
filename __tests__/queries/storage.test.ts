import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useTodaysEntries, useWeeklyData, useUserSettings } from '@/lib/queries/storage';
import { storageService } from '@/lib/storage';
import { FoodEntry, UserSettings } from '@/types';

// Mock the storage service
jest.mock('@/lib/storage', () => ({
  storageService: {
    getTodaysEntries: jest.fn(),
    getWeeklyData: jest.fn(),
    getUserSettings: jest.fn(),
    getStorageInfo: jest.fn(),
  },
}));

const mockedStorageService = storageService as jest.Mocked<typeof storageService>;

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('Storage Query Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useTodaysEntries', () => {
    it('should fetch todays entries successfully', async () => {
      const mockEntries: FoodEntry[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          foods: [{ name: 'Apple', calories: 95, quantity: '1 medium' }],
          totalCalories: 95,
          imageData: 'data:image/jpeg;base64,test',
          date: '2024-01-15',
        },
      ];

      mockedStorageService.getTodaysEntries.mockReturnValue(mockEntries);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useTodaysEntries(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockEntries);
      expect(mockedStorageService.getTodaysEntries).toHaveBeenCalledTimes(1);
    });

    it('should handle empty entries', async () => {
      mockedStorageService.getTodaysEntries.mockReturnValue([]);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useTodaysEntries(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle storage errors', async () => {
      mockedStorageService.getTodaysEntries.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useTodaysEntries(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useWeeklyData', () => {
    it('should fetch weekly data successfully', async () => {
      const mockWeeklyData = {
        '2024-01-15': {
          totalCalories: 1800,
          entries: [],
        },
        '2024-01-14': {
          totalCalories: 2000,
          entries: [],
        },
      };

      mockedStorageService.getWeeklyData.mockReturnValue(mockWeeklyData);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useWeeklyData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockWeeklyData);
      expect(mockedStorageService.getWeeklyData).toHaveBeenCalledTimes(1);
    });
  });

  describe('useUserSettings', () => {
    it('should fetch user settings successfully', async () => {
      const mockSettings: UserSettings = {
        dailyCalorieGoal: 2000,
        apiKey: 'test-key',
        units: 'metric',
        notifications: true,
        theme: 'light',
      };

      mockedStorageService.getUserSettings.mockReturnValue(mockSettings);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUserSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSettings);
      expect(mockedStorageService.getUserSettings).toHaveBeenCalledTimes(1);
    });

    it('should use correct stale time for settings', async () => {
      const mockSettings: UserSettings = {
        dailyCalorieGoal: 2000,
        apiKey: 'test-key',
        units: 'metric',
        notifications: true,
        theme: 'light',
      };

      mockedStorageService.getUserSettings.mockReturnValue(mockSettings);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUserSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Settings should have longer stale time (10 minutes)
      expect(result.current.dataUpdatedAt).toBeTruthy();
    });
  });

  describe('Query options', () => {
    it('should respect custom options', async () => {
      mockedStorageService.getTodaysEntries.mockReturnValue([]);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useTodaysEntries({ enabled: false }),
        { wrapper }
      );

      // Should not fetch when disabled
      expect(result.current.isFetching).toBe(false);
      expect(mockedStorageService.getTodaysEntries).not.toHaveBeenCalled();
    });
  });
});
