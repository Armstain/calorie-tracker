import {
  getAvailableModels,
  hashKey,
  isModelAvailable,
  markModelUnavailable,
  resetModelHealth,
} from '@/lib/modelHealth'

describe('modelHealth', () => {
  beforeEach(() => resetModelHealth())
  afterEach(() => jest.useRealTimers())

  it('skips a model marked unavailable for that key only', () => {
    markModelUnavailable('key-one-123456', 'model-a')
    expect(isModelAvailable('key-one-123456', 'model-a')).toBe(false)
    expect(isModelAvailable('key-two-123456', 'model-a')).toBe(true)
    expect(getAvailableModels('key-one-123456', ['model-a', 'model-b'])).toEqual(['model-b'])
  })

  it('makes the model available again after the skip period', () => {
    jest.useFakeTimers()
    markModelUnavailable('key', 'model-a', 1000)
    jest.advanceTimersByTime(1001)
    expect(isModelAvailable('key', 'model-a')).toBe(true)
  })

  it('returns the full order if every model is marked', () => {
    markModelUnavailable('key', 'model-a')
    markModelUnavailable('key', 'model-b')
    expect(getAvailableModels('key', ['model-a', 'model-b'])).toEqual(['model-a', 'model-b'])
  })

  it('hashes keys that share a prefix differently', () => {
    expect(hashKey('AIzaSyAAAAAAAAAAAAAAAA1')).not.toBe(hashKey('AIzaSyAAAAAAAAAAAAAAAA2'))
  })
})
