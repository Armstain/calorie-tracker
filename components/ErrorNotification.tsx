'use client';

import { useEffect, useState } from 'react';
import { Camera, Globe, HardDrive, Wifi, AlertTriangle, WifiOff, Turtle } from 'lucide-react';
import { AppError } from '@/types';
import { errorUtils } from '@/lib/utils';

interface ErrorNotificationProps {
  error: AppError | null;
  isVisible: boolean;
  onClose: () => void;
  onRetry?: () => void;
  canRetry?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export default function ErrorNotification({
  error,
  isVisible,
  onClose,
  onRetry,
  canRetry = false,
  autoHide = false,
  autoHideDelay = 5000
}: ErrorNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      if (autoHide && !canRetry) {
        const timer = setTimeout(() => {
          onClose();
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsAnimating(false);
    }
  }, [isVisible, autoHide, autoHideDelay, canRetry, onClose]);

  if (!error || !isVisible) return null;

  const getErrorIcon = (type: AppError['type']) => {
    switch (type) {
      case 'camera': return <Camera className="w-5 h-5" />;
      case 'api': return <Globe className="w-5 h-5" />;
      case 'storage': return <HardDrive className="w-5 h-5" />;
      case 'network': return <Wifi className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getErrorColor = (type: AppError['type']) => {
    switch (type) {
      case 'camera': return 'border-blue-200 bg-blue-50';
      case 'api': return 'border-yellow-200 bg-yellow-50';
      case 'storage': return 'border-purple-200 bg-purple-50';
      case 'network': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getTextColor = (type: AppError['type']) => {
    switch (type) {
      case 'camera': return 'text-blue-800';
      case 'api': return 'text-yellow-800';
      case 'storage': return 'text-purple-800';
      case 'network': return 'text-red-800';
      default: return 'text-gray-800';
    }
  };

  const userFriendlyMessage = errorUtils.getUserFriendlyMessage(error);

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex justify-center">
      <div
        className={`max-w-md w-full border rounded-lg shadow-lg transition-all duration-300 ${
          isAnimating ? 'transform translate-y-0 opacity-100' : 'transform -translate-y-2 opacity-0'
        } ${getErrorColor(error.type)}`}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-xl flex-shrink-0">
              {getErrorIcon(error.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium ${getTextColor(error.type)}`}>
                {error.type === 'camera' && 'Camera Error'}
                {error.type === 'api' && 'Analysis Error'}
                {error.type === 'storage' && 'Storage Error'}
                {error.type === 'network' && 'Network Error'}
              </h3>
              
              <p className={`text-sm mt-1 ${getTextColor(error.type)} opacity-90`}>
                {userFriendlyMessage}
              </p>

              {/* Show technical details for transparency */}
              {error.type === 'api' && 'statusCode' in error && typeof (error as { statusCode?: number }).statusCode === 'number' && (
                <p className={`text-xs mt-1 ${getTextColor(error.type)} opacity-60`}>
                  Error code: {(error as { statusCode: number }).statusCode}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 mt-3">
                {canRetry && onRetry && (
                  <button
                    onClick={onRetry}
                    className="text-xs bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-1 rounded font-medium transition-colors"
                  >
                    Try Again
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className="text-xs bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-1 rounded font-medium transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`flex-shrink-0 ${getTextColor(error.type)} hover:opacity-70 transition-opacity`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading state component for API calls
export function LoadingOverlay({ 
  isVisible, 
  message = 'Processing...',
  canCancel = false,
  onCancel
}: {
  isVisible: boolean;
  message?: string;
  canCancel?: boolean;
  onCancel?: () => void;
}) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-900 font-medium mb-2">{message}</p>
        <p className="text-sm text-gray-600 mb-4">Please wait...</p>
        
        {canCancel && onCancel && (
          <button
            onClick={onCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// Network status indicator
export function NetworkStatusIndicator({ 
  isOnline, 
  isSlowConnection 
}: { 
  isOnline: boolean; 
  isSlowConnection: boolean; 
}) {
  if (isOnline && !isSlowConnection) return null;

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-40 flex justify-center`}>
      <div className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
        !isOnline 
          ? 'bg-red-500 text-white' 
          : 'bg-yellow-500 text-white'
      }`}>
        {!isOnline ? (
          <span className="flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            No internet connection
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Turtle className="w-4 h-4" />
            Slow connection detected
          </span>
        )}
      </div>
    </div>
  );
}