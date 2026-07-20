import { darkTheme, lightTheme } from '../ThemeContext';

describe('theme contract', () => {
  it('keeps light and dark semantic color keys identical', () => {
    expect(Object.keys(lightTheme.colors).sort()).toEqual(Object.keys(darkTheme.colors).sort());
  });

  it('exposes stable, frozen token objects', () => {
    expect(Object.isFrozen(lightTheme)).toBe(true);
    expect(lightTheme.spacing).toBe(darkTheme.spacing);
    expect(lightTheme.typography).toBe(darkTheme.typography);
    expect(lightTheme.motion).toBe(darkTheme.motion);
  });

  it('provides readable foreground roles for accent and danger actions', () => {
    expect(lightTheme.colors.onAccent).not.toBe(lightTheme.colors.accent);
    expect(darkTheme.colors.onDanger).not.toBe(darkTheme.colors.danger);
  });
});
