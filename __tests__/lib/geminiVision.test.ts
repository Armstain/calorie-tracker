import { ReadableStream as NodeReadableStream } from 'node:stream/web'
import { TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder } from 'node:util'

// jsdom lacks web streams; use Node's implementations.
Object.assign(globalThis, {
  ReadableStream: (globalThis as { ReadableStream?: unknown }).ReadableStream ?? NodeReadableStream,
  TextEncoder: (globalThis as { TextEncoder?: unknown }).TextEncoder ?? NodeTextEncoder,
  TextDecoder: (globalThis as { TextDecoder?: unknown }).TextDecoder ?? NodeTextDecoder,
})

jest.mock('@/lib/config', () => {
  const actual = jest.requireActual('@/lib/config')
  return {
    ...actual,
    GEMINI_CONFIG: {
      ...actual.GEMINI_CONFIG,
      FALLBACK_ORDER: ['gemini-3.8-flash', 'gemini-3.6-flash'],
    },
  }
})

jest.mock('../../lib/cache', () => ({
  cache: { get: jest.fn().mockReturnValue(null), set: jest.fn() },
  cacheUtils: { getImageCacheKey: jest.fn().mockReturnValue('img') },
}))

import { GeminiService, type AnalysisProgressEvent } from '@/lib/gemini'
import { resetModelHealth } from '@/lib/modelHealth'

const image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ'
const foodJson = JSON.stringify({
  foods: [
    { name: 'basmati rice', quantity: '1 cup', estimatedGrams: 180, calories: 230, confidence: 0.85 },
    { name: 'chicken curry', quantity: '1 bowl', estimatedGrams: 250, calories: 400, confidence: 0.8 },
  ],
})

const okJson = (body: unknown) => ({ ok: true, status: 200, json: async () => body })
const validateOk = okJson({ models: [] })
const generateOk = okJson({ candidates: [{ content: { parts: [{ text: foodJson }] } }] })

function sseResponse(chunks: string[]) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
  return { ok: true, status: 200, body: stream, json: async () => { throw new Error('not json') } }
}

function sseEvent(text: string, finishReason?: string) {
  return `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, ...(finishReason ? { finishReason } : {}) }] })}\r\n\r\n`
}

describe('GeminiService vision', () => {
  let service: GeminiService
  const fetchMock = jest.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    global.fetch = fetchMock as unknown as typeof fetch
    process.env.GEMINI_API_KEY = 'server-test-key-123'
    resetModelHealth()
    ;(GeminiService as unknown as { instance?: unknown }).instance = undefined
    service = GeminiService.getInstance()
  })

  it('parses estimated grams', async () => {
    fetchMock.mockResolvedValueOnce(validateOk).mockResolvedValueOnce(generateOk)
    const result = await service.analyzeFood(image)
    expect(result.foods[0].estimatedGrams).toBe(180)
    expect(result.totalCalories).toBe(630)
  })

  it('adds the user note and learned context to the prompt', async () => {
    fetchMock.mockResolvedValueOnce(validateOk).mockResolvedValueOnce(generateOk)
    await service.analyzeFood(image, undefined, undefined, {
      note: '2 rotis, large bowl of dal',
      userContext: '- AI estimated "rice" = 200 kcal; user corrected to "rice" = 330 kcal',
    })
    const prompt: string = JSON.parse(fetchMock.mock.calls[1][1].body).contents[0].parts[0].text
    expect(prompt).toContain('USER NOTE ABOUT THIS MEAL')
    expect(prompt).toContain('2 rotis, large bowl of dal')
    expect(prompt).toContain("THIS USER'S PAST CORRECTIONS")
    expect(prompt).toContain('estimatedGrams')
  })

  it('caps very long notes', async () => {
    fetchMock.mockResolvedValueOnce(validateOk).mockResolvedValueOnce(generateOk)
    await service.analyzeFood(image, undefined, undefined, { note: 'x'.repeat(5000) })
    const prompt: string = JSON.parse(fetchMock.mock.calls[1][1].body).contents[0].parts[0].text
    expect(prompt).not.toContain('x'.repeat(301))
  })

  it('skips a model that returned 404 on later requests', async () => {
    const notFound = { ok: false, status: 404, json: async () => ({ error: { message: 'model not found' } }) }
    fetchMock
      .mockResolvedValueOnce(validateOk)
      .mockResolvedValueOnce(notFound)
      .mockResolvedValueOnce(generateOk)

    const first = await service.analyzeFood(image)
    expect(first.modelUsed).toBe('gemini-3.6-flash')
    expect(fetchMock.mock.calls[1][0]).toContain('gemini-3.8-flash')

    fetchMock.mockReset()
    fetchMock.mockResolvedValueOnce(generateOk)
    // Key validation is cached by the real cache in production; here it is mocked, so allow it.
    fetchMock.mockImplementation(async (url: string) => (url.endsWith('/models') ? validateOk : generateOk))
    await service.analyzeFood(image)
    const urls = fetchMock.mock.calls.map(c => c[0] as string)
    expect(urls.some(u => u.includes('gemini-3.8-flash'))).toBe(false)
  })

  it('streams progress and reports foods as they appear', async () => {
    const half = Math.floor(foodJson.length / 2)
    fetchMock
      .mockResolvedValueOnce(validateOk)
      .mockResolvedValueOnce(sseResponse([
        sseEvent(foodJson.slice(0, half)),
        // split an event across network chunks
        sseEvent(foodJson.slice(half), 'STOP').slice(0, 10),
        sseEvent(foodJson.slice(half), 'STOP').slice(10),
      ]))

    const events: AnalysisProgressEvent[] = []
    const result = await service.analyzeFood(image, undefined, undefined, { onProgress: e => events.push(e) })

    expect(fetchMock.mock.calls[1][0]).toContain(':streamGenerateContent?alt=sse')
    expect(events[0]).toEqual({ type: 'model', model: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' })
    expect(events.filter(e => e.type === 'food').map(e => (e as { name: string }).name))
      .toEqual(['basmati rice', 'chicken curry'])
    expect(result.foods).toHaveLength(2)
    expect(result.totalCalories).toBe(630)
  })

  it('reports a stream that was cut off by the token limit', async () => {
    fetchMock
      .mockResolvedValueOnce(validateOk)
      .mockResolvedValueOnce(sseResponse([sseEvent('', 'MAX_TOKENS')]))
      .mockResolvedValueOnce(sseResponse([sseEvent('', 'MAX_TOKENS')]))

    await expect(
      service.analyzeFood(image, undefined, undefined, { onProgress: () => {} })
    ).rejects.toMatchObject({ message: expect.stringContaining('cut off') })
  })
})
