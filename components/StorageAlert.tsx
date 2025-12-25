"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storageService } from "@/lib/storage";

interface StorageAlertProps {
  onOptimize?: () => void;
}

export default function StorageAlert({ onOptimize }: StorageAlertProps) {
  const [showAlert, setShowAlert] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ used: 0, available: 0, percentage: 0 });
  const [recommendations, setRecommendations] = useState<{ canOptimize: boolean; recommendations: string[]; potentialSavings: number }>({ canOptimize: false, recommendations: [], potentialSavings: 0 });

  useEffect(() => {
    const checkStorage = () => {
      const info = storageService.getStorageInfo();
      const recs = storageService.getOptimizationRecommendations();
      
      setStorageInfo(info);
      setRecommendations(recs);
      
      // Show alert if storage is over 75% or optimization is available
      setShowAlert(info.percentage > 75 || recs.canOptimize);
    };

    checkStorage();
    
    // Check every 30 seconds
    const interval = setInterval(checkStorage, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOptimize = () => {
    try {
      const result = storageService.performStorageOptimization();
      console.log(`Storage optimized: ${result.deletedEntries} entries deleted, ${result.spaceSaved} bytes saved`);
      
      // Refresh storage info
      const info = storageService.getStorageInfo();
      const recs = storageService.getOptimizationRecommendations();
      setStorageInfo(info);
      setRecommendations(recs);
      
      if (onOptimize) {
        onOptimize();
      }
      
      // Hide alert if optimization resolved the issue
      if (info.percentage <= 75 && !recs.canOptimize) {
        setShowAlert(false);
      }
    } catch (error) {
      console.error('Storage optimization failed:', error);
    }
  };

  if (!showAlert) {
    return null;
  }

  return (
    <div className="fixed top-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-yellow-800">
              Storage {storageInfo.percentage > 90 ? 'Critical' : 'Warning'}
            </h3>
            
            <p className="text-xs text-yellow-700 mt-1">
              {storageInfo.percentage > 90 
                ? `Storage is ${Math.round(storageInfo.percentage)}% full. New photos may not save.`
                : `Storage is ${Math.round(storageInfo.percentage)}% full.`
              }
            </p>
            
            {recommendations.canOptimize && (
              <p className="text-xs text-yellow-600 mt-1">
                Can save ~{recommendations.potentialSavings} KB by optimizing data.
              </p>
            )}
            
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleOptimize}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-3 py-1.5 h-auto"
              >
                <Zap className="w-3 h-3 mr-1" />
                Optimize
              </Button>
              
              <Button
                onClick={() => setShowAlert(false)}
                variant="outline"
                size="sm"
                className="text-xs px-3 py-1.5 h-auto border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                Dismiss
              </Button>
            </div>
          </div>
          
          <button
            onClick={() => setShowAlert(false)}
            className="text-yellow-600 hover:text-yellow-800 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}