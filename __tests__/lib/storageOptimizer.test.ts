import { storageOptimizer } from '@/lib/storageOptimizer';

const entry = {
  timestamp: '2026-11-03T12:00:00.000Z',
  foods: [{ name: 'Cooked white rice', calories: 325, quantity: '1 plate', confidence: 1 }],
  totalCalories: 325,
  imageData: 'data:image/jpeg;base64,/9j/FAKEPHOTO',
  date: '2026-11-03',
};

describe('photos are never saved', () => {
  it('strips imageData from entries before storage', async () => {
    const optimized = await storageOptimizer.optimizeFoodEntry(entry);
    expect(optimized.imageData).toBeUndefined();
    expect(optimized.totalCalories).toBe(325);
  });

  it('cannot be re-enabled through updateConfig', async () => {
    storageOptimizer.updateConfig({ enableImageStorage: true });
    expect(storageOptimizer.getConfig().enableImageStorage).toBe(false);
    const optimized = await storageOptimizer.optimizeFoodEntry(entry);
    expect(optimized.imageData).toBeUndefined();
  });
});
