import { ReadableStream as NodeReadableStream } from 'node:stream/web'
import { TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder } from 'node:util'

Object.assign(globalThis, {
  ReadableStream: (globalThis as { ReadableStream?: unknown }).ReadableStream ?? NodeReadableStream,
  TextEncoder: (globalThis as { TextEncoder?: unknown }).TextEncoder ?? NodeTextEncoder,
  TextDecoder: (globalThis as { TextDecoder?: unknown }).TextDecoder ?? NodeTextDecoder,
})

import { requestFoodAnalysis } from '@/lib/queries/analysis'

function ndjsonResponse(chunks: string[]) {
  const encoder = new TextEncoder()
  return {
    ok: true,
    status: 200,
    headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/x-ndjson' : null) },
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        chunks.forEach(c => controller.enqueue(encoder.encode(c)))
        controller.close()
      },
    }),
  }
}

describe('requestFoodAnalysis', () => {
  const result = { foods: [], totalCalories: 95 }

  it('sends note and context, reports progress and returns the result', async () => {
    const lines = [
      JSON.stringify({ type: 'model', model: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' }),
      JSON.stringify({ type: 'food', name: 'apple' }),
      JSON.stringify({ type: 'result', result }),
    ].join('\n') + '\n'
    global.fetch = jest.fn().mockResolvedValue(ndjsonResponse([lines.slice(0, 25), lines.slice(25)]))

    const onProgress = jest.fn()
    const out = await requestFoodAnalysis({
      imageData: 'data:image/jpeg;base64,AAA',
      apiKey: '',
      note: ' 1 apple ',
      userContext: 'ctx',
      onProgress,
    })

    expect(out).toEqual(result)
    expect(onProgress.mock.calls.map(c => c[0].type)).toEqual(['model', 'food'])
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(body).toMatchObject({ note: '1 apple', userContext: 'ctx', stream: true })
  })

  it('throws the error sent in the stream', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      ndjsonResponse([JSON.stringify({ type: 'error', error: { type: 'api', message: 'nope', statusCode: 422 } }) + '\n'])
    )
    await expect(
      requestFoodAnalysis({ imageData: 'data:image/jpeg;base64,AAA', apiKey: '' })
    ).rejects.toMatchObject({ statusCode: 422 })
  })

  it('throws the JSON error body on a non-OK response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 413,
      json: async () => ({ type: 'api', message: 'Image is too large', statusCode: 413 }),
    })
    await expect(
      requestFoodAnalysis({ imageData: 'data:image/jpeg;base64,AAA', apiKey: '' })
    ).rejects.toMatchObject({ statusCode: 413 })
  })
})
