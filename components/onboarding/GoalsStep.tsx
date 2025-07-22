'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { 
  bmrCalculations, 
  tdeeCalculations, 
  calorieGoalCalculations, 
  GOAL_ADJUSTMENTS 
} from '@/lib/calorieCalculations';

interface GoalsStepProps {
  onContinue: (data: Partial<UserProfile['goals']>) => void;
  onBack: () => void;
  initialData?: Partial<UserProfile['goals']>;
  profileData?: {
    personalInfo: Partial<UserProfile['personalInfo']>;
    activity: Partial<UserProfile['activity']>;
  };
}

interface FitnessGoal {
  value: UserProfile['goals']['primary'];
  label: string;
  description: string;
  adjustment: number;
  icon: string;
  color: string;
}

const fitnessGoals: FitnessGoal[] = [
  {
    value: 'weight_loss',
    label: 'Weight Loss',
    description: 'Lose weight gradually and sustainably',
    adjustment: GOAL_ADJUSTMENTS.weight_loss,
    icon: '📉',
    color: 'border-red-200 bg-red-50 text-red-700'
  },
  {
    value: 'maintenance',
    label: 'Maintain Weight',
    description: 'Keep your current weight stable',
    adjustment: GOAL_ADJUSTMENTS.maintenance,
    icon: '⚖️',
    color: 'border-blue-200 bg-blue-50 text-blue-700'
  },
  {
    value: 'weight_gain',
    label: 'Weight Gain',
    description: 'Gain weight in a healthy way',
    adjustment: GOAL_ADJUSTMENTS.weight_gain,
    icon: '📈',
    color: 'border-green-200 bg-green-50 text-green-700'
  },
  {
    value: 'muscle_building',
    label: 'Build Muscle',
    description: 'Focus on muscle growth and strength',
    adjustment: GOAL_ADJUSTMENTS.muscle_building,
    icon: '💪',
    color: 'border-purple-200 bg-purple-50 text-purple-700'
  }
];

const healthObjectiveOptions = [
  'Improve overall health',
  'Increase energy levels',
  'Better sleep quality',
  'Reduce stress',
  'Improve athletic performance',
  'Better digestion',
  'Boost immune system',
  'Improve mental clarity'
];

export default function GoalsStep({ onContinue, onBack, initialData, profileData }: GoalsStepProps) {
  const [selectedGoal, setSelectedGoal] = useState<UserProfile['goals']['primary']>(
    initialData?.primary || undefined
  );
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>(
    initialData?.healthObjectives || []
  );
  const [targetCalories, setTargetCalories] = useState<number | null>(null);
  const [isValid, setIsValid] = useState(false);

  // Calculate target calories when goal or profile data changes
  useEffect(() => {
    if (selectedGoal && profileData) {
      // Create a temporary profile for calculation
      const tempProfile: UserProfile = {
        hasCompletedOnboarding: false,
        personalInfo: profileData.personalInfo,
        activity: profileData.activity,
        goals: { primary: selectedGoal },
        preferences: {},
        metadata: {
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          onboardingVersion: '1.0'
        }
      };

      // Calculate BMR and TDEE
      const bmr = bmrCalculations.calculateBMR(tempProfile);
      if (bmr && tempProfile.activity.level) {
        const tdee = tdeeCalculations.calculateTDEE(bmr, tempProfile.activity.level);
        const calories = calorieGoalCalculations.calculateDailyCalorieGoal(tdee, selectedGoal);
        setTargetCalories(calories);
      } else {
        setTargetCalories(null);
      }
    } else {
      setTargetCalories(null);
    }
  }, [selectedGoal, profileData]);

  useEffect(() => {
    setIsValid(selectedGoal !== undefined);
  }, [selectedGoal]);

  const handleObjectiveToggle = (objective: string) => {
    setSelectedObjectives(prev => 
      prev.includes(objective)
        ? prev.filter(obj => obj !== objective)
        : [...prev, objective]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      const goalsData: Partial<UserProfile['goals']> = {
        primary: selectedGoal,
        targetCalories: targetCalories || undefined,
        healthObjectives: selectedObjectives.length > 0 ? selectedObjectives : undefined
      };
      onContinue(goalsData);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Your Fitness Goals
          </h1>
          <p className="text-gray-600">
            Choose your primary goal to get personalized recommendations
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primary Goal Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What&apos;s your main fitness goal?
            </label>
            {fitnessGoals.map((goal) => (
              <div
                key={goal.value}
                className={`rounded-lg border p-4 cursor-pointer transition-all duration-200 ${
                  selectedGoal === goal.value
                    ? `border-green-500 bg-green-50 shadow-md`
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => setSelectedGoal(goal.value)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedGoal === goal.value
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedGoal === goal.value && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{goal.icon}</span>
                        <h3 className="font-semibold text-gray-900">
                          {goal.label}
                        </h3>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        goal.adjustment > 0 ? 'bg-green-100 text-green-700' :
                        goal.adjustment < 0 ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {goal.adjustment > 0 ? '+' : ''}{goal.adjustment} cal/day
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {goal.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Calorie Preview */}
          {targetCalories && (
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Your Daily Calorie Target
                </h3>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {targetCalories.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">
                  calories per day
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  Based on your personal information and activity level
                </div>
              </div>
            </div>
          )}

          {/* Health Objectives */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Health objectives (optional)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Select any additional health goals you&apos;d like to focus on
            </p>
            <div className="grid grid-cols-1 gap-2">
              {healthObjectiveOptions.map((objective) => (
                <button
                  key={objective}
                  type="button"
                  onClick={() => handleObjectiveToggle(objective)}
                  className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                    selectedObjectives.includes(objective)
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      selectedObjectives.includes(objective)
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedObjectives.includes(objective) && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                    <span>{objective}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm">💡</span>
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-1">
                  Personalized recommendations
                </h3>
                <p className="text-sm text-blue-800">
                  Your calorie target is calculated using the Harris-Benedict equation based on your 
                  age, gender, height, weight, and activity level, then adjusted for your specific goal.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={`flex-1 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 ${
                isValid
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}