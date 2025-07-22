'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, User, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserSettings, UserProfile } from '@/types';
import { formatCalories } from '@/lib/utils';
import { storageService } from '@/lib/storage';
import DataManagement from '@/components/DataManagement';

interface GoalSettingsProps {
  settings: UserSettings;
  onSettingsUpdate: (settings: Partial<UserSettings>) => void;
  weeklyAverage?: number;
  goalAchievementRate?: number;
  onProfileUpdate?: () => void;
}

export default function GoalSettings({ 
  settings, 
  onSettingsUpdate, 
  weeklyAverage = 0,
  goalAchievementRate = 0,
  onProfileUpdate
}: GoalSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({
    dailyCalorieGoal: settings.dailyCalorieGoal.toString(),
    apiKey: settings.apiKey || '',
    notifications: settings.notifications,
    dataRetentionDays: settings.dataRetentionDays.toString()
  });
  const [profileFormData, setProfileFormData] = useState({
    age: '',
    gender: undefined as UserProfile['personalInfo']['gender'],
    height: { value: '', unit: 'cm' as 'cm' | 'ft_in' },
    weight: { value: '', unit: 'kg' as 'kg' | 'lbs' },
    units: 'metric' as 'metric' | 'imperial',
    activityLevel: undefined as UserProfile['activity']['level'],
    exerciseFrequency: '',
    primaryGoal: undefined as UserProfile['goals']['primary'],
    healthObjectives: [] as string[]
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      dailyCalorieGoal: settings.dailyCalorieGoal.toString(),
      apiKey: settings.apiKey || '',
      notifications: settings.notifications,
      dataRetentionDays: settings.dataRetentionDays.toString()
    });
  }, [settings]);

  // Load user profile on component mount
  useEffect(() => {
    const profile = storageService.getUserProfile();
    setUserProfile(profile);
    
    if (profile) {
      setProfileFormData({
        age: profile.personalInfo.age?.toString() || '',
        gender: profile.personalInfo.gender,
        height: {
          value: profile.personalInfo.height?.value?.toString() || '',
          unit: profile.personalInfo.height?.unit || 'cm'
        },
        weight: {
          value: profile.personalInfo.weight?.value?.toString() || '',
          unit: profile.personalInfo.weight?.unit || 'kg'
        },
        units: profile.personalInfo.height?.unit === 'ft_in' || profile.personalInfo.weight?.unit === 'lbs' ? 'imperial' : 'metric',
        activityLevel: profile.activity.level,
        exerciseFrequency: profile.activity.exerciseFrequency?.toString() || '',
        primaryGoal: profile.goals.primary,
        healthObjectives: profile.goals.healthObjectives || []
      });
    }
  }, []);

  // Update units when toggle changes
  useEffect(() => {
    if (isEditingProfile) {
      setProfileFormData(prev => ({
        ...prev,
        height: {
          ...prev.height,
          unit: prev.units === 'metric' ? 'cm' : 'ft_in'
        },
        weight: {
          ...prev.weight,
          unit: prev.units === 'metric' ? 'kg' : 'lbs'
        }
      }));
    }
  }, [profileFormData.units, isEditingProfile]);

  const handleSave = () => {
    const dailyGoal = parseInt(formData.dailyCalorieGoal);
    const retentionDays = parseInt(formData.dataRetentionDays);

    if (dailyGoal < 1 || dailyGoal > 10000) {
      alert('Daily calorie goal must be between 1 and 10,000 calories');
      return;
    }

    if (retentionDays < 1 || retentionDays > 365) {
      alert('Data retention must be between 1 and 365 days');
      return;
    }

    onSettingsUpdate({
      dailyCalorieGoal: dailyGoal,
      apiKey: formData.apiKey.trim(),
      notifications: formData.notifications,
      dataRetentionDays: retentionDays
    });

    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      dailyCalorieGoal: settings.dailyCalorieGoal.toString(),
      apiKey: settings.apiKey || '',
      notifications: settings.notifications,
      dataRetentionDays: settings.dataRetentionDays.toString()
    });
    setIsEditing(false);
  };

  const getGoalRecommendation = () => {
    if (weeklyAverage === 0) return null;
    
    const difference = weeklyAverage - settings.dailyCalorieGoal;
    const percentDiff = Math.abs(difference / settings.dailyCalorieGoal * 100);
    
    if (percentDiff < 10) {
      return {
        type: 'success',
        message: 'Your goal aligns well with your average intake!'
      };
    } else if (difference > 0) {
      return {
        type: 'warning',
        message: `You're averaging ${formatCalories(Math.abs(difference))} calories above your goal. Consider adjusting your target.`
      };
    } else {
      return {
        type: 'info',
        message: `You're averaging ${formatCalories(Math.abs(difference))} calories below your goal. You might want to increase your target.`
      };
    }
  };

  const recommendation = getGoalRecommendation();

  // Profile validation
  const validateProfileForm = () => {
    const errors: Record<string, string> = {};
    
    // Age validation
    const age = parseInt(profileFormData.age);
    if (!profileFormData.age) {
      errors.age = 'Age is required';
    } else if (isNaN(age) || age < 13 || age > 120) {
      errors.age = 'Age must be between 13 and 120 years';
    }

    // Height validation
    const height = parseFloat(profileFormData.height.value);
    if (!profileFormData.height.value) {
      errors.height = 'Height is required';
    } else if (isNaN(height)) {
      errors.height = 'Please enter a valid height';
    } else if (profileFormData.height.unit === 'cm' && (height < 100 || height > 250)) {
      errors.height = 'Height must be between 100-250 cm';
    } else if (profileFormData.height.unit === 'ft_in' && (height < 3 || height > 8)) {
      errors.height = 'Height must be between 3-8 feet';
    }

    // Weight validation
    const weight = parseFloat(profileFormData.weight.value);
    if (!profileFormData.weight.value) {
      errors.weight = 'Weight is required';
    } else if (isNaN(weight)) {
      errors.weight = 'Please enter a valid weight';
    } else if (profileFormData.weight.unit === 'kg' && (weight < 30 || weight > 300)) {
      errors.weight = 'Weight must be between 30-300 kg';
    } else if (profileFormData.weight.unit === 'lbs' && (weight < 66 || weight > 660)) {
      errors.weight = 'Weight must be between 66-660 lbs';
    }

    // Exercise frequency validation
    const exerciseFreq = parseInt(profileFormData.exerciseFrequency);
    if (profileFormData.exerciseFrequency && (isNaN(exerciseFreq) || exerciseFreq < 0 || exerciseFreq > 7)) {
      errors.exerciseFrequency = 'Exercise frequency must be between 0-7 days per week';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSave = async () => {
    if (!validateProfileForm()) {
      return;
    }

    try {
      const updatedProfile: Partial<UserProfile> = {
        personalInfo: {
          age: parseInt(profileFormData.age),
          gender: profileFormData.gender,
          height: {
            value: parseFloat(profileFormData.height.value),
            unit: profileFormData.height.unit
          },
          weight: {
            value: parseFloat(profileFormData.weight.value),
            unit: profileFormData.weight.unit
          }
        },
        activity: {
          level: profileFormData.activityLevel,
          exerciseFrequency: profileFormData.exerciseFrequency ? parseInt(profileFormData.exerciseFrequency) : undefined
        },
        goals: {
          primary: profileFormData.primaryGoal,
          healthObjectives: profileFormData.healthObjectives.length > 0 ? profileFormData.healthObjectives : undefined
        },
        preferences: {
          units: profileFormData.units,
          notifications: userProfile?.preferences?.notifications
        }
      };

      if (userProfile) {
        storageService.updateUserProfile(updatedProfile);
      } else {
        // Create new profile
        const newProfile: UserProfile = {
          hasCompletedOnboarding: true,
          personalInfo: updatedProfile.personalInfo!,
          activity: updatedProfile.activity!,
          goals: updatedProfile.goals!,
          preferences: updatedProfile.preferences!,
          metadata: {
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            onboardingVersion: '1.0'
          }
        };
        storageService.saveUserProfile(newProfile);
      }

      // Reload profile data
      const refreshedProfile = storageService.getUserProfile();
      setUserProfile(refreshedProfile);
      setIsEditingProfile(false);
      
      // Calculate new calorie goal if profile data changed
      if (refreshedProfile) {
        const newCalorieGoal = storageService.calculateDailyCalories(refreshedProfile);
        if (newCalorieGoal && newCalorieGoal !== settings.dailyCalorieGoal) {
          onSettingsUpdate({ dailyCalorieGoal: newCalorieGoal });
        }
      }

      onProfileUpdate?.();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const handleProfileReset = () => {
    if (confirm('Are you sure you want to reset your profile? This will clear all your personal information and restart the onboarding process.')) {
      try {
        storageService.resetUserProfile();
        setUserProfile(null);
        setShowProfileEdit(false);
        setIsEditingProfile(false);
        onProfileUpdate?.();
        alert('Profile reset successfully. You will see the onboarding flow on your next visit.');
      } catch (error) {
        console.error('Error resetting profile:', error);
        alert('Failed to reset profile. Please try again.');
      }
    }
  };

  const handleProfileCancel = () => {
    // Reset form data to current profile values
    if (userProfile) {
      setProfileFormData({
        age: userProfile.personalInfo.age?.toString() || '',
        gender: userProfile.personalInfo.gender,
        height: {
          value: userProfile.personalInfo.height?.value?.toString() || '',
          unit: userProfile.personalInfo.height?.unit || 'cm'
        },
        weight: {
          value: userProfile.personalInfo.weight?.value?.toString() || '',
          unit: userProfile.personalInfo.weight?.unit || 'kg'
        },
        units: userProfile.personalInfo.height?.unit === 'ft_in' || userProfile.personalInfo.weight?.unit === 'lbs' ? 'imperial' : 'metric',
        activityLevel: userProfile.activity.level,
        exerciseFrequency: userProfile.activity.exerciseFrequency?.toString() || '',
        primaryGoal: userProfile.goals.primary,
        healthObjectives: userProfile.goals.healthObjectives || []
      });
    }
    setIsEditingProfile(false);
    setProfileErrors({});
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Goal Settings
        </h2>
        <p className="text-gray-600">
          Customize your calorie tracking preferences
        </p>
      </div>

      {/* Goal Performance Summary */}
      {weeklyAverage > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Goal Performance
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">
                {formatCalories(settings.dailyCalorieGoal)}
              </div>
              <div className="text-sm text-blue-700">Current Goal</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                {formatCalories(weeklyAverage)}
              </div>
              <div className="text-sm text-green-700">Weekly Average</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">
                {Math.round(goalAchievementRate)}%
              </div>
              <div className="text-sm text-purple-700">Achievement Rate</div>
            </div>
          </div>

          {/* Recommendation */}
          {recommendation && (
            <div className={`p-4 rounded-lg ${
              recommendation.type === 'success' ? 'bg-green-50 border border-green-200' :
              recommendation.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`text-lg ${
                  recommendation.type === 'success' ? 'text-green-600' :
                  recommendation.type === 'warning' ? 'text-yellow-600' :
                  'text-blue-600'
                }`}>
                  {recommendation.type === 'success' ? <CheckCircle className="w-5 h-5" /> : 
                   recommendation.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className={`font-medium mb-1 ${
                    recommendation.type === 'success' ? 'text-green-800' :
                    recommendation.type === 'warning' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    Goal Recommendation
                  </h4>
                  <p className={`text-sm ${
                    recommendation.type === 'success' ? 'text-green-700' :
                    recommendation.type === 'warning' ? 'text-yellow-700' :
                    'text-blue-700'
                  }`}>
                    {recommendation.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Preferences
          </h3>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Edit Settings
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Daily Calorie Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Calorie Goal
            </label>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={formData.dailyCalorieGoal}
                  onChange={(e) => setFormData(prev => ({ ...prev, dailyCalorieGoal: e.target.value }))}
                  className="flex-1"
                  min="1"
                  max="10000"
                />
                <span className="text-gray-600">calories</span>
              </div>
            ) : (
              <div className="text-lg font-medium text-gray-900">
                {formatCalories(settings.dailyCalorieGoal)} calories
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Recommended range: 1,200 - 3,000 calories per day
            </p>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gemini API Key (Optional)
            </label>
            {isEditing ? (
              <Input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter your Gemini API key"
              />
            ) : (
              <div className="text-gray-900">
                {settings.apiKey ? '••••••••••••••••' : 'Not set (using environment variable)'}
              </div>
            )}
            <div className="text-sm text-gray-500 mt-1 space-y-1">
              <p>
                <span className="text-green-600 font-medium">✓ Default test key provided</span> - You can start using the app immediately!
              </p>
              <p>
                For unlimited usage, get your own free API key from{' '}
                <a 
                  href="https://makersuite.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.notifications}
                onChange={(e) => setFormData(prev => ({ ...prev, notifications: e.target.checked }))}
                disabled={!isEditing}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Enable Notifications
                </div>
                <div className="text-sm text-gray-500">
                  Get reminders and goal achievement notifications
                </div>
              </div>
            </label>
          </div>

          {/* Data Retention */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Retention Period
            </label>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={formData.dataRetentionDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataRetentionDays: e.target.value }))}
                  className="w-24"
                  min="1"
                  max="365"
                />
                <span className="text-gray-600">days</span>
              </div>
            ) : (
              <div className="text-gray-900">
                {settings.dataRetentionDays} days
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">
              How long to keep your food entry data (1-365 days)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <Button
              onClick={handleSave}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              Save Changes
            </Button>
            <Button
              onClick={handleCancel}
              variant="secondary"
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Quick Goal Presets */}
      {isEditing && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Goal Presets
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Weight Loss', calories: 1500 },
              { label: 'Maintenance', calories: 2000 },
              { label: 'Active Lifestyle', calories: 2500 },
              { label: 'Athletic', calories: 3000 }
            ].map((preset) => (
              <Button
                key={preset.label}
                onClick={() => setFormData(prev => ({ ...prev, dailyCalorieGoal: preset.calories.toString() }))}
                variant="outline"
                className="p-3 text-center border border-gray-300 rounded-lg hover:bg-white hover:border-blue-300 transition-colors h-auto flex-col"
              >
                <div className="font-medium text-gray-900">{preset.label}</div>
                <div className="text-sm text-gray-600">{formatCalories(preset.calories)}</div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Profile Management Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Profile Information
            </h3>
          </div>
          {userProfile && !isEditingProfile && (
            <Button
              onClick={() => setIsEditingProfile(true)}
              variant="outline"
              size="sm"
            >
              Edit Profile
            </Button>
          )}
        </div>

        {userProfile ? (
          <div className="space-y-4">
            {/* Profile Summary */}
            {!isEditingProfile && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Personal Info</label>
                    <div className="text-sm text-gray-900 mt-1">
                      {userProfile.personalInfo.age && `${userProfile.personalInfo.age} years old`}
                      {userProfile.personalInfo.gender && `, ${userProfile.personalInfo.gender}`}
                    </div>
                    <div className="text-sm text-gray-900">
                      {userProfile.personalInfo.height && 
                        `${userProfile.personalInfo.height.value}${userProfile.personalInfo.height.unit === 'cm' ? 'cm' : 'ft'}`}
                      {userProfile.personalInfo.weight && 
                        `, ${userProfile.personalInfo.weight.value}${userProfile.personalInfo.weight.unit}`}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Activity Level</label>
                    <div className="text-sm text-gray-900 mt-1 capitalize">
                      {userProfile.activity.level?.replace('_', ' ')}
                      {userProfile.activity.exerciseFrequency && 
                        ` (${userProfile.activity.exerciseFrequency} days/week)`}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Primary Goal</label>
                    <div className="text-sm text-gray-900 mt-1 capitalize">
                      {userProfile.goals.primary?.replace('_', ' ')}
                    </div>
                  </div>

                  {userProfile.goals.healthObjectives && userProfile.goals.healthObjectives.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Health Objectives</label>
                      <div className="text-sm text-gray-900 mt-1">
                        {userProfile.goals.healthObjectives.slice(0, 2).join(', ')}
                        {userProfile.goals.healthObjectives.length > 2 && ` +${userProfile.goals.healthObjectives.length - 2} more`}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Profile Edit Form */}
            {isEditingProfile && (
              <div className="space-y-6">
                {/* Units Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Measurement System
                  </label>
                  <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
                    <button
                      type="button"
                      onClick={() => setProfileFormData(prev => ({ ...prev, units: 'metric' }))}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        profileFormData.units === 'metric'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Metric
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileFormData(prev => ({ ...prev, units: 'imperial' }))}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        profileFormData.units === 'imperial'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Imperial
                    </button>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profile-age" className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                    </label>
                    <Input
                      id="profile-age"
                      type="number"
                      value={profileFormData.age}
                      onChange={(e) => setProfileFormData(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="Enter your age"
                      min="13"
                      max="120"
                    />
                    {profileErrors.age && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.age}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setProfileFormData(prev => ({ 
                            ...prev, 
                            gender: option.value as UserProfile['personalInfo']['gender']
                          }))}
                          className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                            profileFormData.gender === option.value
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="profile-height" className="block text-sm font-medium text-gray-700 mb-1">
                      Height ({profileFormData.height.unit === 'cm' ? 'cm' : 'feet'})
                    </label>
                    <Input
                      id="profile-height"
                      type="number"
                      value={profileFormData.height.value}
                      onChange={(e) => setProfileFormData(prev => ({ 
                        ...prev, 
                        height: { ...prev.height, value: e.target.value }
                      }))}
                      placeholder={profileFormData.height.unit === 'cm' ? 'e.g., 170' : 'e.g., 5.8'}
                      step={profileFormData.height.unit === 'cm' ? '1' : '0.1'}
                    />
                    {profileErrors.height && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.height}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="profile-weight" className="block text-sm font-medium text-gray-700 mb-1">
                      Weight ({profileFormData.weight.unit})
                    </label>
                    <Input
                      id="profile-weight"
                      type="number"
                      value={profileFormData.weight.value}
                      onChange={(e) => setProfileFormData(prev => ({ 
                        ...prev, 
                        weight: { ...prev.weight, value: e.target.value }
                      }))}
                      placeholder={profileFormData.weight.unit === 'kg' ? 'e.g., 70' : 'e.g., 154'}
                      step={profileFormData.weight.unit === 'kg' ? '0.1' : '1'}
                    />
                    {profileErrors.weight && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.weight}</p>
                    )}
                  </div>
                </div>

                {/* Activity Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Level
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
                      { value: 'light', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
                      { value: 'moderate', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
                      { value: 'active', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
                      { value: 'very_active', label: 'Extremely Active', desc: 'Very hard exercise, physical job' }
                    ].map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setProfileFormData(prev => ({ 
                          ...prev, 
                          activityLevel: level.value as UserProfile['activity']['level']
                        }))}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          profileFormData.activityLevel === level.value
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">{level.label}</div>
                        <div className="text-sm opacity-75">{level.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exercise Frequency */}
                <div>
                  <label htmlFor="profile-exercise" className="block text-sm font-medium text-gray-700 mb-1">
                    Exercise Frequency (days per week)
                  </label>
                  <Input
                    id="profile-exercise"
                    type="number"
                    value={profileFormData.exerciseFrequency}
                    onChange={(e) => setProfileFormData(prev => ({ ...prev, exerciseFrequency: e.target.value }))}
                    placeholder="0-7 days"
                    min="0"
                    max="7"
                  />
                  {profileErrors.exerciseFrequency && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.exerciseFrequency}</p>
                  )}
                </div>

                {/* Primary Goal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Fitness Goal
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { value: 'weight_loss', label: 'Weight Loss', icon: '📉' },
                      { value: 'maintenance', label: 'Maintain Weight', icon: '⚖️' },
                      { value: 'weight_gain', label: 'Weight Gain', icon: '📈' },
                      { value: 'muscle_building', label: 'Build Muscle', icon: '💪' }
                    ].map((goal) => (
                      <button
                        key={goal.value}
                        type="button"
                        onClick={() => setProfileFormData(prev => ({ 
                          ...prev, 
                          primaryGoal: goal.value as UserProfile['goals']['primary']
                        }))}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          profileFormData.primaryGoal === goal.value
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{goal.icon}</span>
                          <span className="font-medium">{goal.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleProfileSave}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    Save Profile
                  </Button>
                  <Button
                    onClick={handleProfileCancel}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleProfileReset}
                    variant="destructive"
                    className="ml-auto"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Profile
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No Profile Found
            </h4>
            <p className="text-gray-600 mb-4">
              Complete the onboarding process to create your personalized profile and get accurate calorie recommendations.
            </p>
            <Button
              onClick={() => setShowProfileEdit(true)}
              variant="outline"
            >
              Create Profile
            </Button>
            
            {showProfileEdit && (
              <div className="mt-6 text-left">
                <p className="text-sm text-gray-600 mb-4">
                  You can create a basic profile here, or restart the app to go through the full onboarding experience.
                </p>
                <Button
                  onClick={() => {
                    setIsEditingProfile(true);
                    setShowProfileEdit(false);
                  }}
                  className="w-full"
                >
                  Create Basic Profile
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Data Management Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Data Management
        </h3>
        <p className="text-gray-600 mb-4">
          Export your data for backup, import from another device, or manage your stored information.
        </p>
        
        <Button
          onClick={() => setShowDataManagement(!showDataManagement)}
          variant="outline"
          className="w-full"
        >
          {showDataManagement ? 'Hide' : 'Show'} Data Management Options
        </Button>
        
        {showDataManagement && (
          <div className="mt-6">
            <DataManagement onDataChange={() => onSettingsUpdate({})} />
          </div>
        )}
      </div>
    </div>
  );
}