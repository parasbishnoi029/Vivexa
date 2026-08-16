/**
 * Safe LocalStorage and SessionStorage Wrapper
 * Handles quota limits, disabled cookies/storage, and JSON parsing errors without crashing app state.
 */

export const safeStorage = {
  getItem<T>(key: string, defaultValue: T): T {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return defaultValue;
      }
      const item = window.localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`[SafeStorage] Failed to read or parse key "${key}":`, error);
      return defaultValue;
    }
  },

  setItem<T>(key: string, value: T): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`[SafeStorage] Failed to save key "${key}":`, error);
      return false;
    }
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`[SafeStorage] Failed to remove key "${key}":`, error);
    }
  },

  clear(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (error) {
      console.warn(`[SafeStorage] Failed to clear localStorage:`, error);
    }
  }
};
