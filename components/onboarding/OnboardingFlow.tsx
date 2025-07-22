'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/types';
import WelcomeStep from './WelcomeStep';
import BasicInfoStep from './BasicInfoStep';
import ActivityStep from './ActivityStep';
import GoalsStep from './GoalsStep';
import CompletionStep from './CompletionStep';

interface OnboardingFlowProps {
  onComplete: (profile: UserProfile) => void;
  onSkip?: () => void;
  initialProfile?: Partial<UserProfile>;
}

type OnboardingStep = 'welcome' | 'basic-info' | 'activity' | 'goals' | 'completion';

interface StepData {
  personalInfo: Partial<UserProfile['personalInfo']>;
  activity: Partial<UserProfile['activity']>;
  goals: Partial<UserProfile['goals']>;
}

const STEP_ORDER: OnboardingStep[] = ['welcome', 'basic-info', 'activity', 'goals', 'completion'];

export default function OnboardingFlow({ onComplete, onSkip, initialProfile }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [stepData, setStepData] = useState<StepData>({
    personalInfo: initialProfile?.personalInfo || {},
    activity: initialProfile?.activity || {},
    goals: initialProfile?.goals || {}
  });
  const [isAnimating, setIsAnimating] = useState(false);

  // Progress calculation
  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / STEP_ORDER.length) * 100;

  // Navigation functions
  const navigateToStep = useCallback((step: OnboardingStep) => {
    if (step === currentStep) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(step);
      setIsAnimating(false);
    }, 150);
  }, [currentStep]);

  const goToNextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      navigateToStep(STEP_ORDER[nextIndex]);
    }
  }, [currentStepIndex, navigateToStep]);

  const goToPreviousStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      navigateToStep(STEP_ORDER[prevIndex]);
    }
  }, [currentStepIndex, navigateToStep]);

  // Step handlers
  const handleWelcomeContinue = () => {
    goToNextStep();
  };

  const handleWelcomeSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      // If no skip handler provided, complete with minimal profile
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
      onComplete(minimalProfile);
    }
  };

  const handleBasicInfoContinue = (data: Partial<UserProfile['personalInfo']>) => {
    setStepData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...data }
    }));
    goToNextStep();
  };

  const handleActivityContinue = (data: Partial<UserProfile['activity']>) => {
    setStepData(prev => ({
      ...prev,
      activity: { ...prev.activity, ...data }
    }));
    goToNextStep();
  };

  const handleGoalsContinue = (data: Partial<UserProfile['goals']>) => {
    setStepData(prev => ({
      ...prev,
      goals: { ...prev.goals, ...data }
    }));
    goToNextStep();
  };

  const handleOnboardingComplete = () => {
    // Create complete profile
    const completeProfile: UserProfile = {
      hasCompletedOnboarding: true,
      personalInfo: stepData.personalInfo,
      activity: stepData.activity,
      goals: stepData.goals,
      preferences: {
        units: stepData.personalInfo.height?.unit === 'ft_in' || stepData.personalInfo.weight?.unit === 'lbs' ? 'imperial' : 'metric',
        notifications: true
      },
      metadata: {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        onboardingVersion: '1.0'
      }
    };

    onComplete(completeProfile);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && currentStep !== 'welcome') {
        goToPreviousStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, goToPreviousStep]);

  // Render progress indicator (only show after welcome step)
  const renderProgressIndicator = () => {
    if (currentStep === 'welcome') return null;

    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStepIndex} of {STEP_ORDER.length - 1}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  // Render current step with animation
  const renderCurrentStep = () => {
    const stepProps = {
      onBack: goToPreviousStep,
      className: `transition-all duration-300 ease-in-out ${
        isAnimating ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'
      }`
    };

    switch (currentStep) {
      case 'welcome':
        return (
          <div className={stepProps.className}>
            <WelcomeStep
              onContinue={handleWelcomeContinue}
              onSkip={handleWelcomeSkip}
            />
          </div>
        );

      case 'basic-info':
        return (
          <div className={stepProps.className}>
            <BasicInfoStep
              onContinue={handleBasicInfoContinue}
              onBack={stepProps.onBack}
              initialData={stepData.personalInfo}
            />
          </div>
        );

      case 'activity':
        return (
          <div className={stepProps.className}>
            <ActivityStep
              onContinue={handleActivityContinue}
              onBack={stepProps.onBack}
              initialData={stepData.activity}
            />
          </div>
        );

      case 'goals':
        return (
          <div className={stepProps.className}>
            <GoalsStep
              onContinue={handleGoalsContinue}
              onBack={stepProps.onBack}
              initialData={stepData.goals}
              profileData={{
                personalInfo: stepData.personalInfo,
                activity: stepData.activity
              }}
            />
          </div>
        );

      case 'completion':
        return (
          <div className={stepProps.className}>
            <CompletionStep
              onComplete={handleOnboardingComplete}
              onBack={stepProps.onBack}
              profileData={stepData}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderProgressIndicator()}
      
      {/* Main content area with top padding when progress bar is shown */}
      <div className={currentStep !== 'welcome' ? 'pt-20' : ''}>
        {renderCurrentStep()}
      </div>

      {/* Error boundary fallback */}
      {!renderCurrentStep() && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              We encountered an error in the onboarding process.
            </p>
            <button
              onClick={() => setCurrentStep('welcome')}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}