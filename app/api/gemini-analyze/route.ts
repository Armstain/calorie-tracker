import { NextRequest, NextResponse } from 'next/server';

// Slow Gemini replies must not be cut off by the platform's default
// function timeout. 60s is the ceiling on Vercel's Hobby plan.
export const maxDuration = 60;
import { geminiService, type AnalysisProgressEvent } from '@/lib/gemini';
import { GEMINI_MODELS } from '@/lib/config';
import { createRateLimiter, getClientId } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Images are compressed to ~1 MB in the browser; allow some headroom.
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
// base64 is ~4/3 the size of the bytes, plus JSON fields (note, context).
const MAX_BODY_BYTES = Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 64 * 1024;

const perMinute = createRateLimiter({ windowMs: 60 * 1000, max: 10 });
const perDay = createRateLimiter({ windowMs: 24 * 60 * 60 * 1000, max: 300 });

function apiError(message: string, statusCode: number, headers?: Record<string, string>) {
  return NextResponse.json({ type: 'api', message, statusCode }, { status: statusCode, headers });
}

function base64Bytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor(base64.length * 3 / 4) - padding;
}

type StreamEvent =
  | AnalysisProgressEvent
  | { type: 'result'; result: unknown }
  | { type: 'error'; error: unknown };

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientId(request.headers);
    for (const limiter of [perMinute, perDay]) {
      const { allowed, retryAfterSeconds } = limiter.check(clientId);
      if (!allowed) {
        return apiError(
          `Too many analysis requests. Please wait ${retryAfterSeconds} seconds and try again.`,
          429,
          { 'Retry-After': String(retryAfterSeconds) }
        );
      }
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return apiError('Image is too large. Please use a photo under 1.5 MB.', 413);
    }

    const body = await request.json().catch(() => null);
    const imageData = body?.imageData;
    const apiKeyRaw = typeof body?.apiKey === 'string' ? body.apiKey : undefined;
    const apiKey = apiKeyRaw && apiKeyRaw.trim() ? apiKeyRaw.trim() : undefined;
    const note = typeof body?.note === 'string' ? body.note : undefined;
    const userContext = typeof body?.userContext === 'string' ? body.userContext : undefined;
    const model = typeof body?.model === 'string' && body.model in GEMINI_MODELS ? body.model : undefined;
    const stream = body?.stream === true;

    if (!imageData || typeof imageData !== 'string') {
      return apiError('imageData is required', 400);
    }

    if (base64Bytes(imageData) > MAX_IMAGE_BYTES) {
      return apiError('Image is too large. Please use a photo under 1.5 MB.', 413);
    }

    if (!stream) {
      const result = await geminiService.analyzeFood(imageData, apiKey, request.signal, { note, userContext, model });
      return NextResponse.json(result);
    }

    // Streaming: newline-delimited JSON events, ending with a "result" or "error" event.
    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: StreamEvent) => {
          try {
            controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
          } catch {
            // Client went away
          }
        };

        try {
          const result = await geminiService.analyzeFood(imageData, apiKey, request.signal, {
            note,
            userContext,
            model,
            onProgress: send,
          });
          send({ type: 'result', result });
        } catch (error) {
          const isApiError = error && typeof error === 'object' && 'type' in error && error.type === 'api';
          send({
            type: 'error',
            error: isApiError ? error : { type: 'api', message: 'Internal server error', statusCode: 500 },
          });
        } finally {
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'type' in error && error.type === 'api') {
      const statusCode =
        'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500;
      return NextResponse.json(error, { status: statusCode });
    }

    return apiError('Internal server error', 500);
  }
}
