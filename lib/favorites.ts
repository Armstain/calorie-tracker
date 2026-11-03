/**
 * Favorites & repeats — the token-saving layer.
 *
 * Every favorite / repeat is logged straight from stored data, with zero
 * Gemini calls. A parsed meal only costs tokens the first time; saving it
 * as a favorite (or repeating yesterday's meal) means the next identical
 * meal is free. All data lives in localStorage, next to the diary entries.
 */

import { FoodItem, FoodEntry } from '@/types';
import { STORAGE_KEYS } from '@/lib/config';
import { generateId } from '@/lib/utils';

export interface FavoriteMeal {
  id: string;
  name: string;
  foods: FoodItem[];
  totalCalories: number;
  createdAt: string;
  lastUsedAt: string;
  useCount: number;
}

export interface RecentMeal {
  key: string;
  name: string;
  foods: FoodItem[];
  totalCalories: number;
  lastTimestamp: string;
}

export function mealName(foods: FoodItem[]): string {
  if (foods.length === 0) return 'Meal';
  if (foods.length === 1) return foods[0].name;
  return `${foods[0].name} + ${foods.length - 1} more`;
}

export function mealKey(foods: FoodItem[]): string {
  return foods
    .map((f) => `${f.name}|${f.calories}|${f.quantity}`)
    .sort()
    .join(';;');
}

export type FavoriteStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

// Injectable storage so tests can pass a fake without fighting jsdom's
// localStorage mock. Production callers omit it and get window.localStorage.
function defaultStorage(): FavoriteStorage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readFavorites(storage?: FavoriteStorage): FavoriteMeal[] {
  try {
    const store = storage ?? defaultStorage();
    if (!store) return [];
    const raw = store.getItem(STORAGE_KEYS.FAVORITES);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoriteMeal[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFavorites(favorites: FavoriteMeal[], storage?: FavoriteStorage): void {
  const store = storage ?? defaultStorage();
  if (!store) return;
  store.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
}

export function getFavorites(storage?: FavoriteStorage): FavoriteMeal[] {
  return readFavorites(storage).sort(
    (a, b) => b.useCount - a.useCount || b.lastUsedAt.localeCompare(a.lastUsedAt)
  );
}

/** Save a meal as a favorite. Re-saving the same meal just refreshes it. */
export function saveFavorite(foods: FoodItem[], name?: string, storage?: FavoriteStorage): FavoriteMeal | null {
  if (foods.length === 0) return null;
  const totalCalories = foods.reduce((sum, f) => sum + f.calories, 0);
  const now = new Date().toISOString();
  const favorites = readFavorites(storage);
  const key = mealKey(foods);
  const existing = favorites.find((f) => mealKey(f.foods) === key);
  if (existing) {
    existing.lastUsedAt = now;
    writeFavorites(favorites, storage);
    return existing;
  }
  const favorite: FavoriteMeal = {
    id: generateId(),
    name: name || mealName(foods),
    foods,
    totalCalories,
    createdAt: now,
    lastUsedAt: now,
    useCount: 0,
  };
  favorites.push(favorite);
  writeFavorites(favorites, storage);
  return favorite;
}

export function removeFavorite(id: string, storage?: FavoriteStorage): void {
  writeFavorites(readFavorites(storage).filter((f) => f.id !== id), storage);
}

export function markFavoriteUsed(id: string, storage?: FavoriteStorage): void {
  const favorites = readFavorites(storage);
  const favorite = favorites.find((f) => f.id === id);
  if (!favorite) return;
  favorite.useCount += 1;
  favorite.lastUsedAt = new Date().toISOString();
  writeFavorites(favorites, storage);
}

/**
 * Distinct meals from past diary entries, most recent first. This is the
 * "repeat" list: re-logging one of these costs no image parse at all.
 */
export function getRecentMeals(entries: FoodEntry[], limit = 8): RecentMeal[] {
  const byKey = new Map<string, RecentMeal>();
  const sorted = [...entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  for (const entry of sorted) {
    if (entry.foods.length === 0) continue;
    const key = mealKey(entry.foods);
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        name: mealName(entry.foods),
        foods: entry.foods,
        totalCalories: entry.totalCalories,
        lastTimestamp: entry.timestamp,
      });
    }
    if (byKey.size >= limit) break;
  }
  return [...byKey.values()];
}
