import { createResponsiveMetrics, moderateScale } from '../metrics';

describe('responsive metrics', () => {
  it.each([
    [320, 568, 'compact', true, 'portrait'],
    [393, 852, 'regular', false, 'portrait'],
    [852, 393, 'wide', true, 'landscape'],
    [1024, 1366, 'wide', false, 'portrait'],
  ] as const)('classifies %sx%s as %s', (width, height, sizeClass, isSmallHeight, orientation) => {
    const result = createResponsiveMetrics(width, height);

    expect(result).toMatchObject({ width, height, sizeClass, isSmallHeight, orientation });
  });

  it('clamps scaling on very small and very wide windows', () => {
    const small = createResponsiveMetrics(200, 600);
    const wide = createResponsiveMetrics(1600, 1000);

    expect(moderateScale(100, small.scaleFactor)).toBe(88);
    expect(moderateScale(100, wide.scaleFactor)).toBe(120);
  });

  it('uses a bounded content width and larger gutter for wide layouts', () => {
    const regular = createResponsiveMetrics(430, 932);
    const wide = createResponsiveMetrics(1024, 768);

    expect(wide.contentMaxWidth).toBeLessThan(wide.width);
    expect(wide.horizontalGutter).toBeGreaterThan(regular.horizontalGutter);
  });
});
