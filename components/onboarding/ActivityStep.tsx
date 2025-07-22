'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types';

interface ActivityStepProps {
  onContinue: (data: Partial<UserProfile['activity']>) => void;
  onBack: () => void;
  initialData?: Partial<UserProfile['activity']>;
}

interface ActivityLevel {
  value: UserProfile['activity']['level'];
  label: string;
  description: string;
  multiplier: number;
  examples: string[];
}

const activityLevels: ActivityLevel[] = [
  {
    value: 'sedentary',
    label: 'Sedentary',
    description: 'Little to no exercise',
    multiplier: 1.2,
    examples: ['Desk job', 'Minimal walking', 'No regular exercise']
  },
  {
    value: 'light',
    label: 'Lightly Active',
    description: 'Light exercise 1-3 days/week',
    multiplier: 1.375,
    examples: ['Light walking', 'Occasional gym visits', 'Yoga 1-2x/week']
  },
  {
    value: 'moderate',
    label: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week',
    multiplier: 1.55,
    examples: ['Regular gym sessions', 'Jogging', 'Sports 3-4x/week']
  },
  {
    value: 'active',
    label: 'Very Active',
    description: 'Hard exercise 6-7 days/week',
    multiplier: 1.725,
    examples: ['Daily workouts', 'Running', 'Intense sports training']
  },
  {
    value: 'very_active',
    label: 'Extremely Active',
    description: 'Very hard exercise, physical job',
    multiplier: 1.9,
    examples: ['Professional athlete', 'Physical labor job', '2x daily workouts']
  }
];

export default function ActivityStep({ onContinue, onBack, initialData }: ActivityStepProps) {
  const [selectedLevel, setSelectedLevel] = useState<UserProfile['activity']['level']>(
    initialData?.level || undefined
  );
  const [exerciseFrequency, setExerciseFrequency] = useState<string>(
    initialData?.exerciseFrequency?.toString() || ''
  );
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const frequency = parseInt(exerciseFrequency);
    setIsValid(
      selectedLevel !== undefined && 
      exerciseFrequency !== '' && 
      !isNaN(frequency) && 
      frequency >= 0 && 
      frequency <= 7
    );
  }, [selectedLevel, exerciseFrequency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      const activityData: Partial<UserProfile['activity']> = {
        level: selectedLevel,
        exerciseFrequency: parseInt(exerciseFrequency)
      };
      onContinue(activityData);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Activity Level
          </h1>
          <p className="text-gray-600">
            Help us calculate your daily calorie needs
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Activity Level Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose your activity level
            </label>
            {activityLevels.map((level) => (
              <div
                key={level.value}
                className={`bg-white rounded-lg border p-4 cursor-pointer transition-all duration-200 ${
                  selectedLevel === level.value
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => setSelectedLevel(level.value)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedLevel === level.value
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedLevel === level.value && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {level.label}
                      </h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {level.multiplier}x BMR
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {level.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {level.examples.map((example, index) => (
                        <span
                          key={index}
                          className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Exercise Frequency */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <label htmlFor="exerciseFrequency" className="block text-sm font-medium text-gray-700 mb-2">
              How many days per week do you exercise?
            </label>
            <div className="relative">
              <input
                type="number"
                id="exerciseFrequency"
                value={exerciseFrequency}
                onChange={(e) => setExerciseFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0-7 days"
                min="0"
                max="7"
              />
              <div className="absolute right-3 top-2 text-gray-400 text-sm">
                days/week
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Include any structured exercise, sports, or physical activities
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm">💡</span>
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-1">
                  Why we ask this
                </h3>
                <p className="text-sm text-blue-800">
                  Your activity level helps us calculate your Total Daily Energy Expenditure (TDEE) 
                  to provide accurate calorie recommendations for your goals.
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