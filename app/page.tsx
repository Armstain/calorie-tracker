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
import { FoodAnalysisResult, FoodItem, UserSettings, UserProfile, AppError } from "@/types";
import { dateUtils } from "@/lib/utils";
import WorkingCamera from "@/components/WorkingCamera";
import AnalysisProgress from "@/components/AnalysisProgress";
import { learningService } from "@/lib/learningService";
import HealthIntegration from "@/components/HealthIntegration";
import FoodDatabaseEntry from "@/components/FoodDatabaseEntry";
import { CommonFood, MacroPerUnit } from "@/lib/foodDatabase";
import {
  FavoriteMeal,
  getFavorites,
  saveFavorite,
  removeFavorite,
  markFavoriteUsed,
  getRecentMeals,
} from "@/lib/favorites";

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
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const analysisAbortRef = useRef<AbortController | null>(null);
  // Signals aborted deliberately by the user (Stop, or a new scan). Any
  // other abort (browser backgrounding, network drop) is an interruption
  // the user must hear about, not a silent cancel.
  const userAbortedSignalsRef = useRef(new Set<AbortSignal>());
  const [mealNote, setMealNote] = useState("");
  const [analysisModelLabel, setAnalysisModelLabel] = useState<string | undefined>();
  const [foundFoods, setFoundFoods] = useState<string[]>([]);

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
    setFavorites(getFavorites());
  }, [refetchEntries, refetchWeekly, refetchSettings]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  // Keep the scan alive while it runs: on a phone, letting the screen
  // sleep can freeze or kill a long background fetch. The wake lock is
  // best-effort (unsupported browsers just skip it) and is released the
  // moment the scan settles. It re-requests on return to the tab, since
  // the browser drops wake locks when the page is hidden.
  useEffect(() => {
    if (!foodAnalysisMutation.isPending) return;
    let sentinel: { release: () => Promise<void> } | null = null;
    let cancelled = false;
    const requestLock = async () => {
      try {
        const nav = navigator as Navigator & {
          wakeLock?: { request: (type: string) => Promise<{ release: () => Promise<void> }> };
        };
        if (!nav.wakeLock) return;
        const lock = await nav.wakeLock.request('screen');
        if (cancelled) { await lock.release().catch(() => {}); return; }
        sentinel = lock;
      } catch {
        // Wake lock denied or unsupported: the scan still runs, just
        // without the screen-on guarantee.
      }
    };
    requestLock();
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && foodAnalysisMutation.isPending) requestLock();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (sentinel) sentinel.release().catch(() => {});
    };
  }, [foodAnalysisMutation.isPending]);

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
        userAbortedSignalsRef.current.add(analysisAbortRef.current.signal);
        analysisAbortRef.current.abort();
      }
      const controller = new AbortController();
      analysisAbortRef.current = controller;

      setAnalysisModelLabel(undefined);
      setFoundFoods([]);

      let userContext = '';
      try {
        userContext = learningService.getPromptContext();
      } catch {
        // Learning data is optional
      }

      foodAnalysisMutation.mutate(
        {
          imageData,
          apiKey: settings?.apiKey || '',
          signal: controller.signal,
          note: mealNote,
          userContext,
          onProgress: (event) => {
            if (event.type === 'model') {
              setAnalysisModelLabel(event.label);
              setFoundFoods([]);
            } else if (event.type === 'food') {
              setFoundFoods(prev => (prev.includes(event.name) ? prev : [...prev, event.name]));
            }
          },
        },
        {
          onSuccess: (result) => {
            analysisAbortRef.current = null;
            setMealNote("");
            setAnalysisResult(result);
            setCurrentView("results");

            showSuccessToast(
              "Analysis complete!",
              `Found ${result.foods.length} food item${result.foods.length !== 1 ? 's' : ''} with ${result.totalCalories} calories`,
              4000
            );
          },
          onError: (error: unknown, variables?: { signal?: AbortSignal }) => {
            analysisAbortRef.current = null;

            // Canceled requests: silent ONLY when the user cancelled this
            // exact scan (Stop, or starting a new one). A cancel from
            // anywhere else — browser backgrounding, network drop — is an
            // interruption, and silently dropping it is exactly how a
            // background scan "disappears" with no explanation.
            if (error && typeof error === 'object' && 'code' in error && (error as { code?: unknown }).code === 'canceled') {
              if (variables?.signal && userAbortedSignalsRef.current.has(variables.signal)) {
                userAbortedSignalsRef.current.delete(variables.signal);
                return;
              }
              showError({
                type: 'network' as const,
                message: 'The scan was interrupted before it finished. Please try again — or add the meal manually with Quick Add.',
              });
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
    [isOnline, settings?.apiKey, mealNote, showError, showSuccessToast, foodAnalysisMutation]
  );

  const handleStopScan = useCallback(() => {
    if (analysisAbortRef.current) {
      userAbortedSignalsRef.current.add(analysisAbortRef.current.signal);
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

  const handleFoodDatabaseAdd = useCallback(async (food: CommonFood, calories: number, portion: string, macros?: MacroPerUnit) => {
    try {
      // Create a food entry from the database selection. Macros were
      // previously dropped here, so DB foods counted 0g protein/carbs/fat.
      const foodItem: FoodItem = {
        name: food.nameBn ? `${food.name} (${food.nameBn})` : food.name,
        calories: calories,
        quantity: portion,
        confidence: 1.0, // Database entries have 100% confidence
        ...(macros ? { macros: { protein: macros.protein, carbs: macros.carbs, fat: macros.fat, fiber: macros.fiber } } : {}),
      };
      const foodEntry = {
        timestamp: new Date().toISOString(),
        foods: [foodItem],
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

  // Favorites & repeats: log a stored meal with zero Gemini calls.
  const handleFavoriteFromDb = useCallback((food: CommonFood, calories: number, portion: string, macros?: MacroPerUnit) => {
    const foodItem: FoodItem = {
      name: food.nameBn ? `${food.name} (${food.nameBn})` : food.name,
      calories,
      quantity: portion,
      confidence: 1.0,
      ...(macros ? { macros: { protein: macros.protein, carbs: macros.carbs, fat: macros.fat, fiber: macros.fiber } } : {}),
    };
    const favorite = saveFavorite([foodItem]);
    setFavorites(getFavorites());
    if (favorite) showSuccessToast("Saved as favorite", `${foodItem.name} can now be logged without AI`, 3000);
  }, [showSuccessToast]);

  const handleSaveAnalysisAsFavorite = useCallback(() => {
    if (!analysisResult) return;
    const favorite = saveFavorite(analysisResult.foods);
    setFavorites(getFavorites());
    if (favorite) showSuccessToast("Saved as favorite", "This meal can be repeated later with no new image parse", 3000);
  }, [analysisResult, showSuccessToast]);

  const handleRepeatMeal = useCallback(async (foods: FoodItem[], totalCalories: number, favoriteId?: string) => {
    try {
      await storageService.saveFoodEntry({
        timestamp: new Date().toISOString(),
        foods,
        totalCalories,
        date: dateUtils.getCurrentDate(),
      });
      if (favoriteId) markFavoriteUsed(favoriteId);
      setFavorites(getFavorites());
      refreshData();
      setCurrentView("tracker");
    } catch (error) {
      showError(error as Error);
    }
  }, [refreshData, showError]);

  const handleRemoveFavorite = useCallback((id: string) => {
    removeFavorite(id);
    setFavorites(getFavorites());
  }, []);

  const recentMeals = useMemo(() => {
    const allEntries = weeklyData.flatMap((day) => day.entries);
    return getRecentMeals(allEntries, 8);
  }, [weeklyData]);

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
              {/* Slim progress strip: one line of numbers + bar. The full
                  breakdown lives in the tracker view, not on Capture. */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-amber-200 shadow-sm">
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

              {/* Slim welcome banner, new users only: no badge row. */}
              {todaysEntries.length === 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shrink-0">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-gray-600 text-sm">
                      <span className="font-semibold text-gray-800">Welcome to CalorieMeter! </span>
                      Scan a meal for instant AI estimates, or add from the food database.
                    </p>
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
                <div className="mb-3">
                  <label htmlFor="meal-note" className="block text-sm font-medium text-gray-700 mb-1">
                    Add a note <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="meal-note"
                    type="text"
                    value={mealNote}
                    onChange={(e) => setMealNote(e.target.value.slice(0, 300))}
                    maxLength={300}
                    placeholder='e.g. "2 rotis, large bowl of dal, cooked in ghee"'
                    disabled={foodAnalysisMutation.isPending}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Portions, hidden ingredients or cooking oil help the AI estimate more accurately.
                  </p>
                </div>
                <WorkingCamera
                  onPhotoCapture={handlePhotoCapture}
                  onError={showError}
                />
                <AnalysisProgress
                  isAnalyzing={foodAnalysisMutation.isPending}
                  onStop={handleStopScan}
                  modelLabel={analysisModelLabel}
                  foundFoods={foundFoods}
                />
              </div>

              {/* Favorites & Repeats — no AI, no tokens */}
              {(favorites.length > 0 || recentMeals.length > 0) && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-green-200 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-1">Favorites &amp; repeats</h3>
                  <p className="text-xs text-gray-500 mb-3">Logged from saved data — no photo, no AI call, no tokens.</p>
                  <div className="space-y-2">
                    {favorites.map((fav) => (
                      <div key={fav.id} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg p-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">☆ {fav.name}</div>
                          <div className="text-xs text-gray-500">{fav.totalCalories} cal · used {fav.useCount}x</div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleRepeatMeal(fav.foods, fav.totalCalories, fav.id)}
                            className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => handleRemoveFavorite(fav.id)}
                            aria-label={`Remove ${fav.name} from favorites`}
                            className="px-2 py-1.5 text-sm text-gray-500 hover:text-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    {recentMeals.filter((m) => !favorites.some((f) => f.foods.length === m.foods.length && f.totalCalories === m.totalCalories && f.name === m.name)).slice(0, 4).map((meal) => (
                      <div key={meal.key} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg p-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">↻ {meal.name}</div>
                          <div className="text-xs text-gray-500">{meal.totalCalories} cal · last logged {new Date(meal.lastTimestamp).toLocaleDateString()}</div>
                        </div>
                        <button
                          onClick={() => handleRepeatMeal(meal.foods, meal.totalCalories)}
                          className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg shrink-0"
                        >
                          Repeat
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}



          {currentView === "results" && analysisResult && (
            <ResultsDisplay
              analysisResult={analysisResult}
              onAddToDaily={handleAddToDaily}
              onRetakePhoto={handleRetakePhoto}
              onAnalysisUpdate={setAnalysisResult}
              onSaveFavorite={handleSaveAnalysisAsFavorite}
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

        {/* Scan-in-progress pill: visible on every view while a scan runs,
            so navigating away (or returning from another tab) never makes
            a running scan look lost. The result still opens automatically
            when it finishes. */}
        {foodAnalysisMutation.isPending && currentView !== 'capture' && (
          <div className="fixed bottom-20 left-4 right-4 z-40 flex justify-center md:bottom-6">
            <div className="flex items-center gap-3 bg-amber-500 text-white px-4 py-2.5 rounded-full shadow-lg text-sm font-medium">
              <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              <span>Scanning your meal{analysisModelLabel ? ` · ${analysisModelLabel}` : ''}…</span>
              <button
                onClick={handleStopScan}
                className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-semibold"
              >
                Stop
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        <ErrorNotification
          error={error}
          isVisible={isErrorVisible}
          onClose={hideError}
          onRetry={() => retry()}
          // No Try Again here: retry() without a function only hides the
          // banner, and a scan cannot be re-run anyway — photos are never
          // saved, so the user retakes the photo. The secondary action
          // below is the real next step for each cause.
          canRetry={false}
          // Failure messages must not vanish after 5 seconds: a missing
          // key or a quota message the user never reads helps nobody.
          autoHide={false}
          secondaryAction={
            error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string' && (error as { message: string }).message.includes('API key')
              ? { label: 'Open Settings', onClick: () => { hideError(); setCurrentView('settings'); } }
              : isNoFoodRecognizedError
                ? { label: 'Add manually', onClick: () => { hideError(); setShowFoodDatabase(true); } }
                : undefined
          }
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
            onFavoriteAdd={handleFavoriteFromDb}
            onClose={() => setShowFoodDatabase(false)}
          />
        )}

        {/* Toast Container */}
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}
