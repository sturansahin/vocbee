import React, { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { breakpoints } from './breakpoints';
import { DARK_COLORS, LIGHT_COLORS } from './semanticColors';
import { motion } from './motion';
import { radii } from './radii';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';
import type { AppTheme, ThemeMode } from './types';

export interface ThemeContextType {
  isDarkMode: boolean;
  theme: AppTheme;
  colors: AppTheme['colors'];
  spacing: AppTheme['spacing'];
  radii: AppTheme['radii'];
  typography: AppTheme['typography'];
  shadows: AppTheme['shadows'];
  motion: AppTheme['motion'];
  breakpoints: AppTheme['breakpoints'];
}

function createTheme(mode: ThemeMode): AppTheme {
  return Object.freeze({
    mode,
    isDark: mode === 'dark',
    colors: mode === 'dark' ? DARK_COLORS : LIGHT_COLORS,
    spacing,
    radii,
    typography,
    shadows,
    motion,
    breakpoints,
  });
}

export const darkTheme = createTheme('dark');
export const lightTheme = createTheme('light');

function toContext(theme: AppTheme): ThemeContextType {
  return Object.freeze({
    isDarkMode: theme.isDark,
    theme,
    colors: theme.colors,
    spacing: theme.spacing,
    radii: theme.radii,
    typography: theme.typography,
    shadows: theme.shadows,
    motion: theme.motion,
    breakpoints: theme.breakpoints,
  });
}

const darkContext = toContext(darkTheme);
const lightContext = toContext(lightTheme);
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export interface ThemeProviderProps {
  children: ReactNode;
  /** Used by deterministic tests and the development-only component catalog. */
  forcedMode?: ThemeMode;
}

export function ThemeProvider({ children, forcedMode }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const mode: ThemeMode = forcedMode ?? (systemColorScheme === 'dark' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={mode === 'dark' ? darkContext : lightContext}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
