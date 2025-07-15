import { 
  dateUtils, 
  validation, 
  errorUtils, 
  generateId, 
  calculateWeeklyAverage, 
  formatCalories 
} from '@/lib/utils'
import { FoodEntry, DailyData, AppError } from '@/types'

describe('dateUtils', () => {
  beforeEach(() => {
    // Mock current date to 2024-01-15
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('getCurrentDate', () => {
    it('should return current date in YYYY-MM-DD format', () => {
      expect(dateUtils.getCurrentDate()).toBe('2024-01-15')
    })
  })

  describe('formatDisplayDate', () => {
    it('should format date for display', () => {
      const result = dateUtils.formatDisplayDate('2024-01-15')
      expect(result).toMatch(/Mon.*Jan.*15/)
    })
  })

  describe('getWeekDateRange', () => {
    it('should return 7 dates ending with today', () => {
      const dates = dateUtils.getWeekDateRange()
      expect(dates).toHaveLength(7)
      expect(dates[6]).toBe('2024-01-15') // Today should be last
      expect(dates[0]).toBe('2024-01-09') // 6 days ago should be first
    })
  })

  describe('isToday', () => {
    it('should return true for today\'s date', () => {
      expect(dateUtils.isToday('2024-01-15')).toBe(true)
    })

    it('should return false for other dates', () => {
      expect(dateUtils.isToday('2024-01-14')).toBe(false)
    })
  })

  describe('getDaysAgo', () => {
    it('should calculate days ago correctly', () => {
      expect(dateUtils.getDaysAgo('2024-01-13')).toBe(2)
      expect(dateUtils.getDaysAgo('2024-01-15')).toBe(0)
    })
  })
})

describe('validation', () => {
  describe('validateFoodEntry', () => {
    const validEntry: FoodEntry = {
      id: 'test-id',
      timestamp: '2024-01-15T12:00:00Z',
      foods: [{ name: 'Apple', calories: 95, quantity: '1 medium', confidence: 0.9 }],
      totalCalories: 95,
      date: '2024-01-15'
    }

    it('should validate correct food entry', () => {
      expect(validation.validateFoodEntry(validEntry)).toBe(true)
    })

    it('should reject entry without id', () => {
      const { id, ...entryWithoutId } = validEntry
      expect(validation.validateFoodEntry(entryWithoutId)).toBe(false)
    })

    it('should reject entry with empty foods array', () => {
      const entryWithEmptyFoods = { ...validEntry, foods: [] }
      expect(validation.validateFoodEntry(entryWithEmptyFoods)).toBe(false)
    })

    it('should reject entry with negative calories', () => {
      const entryWithNegativeCalories = { ...validEntry, totalCalories: -10 }
      expect(validation.validateFoodEntry(entryWithNegativeCalories)).toBe(false)
    })

    it('should reject entry with invalid date format', () => {
      const entryWithInvalidDate = { ...validEntry, date: '15-01-2024' }
      expect(validation.validateFoodEntry(entryWithInvalidDate)).toBe(false)
    })
  })

  describe('validateCalorieGoal', () => {
    it('should accept valid calorie goals', () => {
      expect(validation.validateCalorieGoal(2000)).toBe(true)
      expect(validation.validateCalorieGoal(1200)).toBe(true)
      expect(validation.validateCalorieGoal(3000)).toBe(true)
    })

    it('should reject invalid calorie goals', () => {
      expect(validation.validateCalorieGoal(0)).toBe(false)
      expect(validation.validateCalorieGoal(-100)).toBe(false)
      expect(validation.validateCalorieGoal(15000)).toBe(false)
    })
  })

  describe('validateImageData', () => {
    it('should accept valid image data URLs', () => {
      expect(validation.validateImageData('data:image/jpeg;base64,/9j/4AAQ')).toBe(true)
      expect(validation.validateImageData('data:image/png;base64,iVBORw0KGgo')).toBe(true)
    })

    it('should reject invalid image data', () => {
      expect(validation.validateImageData('not-an-image')).toBe(false)
      expect(validation.validateImageData('http://example.com/image.jpg')).toBe(false)
    })
  })

  describe('validateApiKey', () => {
    it('should accept valid API keys', () => {
      expect(validation.validateApiKey('AIzaSyDaGmWKa4JsXZ-HjGw7ISLan_Tos0X7s')).toBe(true)
    })

    it('should reject short API keys', () => {
      expect(validation.validateApiKey('short')).toBe(false)
      expect(validation.validateApiKey('')).toBe(false)
    })
  })
})

describe('errorUtils', () => {
  describe('getUserFriendlyMessage', () => {
    it('should return camera-specific messages', () => {
      const cameraError: AppError = { type: 'camera', message: 'permission denied' }
      const message = errorUtils.getUserFriendlyMessage(cameraError)
      expect(message).toContain('Camera access denied')
    })

    it('should return API-specific messages', () => {
      const apiError: AppError = { type: 'api', message: 'rate limit exceeded' }
      const message = errorUtils.getUserFriendlyMessage(apiError)
      expect(message).toContain('Too many requests')
    })

    it('should return storage-specific messages', () => {
      const storageError: AppError = { type: 'storage', message: 'quota exceeded' }
      const message = errorUtils.getUserFriendlyMessage(storageError)
      expect(message).toContain('Unable to save data')
    })

    it('should return network-specific messages', () => {
      const networkError: AppError = { type: 'network', message: 'connection failed' }
      const message = errorUtils.getUserFriendlyMessage(networkError)
      expect(message).toContain('Network error')
    })
  })

  describe('logError', () => {
    it('should log errors to console', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const error: AppError = { type: 'api', message: 'test error' }
      
      errorUtils.logError(error, 'test context')
      
      expect(consoleSpy).toHaveBeenCalledWith('[API] test context:', error)
      consoleSpy.mockRestore()
    })
  })
})

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId()
    const id2 = generateId()
    
    expect(id1).not.toBe(id2)
    expect(id1).toMatch(/^\d+-[a-z0-9]+$/)
  })
})

describe('calculateWeeklyAverage', () => {
  it('should calculate correct average', () => {
    const weeklyData: DailyData[] = [
      { date: '2024-01-09', totalCalories: 1800, goalCalories: 2000, entries: [], goalMet: false },
      { date: '2024-01-10', totalCalories: 2200, goalCalories: 2000, entries: [], goalMet: true },
      { date: '2024-01-11', totalCalories: 2000, goalCalories: 2000, entries: [], goalMet: true },
    ]
    
    expect(calculateWeeklyAverage(weeklyData)).toBe(2000)
  })

  it('should return 0 for empty data', () => {
    expect(calculateWeeklyAverage([])).toBe(0)
  })
})

describe('formatCalories', () => {
  it('should format calories with proper rounding', () => {
    expect(formatCalories(1234.56)).toBe('1,235')
    expect(formatCalories(999)).toBe('999')
    expect(formatCalories(1000)).toBe('1,000')
  })
})