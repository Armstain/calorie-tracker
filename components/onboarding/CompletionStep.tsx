'use client';

import React from 'react';
import { UserProfile } from '@/types';
import { 
  profileCalculations, 
  bmiCalculations 
} from '@/lib/calorieCalculations';

interface CompletionStepProps {
  onComplete: () => void;
  onBack: () => void;
  profileData: {
    personalInfo: Partial<UserProfile['personalInfo']>;
    activity: Partial<UserProfile['activity']>;
    goals: Partial<UserProfile['goals']>;
  };
}

const activityLabels = {
  sedentary: 'Sedentary',
  light: 'Lightly Active',
  moderate: 'Moderately Active',
  active: 'Very Active',
  very_active: 'Extremely Active'
};

const goalLabels = {
  weight_loss: 'Weight Loss',
  weight_gain: 'Weight Gain',
  maintenance: 'Maintain Weight',
  muscle_building: 'Build Muscle'
};

const genderLabels = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say'
};

export default function CompletionStep({ onComplete, onBack, profileData }: CompletionStepProps) {
  // Create complete profile for calculations
  const completeProfile: UserProfile = {
    hasCompletedOnboarding: true,
    personalInfo: profileData.personalInfo,
    activity: profileData.activity,
    goals: profileData.goals,
    preferences: {
      units: profileData.personalInfo.height?.unit === 'ft_in' || profileData.personalInfo.weight?.unit === 'lbs' ? 'imperial' : 'metric',
      notifications: true
    },
    metadata: {
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      onboardingVersion: '1.0'
    }
  };

  // Calculate metrics
  const metrics = profileCalculations.calculateAllMetrics(completeProfile);
  const bmi = metrics.bmi;
  const bmiCategory = bmi ? bmiCalculations.getBMICategoryWithColor(bmi) : null;

  // Format height for display
  const formatHeight = (height: { value: number; unit: 'cm' | 'ft_in' }) => {
    if (height.unit === 'cm') {
      return `${height.value} cm`;
    } else {
      const feet = Math.floor(height.value);
      const inches = Math.round((height.value - feet) * 12);
      return `${feet}&apos;${inches}&quot;`;
    }
  };

  // Format weight for display
  const formatWeight = (weight: { value: number; unit: 'kg' | 'lbs' }) => {
    return `${weight.value} ${weight.unit}`;
  };

  // Get personalized welcome message
  const getPersonalizedMessage = () => {
    const goal = profileData.goals.primary ? goalLabels[profileData.goals.primary].toLowerCase() : 'achieve your health goals';
    
    return `Great job completing your profile! We&apos;re excited to help you ${goal === 'maintain weight' ? 'maintain your current weight' : goal} with personalized calorie tracking.`;
  };

  return (
    <div className="flex flex-col min-h-screen p-6 bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="w-full max-w-md mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">
            Profile Complete!
          </h1>
          <p className="text-black">
            {getPersonalizedMessage()}
          </p>
        </div>

        {/* Profile Summary */}
        <div className="space-y-4 mb-8">
          {/* Personal Information */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-black mb-3 flex items-center">
              <span className="mr-2">👤</span>
              Personal Information
            </h3>
            <div className="space-y-2 text-sm">
              {profileData.personalInfo.age && (
                <div className="flex justify-between">
                  <span className="text-black">Age:</span>
                  <span className="font-medium text-black">{profileData.personalInfo.age} years</span>
                </div>
              )}
              {profileData.personalInfo.gender && (
                <div className="flex justify-between">
                  <span className="text-black">Gender:</span>
                  <span className="font-medium text-black">{genderLabels[profileData.personalInfo.gender]}</span>
                </div>
              )}
              {profileData.personalInfo.height && (
                <div className="flex justify-between">
                  <span className="text-black">Height:</span>
                  <span className="font-medium text-black">{formatHeight(profileData.personalInfo.height)}</span>
                </div>
              )}
              {profileData.personalInfo.weight && (
                <div className="flex justify-between">
                  <span className="text-black">Weight:</span>
                  <span className="font-medium text-black">{formatWeight(profileData.personalInfo.weight)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Activity & Goals */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-black mb-3 flex items-center">
              <span className="mr-2">🎯</span>
              Activity & Goals
            </h3>
            <div className="space-y-2 text-sm text-black" >
              {profileData.activity.level && (
                <div className="flex justify-between">
                  <span className="text-black">Activity Level:</span>
                  <span className="font-medium text-black" >{activityLabels[profileData.activity.level]}</span>
                </div>
              )}
              {profileData.activity.exerciseFrequency !== undefined && (
                <div className="flex justify-between">
                  <span className="text-black">Exercise Frequency:</span>
                  <span className="font-medium">{profileData.activity.exerciseFrequency} days/week</span>
                </div>
              )}
              {profileData.goals.primary && (
                <div className="flex justify-between">
                  <span className="text-black">Primary Goal:</span>
                  <span className="font-medium">{goalLabels[profileData.goals.primary]}</span>
                </div>
              )}
            </div>
          </div>

          {/* Calculated Metrics */}
          {(metrics.calorieGoal || bmi) && (
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-black mb-3 flex items-center">
                <span className="mr-2">📊</span>
                Your Metrics
              </h3>
              <div className="space-y-3">
                {metrics.calorieGoal && (
                  <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {metrics.calorieGoal.toLocaleString()}
                    </div>
                    <div className="text-sm text-amber-700">Daily Calorie Target</div>
                  </div>
                )}
                {bmi && bmiCategory && (
                  <div className="flex justify-between items-center">
                    <span className="text-black">BMI:</span>
                    <div className="text-right">
                      <span className="font-medium text-black">{bmi}</span>
                      <div className={`text-xs ${bmiCategory.color}`}>
                        {bmiCategory.category}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Health Objectives */}
          {profileData.goals.healthObjectives && profileData.goals.healthObjectives.length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-black mb-3 flex items-center">
                <span className="mr-2">🌟</span>
                Health Objectives
              </h3>
              <div className="flex flex-wrap gap-2">
                {profileData.goals.healthObjectives.map((objective, index) => (
                  <span
                    key={index}
                    className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full"
                  >
                    {objective}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* What's Next */}
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100 mb-8">
          <h3 className="font-semibold text-orange-900 mb-2 flex items-center">
            <span className="mr-2">🚀</span>
            What&apos;s next?
          </h3>
          <ul className="text-sm text-orange-800 space-y-1">
            <li>• Start tracking your meals with photo capture</li>
            <li>• Monitor your daily calorie progress</li>
            <li>• Get AI-powered nutritional insights</li>
            <li>• Track your health journey over time</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onBack}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Back
          </button>
          <button
            onClick={onComplete}
            className="flex-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
          >
            Start Using CalorieMeter
          </button>
        </div>

        {/* Privacy Reminder */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Your profile data is stored securely on your device and never shared externally.
        </p>
      </div>
    </div>
  );
}