'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Eye, Calculator, CheckCircle } from 'lucide-react';

interface AnalysisProgressProps {
  isAnalyzing: boolean;
  onStop: () => void;
}

const THINKING_STEPS = [
  { icon: Eye, text: 'Scanning image...', duration: 2000 },
  { icon: Sparkles, text: 'Identifying food items...', duration: 3000 },
  { icon: Calculator, text: 'Calculating nutritional values...', duration: 2500 },
  { icon: CheckCircle, text: 'Finalizing analysis...', duration: 2000 },
];

export default function AnalysisProgress({ isAnalyzing, onStop }: AnalysisProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentStep(0);
      setElapsedTime(0);
      return;
    }

    // Timer for elapsed time
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 100);
    }, 100);

    return () => clearInterval(timer);
  }, [isAnalyzing]);

  // Progress through steps based on elapsed time
  useEffect(() => {
    if (!isAnalyzing) return;

    let accumulated = 0;
    for (let i = 0; i < THINKING_STEPS.length; i++) {
      accumulated += THINKING_STEPS[i].duration;
      if (elapsedTime < accumulated) {
        setCurrentStep(i);
        return;
      }
    }
    // Loop back or stay on last step
    setCurrentStep(THINKING_STEPS.length - 1);
  }, [elapsedTime, isAnalyzing]);

  if (!isAnalyzing) return null;

  const CurrentIcon = THINKING_STEPS[currentStep].icon;
  const currentText = THINKING_STEPS[currentStep].text;

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {/* Main status */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <CurrentIcon className="w-5 h-5 text-amber-600 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
            </div>
            <div>
              <div className="font-medium text-amber-800">AI Analysis in Progress</div>
              <div className="text-sm text-amber-600">{currentText}</div>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-2">
            {THINKING_STEPS.map((step, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  index < currentStep
                    ? 'bg-amber-500'
                    : index === currentStep
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-amber-200'
                }`}
              />
            ))}
          </div>

          {/* Time elapsed */}
          <div className="text-xs text-amber-500">
            {Math.floor(elapsedTime / 1000)}s elapsed
          </div>
        </div>

        <button
          type="button"
          onClick={onStop}
          className="px-4 py-2 text-sm font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors"
        >
          Stop
        </button>
      </div>
    </div>
  );
}
