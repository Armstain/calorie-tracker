"use client";

import { useState } from "react";
import {
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Zap,
  Settings,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { storageService } from "@/lib/storage";
import { learningService } from "@/lib/learningService";
import { useClearTodaysEntries, useClearWeekEntries, useClearAllData } from "@/lib/queries";
import { useToast } from "@/lib/hooks/useToast";

interface DataManagementProps {
  onDataChange?: () => void;
}

export default function DataManagement({ onDataChange }: DataManagementProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [clearingState, setClearingState] = useState<{
    type: "day" | "week" | "all" | null;
    step: "idle" | "confirm" | "processing";
  }>({ type: null, step: "idle" });
  const [showOptimizationSettings, setShowOptimizationSettings] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // TanStack Query mutations
  const clearTodaysEntriesMutation = useClearTodaysEntries();
  const clearWeekEntriesMutation = useClearWeekEntries();
  const clearAllDataMutation = useClearAllData();

  // Toast notifications
  const { addToast } = useToast();

  // Export all data as JSON
  const handleExportData = async () => {
    try {
      setIsExporting(true);

      // Get all data from storage
      const userData = storageService.exportData();
      const learningStats = learningService.getLearningStats();

      // Create comprehensive export object
      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        appName: "CalorieMeter",
        userData: JSON.parse(userData),
        learningData: learningStats,
        metadata: {
          totalEntries: JSON.parse(userData).entries?.length || 0,
          totalCorrections: learningStats.totalCorrections,
          exportedBy: "CalorieMeter App",
        },
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `caloriemeter-data-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setImportStatus({
        type: "success",
        message: "Data exported successfully! Check your downloads folder.",
      });
    } catch (error) {
      console.error("Export error:", error);
      setImportStatus({
        type: "error",
        message: "Failed to export data. Please try again.",
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => setImportStatus({ type: null, message: "" }), 5000);
    }
  };

  // Import data from JSON file
  const handleImportData = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);

      // Validate file type
      if (!file.name.endsWith(".json")) {
        throw new Error("Please select a valid JSON file");
      }

      // Read file content
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
      });

      // Parse and validate JSON
      const importData = JSON.parse(fileContent);

      // Validate data structure
      if (!importData.userData || !importData.version) {
        throw new Error(
          "Invalid data format. Please use a valid CalorieMeter export file."
        );
      }

      // Import user data
      if (importData.userData) {
        storageService.importData(JSON.stringify(importData.userData));
      }

      // Trigger data refresh
      if (onDataChange) {
        onDataChange();
      }

      setImportStatus({
        type: "success",
        message: `Data imported successfully! Imported ${
          importData.metadata?.totalEntries || 0
        } entries.`,
      });
    } catch (error) {
      console.error("Import error:", error);
      setImportStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to import data. Please check the file format.",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = "";
      setTimeout(() => setImportStatus({ type: null, message: "" }), 5000);
    }
  };

  // Clear data functions
  const handleClearData = (type: "day" | "week" | "all") => {
    if (clearingState.step === 'idle') {
      setClearingState({ type, step: 'confirm' });
      // Auto-reset after 8 seconds if no action
      setTimeout(() => {
        setClearingState(prev =>
          prev.type === type && prev.step === 'confirm'
            ? { type: null, step: 'idle' }
            : prev
        );
      }, 8000);
    } else if (clearingState.type === type && clearingState.step === 'confirm') {
      setClearingState({ type, step: 'processing' });

      const getActionName = (type: string) => {
        switch (type) {
          case 'day': return "today's entries";
          case 'week': return "this week's entries";
          case 'all': return "all data";
          default: return "data";
        }
      };

      const mutation = type === 'day' ? clearTodaysEntriesMutation :
                      type === 'week' ? clearWeekEntriesMutation :
                      clearAllDataMutation;

      mutation.mutate(undefined, {
        onSuccess: (deletedCount) => {
          setClearingState({ type: null, step: 'idle' });
          const countText = typeof deletedCount === 'number' ? ` (${deletedCount} entries)` : '';
          addToast({
            type: 'success',
            title: "Data cleared",
            description: `Successfully cleared ${getActionName(type)}${countText}`,
            duration: 5000
          });
        },
        onError: (error) => {
          console.error(`Clear ${type} data error:`, error);
          setClearingState({ type: null, step: 'idle' });
          addToast({
            type: 'error',
            title: "Clear failed",
            description: `Failed to clear ${getActionName(type)}. Please try again.`
          });
        }
      });
    }
  };

  const cancelClearData = () => {
    setClearingState({ type: null, step: 'idle' });
  };

  // Storage optimization functions
  const handleOptimizeStorage = async () => {
    try {
      setIsOptimizing(true);
      const result = storageService.performStorageOptimization();
      
      setImportStatus({
        type: "success",
        message: `Optimization complete! Deleted ${result.deletedEntries} entries and saved ${Math.round(result.spaceSaved / 1024)} KB.`,
      });

      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error("Optimization error:", error);
      setImportStatus({
        type: "error",
        message: "Failed to optimize storage. Please try again.",
      });
    } finally {
      setIsOptimizing(false);
      setTimeout(() => setImportStatus({ type: null, message: "" }), 5000);
    }
  };

  const updateOptimizationSettings = (settings: Partial<Parameters<typeof storageService.updateOptimizationConfig>[0]>) => {
    try {
      storageService.updateOptimizationConfig(settings);
      setImportStatus({
        type: "success",
        message: "Optimization settings updated successfully.",
      });
      setTimeout(() => setImportStatus({ type: null, message: "" }), 3000);
    } catch (error) {
      console.error("Settings update error:", error);
      setImportStatus({
        type: "error",
        message: "Failed to update settings.",
      });
      setTimeout(() => setImportStatus({ type: null, message: "" }), 3000);
    }
  };

  // Get storage info and optimization data
  const storageInfo = storageService.getStorageInfo();
  const storagePercentage = Math.round(storageInfo.percentage);
  const optimizationRecommendations = storageService.getOptimizationRecommendations();
  const optimizationConfig = storageService.getOptimizationConfig();

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Data Management
        </h2>
        <p className="text-gray-600">
          Export, import, and manage your food tracking data
        </p>
      </div>

      {/* Status Message */}
      {importStatus.type && (
        <div
          className={`p-4 rounded-lg border ${
            importStatus.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {importStatus.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span className="font-medium">{importStatus.message}</span>
          </div>
        </div>
      )}

      {/* Storage Usage */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Storage Usage
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Used Storage:</span>
            <span className="font-medium text-gray-900">
              {(storageInfo.used / 1024).toFixed(1)} KB ({storagePercentage}%)
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                storagePercentage > 80
                  ? "bg-red-500"
                  : storagePercentage > 60
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(storagePercentage, 100)}%` }}
            />
          </div>

          <div className="text-xs text-gray-500">
            Browser storage limit: ~5MB (estimated)
          </div>

          {storagePercentage > 70 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Storage Warning</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Your storage is getting full. Consider optimizing or clearing old data.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Storage Optimization */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Storage Optimization
          </h3>
          <Button
            onClick={() => setShowOptimizationSettings(!showOptimizationSettings)}
            variant="outline"
            size="sm"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Storage Tip */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">💡 Storage Tip</span>
            </div>
            <p className="text-xs text-green-700">
              Images are automatically deleted after AI analysis. This saves 90% of storage space while keeping all your calorie data!
            </p>
          </div>

          {optimizationRecommendations.canOptimize ? (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <HardDrive className="w-4 h-4" />
                  <span className="text-sm font-medium">Optimization Available</span>
                </div>
                <ul className="text-xs text-blue-700 space-y-1">
                  {optimizationRecommendations.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
                <p className="text-xs text-blue-600 mt-2">
                  Potential savings: ~{optimizationRecommendations.potentialSavings} KB
                </p>
              </div>

              <Button
                onClick={handleOptimizeStorage}
                disabled={isOptimizing}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                {isOptimizing ? "Optimizing..." : "Optimize Storage"}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Storage is already optimized!</p>
            </div>
          )}
        </div>

        {/* Optimization Settings */}
        {showOptimizationSettings && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Optimization Settings</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-gray-600">Store Images:</span>
                  <span className="text-xs text-gray-500">Recommended: OFF (saves 90% storage)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optimizationConfig.enableImageStorage}
                    onChange={(e) => updateOptimizationSettings({ enableImageStorage: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Auto-cleanup (days):</span>
                <select
                  value={optimizationConfig.autoCleanupDays}
                  onChange={(e) => updateOptimizationSettings({ autoCleanupDays: parseInt(e.target.value) })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Max Image Size:</span>
                <select
                  value={optimizationConfig.maxImageSize}
                  onChange={(e) => updateOptimizationSettings({ maxImageSize: parseInt(e.target.value) })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={50}>50 KB</option>
                  <option value={100}>100 KB</option>
                  <option value={200}>200 KB</option>
                  <option value={500}>500 KB</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Data */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Export Data
        </h3>
        <p className="text-gray-600 mb-4">
          Download all your food tracking data as a JSON file for backup or
          transfer to another device.
        </p>

        <Button
          onClick={handleExportData}
          disabled={isExporting}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? "Exporting..." : "Export All Data"}
        </Button>

        <div className="mt-3 text-xs text-gray-500">
          Includes: Food entries, settings, goals, and AI learning data
        </div>
      </div>

      {/* Import Data */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Import Data
        </h3>
        <p className="text-gray-600 mb-4">
          Restore your data from a previously exported JSON file. This will
          merge with your existing data.
        </p>

        <label className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-all cursor-pointer block text-center">
          <Upload className="w-4 h-4 inline mr-2" />
          {isImporting ? "Importing..." : "Import Data File"}
          <input
            type="file"
            accept=".json"
            onChange={handleImportData}
            className="hidden"
            disabled={isImporting}
          />
        </label>

        <div className="mt-3 text-xs text-gray-500">
          Accepts: JSON files exported from CalorieMeter
        </div>
      </div>

      {/* Clear Data Options */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Clear Data</h3>
        <p className="text-gray-600 mb-4">
          Remove data from your device. Use with caution - these actions cannot
          be undone.
        </p>

        <div className="space-y-3">
          {/* Clear Today's Data */}
          <div className="space-y-2">
            {clearingState.type === 'day' && clearingState.step === 'confirm' && (
              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <span className="text-sm text-orange-700">Clear today&apos;s entries?</span>
                <div className="flex gap-2">
                  <button
                    onClick={cancelClearData}
                    className="text-xs text-orange-600 hover:text-orange-700 underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <Button
              onClick={() => handleClearData("day")}
              variant="outline"
              disabled={clearingState.step === 'processing'}
              className={`w-full ${
                clearingState.type === 'day' && clearingState.step === 'confirm'
                  ? 'bg-orange-600 text-white hover:bg-orange-700 border-orange-600'
                  : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200'
              }`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {clearingState.type === 'day' && clearingState.step === 'processing' ? 'Clearing...' :
               clearingState.type === 'day' && clearingState.step === 'confirm' ? 'Confirm Clear' :
               'Clear Today&apos;s Data'}
            </Button>
          </div>

          {/* Clear Week's Data */}
          <div className="space-y-2">
            {clearingState.type === 'week' && clearingState.step === 'confirm' && (
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-sm text-red-700">Clear this week&apos;s entries?</span>
                <div className="flex gap-2">
                  <button
                    onClick={cancelClearData}
                    className="text-xs text-red-600 hover:text-red-700 underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <Button
              onClick={() => handleClearData("week")}
              variant="outline"
              disabled={clearingState.step === 'processing'}
              className={`w-full ${
                clearingState.type === 'week' && clearingState.step === 'confirm'
                  ? 'bg-red-600 text-white hover:bg-red-700 border-red-600'
                  : 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
              }`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {clearingState.type === 'week' && clearingState.step === 'processing' ? 'Clearing...' :
               clearingState.type === 'week' && clearingState.step === 'confirm' ? 'Confirm Clear' :
               'Clear This Week&apos;s Data'}
            </Button>
          </div>

          {/* Clear All Data */}
          <div className="space-y-2">
            {clearingState.type === 'all' && clearingState.step === 'confirm' && (
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-sm text-red-700 font-medium">⚠️ Clear ALL data permanently?</span>
                <div className="flex gap-2">
                  <button
                    onClick={cancelClearData}
                    className="text-xs text-red-600 hover:text-red-700 underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <Button
              onClick={() => handleClearData("all")}
              variant="outline"
              disabled={clearingState.step === 'processing'}
              className={`w-full ${
                clearingState.type === 'all' && clearingState.step === 'confirm'
                  ? 'bg-red-700 text-white hover:bg-red-800 border-red-700'
                  : 'text-red-700 hover:text-red-800 hover:bg-red-50 border-red-300'
              }`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {clearingState.type === 'all' && clearingState.step === 'processing' ? 'Clearing...' :
               clearingState.type === 'all' && clearingState.step === 'confirm' ? 'Confirm Clear All' :
               'Clear All Data'}
            </Button>
          </div>
        </div>
      </div>

      {/* Data Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Data Summary
        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Today&apos;s Entries:</span>
            <div className="font-medium text-gray-900">
              {storageService.getTodaysEntries().length}
            </div>
          </div>

          <div>
            <span className="text-gray-500">This Week:</span>
            <div className="font-medium text-gray-900">
              {storageService
                .getWeeklyData()
                .reduce((sum, day) => sum + day.entries.length, 0)}
            </div>
          </div>

          <div>
            <span className="text-gray-500">Daily Goal:</span>
            <div className="font-medium text-gray-900">
              {storageService.getDailyGoal()} cal
            </div>
          </div>

          <div>
            <span className="text-gray-500">AI Corrections:</span>
            <div className="font-medium text-gray-900">
              {learningService.getLearningStats().totalCorrections}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
