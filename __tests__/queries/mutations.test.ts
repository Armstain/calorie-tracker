import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useSaveFoodEntry, useUpdateUserSettings } from '@/lib/queries/mutations';
import { storageService } from '@/lib/storage';
import { FoodEntry, UserSettings } from '@/types';

// Mock the storage service
jest.mock('@/lib/storage', () => ({
  storageService: {
    saveFoodEntry: jest.fn(),
    updateUserSettings: jest.fn(),
    getTodaysEntries: jest.fn(),
    getWeeklyData: jest.fn(),
    getUserSettings: jest.fn(),
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
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('Mutation Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useSaveFoodEntry', () => {
    it('should save food entry successfully', async () => {
      const mockEntry: FoodEntry = {
        id: '1',
        timestamp: new Date().toISOString(),
        foods: [{ name: 'Apple', calories: 95, quantity: '1 medium' }],
        totalCalories: 95,
        imageData: 'data:image/jpeg;base64,test',
        date: '2024-01-15',
      };

      const entryToSave = {
        timestamp: mockEntry.timestamp,
        foods: mockEntry.foods,
        totalCalories: mockEntry.totalCalories,
        imageData: mockEntry.imageData,
        date: mockEntry.date,
      };

      mockedStorageService.saveFoodEntry.mockResolvedValue(mockEntry);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSaveFoodEntry(), { wrapper });

      act(() => {
        result.current.mutate({ entry: entryToSave });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockEntry);
      expect(mockedStorageService.saveFoodEntry).toHaveBeenCalledWith(entryToSave);
    });

    it('should handle save errors', async () => {
      const entryToSave = {
        timestamp: new Date().toISOString(),
        foods: [{ name: 'Apple', calories: 95, quantity: '1 medium' }],
        totalCalories: 95,
        imageData: 'data:image/jpeg;base64,test',
        date: '2024-01-15',
      };

      const error = new Error('Storage full');
      mockedStorageService.saveFoodEntry.mockRejectedValue(error);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSaveFoodEntry(), { wrapper });

      act(() => {
        result.current.mutate({ entry: entryToSave });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.type).toBe('storage');
    });

    it('should call success callback', async () => {
      const mockEntry: FoodEntry = {
        id: '1',
        timestamp: new Date().toISOString(),
        foods: [{ name: 'Apple', calories: 95, quantity: '1 medium' }],
        totalCalories: 95,
        imageData: 'data:image/jpeg;base64,test',
        date: '2024-01-15',
      };

      const entryToSave = {
        timestamp: mockEntry.timestamp,
        foods: mockEntry.foods,
        totalCalories: mockEntry.totalCalories,
        imageData: mockEntry.imageData,
        date: mockEntry.date,
      };

      mockedStorageService.saveFoodEntry.mockResolvedValue(mockEntry);

      const onSuccess = jest.fn();
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSaveFoodEntry({ onSuccess }), { wrapper });

      act(() => {
        result.current.mutate({ entry: entryToSave });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccess).toHaveBeenCalledWith(mockEntry, { entry: entryToSave });
    });
  });

  describe('useUpdateUserSettings', () => {
    it('should update user settings successfully', async () => {
      const updatedSettings: UserSettings = {
        dailyCalorieGoal: 2200,
        apiKey: 'new-key',
        units: 'imperial',
        notifications: false,
        theme: 'dark',
      };

      const settingsUpdate = { dailyCalorieGoal: 2200, theme: 'dark' as const };

      mockedStorageService.updateUserSettings.mockResolvedValue(updatedSettings);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateUserSettings(), { wrapper });

      act(() => {
        result.current.mutate({ settings: settingsUpdate });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(updatedSettings);
      expect(mockedStorageService.updateUserSettings).toHaveBeenCalledWith(settingsUpdate);
    });

    it('should handle update errors', async () => {
      const settingsUpdate = { dailyCalorieGoal: 2200 };
      const error = new Error('Settings update failed');
      mockedStorageService.updateUserSettings.mockRejectedValue(error);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateUserSettings(), { wrapper });

      act(() => {
        result.current.mutate({ settings: settingsUpdate });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.type).toBe('storage');
    });

    it('should call error callback', async () => {
      const settingsUpdate = { dailyCalorieGoal: 2200 };
      const error = new Error('Settings update failed');
      mockedStorageService.updateUserSettings.mockRejectedValue(error);

      const onError = jest.fn();
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateUserSettings({ onError }), { wrapper });

      act(() => {
        result.current.mutate({ settings: settingsUpdate });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'storage' }),
        { settings: settingsUpdate }
      );
    });
  });

  describe('Loading states', () => {
    it('should show loading state during mutation', async () => {
      const entryToSave = {
        timestamp: new Date().toISOString(),
        foods: [{ name: 'Apple', calories: 95, quantity: '1 medium' }],
        totalCalories: 95,
        imageData: 'data:image/jpeg;base64,test',
        date: '2024-01-15',
      };

      // Mock a slow save operation
      mockedStorageService.saveFoodEntry.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          id: '1',
          ...entryToSave,
        } as FoodEntry), 100))
      );

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSaveFoodEntry(), { wrapper });

      act(() => {
        result.current.mutate({ entry: entryToSave });
      });

      // Should be loading immediately
      expect(result.current.isPending).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isPending).toBe(false);
    });
  });
});
