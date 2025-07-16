"use client";

import { useEffect, useState } from "react";
import { Utensils, Camera, BarChart3, Sparkles } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [step, setStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStep(1);
    }, 500);

    const timer2 = setTimeout(() => {
      setStep(2);
    }, 1500);

    const timer3 = setTimeout(() => {
      setStep(3);
    }, 2500);

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 3000);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 transition-all duration-500 ${
        isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}
    >
      <div className="text-center space-y-8 px-8">
        {/* Logo */}
        <div className="relative">
          <div
            className={`w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-700 ${
              step >= 0 ? "scale-100 opacity-100" : "scale-50 opacity-0"
            }`}
          >
            <Utensils className="w-10 h-10 text-white" />
          </div>

          {/* Sparkle animation */}
          {step >= 1 && (
            <div className="absolute -top-2 -right-2 animate-pulse">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
          )}
        </div>

        {/* Title */}
        <div
          className={`space-y-2 transform transition-all duration-700 delay-300 ${
            step >= 1 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            CalorieMeter
          </h1>
          <p className="text-gray-600 text-lg">AI-Powered Calorie Tracking</p>
        </div>

        {/* Features */}
        <div
          className={`flex justify-center space-x-8 transform transition-all duration-700 delay-500 ${
            step >= 2 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
              <Camera className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-sm text-gray-600">Capture</span>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-sm text-gray-600">Analyze</span>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-sm text-gray-600">Track</span>
          </div>
        </div>

        {/* Made with love */}
        <div
          className={`transform transition-all duration-700 delay-500 ${
            step >= 2 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <p className="text-xs text-gray-400 mt-4">Made with ❤️ by Adnan</p>
        </div>

        {/* Loading indicator */}
        <div
          className={`transform transition-all duration-700 delay-700 ${
            step >= 3 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full animate-pulse"
              style={{ width: "100%" }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">Getting ready...</p>
        </div>
      </div>
    </div>
  );
}
