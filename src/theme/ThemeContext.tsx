// src/theme/ThemeContext.tsx
//
// Makes the active color scheme live and switchable. Wraps the whole app
// in App.tsx. Any screen migrated to useTheme() re-renders automatically
// the instant settingsService.uiTheme changes — no prop drilling needed.
//
// Screens NOT yet migrated keep using the static `Colors` export from
// ../theme (always dark) and are unaffected by this provider.

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { DarkColors, LightColors, Typography, Spacing, Radius, Motion, ColorScheme } from '../theme';
import { settingsService } from '../data/settingsService';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

interface ThemeContextValue {
  mode: 'dark' | 'light';
  Colors: ColorScheme;
  Typography: typeof Typography;
  Spacing: typeof Spacing;
  Radius: typeof Radius;
  Motion: typeof Motion;
  setMode: (mode: 'dark' | 'light') => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const unsubscribe = settingsService.subscribe(setSettings);
    return unsubscribe;
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    mode: settings.uiTheme,
    Colors: settings.uiTheme === 'light' ? LightColors : DarkColors,
    Typography,
    Spacing,
    Radius,
    Motion,
    setMode: (mode) => settingsService.update({ uiTheme: mode }),
  }), [settings.uiTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be called from within a ThemeProvider — check that App.tsx wraps AppNavigator in <ThemeProvider>.');
  }
  return ctx;
}
