"use client";

import { useState } from "react";
import {
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { storageService } from "@/lib/storage";
import { learningService } from "@/lib/learningService";

interface DataManagementProps {
  onDataChange?: () => void;
}

export default function DataManagement({ onDataChange }: DataManagementProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showClearConfirm, setClearConfirm] = useState<
    "day" | "week" | "all" | null
  >(null);
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

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
    setClearConfirm(type);
  };

  const confirmClearData = () => {
    try {
      switch (showClearConfirm) {
        case "day":
          // Clear today's entries
          const todaysEntries = storageService.getTodaysEntries();
          todaysEntries.forEach((entry) =>
            storageService.deleteEntry(entry.id)
          );
          setImportStatus({
            type: "success",
            message: `Cleared ${todaysEntries.length} entries from today.`,
          });
          break;

        case "week":
          // Clear this week's entries
          const weeklyData = storageService.getWeeklyData();
          let weeklyCount = 0;
          weeklyData.forEach((day) => {
            day.entries.forEach((entry) => {
              storageService.deleteEntry(entry.id);
              weeklyCount++;
            });
          });
          setImportStatus({
            type: "success",
            message: `Cleared ${weeklyCount} entries from this week.`,
          });
          break;

        case "all":
          // Clear all data
          storageService.clearAllData();
          setImportStatus({
            type: "success",
            message: "All data cleared successfully.",
          });
          break;
      }

      // Trigger data refresh
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error("Clear data error:", error);
      setImportStatus({
        type: "error",
        message: "Failed to clear data. Please try again.",
      });
    } finally {
      setClearConfirm(null);
      setTimeout(() => setImportStatus({ type: null, message: "" }), 5000);
    }
  };

  const cancelClearData = () => {
    setClearConfirm(null);
  };

  // Get storage info
  const storageInfo = storageService.getStorageInfo();
  const storagePercentage = Math.round(storageInfo.percentage);

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
        </div>
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
          <Button
            onClick={() => handleClearData("day")}
            variant="outline"
            className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Today&apos;s Data
          </Button>

          <Button
            onClick={() => handleClearData("week")}
            variant="outline"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear This Week&apos;s Data
          </Button>

          <Button
            onClick={() => handleClearData("all")}
            variant="outline"
            className="w-full text-red-700 hover:text-red-800 hover:bg-red-50 border-red-300"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Data
          </Button>
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

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Data Deletion
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to clear{" "}
              {showClearConfirm === "day"
                ? "today&apos;s data"
                : showClearConfirm === "week"
                ? "this week&apos;s data"
                : "all your data"}
              ? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <Button
                onClick={confirmClearData}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Data
              </Button>
              <Button
                onClick={cancelClearData}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
