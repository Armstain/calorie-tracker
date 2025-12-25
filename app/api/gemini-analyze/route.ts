import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/lib/gemini';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const imageData = body?.imageData;
    const apiKeyRaw = typeof body?.apiKey === 'string' ? body.apiKey : undefined;
    const apiKey = apiKeyRaw && apiKeyRaw.trim() ? apiKeyRaw.trim() : undefined;

    if (!imageData || typeof imageData !== 'string') {
      return NextResponse.json(
        { type: 'api', message: 'imageData is required', statusCode: 400 },
        { status: 400 }
      );
    }

    const result = await geminiService.analyzeFood(imageData, apiKey, request.signal);
    return NextResponse.json(result);
  } catch (error) {
    if (error && typeof error === 'object' && 'type' in error && error.type === 'api') {
      const statusCode =
        'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500;
      return NextResponse.json(error, { status: statusCode });
    }

    return NextResponse.json(
      { type: 'api', message: 'Internal server error', statusCode: 500 },
      { status: 500 }
    );
  }
}
