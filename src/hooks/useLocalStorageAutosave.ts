import { useState, useEffect, useRef, useCallback } from "react";

export interface AutosaveOptions<T> {
  key: string;
  initialValue: T | (() => T);
  debounceMs?: number;
  onSave?: (savedValue: T) => void;
  validate?: (value: any) => boolean;
}

export function useLocalStorageAutosave<T>({
  key,
  initialValue,
  debounceMs = 500,
  onSave,
  validate
}: AutosaveOptions<T>) {
  // Read initial from localStorage or fallback to initialValue
  const [data, setData] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!validate || validate(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`[Autosave] Failed to parse localStorage for key "${key}":`, e);
    }
    return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(() => {
    try {
      const savedTime = localStorage.getItem(`${key}_saved_at`);
      return savedTime ? new Date(savedTime) : null;
    } catch {
      return null;
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const dataRef = useRef<T>(data);
  dataRef.current = data;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveToStorage = useCallback((valueToSave: T) => {
    try {
      setIsSaving(true);
      const serialized = JSON.stringify(valueToSave);
      localStorage.setItem(key, serialized);
      const now = new Date();
      localStorage.setItem(`${key}_saved_at`, now.toISOString());
      setLastSaved(now);
      if (onSave) onSave(valueToSave);
    } catch (err) {
      console.error(`[Autosave] Storage write failed for "${key}":`, err);
    } finally {
      setIsSaving(false);
    }
  }, [key, onSave]);

  // Debounced write when data changes
  useEffect(() => {
    setIsSaving(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveToStorage(data);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs, saveToStorage]);

  // Flush immediately on unload or page visibility change
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveToStorage(dataRef.current);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveToStorage(dataRef.current);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [saveToStorage]);

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_saved_at`);
      setLastSaved(null);
      const resetValue = typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
      setData(resetValue);
    } catch (err) {
      console.warn(`[Autosave] Failed to clear storage for key "${key}":`, err);
    }
  }, [key, initialValue]);

  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    saveToStorage(dataRef.current);
  }, [saveToStorage]);

  return {
    data,
    setData,
    lastSaved,
    isSaving,
    saveNow,
    clearStorage,
  };
}
