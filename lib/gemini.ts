// Gemini AI service for food analysis

import { FoodAnalysisResult, ApiError } from '@/types';
import { GEMINI_CONFIG, getApiKey } from '@/lib/config';
import { validation } from '@/lib/utils';
import { cache, cacheUtils } from '@/lib/cache';

export class GeminiService {
  private static instance: GeminiService;
  private requestCount = 0;
  private lastRequestTime = 0;

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  // Rate limiting helper
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Reset counter if more than a minute has passed
    if (timeSinceLastRequest > 60000) {
      this.requestCount = 0;
    }
    
    // Check if we're hitting rate limits
    if (this.requestCount >= GEMINI_CONFIG.MAX_REQUESTS_PER_MINUTE) {
      const waitTime = 60000 - timeSinceLastRequest;
      if (waitTime > 0) {
        throw this.createApiError('Rate limit exceeded. Please wait a moment and try again.', 429);
      }
    }
    
    this.requestCount++;
    this.lastRequestTime = now;
  }

  // Validate API key
  async validateApiKey(apiKey?: string): Promise<boolean> {
    try {
      const key = apiKey || getApiKey();
      if (!validation.validateApiKey(key)) {
        return false;
      }
      
      // Test with a simple request
      const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${key}`, {
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
      
      return response.status !== 401 && response.status !== 403;
    } catch {
      return false;
    }
  }

  // Main food analysis method
  async analyzeFood(imageBase64: string, userApiKey?: string): Promise<FoodAnalysisResult> {
    try {
      // Validate inputs
      if (!validation.validateImageData(imageBase64)) {
        throw this.createApiError('Invalid image data provided');
      }

      // Check cache first
      const cacheKey = cacheUtils.getImageCacheKey(imageBase64);
      const cachedResult = cache.get<FoodAnalysisResult>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // Enforce rate limiting
      await this.enforceRateLimit();

      // Get API key
      const apiKey = getApiKey(userApiKey);

      // Prepare the image data (remove data URL prefix)
      const base64Data = imageBase64.split(',')[1];
      if (!base64Data) {
        throw this.createApiError('Invalid image format');
      }

      // Create the request payload
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

      // Make API request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), GEMINI_CONFIG.TIMEOUT);

      const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle response errors
      if (!response.ok) {
        await this.handleApiError(response);
      }

      const data = await response.json();
      
      // Parse and validate response
      const result = this.parseGeminiResponse(data, imageBase64);
      
      // Cache the result for 10 minutes
      cache.set(cacheKey, result, 10 * 60 * 1000);
      
      return result;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createApiError('Request timeout. Please try again.', 408);
      }
      
      if (error && typeof error === 'object' && 'type' in error && error.type === 'api') {
        throw error;
      }
      
      console.error('Gemini API error:', error);
      throw this.createApiError('Analysis failed. Please check your internet connection and try again.');
    }
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

  // Parse Gemini response into structured data
  private parseGeminiResponse(data: unknown, originalImage: string): FoodAnalysisResult {
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

      // Validate and structure the result
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
        confidence: Math.min(Math.max(food.confidence || 0.7, 0), 1)
      }));

      if (validFoods.length === 0) {
        throw new Error('No valid food items identified');
      }

      const totalCalories = validFoods.reduce((sum: number, food) => sum + food.calories, 0);
      const avgConfidence = validFoods.reduce((sum: number, food) => sum + food.confidence, 0) / validFoods.length;

      return {
        foods: validFoods,
        totalCalories,
        confidence: Math.round(avgConfidence * 100) / 100,
        timestamp: new Date().toISOString(),
        imageUrl: originalImage
      };

    } catch (error) {
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

  // Generate the analysis prompt
  private getFoodAnalysisPrompt(): string {
    return `Analyze this image and provide detailed calorie information. This could be either actual food or a nutrition label/food packaging. Return the response as JSON with this exact format:

{
  "foods": [
    {
      "name": "food item name",
      "calories": number,
      "quantity": "portion size or serving size",
      "confidence": 0.8
    }
  ]
}

INSTRUCTIONS:

**If this is a NUTRITION LABEL or FOOD PACKAGING:**
- Read the nutrition facts label carefully
- Extract the exact calorie information per serving
- Use the product name from the package
- Use the serving size exactly as stated on the label
- Set confidence to 0.95 for nutrition labels (they're accurate)
- Look for "Calories per serving", "Energy", or similar labels
- If multiple servings are visible, calculate total calories

**If this is ACTUAL FOOD:**
- Identify all visible food items
- Estimate realistic calories based on typical serving sizes
- Be specific about food names (e.g., "grilled chicken breast" not just "chicken")
- Consider cooking methods and ingredients
- Use visual estimation for portion sizes
- Set confidence based on how clearly you can identify the food (0.6-0.9)

**General Guidelines:**
- If you see both packaging AND food, prioritize the nutrition label data
- Include confidence scores (0.0 to 1.0)
- If multiple items, list each separately
- Use standard portion descriptions (e.g., "1 cup", "medium slice", "1 piece", "per 100g")
- For packaged foods, include brand name if visible
- Be conservative with estimates if uncertain

**Examples:**
- Nutrition label showing "120 calories per serving" → use exactly 120 calories
- Bag of chips with "150 cal per 28g serving" → use 150 calories for that serving size
- Actual apple → estimate based on size (e.g., "80 calories for medium apple")

Focus on accuracy and prioritize nutrition label data when available.`;
  }

  // Create API error helper
  private createApiError(message: string, statusCode?: number): ApiError {
    return {
      type: 'api',
      message,
      statusCode,
    };
  }
}

// Export singleton instance
export const geminiService = GeminiService.getInstance();