'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, Camera, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResultsProps } from '@/types';
import { formatCalories } from '@/lib/utils';

export default function ResultsDisplay({ 
  analysisResult, 
  onAddToDaily, 
  onRetakePhoto 
}: ResultsProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToDaily = async () => {
    try {
      setIsAdding(true);
      await onAddToDaily();
    } finally {
      setIsAdding(false);
    }
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

      {/* Total Calories Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
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
        
        {/* Overall Confidence */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-blue-700">Confidence Level:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(analysisResult.confidence)}`}>
            {getConfidenceText(analysisResult.confidence)} ({Math.round(analysisResult.confidence * 100)}%)
          </span>
        </div>
      </div>

      {/* Individual Food Items */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Identified Foods ({analysisResult.foods.length})
        </h3>
        
        <div className="space-y-3">
          {analysisResult.foods.map((food, index) => (
            <div 
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 capitalize">
                    {food.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {food.quantity}
                  </p>
                </div>
                
                <div className="text-right ml-4">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCalories(food.calories)}
                  </div>
                  <div className="text-xs text-gray-500">calories</div>
                </div>
              </div>
              
              {/* Individual Confidence */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">Confidence:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(food.confidence)}`}>
                  {Math.round(food.confidence * 100)}%
                </span>
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