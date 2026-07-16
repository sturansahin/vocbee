export const DARK_COLORS = {
  primary: '#FFD700',
  primaryDark: '#FFA500',
  background: '#000000',
  surface: '#1c1c1e',
  surfaceLight: '#2c2c2e',
  text: '#ffffff',
  textSecondary: '#b8b8b8',
  border: '#3a3a3c',
  error: '#ff6b6b',
};

export const LIGHT_COLORS = {
  primary: '#FFD700',
  primaryDark: '#FF8C00',
  background: '#ffffff',
  surface: '#ffffff',
  surfaceLight: '#f5f5f5',
  text: '#1a2c22',
  textSecondary: '#5a7d68',
  border: '#e0e0e0',
  error: '#e53935',
};

// Kept for compatibility with legacy style declarations that intentionally use dark tokens.
export const COLORS = DARK_COLORS;

export const GRADIENT_COLORS = {
  dark: ['#FFD700', '#1a1a1a', '#000000'] as const,
  light: ['#FFA500', '#f5f9f7', '#ffffff'] as const,
  locations: [0, 0.2, 1] as const,
  start: { x: 0.7, y: 0 },
  end: { x: 0.7, y: 2 },
};
