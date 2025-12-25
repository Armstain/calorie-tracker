import { FoodEntry } from '@/types';
import { storageService } from '@/lib/storage';

export interface StorageOptimizationConfig {
  maxImageSize: number;
  compressionQuality: number;
  maxStorageUsage: number;
  enableImageStorage: boolean;
  autoCleanupDays: number;
}

export class StorageOptimizer {
  private static instance: StorageOptimizer;
  private config: StorageOptimizationConfig = {
    maxImageSize: 100,
    compressionQuality: 0.7,
    maxStorageUsage: 80,
    enableImageStorage: false,
    autoCleanupDays: 30,
  };

  static getInstance(): StorageOptimizer {
    if (!StorageOptimizer.instance) {
      StorageOptimizer.instance = new StorageOptimizer();
    }
    return StorageOptimizer.instance;
  }

  // Compress image data before storage
  async compressImage(imageData: string): Promise<string | null> {
    if (!this.config.enableImageStorage) {
      return null;
    }

    try {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve(null);
            return;
          }

          // Calculate new dimensions (max 800px width/height)
          const maxDimension = 800;
          let { width, height } = img;
          
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          const compressedData = canvas.toDataURL('image/jpeg', this.config.compressionQuality);
          
          // Check if compressed size is acceptable
          const sizeKB = (compressedData.length * 3) / 4 / 1024; // Rough base64 size calculation
          
          if (sizeKB > this.config.maxImageSize) {
            // Try with lower quality
            const lowerQualityData = canvas.toDataURL('image/jpeg', 0.5);
            const lowerSizeKB = (lowerQualityData.length * 3) / 4 / 1024;
            
            if (lowerSizeKB <= this.config.maxImageSize) {
              resolve(lowerQualityData);
            } else {
              resolve(null);
            }
          } else {
            resolve(compressedData);
          }
        };
        
        img.onerror = () => resolve(null);
        img.src = imageData;
      });
    } catch (error) {
      console.error('Image compression failed:', error);
      return null;
    }
  }

  async optimizeFoodEntry(entry: Omit<FoodEntry, 'id'>): Promise<Omit<FoodEntry, 'id'>> {
    const optimizedEntry = { ...entry };

    if (!this.config.enableImageStorage) {
      optimizedEntry.imageData = undefined;
    } else if (entry.imageData) {
      const compressedImage = await this.compressImage(entry.imageData);
      optimizedEntry.imageData = compressedImage || undefined;
    }

    optimizedEntry.foods = entry.foods.map(food => ({
      ...food,
      ingredients: food.confidence > 0.7 ? food.ingredients : undefined,
    }));

    return optimizedEntry;
  }

  shouldCleanup(): boolean {
    const storageInfo = storageService.getStorageInfo();
    return storageInfo.percentage > this.config.maxStorageUsage;
  }

  performCleanup(): { deletedEntries: number; spaceSaved: number } {
    const allEntries = storageService['getAllEntries']();
    const storageInfoBefore = storageService.getStorageInfo();
    
    let deletedEntries = 0;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.autoCleanupDays);
    const cutoffString = cutoffDate.toISOString().split('T')[0];

    const entriesToKeep = allEntries.filter(entry => {
      if (entry.date < cutoffString) {
        storageService.deleteEntry(entry.id);
        deletedEntries++;
        return false;
      }
      return true;
    });

    if (this.shouldCleanup() && entriesToKeep.length > 0) {
      const entriesWithImages = entriesToKeep.filter(entry => entry.imageData);

      for (const entry of entriesWithImages) {
        storageService.deleteEntry(entry.id);
      }
    }

    if (this.shouldCleanup()) {
      const lowConfidenceEntries = entriesToKeep
        .filter(entry => {
          const avgConfidence = entry.foods.reduce((sum, food) => sum + food.confidence, 0) / entry.foods.length;
          return avgConfidence < 0.6;
        })
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const lowConfidenceToRemove = Math.min(
        lowConfidenceEntries.length,
        Math.ceil(lowConfidenceEntries.length * 0.3)
      );

      for (let i = 0; i < lowConfidenceToRemove; i++) {
        storageService.deleteEntry(lowConfidenceEntries[i].id);
        deletedEntries++;
      }
    }

    const storageInfoAfter = storageService.getStorageInfo();
    const spaceSaved = storageInfoBefore.used - storageInfoAfter.used;

    return { deletedEntries, spaceSaved };
  }

  getOptimizationRecommendations(): {
    canOptimize: boolean;
    recommendations: string[];
    potentialSavings: number;
  } {
    const allEntries = storageService['getAllEntries']();
    const recommendations: string[] = [];
    let potentialSavings = 0;

    const entriesWithImages = allEntries.filter(entry => entry.imageData);
    if (entriesWithImages.length > 0) {
      const totalImageSize = entriesWithImages.reduce((sum, entry) => {
        return sum + (entry.imageData?.length || 0);
      }, 0);

      recommendations.push(`Remove ${entriesWithImages.length} stored images (analysis complete)`);
      potentialSavings += totalImageSize;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.autoCleanupDays);
    const cutoffString = cutoffDate.toISOString().split('T')[0];
    const oldEntries = allEntries.filter(entry => entry.date < cutoffString);
    
    if (oldEntries.length > 0) {
      recommendations.push(`Remove ${oldEntries.length} entries older than ${this.config.autoCleanupDays} days`);
      potentialSavings += oldEntries.length * 2000;
    }

    const lowConfidenceEntries = allEntries.filter(entry => {
      const avgConfidence = entry.foods.reduce((sum, food) => sum + food.confidence, 0) / entry.foods.length;
      return avgConfidence < 0.5;
    });

    if (lowConfidenceEntries.length > 5) {
      recommendations.push(`Consider removing ${lowConfidenceEntries.length} low-confidence entries`);
      potentialSavings += lowConfidenceEntries.length * 1500;
    }

    return {
      canOptimize: recommendations.length > 0,
      recommendations,
      potentialSavings: Math.round(potentialSavings / 1024),
    };
  }

  updateConfig(newConfig: Partial<StorageOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): StorageOptimizationConfig {
    return { ...this.config };
  }

  estimateEntrySize(entry: Omit<FoodEntry, 'id'>): number {
    const jsonSize = JSON.stringify(entry).length;
    return jsonSize;
  }

  canStoreEntry(entry: Omit<FoodEntry, 'id'>): { canStore: boolean; reason?: string } {
    const entrySize = this.estimateEntrySize(entry);
    const currentStorageInfo = storageService.getStorageInfo();
    
    if (currentStorageInfo.available < entrySize) {
      return {
        canStore: false,
        reason: 'Not enough storage space available'
      };
    }

    const newUsagePercentage = ((currentStorageInfo.used + entrySize) / (currentStorageInfo.used + currentStorageInfo.available)) * 100;
    
    if (newUsagePercentage > 95) {
      return {
        canStore: false,
        reason: 'Storage nearly full (>95%)'
      };
    }

    return { canStore: true };
  }
}

export const storageOptimizer = StorageOptimizer.getInstance();