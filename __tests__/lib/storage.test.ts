import { StorageService } from '@/lib/storage'
import { UserSettings, FoodEntry } from '@/types'
import { STORAGE_KEYS, APP_CONFIG } from '@/lib/config'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('StorageService', () => {
  let storageService: StorageService

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Get fresh instance
    storageService = StorageService.getInstance()
  })

  describe('getUserSettings', () => {
    it('should return default settings when no stored settings exist', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const settings = storageService.getUserSettings()
      
      expect(settings).toEqual({
        dailyCalorieGoal: APP_CONFIG.DEFAULT_CALORIE_GOAL,
        apiKey: '',
        notifications: true,
        dataRetentionDays: APP_CONFIG.DATA_RETENTION_DAYS,
      })
    })

    it('should return stored settings when they exist', () => {
      const storedSettings: UserSettings = {
        dailyCalorieGoal: 2500,
        apiKey: 'test-api-key',
        notifications: false,
        dataRetentionDays: 60,
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedSettings))
      
      const settings = storageService.getUserSettings()
      
      expect(settings).toEqual(storedSettings)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_SETTINGS)
    })

    it('should handle corrupted stored settings gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json')
      
      const settings = storageService.getUserSettings()
      
      expect(settings.dailyCalorieGoal).toBe(APP_CONFIG.DEFAULT_CALORIE_GOAL)
    })
  })

  describe('updateUserSettings', () => {
    it('should merge and save updated settings', () => {
      const existingSettings: UserSettings = {
        dailyCalorieGoal: 2000,
        apiKey: 'old-key',
        notifications: true,
        dataRetentionDays: 30,
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingSettings))
      
      const updates = { dailyCalorieGoal: 2500, apiKey: 'new-key' }
      storageService.updateUserSettings(updates)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_SETTINGS,
        JSON.stringify({
          ...existingSettings,
          ...updates,
        })
      )
    })
  })

  describe('updateDailyGoal', () => {
    it('should update daily goal with valid value', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        dailyCalorieGoal: 2000,
        apiKey: '',
        notifications: true,
        dataRetentionDays: 30,
      }))
      
      storageService.updateDailyGoal(2500)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('should throw error for invalid goal', () => {
      expect(() => storageService.updateDailyGoal(-100)).toThrow()
      expect(() => storageService.updateDailyGoal(15000)).toThrow()
    })
  })

  describe('saveFoodEntry', () => {
    it('should save valid food entry', () => {
      mockLocalStorage.getItem.mockReturnValue('[]')
      
      const entryData = {
        timestamp: '2024-01-15T12:00:00Z',
        foods: [{ name: 'Apple', calories: 95, quantity: '1 medium', confidence: 0.9 }],
        totalCalories: 95,
        date: '2024-01-15'
      }
      
      const savedEntry = storageService.saveFoodEntry(entryData)
      
      expect(savedEntry.id).toBeDefined()
      expect(savedEntry.foods).toEqual(entryData.foods)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.DAILY_ENTRIES,
        expect.stringContaining('"totalCalories":95')
      )
    })

    it('should sort entries by timestamp', () => {
      const existingEntries = [
        {
          id: 'old-entry',
          timestamp: '2024-01-14T12:00:00Z',
          foods: [{ name: 'Banana', calories: 105, quantity: '1 medium', confidence: 0.8 }],
          totalCalories: 105,
          date: '2024-01-14'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingEntries))
      
      const newEntryData = {
        timestamp: '2024-01-15T12:00:00Z',
        foods: [{ name: 'Apple', calories: 95, quantity: '1 medium', confidence: 0.9 }],
        totalCalories: 95,
        date: '2024-01-15'
      }
      
      storageService.saveFoodEntry(newEntryData)
      
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
      expect(savedData[0].timestamp).toBe('2024-01-15T12:00:00Z') // Newer entry first
    })
  })

  describe('getDailyEntries', () => {
    it('should return entries for specific date', () => {
      const entries: FoodEntry[] = [
        {
          id: 'entry1',
          timestamp: '2024-01-15T12:00:00Z',
          foods: [{ name: 'Apple', calories: 95, quantity: '1 medium', confidence: 0.9 }],
          totalCalories: 95,
          date: '2024-01-15'
        },
        {
          id: 'entry2',
          timestamp: '2024-01-14T12:00:00Z',
          foods: [{ name: 'Banana', calories: 105, quantity: '1 medium', confidence: 0.8 }],
          totalCalories: 105,
          date: '2024-01-14'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(entries))
      
      const todayEntries = storageService.getDailyEntries('2024-01-15')
      
      expect(todayEntries).toHaveLength(1)
      expect(todayEntries[0].id).toBe('entry1')
    })

    it('should return empty array for date with no entries', () => {
      mockLocalStorage.getItem.mockReturnValue('[]')
      
      const entries = storageService.getDailyEntries('2024-01-15')
      
      expect(entries).toEqual([])
    })
  })

  describe('getWeeklyData', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return weekly data with goal status', () => {
      const entries: FoodEntry[] = [
        {
          id: 'entry1',
          timestamp: '2024-01-15T12:00:00Z',
          foods: [{ name: 'Apple', calories: 95, quantity: '1 medium', confidence: 0.9 }],
          totalCalories: 2100,
          date: '2024-01-15'
        }
      ]
      
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify({ dailyCalorieGoal: 2000 })) // getUserSettings
        .mockReturnValueOnce(JSON.stringify(entries)) // getAllEntries
      
      const weeklyData = storageService.getWeeklyData()
      
      expect(weeklyData).toHaveLength(7)
      expect(weeklyData[6].date).toBe('2024-01-15') // Today
      expect(weeklyData[6].goalMet).toBe(true) // 2100 >= 2000
    })
  })

  describe('deleteEntry', () => {
    it('should delete entry by id', () => {
      const entries: FoodEntry[] = [
        {
          id: 'entry1',
          timestamp: '2024-01-15T12:00:00Z',
          foods: [{ name: 'Apple', calories: 95, quantity: '1 medium', confidence: 0.9 }],
          totalCalories: 95,
          date: '2024-01-15'
        },
        {
          id: 'entry2',
          timestamp: '2024-01-14T12:00:00Z',
          foods: [{ name: 'Banana', calories: 105, quantity: '1 medium', confidence: 0.8 }],
          totalCalories: 105,
          date: '2024-01-14'
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(entries))
      
      const result = storageService.deleteEntry('entry1')
      
      expect(result).toBe(true)
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
      expect(savedData).toHaveLength(1)
      expect(savedData[0].id).toBe('entry2')
    })

    it('should return false if entry not found', () => {
      mockLocalStorage.getItem.mockReturnValue('[]')
      
      const result = storageService.deleteEntry('nonexistent')
      
      expect(result).toBe(false)
    })
  })

  describe('clearAllData', () => {
    it('should remove all storage keys', () => {
      storageService.clearAllData()
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.DAILY_ENTRIES)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_SETTINGS)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.LAST_CLEANUP)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_PROFILE)
    })
  })

  describe('User Profile and Onboarding', () => {
    const mockProfile = {
      hasCompletedOnboarding: true,
      personalInfo: {
        age: 30,
        gender: 'male' as const,
        height: { value: 180, unit: 'cm' as const },
        weight: { value: 75, unit: 'kg' as const }
      },
      activity: {
        level: 'moderate' as const,
        exerciseFrequency: 3
      },
      goals: {
        primary: 'maintenance' as const,
        targetCalories: 2000
      },
      preferences: {
        units: 'metric' as const,
        notifications: true
      },
      metadata: {
        createdAt: '2024-01-15T10:00:00Z',
        lastUpdated: '2024-01-15T10:00:00Z',
        onboardingVersion: '1.0'
      }
    }

    describe('hasCompletedOnboarding', () => {
      it('should return false when no profile exists', () => {
        mockLocalStorage.getItem.mockReturnValue(null)
        
        const result = storageService.hasCompletedOnboarding()
        
        expect(result).toBe(false)
      })

      it('should return true when profile exists and onboarding is complete', () => {
        const storedProfile = {
          version: '1.0',
          profile: mockProfile
        }
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedProfile))
        
        const result = storageService.hasCompletedOnboarding()
        
        expect(result).toBe(true)
      })

      it('should return false when profile exists but onboarding is not complete', () => {
        const incompleteProfile = {
          ...mockProfile,
          hasCompletedOnboarding: false
        }
        const storedProfile = {
          version: '1.0',
          profile: incompleteProfile
        }
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedProfile))
        
        const result = storageService.hasCompletedOnboarding()
        
        expect(result).toBe(false)
      })
    })

    describe('markOnboardingComplete', () => {
      it('should save profile with onboarding marked as complete', () => {
        const inputProfile = {
          ...mockProfile,
          hasCompletedOnboarding: false
        }
        
        storageService.markOnboardingComplete(inputProfile)
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.USER_PROFILE,
          expect.stringContaining('"hasCompletedOnboarding":true')
        )
        
        const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
        expect(savedData.version).toBe('1.0')
        expect(savedData.profile.hasCompletedOnboarding).toBe(true)
        expect(savedData.profile.metadata.onboardingVersion).toBe('1.0')
      })
    })

    describe('getUserProfile', () => {
      it('should return null when no profile exists', () => {
        mockLocalStorage.getItem.mockReturnValue(null)
        
        const result = storageService.getUserProfile()
        
        expect(result).toBeNull()
      })

      it('should return profile when valid profile exists', () => {
        const storedProfile = {
          version: '1.0',
          profile: mockProfile
        }
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedProfile))
        
        const result = storageService.getUserProfile()
        
        expect(result).toEqual(mockProfile)
      })
    })

    describe('calculateDailyCalories', () => {
      it('should calculate daily calories based on profile data', () => {
        const result = storageService.calculateDailyCalories(mockProfile)
        
        expect(result).toBeGreaterThan(0)
        expect(typeof result).toBe('number')
      })

      it('should return null for incomplete profile', () => {
        const incompleteProfile = {
          ...mockProfile,
          personalInfo: {
            age: 30
            // Missing other required fields
          }
        }
        
        const result = storageService.calculateDailyCalories(incompleteProfile)
        
        expect(result).toBeNull()
      })
    })
  })
})