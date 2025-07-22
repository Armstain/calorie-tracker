'use client';

import React from 'react';

interface WelcomeStepProps {
  onContinue: () => void;
  onSkip: () => void;
}

export default function WelcomeStep({ onContinue, onSkip }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="w-full max-w-md mx-auto text-center space-y-8">
        {/* App Logo/Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-3xl">🍎</span>
          </div>
        </div>

        {/* Welcome Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to CalorieMeter
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Track your nutrition effortlessly with AI-powered food analysis
          </p>
        </div>

        {/* App Introduction */}
        <div className="space-y-6 text-left">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Personalize your experience
            </h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <p className="text-gray-700">
                  Get accurate calorie recommendations based on your personal goals
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <p className="text-gray-700">
                  Track your progress with personalized insights
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <p className="text-gray-700">
                  Receive health recommendations tailored to you
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Message */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm">🔒</span>
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-1">
                  Your privacy matters
                </h3>
                <p className="text-sm text-blue-800">
                  All your data stays on your device. We never share or store your personal information on external servers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <button
            onClick={onContinue}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 shadow-sm"
          >
            Get Started
          </button>
          <button
            onClick={onSkip}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Skip for now
          </button>
        </div>

        {/* Additional Info */}
        <p className="text-sm text-gray-500 mt-6">
          Takes less than 2 minutes to complete
        </p>
      </div>
    </div>
  );
}