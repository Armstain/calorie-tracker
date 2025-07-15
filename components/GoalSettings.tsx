'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserSettings } from '@/types';
import { formatCalories } from '@/lib/utils';

interface GoalSettingsProps {
  settings: UserSettings;
  onSettingsUpdate: (settings: Partial<UserSettings>) => void;
  weeklyAverage?: number;
  goalAchievementRate?: number;
}

export default function GoalSettings({ 
  settings, 
  onSettingsUpdate, 
  weeklyAverage = 0,
  goalAchievementRate = 0
}: GoalSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    dailyCalorieGoal: settings.dailyCalorieGoal.toString(),
    apiKey: settings.apiKey || '',
    notifications: settings.notifications,
    dataRetentionDays: settings.dataRetentionDays.toString()
  });

  useEffect(() => {
    setFormData({
      dailyCalorieGoal: settings.dailyCalorieGoal.toString(),
      apiKey: settings.apiKey || '',
      notifications: settings.notifications,
      dataRetentionDays: settings.dataRetentionDays.toString()
    });
  }, [settings]);

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
    </div>
  );
}