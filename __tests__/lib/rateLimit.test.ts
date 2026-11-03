import { createRateLimiter, getClientId } from '@/lib/rateLimit'

describe('createRateLimiter', () => {
  afterEach(() => jest.useRealTimers())

  it('allows up to max requests per window, then blocks with a retry time', () => {
    jest.useFakeTimers()
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2 })

    expect(limiter.check('a').allowed).toBe(true)
    expect(limiter.check('a').allowed).toBe(true)
    const blocked = limiter.check('a')
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)

    // Other clients are counted separately
    expect(limiter.check('b').allowed).toBe(true)

    jest.advanceTimersByTime(60_001)
    expect(limiter.check('a').allowed).toBe(true)
  })
})

describe('getClientId', () => {
  it('uses the first x-forwarded-for address', () => {
    expect(getClientId(new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }))).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip, then anonymous', () => {
    expect(getClientId(new Headers({ 'x-real-ip': '5.6.7.8' }))).toBe('5.6.7.8')
    expect(getClientId(new Headers())).toBe('anonymous')
  })
})
