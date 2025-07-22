"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Loader2, Check, X } from "lucide-react";
import { FoodAnalysisResult, FoodItem } from "@/types";
import { useToast } from "@/lib/hooks/useToast";

interface NaturalLanguageCorrectionProps {
  analysisResult: FoodAnalysisResult;
  foodIndex: number;
  onCorrectionApplied: (
    correctedFood: FoodItem,
    newTotalCalories: number
  ) => void;
  onCancel: () => void;
}

export default function NaturalLanguageCorrection({
  analysisResult,
  foodIndex,
  onCorrectionApplied,
  onCancel,
}: NaturalLanguageCorrectionProps) {
  const [correctionText, setCorrectionText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { loading, success, error: showError, updateToast } = useToast();

  const food = analysisResult.foods[foodIndex];

  const handleCorrection = async () => {
    if (!correctionText.trim()) return;

    setIsProcessing(true);

    // Show loading toast
    const loadingToastId = loading(
      "Processing correction...",
      "AI is analyzing your correction"
    );

    // Simple retry logic for rate limiting
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Update toast for retry
          updateToast(loadingToastId, {
            title: `Retrying... (${attempt + 1}/3)`,
            description: "Please wait while we process your correction"
          });
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      // Create a correction prompt for the AI
      const correctionPrompt = `You are a food nutrition expert. A user wants to correct a food analysis.

ORIGINAL FOOD:
Name: ${food.name}
Calories: ${food.calories}
Quantity: ${food.quantity}
${food.cookingMethod ? `Cooking: ${food.cookingMethod}` : ""}

USER CORRECTION: "${correctionText}"

Provide ONLY a JSON response with the corrected food information:

{
  "name": "corrected food name",
  "calories": number,
  "quantity": "corrected portion size",
  "confidence": 0.9,
  "ingredients": ["ingredient1", "ingredient2"],
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

Rules:
- If size mentioned (small/large/medium), adjust calories proportionally
- If food type changes, recalculate everything
- If cooking method changes, adjust calories accordingly
- Provide realistic nutritional estimates
- Return ONLY valid JSON, no other text`;

      // Use Gemini to process the correction
      const response = await fetch("/api/gemini-correction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: correctionPrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        } else if (response.status === 503) {
          throw new Error('AI service is temporarily unavailable. Please try again in a few minutes.');
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('API key authentication failed. Please check your settings.');
        } else {
          throw new Error(errorData.error || 'Failed to process correction');
        }
      }

      const data = await response.json();

      if (!data.response) {
        throw new Error("No response received from AI");
      }



      // Parse the AI response
      let correctedFood: FoodItem;
      try {
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          correctedFood = {
            name: parsed.name || food.name,
            calories: Math.round(parsed.calories || food.calories),
            quantity: parsed.quantity || food.quantity,
            confidence: parsed.confidence || 0.9,
            ingredients: Array.isArray(parsed.ingredients)
              ? parsed.ingredients
              : food.ingredients,
            cookingMethod: parsed.cookingMethod || food.cookingMethod,
            macros: parsed.macros
              ? {
                  protein: Math.round(parsed.macros.protein || 0),
                  carbs: Math.round(parsed.macros.carbs || 0),
                  fat: Math.round(parsed.macros.fat || 0),
                  fiber: Math.round(parsed.macros.fiber || 0),
                }
              : food.macros,
            category: parsed.category || food.category,
            healthScore: parsed.healthScore || food.healthScore,
          };
        } else {
          // Fallback: try to parse the entire response as JSON
          try {
            const parsed = JSON.parse(data.response);
            correctedFood = {
              name: parsed.name || food.name,
              calories: Math.round(parsed.calories || food.calories),
              quantity: parsed.quantity || food.quantity,
              confidence: parsed.confidence || 0.9,
              ingredients: Array.isArray(parsed.ingredients)
                ? parsed.ingredients
                : food.ingredients,
              cookingMethod: parsed.cookingMethod || food.cookingMethod,
              macros: parsed.macros
                ? {
                    protein: Math.round(parsed.macros.protein || 0),
                    carbs: Math.round(parsed.macros.carbs || 0),
                    fat: Math.round(parsed.macros.fat || 0),
                    fiber: Math.round(parsed.macros.fiber || 0),
                  }
                : food.macros,
              category: parsed.category || food.category,
              healthScore: parsed.healthScore || food.healthScore,
            };
          } catch {
            throw new Error("Invalid response format from AI");
          }
        }
      } catch (parseError) {
        console.error("Failed to parse correction response:", parseError);
        console.error("Raw response:", data.response);
        throw new Error(
          "Failed to understand the correction. Please try rephrasing."
        );
      }

      // Calculate new total calories
      const otherFoodsCalories = analysisResult.foods
        .filter((_, index) => index !== foodIndex)
        .reduce((sum, f) => sum + f.calories, 0);
      const newTotalCalories = otherFoodsCalories + correctedFood.calories;

        // Success! Update toast and apply correction
        updateToast(loadingToastId, {
          type: 'success',
          title: 'Correction applied!',
          description: `Updated ${food.name} with your changes`,
          duration: 3000
        });

        // Apply the correction
        onCorrectionApplied(correctedFood, newTotalCalories);
        setIsProcessing(false);
        onCancel(); // Close the modal
        return; // Success, exit retry loop

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Correction processing error (attempt ${attempt + 1}):`, lastError);
        
        // If it's a rate limit error and we have retries left, continue
        if (lastError.message.includes('Too many requests') && attempt < maxRetries) {
          continue;
        }
        
        // For other errors or if we're out of retries, break
        break;
      }
    }

    // If we get here, all attempts failed
    updateToast(loadingToastId, {
      type: 'error',
      title: 'Correction failed',
      description: lastError?.message || 'Failed to process correction',
      duration: 5000
    });

    setIsProcessing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCorrection();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Correct Food Analysis
          </h3>
        </div>

        <div className="mb-4">
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <h4 className="font-medium text-gray-900 mb-1">
              Current Analysis:
            </h4>
            <p className="text-sm text-gray-600">
              <span className="font-medium">{food.name}</span> - {food.calories}{" "}
              calories ({food.quantity})
            </p>
            {food.cookingMethod && (
              <p className="text-xs text-gray-500 mt-1">
                Cooking method: {food.cookingMethod}
              </p>
            )}
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            What should be corrected?
          </label>
          <Input
            value={correctionText}
            onChange={(e) => setCorrectionText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., 'That's actually a large pizza slice, not small' or 'It's grilled chicken, not fried'"
            className="w-full"
            disabled={isProcessing}
          />

          <div className="mt-2 text-xs text-gray-500">
            <p className="mb-1">Examples of corrections you can make:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>&quot;That&apos;s a large portion, not medium&quot;</li>
              <li>&quot;It&apos;s baked, not fried&quot;</li>
              <li>&quot;That&apos;s a veggie burger, not beef&quot;</li>
              <li>&quot;Add extra cheese and bacon&quot;</li>
            </ul>
          </div>
        </div>



        <div className="flex gap-3">
          <Button
            onClick={handleCorrection}
            disabled={!correctionText.trim()}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            Apply Correction
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          AI will analyze your correction and recalculate calories and nutritional information accordingly.
        </p>
      </div>
    </div>
  );
}
