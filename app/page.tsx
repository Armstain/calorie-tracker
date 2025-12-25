"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Camera,
  BarChart3,
  TrendingUp,
  Settings,
  Utensils,
  Plus,
} from "lucide-react";

import ResultsDisplay from "@/components/ResultsDisplay";
import DailyTracker from "@/components/DailyTracker";
import HistoryView from "@/components/HistoryView";
import GoalSettings from "@/components/GoalSettings";
import SplashScreen from "@/components/SplashScreen";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import StorageAlert from "@/components/StorageAlert";
import ErrorNotification, {
  NetworkStatusIndicator,
} from "@/components/ErrorNotification";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useErrorHandler } from "@/lib/hooks/useErrorHandler";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";
import { useToast } from "@/lib/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast";
import { storageService } from "@/lib/storage";
import { FoodAnalysisResult, UserSettings, UserProfile, AppError } from "@/types";
import { dateUtils } from "@/lib/utils";
import WorkingCamera from "@/components/WorkingCamera";
import HealthIntegration from "@/components/HealthIntegration";
import FoodDatabaseEntry from "@/components/FoodDatabaseEntry";
import { CommonFood } from "@/lib/foodDatabase";

import {
  useTodaysEntries,
  useWeeklyData,
  useUserSettings,
  useFoodAnalysis,
  useSaveFoodEntry,
  useUpdateUserSettings,
} from "@/lib/queries";

type AppView =
  | "capture"
  | "results"
  | "tracker"
  | "history"
  | "health"
  | "settings";

export default function Home() {
  const [showSplash, setShowSplash] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>("capture");
  const [analysisResult, setAnalysisResult] =
    useState<FoodAnalysisResult | null>(null);
  const [showFoodDatabase, setShowFoodDatabase] = useState(false);
  const analysisAbortRef = useRef<AbortController | null>(null);

  // TanStack Query hooks for data fetching
  const { data: todaysEntries = [], isLoading: isLoadingEntries, refetch: refetchEntries } = useTodaysEntries();
  const { data: weeklyData = [], refetch: refetchWeekly } = useWeeklyData();
  const { data: settings, isLoading: isLoadingSettings, refetch: refetchSettings } = useUserSettings();

  // TanStack Query mutations
  const foodAnalysisMutation = useFoodAnalysis();
  const saveFoodEntryMutation = useSaveFoodEntry();
  const updateSettingsMutation = useUpdateUserSettings();

  const {
    error,
    isVisible: isErrorVisible,
    showError,
    hideError,
    retry,
    canRetry,
  } = useErrorHandler();
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const {
    success: showSuccessToast
  } = useToast();

  const isNoFoodRecognizedError = useMemo(() => {
    if (!error || typeof error !== 'object') return false;
    if (!('statusCode' in error)) return false;
    return (error as { statusCode?: unknown }).statusCode === 422;
  }, [error]);



  useEffect(() => {
    const checkOnboardingStatus = () => {
      try {
        const hasCompleted = storageService.hasCompletedOnboarding();
        
        if (hasCompleted) {
          // Existing user - skip splash screen and go directly to main app
          setShowOnboarding(false);
          setShowSplash(false);
        } else {
          // New user - show onboarding flow
          setShowOnboarding(true);
          setShowSplash(false);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // On error, default to showing onboarding for safety
        setShowOnboarding(true);
        setShowSplash(false);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  const refreshData = useCallback(() => {
    refetchEntries();
    refetchWeekly();
    refetchSettings();
  }, [refetchEntries, refetchWeekly, refetchSettings]);

  const handlePhotoCapture = useCallback(
    async (imageData: string) => {
      if (!isOnline) {
        showError(
          "No internet connection. Please check your network and try again."
        );
        return;
      }

      // Cancel any in-flight analysis before starting a new one
      if (analysisAbortRef.current) {
        analysisAbortRef.current.abort();
      }
      const controller = new AbortController();
      analysisAbortRef.current = controller;

      foodAnalysisMutation.mutate(
        { imageData, apiKey: settings?.apiKey || '', signal: controller.signal },
        {
          onSuccess: (result) => {
            analysisAbortRef.current = null;
            setAnalysisResult(result);
            setCurrentView("results");

            showSuccessToast(
              "Analysis complete!",
              `Found ${result.foods.length} food item${result.foods.length !== 1 ? 's' : ''} with ${result.totalCalories} calories`,
              4000
            );
          },
          onError: (error: unknown) => {
            analysisAbortRef.current = null;

            // User clicked Stop Scan (canceled request)
            if (error && typeof error === 'object' && 'code' in error && (error as { code?: unknown }).code === 'canceled') {
              return;
            }

            // Ensure error has proper format for useErrorHandler
            if (error && typeof error === 'object' && 'type' in error && 'message' in error) {
              showError(error as AppError);
            } else {
              // Fallback for malformed errors
              let errorMessage = 'Food analysis failed. Please check your connection and try again.';

              if (error && typeof error === 'object' && 'message' in error) {
                errorMessage = String((error as { message: unknown }).message);
              } else if (typeof error === 'string') {
                errorMessage = error;
              }

              showError({
                type: 'network' as const,
                message: errorMessage
              });
            }
          },
          onSettled: () => {
            analysisAbortRef.current = null;
          },
        }
      );
    },
    [isOnline, settings?.apiKey, showError, showSuccessToast, foodAnalysisMutation]
  );

  const handleStopScan = useCallback(() => {
    if (analysisAbortRef.current) {
      analysisAbortRef.current.abort();
      analysisAbortRef.current = null;
    }

    // Clear mutation state immediately so the UI stops showing "Analyzing..."
    foodAnalysisMutation.reset();
  }, [foodAnalysisMutation]);

  const handleAddToDaily = useCallback(() => {
    if (!analysisResult) return;

    const entry = {
      timestamp: analysisResult.timestamp,
      foods: analysisResult.foods,
      totalCalories: analysisResult.totalCalories,
      imageData: analysisResult.imageUrl,
      date: dateUtils.getCurrentDate(),
    };

    saveFoodEntryMutation.mutate(
      { entry },
      {
        onSuccess: () => {
          setCurrentView("tracker");
          setAnalysisResult(null);

          // Show success toast
          showSuccessToast(
            "Added to daily total!",
            `${analysisResult.totalCalories} calories added to today's intake`,
            3000
          );
        },
        onError: (error) => {
          showError(error as Error);
        },
      }
    );
  }, [analysisResult, saveFoodEntryMutation, showError, showSuccessToast]);

  const handleRetakePhoto = useCallback(() => {
    setAnalysisResult(null);
    setCurrentView("capture");
  }, []);

  const handleGoalUpdate = useCallback(
    (newGoal: number) => {
      updateSettingsMutation.mutate(
        { settings: { dailyCalorieGoal: newGoal } },
        {
          onError: (error) => {
            showError(error as Error);
          },
        }
      );
    },
    [updateSettingsMutation, showError]
  );

  const handleSettingsUpdate = useCallback(
    (newSettings: Partial<UserSettings>) => {
      updateSettingsMutation.mutate(
        { settings: newSettings },
        {
          onError: (error) => {
            showError(error as Error);
          },
        }
      );
    },
    [updateSettingsMutation, showError]
  );

  const handleDateSelect = useCallback((date: string) => {
    // Could implement date-specific view here
    console.log("Selected date:", date);
  }, []);

  const currentTotal = useMemo(
    () => todaysEntries.reduce((sum, entry) => sum + entry.totalCalories, 0),
    [todaysEntries]
  );

  const weeklyAverage = useMemo(() => {
    return weeklyData.length > 0
      ? Math.round(
          weeklyData.reduce((sum, day) => sum + day.totalCalories, 0) /
            weeklyData.length
        )
      : 0;
  }, [weeklyData]);

  const goalAchievementRate = useMemo(() => {
    if (weeklyData.length === 0 || !settings?.dailyCalorieGoal) return 0;

    const goalMetDays = weeklyData.filter(
      (day) => day.totalCalories >= settings.dailyCalorieGoal
    ).length;

    return (goalMetDays / weeklyData.length) * 100;
  }, [weeklyData, settings?.dailyCalorieGoal]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleOnboardingComplete = useCallback((profile: UserProfile) => {
    try {
      // Save the profile and mark onboarding as complete
      storageService.markOnboardingComplete(profile);
      
      // Update daily calorie goal if calculated from profile
      const calculatedCalories = storageService.calculateDailyCalories(profile);
      if (calculatedCalories) {
        storageService.updateDailyGoal(calculatedCalories);
      }
      
      // Refresh data to reflect new settings
      refreshData();
      
      // Hide onboarding and show main app
      setShowOnboarding(false);
      
      // Show splash screen briefly for existing users who just completed onboarding
      setShowSplash(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      showError(error as Error);
    }
  }, [refreshData, showError]);

  const handleOnboardingSkip = useCallback(() => {
    // Create minimal profile for users who skip onboarding
    const minimalProfile: UserProfile = {
      hasCompletedOnboarding: true,
      personalInfo: {},
      activity: {},
      goals: {},
      preferences: {
        units: 'metric',
        notifications: true
      },
      metadata: {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        onboardingVersion: '1.0'
      }
    };
    
    handleOnboardingComplete(minimalProfile);
  }, [handleOnboardingComplete]);

  const handleFoodDatabaseAdd = useCallback(async (food: CommonFood, calories: number, portion: string) => {
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

      await storageService.saveFoodEntry(foodEntry);
      refreshData();
      setCurrentView("tracker");
      setShowFoodDatabase(false);
    } catch (error) {
      showError(error as Error);
    }
  }, [refreshData, showError]);

  // Show loading state while checking onboarding status
  if (isCheckingOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto animate-pulse">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-600">Loading CalorieMeter...</p>
        </div>
      </div>
    );
  }

  // Show onboarding flow for new users
  if (showOnboarding) {
    return (
      <ErrorBoundary>
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      </ErrorBoundary>
    );
  }

  // Show splash screen for existing users (brief transition)
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        {/* Mobile-First Header */}
        <header
          className="bg-white/90 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-40 shadow-sm"
          role="banner"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center"
                  aria-hidden="true"
                >
                  <Utensils className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    CalorieMeter
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Smart Calorie Tracking
                  </p>
                </div>
              </div>

              {/* Desktop Navigation */}
              <nav
                className="hidden md:flex space-x-2"
                role="navigation"
                aria-label="Main navigation"
              >
                <button
                  onClick={() => setCurrentView("capture")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === "capture"
                      ? "bg-amber-100 text-amber-800 shadow-sm"
                      : "text-gray-600 hover:text-amber-700 hover:bg-amber-50"
                  }`}
                  aria-current={currentView === "capture" ? "page" : undefined}
                  aria-label="Go to photo capture page"
                >
                  <Camera className="w-4 h-4" aria-hidden="true" />
                  Capture
                </button>
                <button
                  onClick={() => setCurrentView("tracker")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === "tracker"
                      ? "bg-amber-100 text-amber-800 shadow-sm"
                      : "text-gray-600 hover:text-amber-700 hover:bg-amber-50"
                  }`}
                  aria-current={currentView === "tracker" ? "page" : undefined}
                  aria-label="Go to today's calorie tracker"
                >
                  <BarChart3 className="w-4 h-4" aria-hidden="true" />
                  Today
                </button>
                <button
                  onClick={() => setCurrentView("history")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === "history"
                      ? "bg-amber-100 text-amber-800 shadow-sm"
                      : "text-gray-600 hover:text-amber-700 hover:bg-amber-50"
                  }`}
                  aria-current={currentView === "history" ? "page" : undefined}
                  aria-label="Go to calorie history and trends"
                >
                  <TrendingUp className="w-4 h-4" aria-hidden="true" />
                  History
                </button>
                <button
                  onClick={() => setCurrentView("health")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === "health"
                      ? "bg-amber-100 text-amber-800 shadow-sm"
                      : "text-gray-600 hover:text-amber-700 hover:bg-amber-50"
                  }`}
                  aria-current={currentView === "health" ? "page" : undefined}
                  aria-label="Go to health metrics and BMI calculator"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  Health
                </button>
                <button
                  onClick={() => setCurrentView("settings")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === "settings"
                      ? "bg-amber-100 text-amber-800 shadow-sm"
                      : "text-gray-600 hover:text-amber-700 hover:bg-amber-50"
                  }`}
                  aria-current={currentView === "settings" ? "page" : undefined}
                  aria-label="Go to app settings and goals"
                >
                  <Settings className="w-4 h-4" aria-hidden="true" />
                  Settings
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentView === "capture" && (
            <div className="space-y-6">
              {/* Daily Progress Summary */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-amber-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-800">Today&apos;s Progress</h2>
                  <button
                    onClick={() => setCurrentView("tracker")}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                  >
                    View Details →
                  </button>
                </div>
                {isLoadingSettings || isLoadingEntries ? (
                  <div className="animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-2">
                          <div className="h-8 bg-gray-300 rounded w-16"></div>
                          <div className="h-4 bg-gray-300 rounded w-20"></div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 bg-gray-300 rounded w-16 mb-1"></div>
                        <div className="h-6 bg-gray-300 rounded w-12"></div>
                      </div>
                    </div>
                  </div>
                ) : settings ? (
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900">{currentTotal}</span>
                        <span className="text-sm text-gray-500">/ {settings.dailyCalorieGoal} cal</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min((currentTotal / settings.dailyCalorieGoal) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Remaining</div>
                      <div className="text-lg font-semibold text-gray-800">
                        {Math.max(settings.dailyCalorieGoal - currentTotal, 0)}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Welcome Message for New Users */}
              {todaysEntries.length === 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Welcome to CalorieMeter!</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Take a photo of your food and get instant AI-powered calorie estimates. 
                      Start tracking your nutrition journey today!
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mt-4">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>AI Analysis</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>Local Storage</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span>Privacy First</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Meals Preview */}
              {todaysEntries.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-amber-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">Recent Meals</h3>
                    <span className="text-sm text-gray-500">{todaysEntries.length} entries today</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {todaysEntries.slice(-3).map((entry, index) => (
                      <div key={index} className="flex-shrink-0 bg-gray-50 rounded-lg p-3 min-w-[120px]">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {entry.foods[0]?.name || 'Food Item'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {entry.totalCalories} cal
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(entry.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Camera Component */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-amber-200 shadow-sm">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">Capture Your Food</h3>
                    <button
                      onClick={() => setShowFoodDatabase(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Quick Add
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Point your camera at your meal and tap the capture button for instant analysis, or use Quick Add for common foods
                  </p>
                </div>
                <WorkingCamera
                  onPhotoCapture={handlePhotoCapture}
                  onError={showError}
                />
                {foodAnalysisMutation.isPending && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-500 border-t-transparent"></div>
                        <div className="text-sm text-amber-700">
                          <div className="font-medium">Analyzing your food...</div>
                          <div className="text-xs text-amber-600">AI is identifying ingredients and calculating calories</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleStopScan}
                        className="px-3 py-1.5 text-sm font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors"
                      >
                        Stop scan
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Tips */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">💡 Pro Tips</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <span className="text-green-600 font-medium">Ready to use!</span> Default API key is already configured</li>
                  <li>• Ensure good lighting for better AI recognition</li>
                  <li>• Include the whole plate for accurate portion estimates</li>
                  <li>• Try different angles if the first analysis isn&apos;t accurate</li>
                </ul>
              </div>
            </div>
          )}



          {currentView === "results" && analysisResult && (
            <ResultsDisplay
              analysisResult={analysisResult}
              onAddToDaily={handleAddToDaily}
              onRetakePhoto={handleRetakePhoto}
              onAnalysisUpdate={setAnalysisResult}
            />
          )}

          {currentView === "tracker" && settings && (
            <DailyTracker
              dailyGoal={settings.dailyCalorieGoal}
              currentTotal={currentTotal}
              todaysEntries={todaysEntries}
              onGoalUpdate={handleGoalUpdate}
            />
          )}

          {currentView === "history" && (
            <HistoryView
              weeklyData={weeklyData}
              onDateSelect={handleDateSelect}
            />
          )}

          {currentView === "health" && (
            <HealthIntegration
              onSettingsUpdate={handleSettingsUpdate}
              currentCalories={currentTotal}
            />
          )}

          {currentView === "settings" && settings && (
            <GoalSettings
              settings={settings}
              onSettingsUpdate={handleSettingsUpdate}
              weeklyAverage={weeklyAverage}
              goalAchievementRate={goalAchievementRate}
              onProfileUpdate={refreshData}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-amber-200 z-40 shadow-lg">
          <div className="grid grid-cols-5 h-16">
            <button
              onClick={() => setCurrentView("capture")}
              className={`flex flex-col items-center justify-center space-y-1 transition-all ${
                currentView === "capture"
                  ? "text-amber-600 bg-amber-50"
                  : "text-gray-500 hover:text-amber-600"
              }`}
            >
              <Camera className="w-5 h-5" />
              <span className="text-xs font-medium">Capture</span>
            </button>

            <button
              onClick={() => setCurrentView("tracker")}
              className={`flex flex-col items-center justify-center space-y-1 transition-all ${
                currentView === "tracker"
                  ? "text-amber-600 bg-amber-50"
                  : "text-gray-500 hover:text-amber-600"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs font-medium">Today</span>
            </button>

            <button
              onClick={() => setCurrentView("history")}
              className={`flex flex-col items-center justify-center space-y-1 transition-all ${
                currentView === "history"
                  ? "text-amber-600 bg-amber-50"
                  : "text-gray-500 hover:text-amber-600"
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs font-medium">History</span>
            </button>

            <button
              onClick={() => setCurrentView("health")}
              className={`flex flex-col items-center justify-center space-y-1 transition-all ${
                currentView === "health"
                  ? "text-amber-600 bg-amber-50"
                  : "text-gray-500 hover:text-amber-600"
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">Health</span>
            </button>

            <button
              onClick={() => setCurrentView("settings")}
              className={`flex flex-col items-center justify-center space-y-1 transition-all ${
                currentView === "settings"
                  ? "text-amber-600 bg-amber-50"
                  : "text-gray-500 hover:text-amber-600"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs font-medium">Settings</span>
            </button>
          </div>
        </nav>

        {/* Add bottom padding on mobile to account for navigation */}
        <div className="h-16 md:hidden" />

        {/* Error Notification */}
        <ErrorNotification
          error={error}
          isVisible={isErrorVisible}
          onClose={hideError}
          onRetry={() => retry()}
          canRetry={canRetry && !isNoFoodRecognizedError}
          autoHide={true}
        />



        {/* Network Status */}
        <NetworkStatusIndicator
          isOnline={isOnline}
          isSlowConnection={isSlowConnection}
        />

        {/* Storage Alert */}
        <StorageAlert onOptimize={refreshData} />

        {/* Food Database Entry Modal */}
        {showFoodDatabase && (
          <FoodDatabaseEntry
            onFoodAdd={handleFoodDatabaseAdd}
            onClose={() => setShowFoodDatabase(false)}
          />
        )}

        {/* Toast Container */}
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}
