import { GeminiService } from '@/lib/gemini'
import { GEMINI_CONFIG } from '@/lib/config'

// Mock fetch
global.fetch = jest.fn()

describe('GeminiService', () => {
  let geminiService: GeminiService

  beforeEach(() => {
    jest.clearAllMocks()
    geminiService = GeminiService.getInstance()
  })

  describe('validateApiKey', () => {
    it('should return true for valid API key', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      }
      
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)
      
      const result = await geminiService.validateApiKey('valid-api-key')
      
      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('valid-api-key'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('should return false for invalid API key', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
      }
      
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)
      
      const result = await geminiService.validateApiKey('invalid-api-key')
      
      expect(result).toBe(false)
    })

    it('should return false for network errors', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
      
      const result = await geminiService.validateApiKey('any-key')
      
      expect(result).toBe(false)
    })
  })

  describe('analyzeFood', () => {
    const validImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ'
    const mockApiResponse = {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              foods: [
                {
                  name: 'apple',
                  calories: 95,
                  quantity: '1 medium',
                  confidence: 0.9
                }
              ]
            })
          }]
        }
      }]
    }

    beforeEach(() => {
      // Mock environment variable
      process.env.GEMINI_API_KEY = 'test-api-key'
    })

    it('should analyze food successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      }
      
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)
      
      const result = await geminiService.analyzeFood(validImageData)
      
      expect(result.foods).toHaveLength(1)
      expect(result.foods[0].name).toBe('apple')
      expect(result.foods[0].calories).toBe(95)
      expect(result.totalCalories).toBe(95)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.timestamp).toBeDefined()
    })

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Invalid API key' }
        }),
      }
      
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)
      
      await expect(geminiService.analyzeFood(validImageData)).rejects.toThrow('Invalid API key')
    })

    it('should handle rate limiting', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Rate limit exceeded' }
        }),
      }
      
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)
      
      await expect(geminiService.analyzeFood(validImageData)).rejects.toThrow('Rate limit exceeded')
    })

    it('should handle timeout', async () => {
      jest.useFakeTimers()
      
      const mockPromise = new Promise(() => {}) // Never resolves
      ;(fetch as jest.Mock).mockReturnValueOnce(mockPromise)
      
      const analyzePromise = geminiService.analyzeFood(validImageData)
      
      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(GEMINI_CONFIG.TIMEOUT + 1000)
      
      await expect(analyzePromise).rejects.toThrow('Request timeout')
      
      jest.useRealTimers()
    })

    it('should reject invalid image data', async () => {
      await expect(geminiService.analyzeFood('invalid-image-data')).rejects.toThrow('Invalid image data')
    })

    it('should handle malformed API responses', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ invalid: 'response' }),
      }
      
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)
      
      await expect(geminiService.analyzeFood(validImageData)).rejects.toThrow('Invalid response format')
    })

    it('should parse text responses as fallback', async () => {
      const textResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'Apple: 95 calories\nBanana: 105 calories'
            }]
          }
        }]
      }
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(textResponse),
      }
      
      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)
      
      const result = await geminiService.analyzeFood(validImageData)
      
      expect(result.foods).toHaveLength(2)
      expect(result.foods[0].name).toBe('Apple')
      expect(result.foods[0].calories).toBe(95)
      expect(result.foods[1].name).toBe('Banana')
      expect(result.foods[1].calories).toBe(105)
    })

    it('should enforce rate limiting', async () => {
      // Make multiple rapid requests
      const promises = []
      for (let i = 0; i < GEMINI_CONFIG.MAX_REQUESTS_PER_MINUTE + 1; i++) {
        promises.push(geminiService.analyzeFood(validImageData))
      }
      
      // The last request should be rate limited
      await expect(promises[promises.length - 1]).rejects.toThrow('Rate limit exceeded')
    })
  })
})