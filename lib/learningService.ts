// AI Learning Service - Learn from user corrections to improve accuracy

import { FoodAnalysisResult, FoodItem, MacroNutrients } from '@/types';
// Learning service for AI improvements based on user corrections

interface UserCorrection {
  id: string;
  originalAnalysis: FoodAnalysisResult;
  correctedData: {
    foods: Partial<FoodItem>[];
    totalCalories?: number;
    totalMacros?: MacroNutrients;
    mealType?: string;
    restaurantName?: string;
  };
  timestamp: string;
  imageHash: string;
  correctionType: 'calories' | 'ingredients' | 'cooking_method' | 'macros' | 'restaurant' | 'meal_type';
}

interface LearningPattern {
  pattern: string;
  corrections: number;
  accuracy: number;
  lastSeen: string;
}

export class LearningService {
  private static instance: LearningService;
  private corrections: Map<string, UserCorrection> = new Map();
  private patterns: Map<string, LearningPattern> = new Map();

  static getInstance(): LearningService {
    if (!LearningService.instance) {
      LearningService.instance = new LearningService();
      LearningService.instance.loadCorrections();
    }
    return LearningService.instance;
  }

  // Save user correction and learn from it
  saveCorrection(
    originalAnalysis: FoodAnalysisResult,
    correctedData: {
      foods: Partial<FoodItem>[];
      totalCalories?: number;
      totalMacros?: MacroNutrients;
      mealType?: string;
      restaurantName?: string;
    },
    correctionType: UserCorrection['correctionType']
  ): void {
    const correction: UserCorrection = {
      id: this.generateId(),
      originalAnalysis,
      correctedData: {
        foods: correctedData.foods || [],
        totalCalories: correctedData.totalCalories,
        totalMacros: correctedData.totalMacros,
        mealType: correctedData.mealType,
        restaurantName: correctedData.restaurantName
      },
      timestamp: new Date().toISOString(),
      imageHash: this.hashImage(originalAnalysis.imageUrl || ''),
      correctionType
    };

    this.corrections.set(correction.id, correction);
    this.updateLearningPatterns(correction);
    this.saveCorrections();

    console.log(`Learning: User corrected ${correctionType}`, correction);
  }

  // Get suggestions based on learned patterns
  getSuggestions(analysis: FoodAnalysisResult): {
    calorieAdjustment?: number;
    cookingMethodSuggestions?: string[];
    restaurantSuggestions?: string[];
    ingredientSuggestions?: string[];
    confidenceAdjustment?: number;
  } {
    const imageHash = this.hashImage(analysis.imageUrl || '');
    const suggestions: {
      calorieAdjustment?: number;
      cookingMethodSuggestions?: string[];
      restaurantSuggestions?: string[];
      ingredientSuggestions?: string[];
      confidenceAdjustment?: number;
    } = {};

    // Check for similar images
    const similarCorrections = Array.from(this.corrections.values())
      .filter(c => c.imageHash === imageHash || this.isSimilarFood(c.originalAnalysis, analysis));

    if (similarCorrections.length > 0) {
      // Calorie adjustments
      const calorieCorrections = similarCorrections
        .filter(c => c.correctionType === 'calories' && c.correctedData.totalCalories)
        .map(c => ({
          original: c.originalAnalysis.totalCalories,
          corrected: c.correctedData.totalCalories!
        }));

      if (calorieCorrections.length > 0) {
        const avgAdjustment = calorieCorrections.reduce((sum, c) => 
          sum + (c.corrected - c.original), 0) / calorieCorrections.length;
        suggestions.calorieAdjustment = Math.round(avgAdjustment);
      }

      // Cooking method suggestions
      const cookingMethods = similarCorrections
        .filter(c => c.correctionType === 'cooking_method')
        .flatMap(c => c.correctedData.foods.map(f => f.cookingMethod).filter(Boolean)) as string[];
      
      if (cookingMethods.length > 0) {
        suggestions.cookingMethodSuggestions = [...new Set(cookingMethods)];
      }

      // Restaurant suggestions
      const restaurants = similarCorrections
        .filter(c => c.correctionType === 'restaurant' && c.correctedData.restaurantName)
        .map(c => c.correctedData.restaurantName!);
      
      if (restaurants.length > 0) {
        suggestions.restaurantSuggestions = [...new Set(restaurants)];
      }

      // Confidence adjustment based on correction frequency
      const correctionRate = similarCorrections.length / Math.max(this.getTotalAnalyses(), 1);
      if (correctionRate > 0.3) {
        suggestions.confidenceAdjustment = -0.2; // Lower confidence for frequently corrected items
      }
    }

    return suggestions;
  }

  // Get learning statistics
  getLearningStats(): {
    totalCorrections: number;
    correctionsByType: Record<string, number>;
    accuracyImprovement: number;
    mostCorrectedFoods: string[];
    learningPatterns: LearningPattern[];
  } {
    const corrections = Array.from(this.corrections.values());
    
    const correctionsByType = corrections.reduce((acc, c) => {
      acc[c.correctionType] = (acc[c.correctionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCorrectedFoods = corrections
      .flatMap(c => c.originalAnalysis.foods.map(f => f.name))
      .reduce((acc, food) => {
        acc[food] = (acc[food] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topCorrectedFoods = Object.entries(mostCorrectedFoods)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([food]) => food);

    return {
      totalCorrections: corrections.length,
      correctionsByType,
      accuracyImprovement: this.calculateAccuracyImprovement(),
      mostCorrectedFoods: topCorrectedFoods,
      learningPatterns: Array.from(this.patterns.values()).slice(0, 10)
    };
  }

  // Apply learned corrections to new analysis
  applyLearning(analysis: FoodAnalysisResult): FoodAnalysisResult {
    const suggestions = this.getSuggestions(analysis);
    const enhancedAnalysis = { ...analysis };

    // Apply calorie adjustment
    if (suggestions.calorieAdjustment) {
      enhancedAnalysis.totalCalories += suggestions.calorieAdjustment;
      enhancedAnalysis.foods = enhancedAnalysis.foods.map(food => ({
        ...food,
        calories: Math.round(food.calories * (1 + suggestions.calorieAdjustment! / analysis.totalCalories))
      }));
    }

    // Apply confidence adjustment
    if (suggestions.confidenceAdjustment) {
      enhancedAnalysis.confidence = Math.max(0.1, 
        Math.min(1.0, enhancedAnalysis.confidence + suggestions.confidenceAdjustment));
      
      enhancedAnalysis.foods = enhancedAnalysis.foods.map(food => ({
        ...food,
        confidence: Math.max(0.1, 
          Math.min(1.0, food.confidence + suggestions.confidenceAdjustment!))
      }));
    }

    // Add restaurant suggestion if available
    if (suggestions.restaurantSuggestions && suggestions.restaurantSuggestions.length > 0) {
      enhancedAnalysis.restaurantName = suggestions.restaurantSuggestions[0];
    }

    return enhancedAnalysis;
  }

  // Private helper methods
  private updateLearningPatterns(correction: UserCorrection): void {
    const foods = correction.originalAnalysis.foods;
    
    foods.forEach(food => {
      const pattern = `${food.name}_${food.cookingMethod || 'unknown'}`;
      const existing = this.patterns.get(pattern) || {
        pattern,
        corrections: 0,
        accuracy: 1.0,
        lastSeen: correction.timestamp
      };

      existing.corrections += 1;
      existing.lastSeen = correction.timestamp;
      
      // Adjust accuracy based on correction type
      if (correction.correctionType === 'calories') {
        existing.accuracy *= 0.9; // Reduce accuracy for calorie corrections
      }

      this.patterns.set(pattern, existing);
    });
  }

  private isSimilarFood(analysis1: FoodAnalysisResult, analysis2: FoodAnalysisResult): boolean {
    const foods1 = analysis1.foods.map(f => f.name.toLowerCase());
    const foods2 = analysis2.foods.map(f => f.name.toLowerCase());
    
    // Check if they share at least 50% of food items
    const intersection = foods1.filter(f => foods2.includes(f));
    const union = [...new Set([...foods1, ...foods2])];
    
    return intersection.length / union.length >= 0.5;
  }

  private hashImage(imageUrl: string): string {
    // Simple hash function for image data
    let hash = 0;
    for (let i = 0; i < Math.min(imageUrl.length, 1000); i++) {
      const char = imageUrl.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getTotalAnalyses(): number {
    // This would ideally track total analyses, for now use corrections as proxy
    return this.corrections.size * 3; // Estimate
  }

  private calculateAccuracyImprovement(): number {
    // Calculate improvement based on correction patterns
    const recentCorrections = Array.from(this.corrections.values())
      .filter(c => Date.now() - new Date(c.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000);
    
    if (recentCorrections.length === 0) return 0;
    
    // Simple accuracy improvement calculation
    return Math.max(0, 20 - (recentCorrections.length / 10) * 5);
  }

  private loadCorrections(): void {
    try {
      const stored = localStorage.getItem('ai_learning_corrections');
      if (stored) {
        const data = JSON.parse(stored);
        this.corrections = new Map(data.corrections || []);
        this.patterns = new Map(data.patterns || []);
      }
    } catch (error) {
      console.error('Error loading learning data:', error);
    }
  }

  private saveCorrections(): void {
    try {
      const data = {
        corrections: Array.from(this.corrections.entries()),
        patterns: Array.from(this.patterns.entries()),
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('ai_learning_corrections', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving learning data:', error);
    }
  }
}

export const learningService = LearningService.getInstance();