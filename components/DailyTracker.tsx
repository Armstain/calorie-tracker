"use client";

import { useState, useEffect } from "react";
import { Utensils, PartyPopper, Trash2, RotateCcw, Plus, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrackerProps } from "@/types";
import { formatCalories, dateUtils } from "@/lib/utils";
import Image from "next/image";
import FoodDatabaseEntry from "@/components/FoodDatabaseEntry";
import { CommonFood } from "@/lib/foodDatabase";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useDeleteFoodEntry, useSaveFoodEntry } from "@/lib/queries";
import { useToast } from "@/lib/hooks/useToast";

export default function DailyTracker({
  dailyGoal,
  currentTotal,
  todaysEntries,
  onGoalUpdate,
}: TrackerProps) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(dailyGoal.toString());
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState<'idle' | 'confirm' | 'processing'>('idle');
  const [showFoodDatabase, setShowFoodDatabase] = useState(false);

  // TanStack Query mutations
  const deleteEntryMutation = useDeleteFoodEntry();
  const saveFoodEntryMutation = useSaveFoodEntry();

  // Toast notifications
  const { addToast } = useToast();

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
    // Find the entry to get its details for undo
    const entryToDelete = todaysEntries.find(entry => entry.id === entryId);
    if (!entryToDelete) return;

    // Immediately delete with undo option
    deleteEntryMutation.mutate(
      { entryId },
      {
        onSuccess: () => {
          // Show success toast with undo action
          addToast({
            type: 'success',
            title: "Meal removed",
            description: `${entryToDelete.foods[0]?.name || 'Meal'} (${entryToDelete.totalCalories} cal) was removed`,
            duration: 8000, // Longer duration for undo
            action: {
              label: "Undo",
              onClick: () => {
                // Re-add the entry
                saveFoodEntryMutation.mutate(
                  { entry: entryToDelete },
                  {
                    onSuccess: () => {
                      addToast({
                        type: 'success',
                        title: "Meal restored",
                        description: "The meal has been added back to your log"
                      });
                    },
                    onError: () => {
                      addToast({
                        type: 'error',
                        title: "Failed to restore meal",
                        description: "Please try adding the meal again manually"
                      });
                    }
                  }
                );
              }
            }
          });
        },
        onError: (error) => {
          console.error('Error deleting entry:', error);
          addToast({
            type: 'error',
            title: "Failed to remove meal",
            description: "Please try again"
          });
        }
      }
    );
  };

  const handleResetProgress = () => {
    if (resetStep === 'idle') {
      setResetStep('confirm');
      // Auto-reset to idle after 5 seconds if no action
      setTimeout(() => {
        setResetStep(current => current === 'confirm' ? 'idle' : current);
      }, 5000);
    } else if (resetStep === 'confirm') {
      setResetStep('processing');

      // Store entries for potential undo
      const entriesToDelete = [...todaysEntries];
      let deletedCount = 0;
      const totalEntries = entriesToDelete.length;

      if (totalEntries === 0) {
        setResetStep('idle');
        return;
      }

      entriesToDelete.forEach(entry => {
        deleteEntryMutation.mutate(
          { entryId: entry.id },
          {
            onSuccess: () => {
              deletedCount++;
              if (deletedCount === totalEntries) {
                setResetStep('idle');
                // Show success with undo option
                addToast({
                  type: 'success',
                  title: "Progress reset",
                  description: `Cleared ${totalEntries} meal entries`,
                  duration: 10000,
                  action: {
                    label: "Undo Reset",
                    onClick: () => {
                      // Restore all entries
                      entriesToDelete.forEach(entry => {
                        saveFoodEntryMutation.mutate({ entry });
                      });
                      addToast({
                        type: 'success',
                        title: "Progress restored",
                        description: "All meals have been added back"
                      });
                    }
                  }
                });
              }
            },
            onError: (error) => {
              console.error('Error deleting entry:', error);
              setResetStep('idle');
              addToast({
                type: 'error',
                title: "Failed to reset progress",
                description: "Please try again"
              });
            }
          }
        );
      });
    }
  };

  const handleFoodDatabaseAdd = (food: CommonFood, calories: number, portion: string) => {
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

    saveFoodEntryMutation.mutate(
      { entry: foodEntry },
      {
        onSuccess: () => {
          setShowFoodDatabase(false);
        },
        onError: (error) => {
          console.error('Error adding food from database:', error);
        }
      }
    );
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

        {/* Progress Visualization */}
        {todaysEntries.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">Calorie Breakdown</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Tooltip 
                      formatter={(value: number) => [formatCalories(value), 'Calories']}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Pie
                      data={[
                        { name: 'Consumed', value: currentTotal, color: isOverGoal ? '#ef4444' : '#10b981' },
                        { name: 'Remaining', value: Math.max(remainingCalories, 0), color: '#e5e7eb' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {[
                        { name: 'Consumed', value: currentTotal, color: isOverGoal ? '#ef4444' : '#10b981' },
                        { name: 'Remaining', value: Math.max(remainingCalories, 0), color: '#e5e7eb' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>

              {/* Meal Breakdown */}
              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Meals Today</h5>
                {todaysEntries.slice(0, 4).map((entry) => {
                  const mealTime = new Date(entry.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                  const mealPercentage = (entry.totalCalories / dailyGoal) * 100;
                  
                  return (
                    <div key={entry.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.foods.length === 1 ? entry.foods[0].name : `${entry.foods.length} items`}
                        </div>
                        <div className="text-xs text-gray-500">{mealTime}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCalories(entry.totalCalories)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.round(mealPercentage)}% of goal
                        </div>
                      </div>
                    </div>
                  );
                })}
                {todaysEntries.length > 4 && (
                  <div className="text-xs text-gray-500 text-center pt-2">
                    +{todaysEntries.length - 4} more meals
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        <div
          className={`text-center p-3 rounded-lg mt-4 ${
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
                <div className="flex items-center gap-2">
                  {resetStep === 'confirm' && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-red-50 border border-red-200 rounded text-xs">
                      <span className="text-red-700">Reset {todaysEntries.length} entries?</span>
                      <button
                        onClick={() => setResetStep('idle')}
                        className="text-red-600 hover:text-red-700 underline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  <Button
                    onClick={handleResetProgress}
                    variant="outline"
                    size="sm"
                    disabled={resetStep === 'processing'}
                    className={`${
                      resetStep === 'confirm'
                        ? 'bg-red-600 text-white hover:bg-red-700 border-red-600'
                        : 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    {resetStep === 'processing' ? 'Resetting...' :
                     resetStep === 'confirm' ? 'Confirm' : 'Reset Day'}
                  </Button>
                </div>
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
