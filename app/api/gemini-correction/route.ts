import { NextRequest, NextResponse } from 'next/server';
import { getApiKey, GEMINI_MODELS, GEMINI_CONFIG } from '@/lib/config';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  clientData.count++;
  return true;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Simple rate limiting based on IP
    const clientId = request.headers.get('x-forwarded-for') || 'localhost';
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Try models in fallback order with retry logic
    const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro'];
    const retryDelays = [1000, 2000, 4000]; // Exponential backoff
    
    for (const modelName of modelsToTry) {
      const modelConfig = GEMINI_MODELS[modelName as keyof typeof GEMINI_MODELS];
      if (!modelConfig) continue;

      // Try each model with retries
      for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
        try {
          const requestBody = {
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              topK: 32,
              topP: 1,
              maxOutputTokens: 1024,
            }
          };

          const response = await fetch(`${modelConfig.url}?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (response.ok) {
            const data = await response.json();
            
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
              return NextResponse.json({
                response: data.candidates[0].content.parts[0].text,
                modelUsed: modelName
              });
            }
          }

          // Handle specific error cases
          if (response.status === 429) {
            // Rate limited - wait and retry
            if (attempt < retryDelays.length) {
              await delay(retryDelays[attempt]);
              continue;
            }
            // If all retries exhausted, try next model
            break;
          }

          if (response.status === 401 || response.status === 403) {
            // Auth error - don't retry, return immediately
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
              { error: errorData.error?.message || 'Authentication failed' },
              { status: response.status }
            );
          }

          // For other errors, try next attempt or model
          if (attempt < retryDelays.length) {
            await delay(retryDelays[attempt]);
            continue;
          }
          break;

        } catch (error) {
          console.error(`Error with model ${modelName}, attempt ${attempt + 1}:`, error);
          
          // Network error - retry with delay
          if (attempt < retryDelays.length) {
            await delay(retryDelays[attempt]);
            continue;
          }
          break;
        }
      }
    }

    // All models and retries failed
    return NextResponse.json(
      { error: 'All AI models are currently unavailable. Please try again in a few minutes.' },
      { status: 503 }
    );

  } catch (error) {
    console.error('Gemini correction API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}