// Core data models for the Food Calorie Estimator app

export interface MacroNutrients {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface FoodItem {
  name: string;
  calories: number;
  quantity: string;
  confidence: number;
  ingredients?: string[];
  cookingMethod?: 'grilled' | 'fried' | 'baked' | 'steamed' | 'raw' | 'boiled' | 'roasted';
  macros?: MacroNutrients;
  category?: 'protein' | 'vegetable' | 'grain' | 'fruit' | 'dairy' | 'snack' | 'beverage';
  healthScore?: number;
}

export interface FoodAnalysisResult {
  foods: FoodItem[];
  totalCalories: number;
  confidence: number;
  timestamp: string;
  imageUrl?: string;
  modelUsed?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  restaurantName?: string;
  totalMacros?: MacroNutrients;
}

export interface FoodEntry {
  id: string;
  timestamp: string;
  foods: FoodItem[];
  totalCalories: number;
  imageData?: string;
  date: string; // YYYY-MM-DD format
}

export interface DailyData {
  date: string; // YYYY-MM-DD format
  totalCalories: number;
  goalCalories: number;
  entries: FoodEntry[];
  goalMet: boolean;
}

export interface UserSettings {
  dailyCalorieGoal: number;
  apiKey?: string;
  notifications: boolean;
  dataRetentionDays: number;
}

// Component prop interfaces
export interface CameraProps {
  onPhotoCapture: (imageData: string) => void;
  onError: (error: string) => void;
}

export interface AnalyzerProps {
  imageData: string;
  onAnalysisComplete: (result: FoodAnalysisResult) => void;
  onAnalysisError: (error: string) => void;
}

export interface ResultsProps {
  analysisResult: FoodAnalysisResult;
  onAddToDaily: () => void;
  onRetakePhoto: () => void;
}

export interface TrackerProps {
  dailyGoal: number;
  currentTotal: number;
  todaysEntries: FoodEntry[];
  onGoalUpdate: (newGoal: number) => void;
}

export interface HistoryProps {
  weeklyData: DailyData[];
  onDateSelect: (date: string) => void;
}

// Error types
export interface AppError {
  type: 'camera' | 'api' | 'storage' | 'network';
  message: string;
  code?: string;
}

export interface CameraError extends AppError {
  type: 'camera';
}

export interface ApiError extends AppError {
  type: 'api';
  statusCode?: number;
}

export interface StorageError extends AppError {
  type: 'storage';
}