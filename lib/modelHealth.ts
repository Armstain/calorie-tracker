// Remembers models that returned 404 (retired, or not available to a given key)
// so we skip them for a while instead of paying for a failed request every time.

const DEFAULT_SKIP_MS = 60 * 60 * 1000; // 1 hour

const unavailableUntil = new Map<string, number>();

// Short non-reversible fingerprint of an API key, safe to use in cache keys.
// (A key prefix is shared by many keys, e.g. "AIzaSy...", so it can't be used.)
export function hashKey(key: string): string {
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash + key.charCodeAt(i)) | 0;
  }
  return `${key.length}_${(hash >>> 0).toString(36)}`;
}

function entryKey(apiKey: string, model: string) {
  return `${hashKey(apiKey)}:${model}`;
}

export function markModelUnavailable(apiKey: string, model: string, ms: number = DEFAULT_SKIP_MS): void {
  unavailableUntil.set(entryKey(apiKey, model), Date.now() + ms);
}

export function isModelAvailable(apiKey: string, model: string): boolean {
  const key = entryKey(apiKey, model);
  const until = unavailableUntil.get(key);
  if (until === undefined) return true;
  if (until <= Date.now()) {
    unavailableUntil.delete(key);
    return true;
  }
  return false;
}

// Filter a fallback order down to models not recently marked unavailable.
// If every model is marked, return the full order rather than failing outright.
export function getAvailableModels<T extends string>(apiKey: string, order: readonly T[]): T[] {
  const available = order.filter(model => isModelAvailable(apiKey, model));
  return available.length > 0 ? available : [...order];
}

export function resetModelHealth(): void {
  unavailableUntil.clear();
}
