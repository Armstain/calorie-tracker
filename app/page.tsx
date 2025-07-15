'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Camera, BarChart3, TrendingUp, Settings, Utensils } from 'lucide-react';
import CameraCapture from '@/components/CameraCapture';
import ResultsDisplay from '@/components/ResultsDisplay';
import DailyTracker from '@/components/DailyTracker';
import HistoryView from '@/components/HistoryView';
import GoalSettings from '@/components/GoalSettings';
import ErrorNotification, { LoadingOverlay, NetworkStatusIndicator } from '@/components/ErrorNotification';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { storageService } from '@/lib/storage';
import { geminiService } from '@/lib/gemini';
import { FoodAnalysisResult, FoodEntry, UserSettings } from '@/types';
import { dateUtils } from '@/lib/utils';

type AppView = 'capture' | 'results' | 'tracker' | 'history' | 'settings';

export default function Home() {
  const [currentView, setCurrentView] = useState<AppView>('capture');
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(storageService.getUserSettings());
  const [todaysEntries, setTodaysEntries] = useState<FoodEntry[]>([]);
  const [weeklyData, setWeeklyData] = useState(storageService.getWeeklyData());
  
  const { error, isVisible: isErrorVisible, showError, hideError, retry, canRetry } = useErrorHandler();
  const { isOnline, isSlowConnection } = useNetworkStatus();

  const refreshData = useCallback(() => {
    setTodaysEntries(storageService.getTodaysEntries());
    setWeeklyData(storageService.getWeeklyData());
    setSettings(storageService.getUserSettings());
  }, []);

  // Load initial data
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handlePhotoCapture = useCallback(async (imageData: string) => {
    if (!isOnline) {
      showError('No internet connection. Please check your network and try again.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await geminiService.analyzeFood(imageData, settings.apiKey);
      setAnalysisResult(result);
      setCurrentView('results');
    } catch (error) {
      showError(error as Error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isOnline, settings.apiKey, showError]);

  const handleAddToDaily = useCallback(async () => {
    if (!analysisResult) return;

    try {
      storageService.saveFoodEntry({
        timestamp: analysisResult.timestamp,
        foods: analysisResult.foods,
        totalCalories: analysisResult.totalCalories,
        imageData: analysisResult.imageUrl,
        date: dateUtils.getCurrentDate()
      });

      refreshData();
      setCurrentView('tracker');
      setAnalysisResult(null);
    } catch (error) {
      showError(error as Error);
    }
  }, [analysisResult, refreshData, showError]);

  const handleRetakePhoto = useCallback(() => {
    setAnalysisResult(null);
    setCurrentView('capture');
  }, []);

  const handleGoalUpdate = useCallback((newGoal: number) => {
    try {
      storageService.updateDailyGoal(newGoal);
      refreshData();
    } catch (error) {
      showError(error as Error);
    }
  }, [refreshData, showError]);

  const handleSettingsUpdate = useCallback((newSettings: Partial<UserSettings>) => {
    try {
      storageService.updateUserSettings(newSettings);
      refreshData();
    } catch (error) {
      showError(error as Error);
    }
  }, [refreshData, showError]);

  const handleDateSelect = useCallback((date: string) => {
    // Could implement date-specific view here
    console.log('Selected date:', date);
  }, []);

  const currentTotal = useMemo(() => 
    todaysEntries.reduce((sum, entry) => sum + entry.totalCalories, 0), 
    [todaysEntries]
  );
  
  const weeklyAverage = useMemo(() => 
    weeklyData.length > 0 
      ? Math.round(weeklyData.reduce((sum, day) => sum + day.totalCalories, 0) / weeklyData.length)
      : 0,
    [weeklyData]
  );
  
  const goalAchievementRate = useMemo(() => 
    weeklyData.length > 0
      ? (weeklyData.filter(day => day.goalMet).length / weeklyData.length) * 100
      : 0,
    [weeklyData]
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        {/* Mobile-First Header */}
        <header className="bg-white/90 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-40 shadow-sm" role="banner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <Utensils className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  CalorieMeter
                </h1>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-2" role="navigation" aria-label="Main navigation">
                <button
                  onClick={() => setCurrentView('capture')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'capture'
                      ? 'bg-amber-100 text-amber-800 shadow-sm'
                      : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
                  }`}
                  aria-current={currentView === 'capture' ? 'page' : undefined}
                  aria-label="Go to photo capture page"
                >
                  <Camera className="w-4 h-4" aria-hidden="true" />
                  Capture
                </button>
                <button
                  onClick={() => setCurrentView('tracker')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'tracker'
                      ? 'bg-amber-100 text-amber-800 shadow-sm'
                      : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
                  }`}
                  aria-current={currentView === 'tracker' ? 'page' : undefined}
                  aria-label="Go to today's calorie tracker"
                >
                  <BarChart3 className="w-4 h-4" aria-hidden="true" />
                  Today
                </button>
                <button
                  onClick={() => setCurrentView('history')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'history'
                      ? 'bg-amber-100 text-amber-800 shadow-sm'
                      : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
                  }`}
                  aria-current={currentView === 'history' ? 'page' : undefined}
                  aria-label="Go to calorie history and trends"
                >
                  <TrendingUp className="w-4 h-4" aria-hidden="true" />
                  History
                </button>
                <button
                  onClick={() => setCurrentView('settings')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'settings'
                      ? 'bg-amber-100 text-amber-800 shadow-sm'
                      : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
                  }`}
                  aria-current={currentView === 'settings' ? 'page' : undefined}
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
          {currentView === 'capture' && (
            <CameraCapture
              onPhotoCapture={handlePhotoCapture}
              onError={showError}
            />
          )}

          {currentView === 'results' && analysisResult && (
            <ResultsDisplay
              analysisResult={analysisResult}
              onAddToDaily={handleAddToDaily}
              onRetakePhoto={handleRetakePhoto}
            />
          )}

          {currentView === 'tracker' && (
            <DailyTracker
              dailyGoal={settings.dailyCalorieGoal}
              currentTotal={currentTotal}
              todaysEntries={todaysEntries}
              onGoalUpdate={handleGoalUpdate}
            />
          )}

          {currentView === 'history' && (
            <HistoryView
              weeklyData={weeklyData}
              onDateSelect={handleDateSelect}
            />
          )}

          {currentView === 'settings' && (
            <GoalSettings
              settings={settings}
              onSettingsUpdate={handleSettingsUpdate}
              weeklyAverage={weeklyAverage}
              goalAchievementRate={goalAchievementRate}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-amber-200 z-40 shadow-lg">
          <div className="grid grid-cols-4 h-16">
            <button
              onClick={() => setCurrentView('capture')}
              className={`flex flex-col items-center justify-center space-y-1 transition-all ${
                currentView === 'capture'
                  ? 'text-amber-600 bg-amber-50'
                  : 'text-gray-500 hover:text-amber-600'
              }`}
            >
              <Camera className="w-5 h-5" />
              <span className="text-xs font-medium">Capture</span>
            </button>
            
            <button
              onClick={() => setCurrentView('tracker')}
              className={`flex flex-col items-center justify-center space-y-1 transition-all ${
                currentView === 'tracker'
                  ? 'text-amber-600 bg-amber-50'
                  : 'text-gray-500 hover:text-amber-600'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs font-medium">Today</span>
            </button>
            
            <button
              onClick={() => setCurrentView('history')}
              className={`flex flex-col items-center justify-center space-y-1 transition-all ${
                currentView === 'history'
                  ? 'text-amber-600 bg-amber-50'
                  : 'text-gray-500 hover:text-amber-600'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs font-medium">History</span>
            </button>
            
            <button
              onClick={() => setCurrentView('settings')}
              className={`flex flex-col items-center justify-center space-y-1 transition-all ${
                currentView === 'settings'
                  ? 'text-amber-600 bg-amber-50'
                  : 'text-gray-500 hover:text-amber-600'
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
          canRetry={canRetry}
          autoHide={true}
        />

        {/* Loading Overlay */}
        <LoadingOverlay
          isVisible={isAnalyzing}
          message="Analyzing your food..."
          canCancel={false}
        />

        {/* Network Status */}
        <NetworkStatusIndicator
          isOnline={isOnline}
          isSlowConnection={isSlowConnection}
        />
      </div>
    </ErrorBoundary>
  );
}
