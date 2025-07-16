'use client';

import { useState, useEffect } from 'react';
import { Heart, TrendingUp, Calculator, Target, Activity, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserSettings } from '@/types';
import { formatCalories } from '@/lib/utils';

interface HealthMetrics {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain';
}

interface WeightEntry {
  id: string;
  weight: number;
  date: string;
  timestamp: string;
}

interface HealthIntegrationProps {
  settings: UserSettings;
  onSettingsUpdate: (settings: Partial<UserSettings>) => void;
  currentCalories: number;
  weeklyAverage: number;
}

export default function HealthIntegration({ 
  settings, 
  onSettingsUpdate, 
  currentCalories,
  weeklyAverage 
}: HealthIntegrationProps) {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>({
    weight: 70,
    height: 170,
    age: 30,
    gender: 'other',
    activityLevel: 'moderate',
    goal: 'maintain'
  });
  
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = () => {
    try {
      const storedMetrics = localStorage.getItem('health_metrics');
      const storedWeights = localStorage.getItem('weight_entries');
      
      if (storedMetrics) {
        setHealthMetrics(JSON.parse(storedMetrics));
      }
      
      if (storedWeights) {
        setWeightEntries(JSON.parse(storedWeights));
      }
    } catch (error) {
      console.error('Error loading health data:', error);
    }
  };

  const saveHealthData = () => {
    try {
      localStorage.setItem('health_metrics', JSON.stringify(healthMetrics));
      localStorage.setItem('weight_entries', JSON.stringify(weightEntries));
    } catch (error) {
      console.error('Error saving health data:', error);
    }
  };

  const calculateBMI = (): number => {
    const heightInMeters = healthMetrics.height / 100;
    return healthMetrics.weight / (heightInMeters * heightInMeters);
  };

  const getBMICategory = (bmi: number): { category: string; color: string } => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600' };
    return { category: 'Obese', color: 'text-red-600' };
  };

  const calculateDailyCalorieNeeds = (): number => {
    // Mifflin-St Jeor Equation
    let bmr: number;
    
    if (healthMetrics.gender === 'male') {
      bmr = 10 * healthMetrics.weight + 6.25 * healthMetrics.height - 5 * healthMetrics.age + 5;
    } else {
      bmr = 10 * healthMetrics.weight + 6.25 * healthMetrics.height - 5 * healthMetrics.age - 161;
    }

    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const tdee = bmr * activityMultipliers[healthMetrics.activityLevel];

    // Adjust for goal
    switch (healthMetrics.goal) {
      case 'lose': return Math.round(tdee - 500); // 500 cal deficit for 1lb/week loss
      case 'gain': return Math.round(tdee + 500); // 500 cal surplus for 1lb/week gain
      default: return Math.round(tdee);
    }
  };

  const addWeightEntry = () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) return;

    const entry: WeightEntry = {
      id: Date.now().toString(),
      weight,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    };

    const updatedEntries = [entry, ...weightEntries].slice(0, 30); // Keep last 30 entries
    setWeightEntries(updatedEntries);
    setNewWeight('');
    
    // Update current weight in metrics
    setHealthMetrics(prev => ({ ...prev, weight }));
    
    saveHealthData();
  };

  const getWeightTrend = (): { trend: 'up' | 'down' | 'stable'; change: number } => {
    if (weightEntries.length < 2) return { trend: 'stable', change: 0 };
    
    const recent = weightEntries.slice(0, 5);
    const older = weightEntries.slice(5, 10);
    
    if (recent.length === 0 || older.length === 0) return { trend: 'stable', change: 0 };
    
    const recentAvg = recent.reduce((sum, entry) => sum + entry.weight, 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + entry.weight, 0) / older.length;
    
    const change = recentAvg - olderAvg;
    
    if (Math.abs(change) < 0.5) return { trend: 'stable', change };
    return { trend: change > 0 ? 'up' : 'down', change };
  };

  const updateHealthMetrics = (field: keyof HealthMetrics, value: any) => {
    setHealthMetrics(prev => ({ ...prev, [field]: value }));
  };

  const saveHealthMetrics = () => {
    const recommendedCalories = calculateDailyCalorieNeeds();
    onSettingsUpdate({ dailyCalorieGoal: recommendedCalories });
    saveHealthData();
    setIsEditing(false);
  };

  const bmi = calculateBMI();
  const bmiInfo = getBMICategory(bmi);
  const dailyNeeds = calculateDailyCalorieNeeds();
  const weightTrend = getWeightTrend();
  const calorieBalance = currentCalories - dailyNeeds;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Health Integration
        </h2>
        <p className="text-gray-600">
          Track your health metrics and get personalized recommendations
        </p>
      </div>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* BMI Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">BMI</h3>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {bmi.toFixed(1)}
            </div>
            <div className={`text-sm font-medium ${bmiInfo.color}`}>
              {bmiInfo.category}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {healthMetrics.weight}kg • {healthMetrics.height}cm
            </div>
          </div>
        </div>

        {/* Daily Calorie Needs */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">Daily Needs</h3>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatCalories(dailyNeeds)}
            </div>
            <div className="text-sm text-gray-600">calories/day</div>
            <div className="text-xs text-gray-500 mt-2 capitalize">
              Goal: {healthMetrics.goal} weight
            </div>
          </div>
        </div>

        {/* Weight Trend */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">Weight Trend</h3>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold mb-1 ${
              weightTrend.trend === 'up' ? 'text-red-600' : 
              weightTrend.trend === 'down' ? 'text-green-600' : 'text-gray-600'
            }`}>
              {weightTrend.trend === 'up' ? '↗' : weightTrend.trend === 'down' ? '↘' : '→'}
              {Math.abs(weightTrend.change).toFixed(1)}kg
            </div>
            <div className="text-sm text-gray-600">
              {weightTrend.trend === 'stable' ? 'Stable' : 
               weightTrend.trend === 'up' ? 'Increasing' : 'Decreasing'}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Last 5 vs previous 5 entries
            </div>
          </div>
        </div>
      </div>

      {/* Calorie Balance Analysis */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Calorie Balance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatCalories(currentCalories)}</div>
            <div className="text-sm text-gray-600">Consumed Today</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatCalories(dailyNeeds)}</div>
            <div className="text-sm text-gray-600">Daily Target</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${calorieBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {calorieBalance > 0 ? '+' : ''}{formatCalories(calorieBalance)}
            </div>
            <div className="text-sm text-gray-600">
              {calorieBalance > 0 ? 'Over Target' : 'Under Target'}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress to Goal</span>
            <span>{Math.round((currentCalories / dailyNeeds) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                currentCalories > dailyNeeds ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min((currentCalories / dailyNeeds) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Weight Tracking */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Weight Tracking</h3>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="Weight (kg)"
              className="w-32"
              step="0.1"
            />
            <Button onClick={addWeightEntry} size="sm">
              <Scale className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Recent Weight Entries */}
        {weightEntries.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Recent Entries:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {weightEntries.slice(0, 8).map((entry) => (
                <div key={entry.id} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="font-semibold text-gray-900">{entry.weight}kg</div>
                  <div className="text-xs text-gray-500">
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Health Metrics Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Health Profile</h3>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="outline"
            size="sm"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (cm)
                </label>
                <Input
                  type="number"
                  value={healthMetrics.height}
                  onChange={(e) => updateHealthMetrics('height', parseInt(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <Input
                  type="number"
                  value={healthMetrics.age}
                  onChange={(e) => updateHealthMetrics('age', parseInt(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={healthMetrics.gender}
                  onChange={(e) => updateHealthMetrics('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Level
                </label>
                <select
                  value={healthMetrics.activityLevel}
                  onChange={(e) => updateHealthMetrics('activityLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sedentary">Sedentary (little/no exercise)</option>
                  <option value="light">Light (light exercise 1-3 days/week)</option>
                  <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
                  <option value="active">Active (hard exercise 6-7 days/week)</option>
                  <option value="very_active">Very Active (very hard exercise, physical job)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight Goal
                </label>
                <select
                  value={healthMetrics.goal}
                  onChange={(e) => updateHealthMetrics('goal', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="lose">Lose Weight</option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="gain">Gain Weight</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button onClick={saveHealthMetrics} className="bg-green-500 hover:bg-green-600 text-white">
                <Heart className="w-4 h-4 mr-2" />
                Save & Update Calorie Goal
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Height:</span>
              <div className="font-medium text-gray-900">{healthMetrics.height} cm</div>
            </div>
            <div>
              <span className="text-gray-500">Age:</span>
              <div className="font-medium text-gray-900">{healthMetrics.age} years</div>
            </div>
            <div>
              <span className="text-gray-500">Gender:</span>
              <div className="font-medium text-gray-900 capitalize">{healthMetrics.gender}</div>
            </div>
            <div>
              <span className="text-gray-500">Activity:</span>
              <div className="font-medium text-gray-900 capitalize">{healthMetrics.activityLevel.replace('_', ' ')}</div>
            </div>
          </div>
        )}
      </div>

      {/* Health Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Personalized Recommendations
        </h3>
        
        <div className="space-y-3 text-sm">
          {bmi < 18.5 && (
            <div className="flex items-start gap-2">
              <Activity className="w-4 h-4 text-blue-600 mt-0.5" />
              <p className="text-blue-800">
                Your BMI indicates you're underweight. Consider increasing your calorie intake with nutrient-dense foods and consult a healthcare provider.
              </p>
            </div>
          )}
          
          {bmi >= 25 && (
            <div className="flex items-start gap-2">
              <Activity className="w-4 h-4 text-blue-600 mt-0.5" />
              <p className="text-blue-800">
                Your BMI indicates you're above normal weight. A moderate calorie deficit combined with regular exercise can help achieve a healthy weight.
              </p>
            </div>
          )}
          
          {calorieBalance > 500 && (
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-blue-600 mt-0.5" />
              <p className="text-blue-800">
                You're significantly over your calorie target today. Consider lighter meals or increased physical activity.
              </p>
            </div>
          )}
          
          {calorieBalance < -500 && (
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-blue-600 mt-0.5" />
              <p className="text-blue-800">
                You're well under your calorie target. Make sure you're eating enough to support your health and energy needs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}