"use client";

import { useState, useEffect } from "react";
import { Utensils, PartyPopper, Trash2, RotateCcw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrackerProps } from "@/types";
import { formatCalories, dateUtils } from "@/lib/utils";
import { storageService } from "@/lib/storage";
import Image from "next/image";
import FoodDatabaseEntry from "@/components/FoodDatabaseEntry";
import { CommonFood } from "@/lib/foodDatabase";

export default function DailyTracker({
  dailyGoal,
  currentTotal,
  todaysEntries,
  onGoalUpdate,
}: TrackerProps) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(dailyGoal.toString());
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [showFoodDatabase, setShowFoodDatabase] = useState(false);

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
    if (isOverGoal) return "bg-red-500";
    if (progressPercentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusMessage = () => {
    if (isOverGoal) {
      return `${formatCalories(
        Math.abs(remainingCalories)
      )} calories over goal`;
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

  const handleDeleteEntry = (entryId: string) => {
    setDeleteEntryId(entryId);
  };

  const confirmDeleteEntry = () => {
    if (deleteEntryId) {
      try {
        storageService.deleteEntry(deleteEntryId);
        // Trigger refresh by calling onGoalUpdate with current goal
        onGoalUpdate(dailyGoal);
        setDeleteEntryId(null);
      } catch (error) {
        console.error('Error deleting entry:', error);
        // Could show error message here
      }
    }
  };

  const cancelDeleteEntry = () => {
    setDeleteEntryId(null);
  };

  const handleResetProgress = () => {
    setShowResetConfirm(true);
  };

  const confirmResetProgress = () => {
    try {
      // Delete all today's entries
      todaysEntries.forEach(entry => {
        storageService.deleteEntry(entry.id);
      });
      // Trigger refresh
      onGoalUpdate(dailyGoal);
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  };

  const cancelResetProgress = () => {
    setShowResetConfirm(false);
  };

  const handleFoodDatabaseAdd = (food: CommonFood, calories: number, portion: string) => {
    try {
      // Create a food entry from the database selection
      const foodEntry = {
        timestamp: new Date().toISOString(),
        foods: [{
          name: food.name,
          calories: calories,
          quantity: portion,
          confidence: 1.0 // Database entries have 100% confidence
        }],
        totalCalories: calories,
        date: dateUtils.getCurrentDate(),
      };

      storageService.saveFoodEntry(foodEntry);
      onGoalUpdate(dailyGoal); // Trigger refresh
      setShowFoodDatabase(false);
    } catch (error) {
      console.error('Error adding food from database:', error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Today&apos;s Progress
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
            <div className="text-sm text-gray-600">
              of {formatCalories(dailyGoal)}
            </div>
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
        <div
          className={`text-center p-3 rounded-lg ${
            isOverGoal
              ? "bg-red-50 text-red-700"
              : remainingCalories === 0
              ? "bg-green-50 text-green-700"
              : "bg-blue-50 text-blue-700"
          }`}
        >
          {getStatusMessage()}
        </div>
      </div>

      {/* Today's Entries */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Today&apos;s Meals ({todaysEntries.length})
          </h3>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowFoodDatabase(true)}
              variant="outline"
              size="sm"
              className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
            >
              <Plus className="w-4 h-4 mr-1" />
              Quick Add
            </Button>
            {todaysEntries.length > 0 && (
              <>
                <div className="text-sm text-gray-600">
                  Total: {formatCalories(currentTotal)} cal
                </div>
                <Button
                  onClick={handleResetProgress}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset Day
                </Button>
              </>
            )}
          </div>
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
                <div className="flex items-center justify-between">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => toggleEntryExpansion(entry.id)}
                  >
                    <div className="font-medium text-gray-900">
                      {entry.foods.length === 1
                        ? entry.foods[0].name
                        : `${entry.foods.length} food items`}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div className="text-right mr-4">
                    <div className="font-semibold text-gray-900">
                      {formatCalories(entry.totalCalories)}
                    </div>
                    <div className="text-xs text-gray-500">calories</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEntry(entry.id);
                      }}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Remove this meal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div 
                      className="text-gray-400 cursor-pointer"
                      onClick={() => toggleEntryExpansion(entry.id)}
                    >
                      {expandedEntry === entry.id ? "▼" : "▶"}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedEntry === entry.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="space-y-2">
                      {entry.foods.map((food, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center"
                        >
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
                        <Image
                          src={entry.imageData}
                          alt="Food entry"
                          width={80}
                          height={80}
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
            {todaysEntries.reduce(
              (total, entry) => total + entry.foods.length,
              0
            )}
          </div>
          <div className="text-sm text-gray-600">Food Items</div>
        </div>
      </div>

      {/* Delete Entry Confirmation Modal */}
      {deleteEntryId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Remove Meal Entry
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove this meal from today&apos;s log? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <Button
                onClick={confirmDeleteEntry}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Meal
              </Button>
              <Button
                onClick={cancelDeleteEntry}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Progress Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reset Today&apos;s Progress
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reset today&apos;s progress? This will remove all {todaysEntries.length} meal entries and cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <Button
                onClick={confirmResetProgress}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Progress
              </Button>
              <Button
                onClick={cancelResetProgress}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Food Database Entry Modal */}
      {showFoodDatabase && (
        <FoodDatabaseEntry
          onFoodAdd={handleFoodDatabaseAdd}
          onClose={() => setShowFoodDatabase(false)}
        />
      )}
    </div>
  );
}
