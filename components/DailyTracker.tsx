'use client';

import { useState, useEffect } from 'react';
import { Utensils, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TrackerProps, FoodEntry } from '@/types';
import { formatCalories, dateUtils } from '@/lib/utils';

export default function DailyTracker({ 
  dailyGoal, 
  currentTotal, 
  todaysEntries, 
  onGoalUpdate 
}: TrackerProps) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(dailyGoal.toString());
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  useEffect(() => {
    setGoalInput(dailyGoal.toString());
  }, [dailyGoal]);

  const progressPercentage = Math.min((currentTotal / dailyGoal) * 100, 100);
  const isOverGoal = currentTotal > dailyGoal;
  const remainingCalories = dailyGoal - currentTotal;

  const handleGoalSave = () => {
    const newGoal = parseInt(goalInput);
    if (newGoal > 0 && newGoal <= 10000) {
      onGoalUpdate(newGoal);
      setIsEditingGoal(false);
    }
  };

  const handleGoalCancel = () => {
    setGoalInput(dailyGoal.toString());
    setIsEditingGoal(false);
  };

  const getProgressColor = () => {
    if (isOverGoal) return 'bg-red-500';
    if (progressPercentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusMessage = () => {
    if (isOverGoal) {
      return `${formatCalories(Math.abs(remainingCalories))} calories over goal`;
    }
    if (remainingCalories > 0) {
      return `${formatCalories(remainingCalories)} calories remaining`;
    }
    return (
      <span className="flex items-center justify-center gap-2">
        <PartyPopper className="w-4 h-4" />
        Goal reached!
      </span>
    );
  };

  const toggleEntryExpansion = (entryId: string) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Today's Progress
        </h2>
        <p className="text-gray-600">
          {dateUtils.formatDisplayDate(dateUtils.getCurrentDate())}
        </p>
      </div>

      {/* Daily Goal Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Daily Goal</h3>
          {!isEditingGoal && (
            <Button
              onClick={() => setIsEditingGoal(true)}
              variant="ghost"
              size="sm"
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              Edit
            </Button>
          )}
        </div>

        {isEditingGoal ? (
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="flex-1"
              placeholder="Enter daily calorie goal"
              min="1"
              max="10000"
            />
            <Button
              onClick={handleGoalSave}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Save
            </Button>
            <Button
              onClick={handleGoalCancel}
              variant="secondary"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="text-2xl font-bold text-gray-900">
            {formatCalories(dailyGoal)} calories
          </div>
        )}
      </div>

      {/* Progress Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {formatCalories(currentTotal)}
            </div>
            <div className="text-sm text-gray-600">of {formatCalories(dailyGoal)}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>0</span>
            <span>{Math.round(progressPercentage)}%</span>
            <span>{formatCalories(dailyGoal)}</span>
          </div>
        </div>

        {/* Status Message */}
        <div className={`text-center p-3 rounded-lg ${
          isOverGoal 
            ? 'bg-red-50 text-red-700' 
            : remainingCalories === 0 
              ? 'bg-green-50 text-green-700'
              : 'bg-blue-50 text-blue-700'
        }`}>
          {getStatusMessage()}
        </div>
      </div>

      {/* Today's Entries */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Today's Meals ({todaysEntries.length})
          </h3>
          {todaysEntries.length > 0 && (
            <div className="text-sm text-gray-600">
              Total: {formatCalories(currentTotal)} cal
            </div>
          )}
        </div>

        {todaysEntries.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Utensils className="w-16 h-16 mx-auto" />
            </div>
            <p className="text-gray-600">No meals logged today</p>
            <p className="text-sm text-gray-500 mt-1">
              Take a photo of your food to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaysEntries.map((entry) => (
              <div
                key={entry.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleEntryExpansion(entry.id)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {entry.foods.length === 1 
                        ? entry.foods[0].name 
                        : `${entry.foods.length} food items`}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(entry.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  
                  <div className="text-right mr-4">
                    <div className="font-semibold text-gray-900">
                      {formatCalories(entry.totalCalories)}
                    </div>
                    <div className="text-xs text-gray-500">calories</div>
                  </div>

                  <div className="text-gray-400">
                    {expandedEntry === entry.id ? '▼' : '▶'}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedEntry === entry.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="space-y-2">
                      {entry.foods.map((food, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {food.name}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({food.quantity})
                            </span>
                          </div>
                          <span className="text-sm text-gray-700">
                            {formatCalories(food.calories)} cal
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {entry.imageData && (
                      <div className="mt-3">
                        <img
                          src={entry.imageData}
                          alt="Food entry"
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {todaysEntries.length}
          </div>
          <div className="text-sm text-gray-600">Meals Logged</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {todaysEntries.reduce((total, entry) => total + entry.foods.length, 0)}
          </div>
          <div className="text-sm text-gray-600">Food Items</div>
        </div>
      </div>
    </div>
  );
}