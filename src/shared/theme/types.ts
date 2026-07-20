import type { TextStyle, ViewStyle } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export interface SemanticColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  borderDefault: string;
  borderStrong: string;
  accent: string;
  accentPressed: string;
  onAccent: string;
  success: string;
  warning: string;
  danger: string;
  onDanger: string;
  overlay: string;
  focusRing: string;
  accentSoft: string;
  dangerSoft: string;
  successSoft: string;
  transparent: string;
  streak: string;
  shadow: string;
  onOverlay: string;
  swipeSkip: string;
  swipeSkipSoft: string;
  swipeLearn: string;
  swipeLearnSoft: string;
  celebrationBackdrop: string;
  celebrationText: string;
  celebrationLabel: string;
  celebrationMessage: string;
  emberPrimary: string;
  emberSecondary: string;
}

export type ThemeColors = SemanticColors;

export type SpacingTokens = Readonly<{
  none: 0;
  xxs: 2;
  xs: 4;
  sm: 8;
  md: 12;
  lg: 16;
  xl: 20;
  '2xl': 24;
  '3xl': 32;
  '4xl': 40;
  '5xl': 48;
  '6xl': 64;
}>;

export type RadiusTokens = Readonly<{
  none: 0;
  xs: 4;
  sm: 8;
  md: 12;
  lg: 16;
  xl: 24;
  pill: 999;
}>;

export type TypographyRole =
  | 'display'
  | 'screenTitle'
  | 'sectionTitle'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'button'
  | 'input'
  | 'metric';

export type TypographyTokens = Readonly<Record<TypographyRole, Readonly<TextStyle>>>;

export type ShadowTokens = Readonly<{
  none: Readonly<ViewStyle>;
  card: Readonly<ViewStyle>;
  modal: Readonly<ViewStyle>;
  floating: Readonly<ViewStyle>;
}>;

export interface MotionTokens {
  duration: Readonly<{
    instant: 0;
    fast: 150;
    normal: 250;
    slow: 400;
  }>;
  easing: Readonly<{
    standard: readonly [number, number, number, number];
    emphasized: readonly [number, number, number, number];
  }>;
}

export interface BreakpointTokens {
  compactMax: number;
  wideMin: number;
  smallHeightMax: number;
  contentMaxWidth: Readonly<{
    compact: number;
    regular: number;
    wide: number;
  }>;
}

export interface AppTheme {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  spacing: SpacingTokens;
  radii: RadiusTokens;
  typography: TypographyTokens;
  shadows: ShadowTokens;
  motion: MotionTokens;
  breakpoints: BreakpointTokens;
}
