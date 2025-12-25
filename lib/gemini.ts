import { FoodAnalysisResult, ApiError } from '@/types';
import { GEMINI_CONFIG, GEMINI_MODELS, getApiKey, getRateLimits, isUsingDefaultTestKey } from '@/lib/config';
import { validation } from '@/lib/utils';
import { cache, cacheUtils } from '@/lib/cache';

export class GeminiService {
  private static instance: GeminiService;
  private requestCount = 0;
  private lastRequestTime = 0;
  private dailyRequestCount = 0;
  private dailyCountResetDate = new Date().toDateString();
  private retryDelays = [1000, 2000, 4000, 8000];

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private getModelConfig(modelName: string) {
    return GEMINI_MODELS[modelName as keyof typeof GEMINI_MODELS];
  }

  private async enforceRateLimit(modelName?: string, apiKey?: string): Promise<void> {
    const now = Date.now();
    const today = new Date().toDateString();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest > 60000) {
      this.requestCount = 0;
    }
    
    if (today !== this.dailyCountResetDate) {
      this.dailyRequestCount = 0;
      this.dailyCountResetDate = today;
    }
    
     const model = (modelName || GEMINI_CONFIG.DEFAULT_MODEL) as keyof typeof GEMINI_MODELS;
     const rateLimits = getRateLimits(apiKey, model);
    
    if (this.requestCount >= rateLimits.requestsPerMinute) {
      const waitTime = 60000 - timeSinceLastRequest;
      if (waitTime > 0) {
        throw this.createApiError(`Rate limit exceeded (${this.requestCount}/${rateLimits.requestsPerMinute} requests per minute). Please wait ${Math.ceil(waitTime/1000)} seconds and try again.`, 429);
      }
    }
    
    if (this.dailyRequestCount >= rateLimits.requestsPerDay) {
      throw this.createApiError(`Daily rate limit exceeded (${this.dailyRequestCount}/${rateLimits.requestsPerDay} requests per day). Please try again tomorrow.`, 429);
    }
    
    this.requestCount++;
    this.dailyRequestCount++;
    this.lastRequestTime = now;
    
    
  }
  async validateApiKey(apiKey?: string): Promise<boolean> {
    try {
      const key = apiKey || getApiKey();
      
      if (!validation.validateApiKey(key)) {
        console.warn('API key validation failed: Invalid format');
        return false;
      }
      
      const cacheKey = `api_key_validation_${key.substring(0, 10)}`;
      const cachedResult = cache.get<boolean>(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }

      const fallbackOrder = GEMINI_CONFIG.FALLBACK_ORDER;
      for (const modelName of fallbackOrder) {
          try {
          const modelCacheKey = `model_available_${modelName}_${key.substring(0, 10)}`;
          const modelAvailable = cache.get<boolean>(modelCacheKey);
          
          if (modelAvailable === true) {
            cache.set(cacheKey, true, 60 * 60 * 1000);
            return true;
          }
          
          const modelConfig = this.getModelConfig(modelName);
          if (!modelConfig) continue;

          const response = await fetch(`${modelConfig.url}?key=${key}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: 'Hello' }]
              }]
            })
          });
          
          if (response.status !== 401 && response.status !== 403) {
            cache.set(cacheKey, true, 60 * 60 * 1000); // 1 hour
            cache.set(modelCacheKey, true, 60 * 60 * 1000); // 1 hour
            
            return true;
          }
          
          const errorData = await response.json().catch(() => ({}));
          console.warn(`API key validation failed for model ${modelName}: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`);
        } catch (error) {
          console.warn(`Error testing model ${modelName}:`, error);
          continue; // Try next model
        }
      }
      
      cache.set(cacheKey, false, 5 * 60 * 1000);
      console.warn('API key validation failed: All models failed');
      return false;
    } catch (error) {
      console.error('API key validation error:', error);
      return false;
    }
  }

  async analyzeFood(imageBase64: string, userApiKey?: string, signal?: AbortSignal): Promise<FoodAnalysisResult> {
    try {
      if (!validation.validateImageData(imageBase64)) {
        throw this.createApiError('Invalid image data provided');
      }
      const cacheKey = cacheUtils.getImageCacheKey(imageBase64);
      const cachedResult = cache.get<FoodAnalysisResult>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      let apiKey: string;
      try {
        apiKey = getApiKey(userApiKey);
      } catch (error) {
        console.error('API key retrieval failed:', error);
        throw this.createApiError('API key not configured. Please check your settings.', 400);
      }

      const isKeyValid = await this.validateApiKey(apiKey);
      if (!isKeyValid) {
        console.error('API key validation failed');
        throw this.createApiError('Invalid API key. Please check your Gemini API key in settings.', 403);
      }

      const errors: string[] = [];
      const fallbackOrder = GEMINI_CONFIG.FALLBACK_ORDER;
      for (const modelName of fallbackOrder) {
        let lastError: unknown = null;
        let retryCount = 0;
        
        while (retryCount <= this.retryDelays.length) {
          try {
            const result = await this.tryAnalyzeWithModel(imageBase64, apiKey, modelName, signal);
            
            cache.set(cacheKey, result, 10 * 60 * 1000);
            
            return result;
          } catch (error) {
            lastError = error;
            const errorMsg = error && typeof error === 'object' && 'message' in error 
              ? String(error.message) 
              : 'Unknown error';
            
            if (error && typeof error === 'object' && 'statusCode' in error) {
              const statusCode = error.statusCode as number;
              
              if (statusCode === 401 || statusCode === 403 || statusCode === 400) {
                errors.push(`${modelName}: ${errorMsg} (${statusCode})`);
                break; // Exit retry loop for this model
              }

              if (statusCode === 422) {
                throw error;
              }
              
              if (statusCode === 429) {
                const usingSharedDemoKey = isUsingDefaultTestKey(apiKey);
                if (usingSharedDemoKey) {
                  throw this.createApiError(
                    'The built-in demo Gemini API key is currently rate-limited. Add your own Gemini API key in Settings, or set GEMINI_API_KEY in .env.local and restart the dev server.',
                    429
                  );
                }

                errors.push(`${modelName}: ${errorMsg} (${statusCode})`);
                break; // Exit retry loop for this model; try next model
              }
              
              if ((statusCode >= 500 && statusCode < 600) && retryCount < this.retryDelays.length) {
                const delayMs = this.retryDelays[retryCount];
                await new Promise(resolve => setTimeout(resolve, delayMs));
                retryCount++;
                continue;
              }
            }
            
            if (error instanceof TypeError && error.message.includes('network') && retryCount < this.retryDelays.length) {
              const delayMs = this.retryDelays[retryCount];
              await new Promise(resolve => setTimeout(resolve, delayMs));
              retryCount++;
              continue;
            }
            
            errors.push(`${modelName}: ${errorMsg}`);
            console.warn(`Model ${modelName} failed after ${retryCount} retries:`, errorMsg);
            break;
          }
        }
        
        if (lastError && typeof lastError === 'object' && 'statusCode' in lastError) {
          const statusCode = lastError.statusCode as number;
          if (statusCode === 401 || statusCode === 403) {
            throw lastError; // Re-throw auth errors immediately
          }
        }
      }

      throw this.createApiError(`Food analysis failed with all models. ${errors.join('; ')}`);

    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error && error.type === 'api') {
        throw error;
      }
      
      console.error('Gemini API error:', error);
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : 'Unknown error';
      
      throw this.createApiError(`Analysis failed: ${errorMessage}. Please check your internet connection and try again.`);
    }
  }

  // Try analysis with a specific model
  private async tryAnalyzeWithModel(
    imageBase64: string, 
    apiKey: string, 
    modelName: string,
    signal?: AbortSignal
  ): Promise<FoodAnalysisResult> {
    await this.enforceRateLimit(modelName, apiKey);

    const modelConfig = this.getModelConfig(modelName);
    if (!modelConfig) {
        throw this.createApiError(`Configuration for model ${modelName} not found`);
    }

    const base64Data = imageBase64.split(',')[1];
    if (!base64Data) {
      throw this.createApiError('Invalid image format');
    }

    const requestBody = {
      contents: [{
        parts: [
          {
            text: this.getFoodAnalysisPrompt()
          },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 1,
        maxOutputTokens: 1024,
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_CONFIG.TIMEOUT);

    const abortFromUpstream = () => controller.abort();
    if (signal) {
      if (signal.aborted) {
        controller.abort();
      } else {
        signal.addEventListener('abort', abortFromUpstream, { once: true });
      }
    }

    let response: Response;
    try {
      response = await fetch(`${modelConfig.url}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener('abort', abortFromUpstream);
      }
      const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
      if (name === 'AbortError') {
        if (signal?.aborted) {
          throw this.createApiError('Canceled', 499, 'canceled');
        }
        throw this.createApiError('Request timeout. Please try again.', 408);
      }
      throw error;
    }

    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', abortFromUpstream);
    }

    // Handle response errors
    if (!response.ok) {
      await this.handleApiError(response);
    }

    const data = await response.json();
    
    // Parse and validate response
    return this.parseGeminiResponse(data, imageBase64, modelName);
  }

  // Handle API response errors
  private async handleApiError(response: Response): Promise<never> {
    const status = response.status;
    let errorMessage = 'API request failed';

    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // Use default message if can't parse error response
    }

    switch (status) {
      case 401:
      case 403:
        throw this.createApiError('Invalid API key. Please check your Gemini API key in settings.', status);
      case 429:
        throw this.createApiError('Rate limit exceeded. Please wait a moment and try again.', status);
      case 400:
        throw this.createApiError('Invalid request. Please try with a different image.', status);
      case 500:
      case 502:
      case 503:
        throw this.createApiError('Gemini service temporarily unavailable. Please try again later.', status);
      default:
        throw this.createApiError(`API error: ${errorMessage}`, status);
    }
  }

  private parseGeminiResponse(data: unknown, originalImage: string, modelName?: string): FoodAnalysisResult {
    try {
      if (!data || typeof data !== 'object' || !('candidates' in data) || 
          !Array.isArray(data.candidates) || !data.candidates[0] || 
          !data.candidates[0].content) {
        throw new Error('Invalid response format');
      }

      const responseText = data.candidates[0].content.parts[0].text;
      
      // Try to parse JSON response
      let parsedData: { foods?: unknown[] };
      try {
        // Look for JSON in the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: parse structured text response
          parsedData = this.parseTextResponse(responseText);
        }
      } catch {
        // Fallback: parse structured text response
        parsedData = this.parseTextResponse(responseText);
      }

      const foods = Array.isArray(parsedData.foods) ? parsedData.foods : [];
      const validFoods = foods.filter((food: unknown) => 
        food && 
        typeof food === 'object' &&
        'name' in food &&
        'calories' in food &&
        typeof food.name === 'string' && 
        typeof food.calories === 'number' && 
        food.calories >= 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ).map((food: any) => ({
        name: food.name,
        calories: Math.round(food.calories),
        quantity: food.quantity || 'serving',
        confidence: Math.min(Math.max(food.confidence || 0.7, 0), 1),
        ingredients: Array.isArray(food.ingredients) ? food.ingredients : [],
        cookingMethod: food.cookingMethod || undefined,
        macros: food.macros ? {
          protein: Math.round(food.macros.protein || 0),
          carbs: Math.round(food.macros.carbs || 0),
          fat: Math.round(food.macros.fat || 0),
          fiber: Math.round(food.macros.fiber || 0)
        } : undefined,
        category: food.category || undefined,
        healthScore: food.healthScore ? Math.min(Math.max(food.healthScore, 1), 10) : undefined
      }));

      if (validFoods.length === 0) {
        throw this.createApiError(
          'Could not recognize any food in this image. Try a clearer photo with better lighting and the full plate visible.',
          422
        );
      }

      const totalCalories = validFoods.reduce((sum: number, food) => sum + food.calories, 0);
      const avgConfidence = validFoods.reduce((sum: number, food) => sum + food.confidence, 0) / validFoods.length;

      // Calculate total macros
      const totalMacros = validFoods.reduce((total, food) => {
        if (food.macros) {
          return {
            protein: total.protein + food.macros.protein,
            carbs: total.carbs + food.macros.carbs,
            fat: total.fat + food.macros.fat,
            fiber: total.fiber + food.macros.fiber
          };
        }
        return total;
      }, { protein: 0, carbs: 0, fat: 0, fiber: 0 });

      return {
        foods: validFoods,
        totalCalories,
        confidence: Math.round(avgConfidence * 100) / 100,
        timestamp: new Date().toISOString(),
        imageUrl: originalImage,
        modelUsed: modelName || GEMINI_CONFIG.DEFAULT_MODEL,
        mealType: (() => {
          const mealType = (parsedData as { mealType?: string }).mealType;
          const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
          return validMealTypes.includes(mealType || '') 
            ? mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack'
            : undefined;
        })(),
        restaurantName: (parsedData as { restaurantName?: string }).restaurantName || undefined,
        totalMacros: totalMacros.protein > 0 || totalMacros.carbs > 0 || totalMacros.fat > 0 ? totalMacros : undefined
      };

    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error && error.type === 'api') {
        throw error as ApiError;
      }

      console.error('Response parsing error:', error);
      throw this.createApiError('Failed to parse analysis results. Please try again with a clearer image.');
    }
  }

  // Fallback text parsing for non-JSON responses
  private parseTextResponse(text: string): { foods: unknown[] } {
    const foods = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      // Look for patterns like "Food Name: X calories"
      const match = line.match(/(.+?):\s*(\d+)\s*cal/i);
      if (match) {
        foods.push({
          name: match[1].trim(),
          calories: parseInt(match[2]),
          quantity: 'serving',
          confidence: 0.7
        });
      }
    }

    return { foods };
  }

  private getFoodAnalysisPrompt(): string {
    return `Analyze this image and provide comprehensive food information. This could be either actual food or a nutrition label/food packaging. Return the response as JSON with this exact format:

{
  "foods": [
    {
      "name": "food item name",
      "calories": number,
      "quantity": "portion size or serving size",
      "confidence": 0.8,
      "ingredients": ["ingredient1", "ingredient2", "ingredient3"],
      "cookingMethod": "grilled|fried|baked|steamed|raw|boiled|roasted",
      "macros": {
        "protein": number,
        "carbs": number,
        "fat": number,
        "fiber": number
      },
      "category": "protein|vegetable|grain|fruit|dairy|snack|beverage",
      "healthScore": number
    }
  ],
  "mealType": "breakfast|lunch|dinner|snack",
  "restaurantName": "restaurant name if identifiable",
  "totalMacros": {
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number
  }
}

ENHANCED ANALYSIS INSTRUCTIONS:

**INGREDIENT BREAKDOWN:**
- List main ingredients you can identify
- Include seasonings, sauces, oils if visible
- For complex dishes, break down components (e.g., burger: "beef patty", "bun", "lettuce", "tomato", "cheese")

**COOKING METHOD DETECTION:**
- Look for visual cues: grill marks, golden browning, oil sheen, etc.
- "grilled" - visible grill marks, charred edges
- "fried" - golden/crispy exterior, oil visible
- "baked" - even browning, dry surface
- "steamed" - moist appearance, no browning
- "raw" - fresh, uncooked appearance
- "boiled" - soft texture, no browning
- "roasted" - caramelized edges, dry heat cooking

**MACRO ESTIMATION (grams):**
- Protein: meat, fish, eggs, beans, dairy
- Carbs: bread, rice, pasta, fruits, vegetables
- Fat: oils, butter, nuts, fatty meats
- Fiber: vegetables, fruits, whole grains

**HEALTH SCORE (1-10):**
- 8-10: Very healthy (vegetables, lean proteins, whole grains)
- 6-7: Moderately healthy (balanced meals with some processing)
- 4-5: Average (mixed healthy and less healthy components)
- 1-3: Less healthy (highly processed, fried, high sugar/fat)

**RESTAURANT DETECTION:**
- Look for distinctive plating, branded items, restaurant-style presentation
- Common chains: McDonald's, Subway, Starbucks, etc.
- Include restaurant name if clearly identifiable

**MEAL TYPE DETECTION:**
- breakfast: eggs, cereal, toast, coffee, pancakes
- lunch: sandwiches, salads, soups, light meals
- dinner: larger portions, multiple courses, hearty meals
- snack: small portions, finger foods, single items

**NUTRITION LABEL PRIORITY:**
- If nutrition label visible, use exact values and set confidence to 0.95
- Extract all macro information from label
- Use product name and serving size exactly as stated

**ACCURACY GUIDELINES:**
- Be specific about food names and cooking methods
- Consider portion sizes carefully
- Set confidence based on image clarity and food recognition
- Include all visible components of complex dishes
- Estimate macros based on typical food composition

Focus on comprehensive analysis while maintaining accuracy.`;
  }

  // Create API error helper
  private createApiError(message: string, statusCode?: number, code?: string): ApiError {
    return {
      type: 'api',
      message,
      statusCode,
      ...(code ? { code } : {}),
    };
  }
}

// Export singleton instance
export const geminiService = GeminiService.getInstance();