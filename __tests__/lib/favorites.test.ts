import {
  getFavorites,
  saveFavorite,
  removeFavorite,
  markFavoriteUsed,
  getRecentMeals,
  mealKey,
  type FavoriteStorage,
} from '@/lib/favorites';
import type { FoodItem, FoodEntry } from '@/types';

function fakeStorage(): FavoriteStorage & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
    removeItem: (k: string) => {
      delete data[k];
    },
  };
}

const bhaat: FoodItem = { name: 'Cooked white rice', calories: 325, quantity: '1 plate (250g)', confidence: 1 };
const bhorta: FoodItem = { name: 'Alu bhorta', calories: 95, quantity: '1 bati (100g)', confidence: 1 };

function entry(foods: FoodItem[], totalCalories: number, timestamp: string): FoodEntry {
  return { id: timestamp, timestamp, foods, totalCalories, date: timestamp.slice(0, 10) };
}

describe('favorites', () => {
  it('saves, lists, uses and removes a favorite without any AI call', () => {
    const store = fakeStorage();
    expect(getFavorites(store)).toEqual([]);
    const fav = saveFavorite([bhaat], undefined, store);
    expect(fav).not.toBeNull();
    expect(fav?.name).toBe('Cooked white rice');
    expect(getFavorites(store)).toHaveLength(1);
    // Re-saving the same meal refreshes it instead of duplicating it.
    saveFavorite([bhaat], undefined, store);
    expect(getFavorites(store)).toHaveLength(1);
    markFavoriteUsed(fav!.id, store);
    expect(getFavorites(store)[0].useCount).toBe(1);
    removeFavorite(fav!.id, store);
    expect(getFavorites(store)).toEqual([]);
  });

  it('returns null for an empty meal', () => {
    expect(saveFavorite([], undefined, fakeStorage())).toBeNull();
  });
});

describe('recent meals (repeats)', () => {
  it('dedupes identical meals and orders by most recent first', () => {
    const meals = getRecentMeals([
      entry([bhaat], 325, '2026-11-02T12:00:00.000Z'),
      entry([bhorta], 95, '2026-11-02T19:00:00.000Z'),
      entry([bhaat], 325, '2026-11-03T12:00:00.000Z'),
    ]);
    expect(meals).toHaveLength(2);
    expect(meals[0].name).toBe('Cooked white rice');
    expect(mealKey([bhaat])).toBe(mealKey([{ ...bhaat }]));
  });
});
