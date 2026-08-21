import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";

export type Theme = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

export type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

export type ThemeProviderState = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  isSystem: boolean;
  hasManualOverride: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  resetToSystem: () => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  resolvedTheme: "dark",
  systemTheme: "dark",
  isSystem: true,
  hasManualOverride: false,
  setTheme: () => null,
  toggleTheme: () => null,
  resetToSystem: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

// Helper function to safely query system OS preference
function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "dark";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vivexa-ui-theme",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  // Read stored manual override or fallback to default
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null;
      if (stored && (stored === "dark" || stored === "light" || stored === "system")) {
        return stored;
      }
    } catch (e) {
      console.warn("ThemeProvider: Failed to read theme from localStorage:", e);
    }
    return defaultTheme;
  });

  // Track live system OS preference
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  // Determine currently active resolved theme
  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === "system") {
      return systemTheme;
    }
    return theme;
  }, [theme, systemTheme]);

  // Apply classes and attributes to DOM root element
  const applyTheme = useCallback((resolved: ResolvedTheme, withTransition = true) => {
    if (typeof window === "undefined") return;

    const root = window.document.documentElement;

    if (withTransition && !disableTransitionOnChange) {
      root.classList.add("theme-transitioning");
    }

    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    root.setAttribute("data-theme", resolved);
    root.style.colorScheme = resolved;

    if (withTransition && !disableTransitionOnChange) {
      const timer = window.setTimeout(() => {
        root.classList.remove("theme-transitioning");
      }, 450);
      return () => window.clearTimeout(timer);
    }
  }, [disableTransitionOnChange]);

  // 1. Subscribe to OS 'prefers-color-scheme' media query changes in real time
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Initial check to guarantee systemTheme accuracy
    const initialMatch: ResolvedTheme = mediaQuery.matches ? "dark" : "light";
    setSystemTheme(initialMatch);

    // Event listener callback when OS theme toggles
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const newSystemTheme: ResolvedTheme = e.matches ? "dark" : "light";
      setSystemTheme(newSystemTheme);

      // If user theme is set to system mode (auto-sync), update DOM immediately
      if (theme === "system") {
        applyTheme(newSystemTheme, true);
      }
    };

    // Modern event listener with legacy addListener fallback
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleMediaChange);
    } else if (typeof (mediaQuery as any).addListener === "function") {
      (mediaQuery as any).addListener(handleMediaChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } else if (typeof (mediaQuery as any).removeListener === "function") {
        (mediaQuery as any).removeListener(handleMediaChange);
      }
    };
  }, [theme, applyTheme]);

  // 2. React to theme or resolvedTheme changes
  useEffect(() => {
    const cleanup = applyTheme(resolvedTheme, true);
    return () => {
      if (cleanup) cleanup();
    };
  }, [resolvedTheme, applyTheme]);

  // 3. Synchronize cross-tab theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        const newTheme = (e.newValue as Theme) || defaultTheme;
        if (newTheme === "dark" || newTheme === "light" || newTheme === "system") {
          setThemeState(newTheme);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey, defaultTheme]);

  // Manual theme setter (saves to localStorage)
  const setTheme = useCallback((newTheme: Theme) => {
    try {
      if (newTheme === "system") {
        localStorage.setItem(storageKey, "system");
      } else {
        localStorage.setItem(storageKey, newTheme);
      }
    } catch (e) {
      console.warn("ThemeProvider: Failed to save theme preference:", e);
    }
    setThemeState(newTheme);
  }, [storageKey]);

  // Toggle theme utility (toggles between light and dark)
  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  // Reset back to automatic OS synchronization
  const resetToSystem = useCallback(() => {
    setTheme("system");
  }, [setTheme]);

  const value = useMemo<ThemeProviderState>(() => ({
    theme,
    resolvedTheme,
    systemTheme,
    isSystem: theme === "system",
    hasManualOverride: theme !== "system",
    setTheme,
    toggleTheme,
    resetToSystem,
  }), [theme, resolvedTheme, systemTheme, setTheme, toggleTheme, resetToSystem]);

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
