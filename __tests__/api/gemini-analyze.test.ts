/**
 * @jest-environment node
 */
jest.mock('@/lib/gemini', () => ({
  geminiService: { analyzeFood: jest.fn() },
}))

import { POST } from '@/app/api/gemini-analyze/route'
import { geminiService } from '@/lib/gemini'
import type { NextRequest } from 'next/server'

const analyzeFood = geminiService.analyzeFood as jest.Mock
const smallImage = 'data:image/jpeg;base64,' + 'A'.repeat(1000)

let ipCounter = 0
function makeRequest(body: unknown, ip = `10.0.0.${++ipCounter}`) {
  return new Request('http://localhost/api/gemini-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

const result = { foods: [{ name: 'apple', calories: 95, quantity: '1', confidence: 0.9 }], totalCalories: 95 }

describe('POST /api/gemini-analyze', () => {
  beforeEach(() => analyzeFood.mockReset())

  it('returns JSON and forwards note, context and a known model', async () => {
    analyzeFood.mockResolvedValue(result)
    const res = await POST(makeRequest({
      imageData: smallImage,
      note: '1 apple',
      userContext: 'ctx',
      model: 'gemini-3.6-flash',
    }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(result)
    expect(analyzeFood.mock.calls[0][3]).toMatchObject({ note: '1 apple', userContext: 'ctx', model: 'gemini-3.6-flash' })
  })

  it('ignores unknown model ids', async () => {
    analyzeFood.mockResolvedValue(result)
    await POST(makeRequest({ imageData: smallImage, model: 'not-a-model' }))
    expect(analyzeFood.mock.calls[0][3].model).toBeUndefined()
  })

  it('rejects images over 1.5 MB with 413', async () => {
    const big = 'data:image/jpeg;base64,' + 'A'.repeat(2.1 * 1024 * 1024)
    const res = await POST(makeRequest({ imageData: big }))
    expect(res.status).toBe(413)
    expect(analyzeFood).not.toHaveBeenCalled()
  })

  it('rate limits a client after 10 requests a minute', async () => {
    analyzeFood.mockResolvedValue(result)
    const ip = '192.168.1.50'
    for (let i = 0; i < 10; i++) {
      expect((await POST(makeRequest({ imageData: smallImage }, ip))).status).toBe(200)
    }
    const blocked = await POST(makeRequest({ imageData: smallImage }, ip))
    expect(blocked.status).toBe(429)
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0)
  })

  it('streams progress events followed by the result', async () => {
    analyzeFood.mockImplementation(async (_img, _key, _signal, options) => {
      options.onProgress({ type: 'model', model: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' })
      options.onProgress({ type: 'food', name: 'apple' })
      return result
    })
    const res = await POST(makeRequest({ imageData: smallImage, stream: true }))
    expect(res.headers.get('content-type')).toContain('application/x-ndjson')
    const events = (await res.text()).trim().split('\n').map(line => JSON.parse(line))
    expect(events.map(e => e.type)).toEqual(['model', 'food', 'result'])
    expect(events[2].result).toEqual(result)
  })

  it('sends errors as a final stream event', async () => {
    analyzeFood.mockRejectedValue({ type: 'api', message: 'No food found', statusCode: 422 })
    const res = await POST(makeRequest({ imageData: smallImage, stream: true }))
    const events = (await res.text()).trim().split('\n').map(line => JSON.parse(line))
    expect(events).toEqual([{ type: 'error', error: { type: 'api', message: 'No food found', statusCode: 422 } }])
  })
})
