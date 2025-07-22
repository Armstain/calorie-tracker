'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, Camera, AlertTriangle, Edit3, MapPin, Clock, ChefHat, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResultsProps, FoodItem } from '@/types';
import { formatCalories } from '@/lib/utils';
import { learningService } from '@/lib/learningService';
import NaturalLanguageCorrection from '@/components/NaturalLanguageCorrection';

export default function ResultsDisplay({ 
  analysisResult, 
  onAddToDaily, 
  onRetakePhoto,
  onAnalysisUpdate
}: ResultsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [naturalCorrectionIndex, setNaturalCorrectionIndex] = useState<number | null>(null);
  const [correctionData, setCorrectionData] = useState<{
    calories: string;
    cookingMethod: string;
    ingredients: string;
  }>({ calories: '', cookingMethod: '', ingredients: '' });

  const handleAddToDaily = async () => {
    try {
      setIsAdding(true);
      await onAddToDaily();
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuickCorrection = (index: number) => {
    const food = analysisResult.foods[index];
    setCorrectionData({
      calories: food.calories.toString(),
      cookingMethod: food.cookingMethod || '',
      ingredients: food.ingredients?.join(', ') || ''
    });
    setEditingIndex(index);
  };

  const handleNaturalCorrection = (index: number) => {
    setNaturalCorrectionIndex(index);
  };

  const handleCorrectionApplied = (correctedFood: FoodItem, newTotalCalories: number) => {
    if (naturalCorrectionIndex === null) return;

    // Update the analysis result with the corrected food
    const updatedFoods = [...analysisResult.foods];
    updatedFoods[naturalCorrectionIndex] = correctedFood;

    const updatedResult = {
      ...analysisResult,
      foods: updatedFoods,
      totalCalories: newTotalCalories
    };

    // Update parent component's state
    if (onAnalysisUpdate) {
      onAnalysisUpdate(updatedResult);
    }

    setNaturalCorrectionIndex(null);

    // Save the correction to learning service
    learningService.saveCorrection(
      analysisResult,
      updatedResult,
      'ingredients' // Natural language corrections typically involve ingredient/food identification changes
    );
  };

  const saveCorrection = () => {
    if (editingIndex === null) return;
    
    const originalFood = analysisResult.foods[editingIndex];
    const correctedCalories = parseInt(correctionData.calories) || originalFood.calories;
    
    // Validate cooking method
    const validCookingMethods = ['grilled', 'fried', 'baked', 'steamed', 'raw', 'boiled', 'roasted'];
    const cookingMethod = validCookingMethods.includes(correctionData.cookingMethod) 
      ? correctionData.cookingMethod as 'grilled' | 'fried' | 'baked' | 'steamed' | 'raw' | 'boiled' | 'roasted'
      : undefined;

    const correctedFood = {
      ...originalFood,
      calories: correctedCalories,
      cookingMethod,
      ingredients: correctionData.ingredients.split(',').map(i => i.trim()).filter(Boolean)
    };

    // Update the analysis result
    const updatedFoods = [...analysisResult.foods];
    updatedFoods[editingIndex] = correctedFood;
    
    const newTotalCalories = updatedFoods.reduce((sum, food) => sum + food.calories, 0);
    
    const updatedResult = {
      ...analysisResult,
      foods: updatedFoods,
      totalCalories: newTotalCalories
    };

    // Update parent component's state
    if (onAnalysisUpdate) {
      onAnalysisUpdate(updatedResult);
    }

    // Save the correction to learning service
    learningService.saveCorrection(
      analysisResult,
      updatedResult,
      'calories' // Manual corrections typically involve calorie adjustments
    );

    setEditingIndex(null);
    setCorrectionData({ calories: '', cookingMethod: '', ingredients: '' });
  };

  const cancelCorrection = () => {
    setEditingIndex(null);
    setCorrectionData({ calories: '', cookingMethod: '', ingredients: '' });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'protein': return 'bg-red-100 text-red-700';
      case 'vegetable': return 'bg-green-100 text-green-700';
      case 'grain': return 'bg-yellow-100 text-yellow-700';
      case 'fruit': return 'bg-pink-100 text-pink-700';
      case 'dairy': return 'bg-blue-100 text-blue-700';
      case 'snack': return 'bg-orange-100 text-orange-700';
      case 'beverage': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    if (score >= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Analysis Results
        </h2>
        <p className="text-gray-600">
          AI-powered calorie estimation for your food
        </p>
      </div>

      {/* Image Display */}
      {analysisResult.imageUrl && (
        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
          <div className="relative w-full h-64">
            <Image
              src={analysisResult.imageUrl}
              alt="Analyzed food"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </div>
      )}

      {/* Enhanced Summary with Context */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">
              Total Calories
            </h3>
            <p className="text-sm text-blue-700">
              Estimated calorie content
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-900">
              {formatCalories(analysisResult.totalCalories)}
            </div>
            <div className="text-sm text-blue-700">calories</div>
          </div>
        </div>

        {/* Context Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Meal Type */}
          {analysisResult.mealType && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">Meal:</span>
              <span className="text-sm font-medium text-blue-900 capitalize">
                {analysisResult.mealType}
              </span>
            </div>
          )}

          {/* Restaurant */}
          {analysisResult.restaurantName && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">Restaurant:</span>
              <span className="text-sm font-medium text-blue-900">
                {analysisResult.restaurantName}
              </span>
            </div>
          )}

          {/* Overall Confidence */}
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700">Confidence:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(analysisResult.confidence)}`}>
              {getConfidenceText(analysisResult.confidence)} ({Math.round(analysisResult.confidence * 100)}%)
            </span>
          </div>
        </div>

        {/* Total Macros Summary */}
        {analysisResult.totalMacros && (
          <div className="bg-white rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-3">Total Macronutrients:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{analysisResult.totalMacros.protein}g</div>
                <div className="text-xs text-blue-700">Protein</div>
                <div className="text-xs text-gray-500">
                  {Math.round((analysisResult.totalMacros.protein * 4 / analysisResult.totalCalories) * 100)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{analysisResult.totalMacros.carbs}g</div>
                <div className="text-xs text-blue-700">Carbs</div>
                <div className="text-xs text-gray-500">
                  {Math.round((analysisResult.totalMacros.carbs * 4 / analysisResult.totalCalories) * 100)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-600">{analysisResult.totalMacros.fat}g</div>
                <div className="text-xs text-blue-700">Fat</div>
                <div className="text-xs text-gray-500">
                  {Math.round((analysisResult.totalMacros.fat * 9 / analysisResult.totalCalories) * 100)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">{analysisResult.totalMacros.fiber}g</div>
                <div className="text-xs text-blue-700">Fiber</div>
                <div className="text-xs text-gray-500">Daily Value</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Food Items with Detailed Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Detailed Food Analysis ({analysisResult.foods.length})
        </h3>
        
        <div className="space-y-4">
          {analysisResult.foods.map((food, index) => (
            <div 
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              {/* Food Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 capitalize text-lg">
                      {food.name}
                    </h4>
                    {food.category && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(food.category)}`}>
                        {food.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {food.quantity}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCalories(food.calories)}
                  </div>
                  <div className="text-xs text-gray-500">calories</div>
                </div>
              </div>

              {/* Enhanced Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Cooking Method */}
                {food.cookingMethod && (
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-600">Cooking:</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {food.cookingMethod}
                    </span>
                  </div>
                )}

                {/* Health Score */}
                {food.healthScore && (
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${getHealthScoreColor(food.healthScore)}`} />
                    <span className="text-sm text-gray-600">Health Score:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {food.healthScore}/10
                    </span>
                  </div>
                )}

                {/* Confidence */}
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Confidence:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(food.confidence)}`}>
                    {Math.round(food.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Ingredients */}
              {food.ingredients && food.ingredients.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Ingredients:</h5>
                  <div className="flex flex-wrap gap-1">
                    {food.ingredients.map((ingredient, i) => (
                      <span 
                        key={i}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Macronutrients */}
              {food.macros && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Macronutrients:</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{food.macros.protein}g</div>
                      <div className="text-gray-600">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{food.macros.carbs}g</div>
                      <div className="text-gray-600">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-yellow-600">{food.macros.fat}g</div>
                      <div className="text-gray-600">Fat</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-purple-600">{food.macros.fiber}g</div>
                      <div className="text-gray-600">Fiber</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Correction Buttons */}
              <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                <Button
                  onClick={() => handleNaturalCorrection(index)}
                  variant="outline"
                  size="sm"
                  className="text-xs text-blue-600 hover:text-blue-800 border-blue-200 hover:border-blue-300"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Natural Correction
                </Button>
                <Button
                  onClick={() => handleQuickCorrection(index)}
                  variant="outline"
                  size="sm"
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Manual Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Metadata */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Analysis Time:</span>
            <div className="font-medium text-gray-900">
              {new Date(analysisResult.timestamp).toLocaleTimeString()}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Items Found:</span>
            <div className="font-medium text-gray-900">
              {analysisResult.foods.length} food{analysisResult.foods.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        {/* Model Information */}
        {analysisResult.modelUsed && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">AI Model Used:</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  analysisResult.modelUsed === 'gemini-2.0-flash' 
                    ? 'bg-purple-100 text-purple-700' 
                    : analysisResult.modelUsed === 'gemini-1.5-pro'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {analysisResult.modelUsed === 'gemini-2.0-flash' && '🚀 Gemini 2.0 Flash'}
                  {analysisResult.modelUsed === 'gemini-1.5-pro' && '⭐ Gemini 1.5 Pro'}
                  {analysisResult.modelUsed === 'gemini-1.5-flash' && '⚡ Gemini 1.5 Flash'}
                  {!['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'].includes(analysisResult.modelUsed) && 
                    `🤖 ${analysisResult.modelUsed}`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleAddToDaily}
          disabled={isAdding}
          className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-3 px-4 rounded-lg transition-colors gap-2"
        >
          {isAdding ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Adding...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Add to Daily Total
            </>
          )}
        </Button>
        
        <Button
          onClick={onRetakePhoto}
          variant="secondary"
          className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors gap-2"
        >
          <Camera className="w-4 h-4" />
          Analyze Another
        </Button>
      </div>

      {/* Manual Correction Modal */}
      {editingIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Manual Food Correction
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Manually adjust the food analysis details:
            </p>
            
            <div className="space-y-4">
              {/* Calories Correction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calories (current: {analysisResult.foods[editingIndex].calories})
                </label>
                <Input
                  type="number"
                  value={correctionData.calories}
                  onChange={(e) => setCorrectionData(prev => ({ ...prev, calories: e.target.value }))}
                  placeholder="Enter correct calories"
                  className="w-full"
                />
              </div>

              {/* Cooking Method Correction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cooking Method
                </label>
                <select
                  value={correctionData.cookingMethod}
                  onChange={(e) => setCorrectionData(prev => ({ ...prev, cookingMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select cooking method</option>
                  <option value="grilled">Grilled</option>
                  <option value="fried">Fried</option>
                  <option value="baked">Baked</option>
                  <option value="steamed">Steamed</option>
                  <option value="raw">Raw</option>
                  <option value="boiled">Boiled</option>
                  <option value="roasted">Roasted</option>
                </select>
              </div>

              {/* Ingredients Correction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingredients (comma-separated)
                </label>
                <Input
                  type="text"
                  value={correctionData.ingredients}
                  onChange={(e) => setCorrectionData(prev => ({ ...prev, ingredients: e.target.value }))}
                  placeholder="e.g., chicken, rice, vegetables"
                  className="w-full"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={saveCorrection}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                Save Correction
              </Button>
              <Button
                onClick={cancelCorrection}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Your corrections help improve AI accuracy for future analyses.
            </p>
          </div>
        </div>
      )}

      {/* Natural Language Correction Modal */}
      {naturalCorrectionIndex !== null && (
        <NaturalLanguageCorrection
          analysisResult={analysisResult}
          foodIndex={naturalCorrectionIndex}
          onCorrectionApplied={handleCorrectionApplied}
          onCancel={() => setNaturalCorrectionIndex(null)}
        />
      )}

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">
              Estimation Disclaimer
            </h4>
            <p className="text-sm text-yellow-700">
              Calorie estimates are AI-generated approximations based on visual analysis. 
              Actual values may vary depending on preparation methods, ingredients, and portion sizes. 
              For precise nutritional information, consult food labels or a nutritionist.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}