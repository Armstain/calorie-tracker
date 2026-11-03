jest.mock('@/lib/config', () => {
  const actual = jest.requireActual('@/lib/config')
  return {
    ...actual,
    GEMINI_CONFIG: {
      ...actual.GEMINI_CONFIG,
      // Keep tests deterministic: only one model attempted.
      FALLBACK_ORDER: ['gemini-3.8-flash'],
    },
  }
})

import { GeminiService } from '@/lib/gemini'
import { GEMINI_CONFIG, getRateLimits } from '@/lib/config'

// Mock fetch
global.fetch = jest.fn()

// Mock cache
jest.mock('../../lib/cache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
  },
  cacheUtils: {
    getImageCacheKey: jest.fn().mockReturnValue('test-cache-key'),
  }
}))

describe('GeminiService', () => {
  let geminiService: GeminiService

  beforeEach(() => {
    jest.resetAllMocks()
    global.fetch = jest.fn()

    // Reset singleton state between tests
    ;(GeminiService as unknown as { instance?: unknown }).instance = undefined
    geminiService = GeminiService.getInstance()
    
    // Setup default cache behavior (miss)
    const { cache } = require('../../lib/cache')
    cache.get.mockReturnValue(null)
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
        expect.stringContaining('/models'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ 'x-goog-api-key': 'valid-api-key' }),
        })
      )
      // Key must not be sent in the URL
      expect((fetch as jest.Mock).mock.calls[0][0]).not.toContain('valid-api-key')
    })

    it('should return false for invalid API key', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: { message: 'Invalid API key' } }),
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
      const validateResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({}),
      }

      const analyzeResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      }

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce(validateResponse)
        .mockResolvedValueOnce(analyzeResponse)
      
      const result = await geminiService.analyzeFood(validImageData)
      
      expect(result.foods).toHaveLength(1)
      expect(result.foods[0].name).toBe('apple')
      expect(result.foods[0].calories).toBe(95)
      expect(result.totalCalories).toBe(95)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.timestamp).toBeDefined()
    })

    it('should handle API errors gracefully', async () => {
      const validateResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({}),
      }

      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Invalid API key' }
        }),
      }
      
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce(validateResponse)
        .mockResolvedValueOnce(mockResponse)
      
      await expect(geminiService.analyzeFood(validImageData)).rejects.toMatchObject({
        message: expect.stringContaining('Invalid API key'),
      })
    })

    it('should handle rate limiting', async () => {
      const successResponse = { ok: true, status: 200, json: jest.fn().mockResolvedValue({}) }
      const mockResponse = {
        ok: false,
        status: 429,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Rate limit exceeded' }
        }),
      }
      
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce(successResponse)
        .mockResolvedValueOnce(mockResponse)
      
      await expect(geminiService.analyzeFood(validImageData)).rejects.toMatchObject({
        message: expect.stringContaining('Rate limit exceeded'),
      })
    })

    it('should handle timeout', async () => {
      jest.useFakeTimers()
      
      const successResponse = { ok: true, status: 200, json: jest.fn().mockResolvedValue({}) }
      
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce(successResponse)
        .mockImplementationOnce((_url: string, options?: RequestInit) => {
          return new Promise((_resolve, reject) => {
            const signal = options?.signal as AbortSignal | undefined
            signal?.addEventListener('abort', () => {
              const err = new Error('Aborted') as Error & { name: string }
              err.name = 'AbortError'
              reject(err)
            })
          })
        })
      
      const analyzePromise = geminiService.analyzeFood(validImageData)
      const expectation = expect(analyzePromise).rejects.toMatchObject({
        message: expect.stringContaining('Request timeout'),
      })
      
      // Fast-forward time to trigger timeout
      await jest.advanceTimersByTimeAsync(GEMINI_CONFIG.TIMEOUT + 1000)
      
      await expectation
      
      jest.useRealTimers()
    })

    it('should send the image mime type, key header and JSON schema', async () => {
      const okValidate = { ok: true, status: 200, json: jest.fn().mockResolvedValue({}) }
      const analyzeResponse = { ok: true, status: 200, json: jest.fn().mockResolvedValue(mockApiResponse) }
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce(okValidate)
        .mockResolvedValueOnce(analyzeResponse)

      await geminiService.analyzeFood('data:image/png;base64,iVBORw0KGgo')

      const [url, init] = (fetch as jest.Mock).mock.calls[1]
      expect(url).not.toContain('key=')
      expect(init.headers['x-goog-api-key']).toBe('test-api-key')
      const body = JSON.parse(init.body)
      expect(body.contents[0].parts[1].inline_data.mime_type).toBe('image/png')
      expect(body.generationConfig.responseMimeType).toBe('application/json')
      expect(body.generationConfig.responseSchema).toBeDefined()
    })

    it('should report safety-blocked images as unrecognized (422)', async () => {
      const okValidate = { ok: true, status: 200, json: jest.fn().mockResolvedValue({}) }
      const blocked = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ candidates: [{ finishReason: 'SAFETY' }] }),
      }
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce(okValidate)
        .mockResolvedValueOnce(blocked)

      await expect(geminiService.analyzeFood(validImageData)).rejects.toMatchObject({
        statusCode: 422,
        message: expect.stringContaining('safety filter'),
      })
    })

    it('should keep a confidence of 0 instead of replacing it', async () => {
      const okValidate = { ok: true, status: 200, json: jest.fn().mockResolvedValue({}) }
      const response = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [{ text: JSON.stringify({ foods: [{ name: 'x', calories: 10, quantity: '1', confidence: 0 }] }) }] },
          }],
        }),
      }
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce(okValidate)
        .mockResolvedValueOnce(response)

      const result = await geminiService.analyzeFood(validImageData)
      expect(result.foods[0].confidence).toBe(0)
    })

    it('should reject invalid image data', async () => {
      await expect(geminiService.analyzeFood('invalid-image-data')).rejects.toMatchObject({
        message: expect.stringContaining('Invalid image data'),
      })
    })

    it('should handle malformed API responses', async () => {
      const successResponse = { ok: true, status: 200, json: jest.fn().mockResolvedValue({}) }
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ invalid: 'response' }),
      }
      
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce(successResponse)
        .mockResolvedValueOnce(mockResponse)
      
      await expect(geminiService.analyzeFood(validImageData)).rejects.toMatchObject({
        message: expect.stringContaining('Failed to parse analysis results'),
      })
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
      
      const successResponse = { ok: true, status: 200, json: jest.fn().mockResolvedValue({}) }
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(textResponse),
      }
      
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce(successResponse)
        .mockResolvedValueOnce(mockResponse)
      
      const result = await geminiService.analyzeFood(validImageData)
      
      expect(result.foods).toHaveLength(2)
      expect(result.foods[0].name).toBe('Apple')
      expect(result.foods[0].calories).toBe(95)
      expect(result.foods[1].name).toBe('Banana')
      expect(result.foods[1].calories).toBe(105)
    })

    it('should enforce rate limiting', async () => {
      const rateLimits = getRateLimits(undefined, 'gemini-3.8-flash')

      ;(fetch as jest.Mock).mockImplementation((_url: string, init?: RequestInit) => {
        const isValidationCall = init?.method === 'GET'

        if (isValidationCall) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({}),
          })
        }

        return Promise.resolve({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue(mockApiResponse),
        })
      })

      // Make multiple rapid requests up to the per-minute limit + 1
      for (let i = 0; i < rateLimits.requestsPerMinute; i++) {
        await geminiService.analyzeFood(validImageData)
      }

      await expect(geminiService.analyzeFood(validImageData)).rejects.toMatchObject({
        message: expect.stringContaining('Rate limit exceeded'),
      })
    })
  })
})