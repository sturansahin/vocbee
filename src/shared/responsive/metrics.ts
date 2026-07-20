import { breakpoints } from '@shared/theme';
import type { ResponsiveMetrics, SizeClass } from './types';

const REFERENCE_WIDTH = 393;
const MIN_SCALE = 0.88;
const MAX_SCALE = 1.2;
const SCALE_INFLUENCE = 0.5;

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function getSizeClass(width: number): SizeClass {
  if (width <= breakpoints.compactMax) {
    return 'compact';
  }
  if (width >= breakpoints.wideMin) {
    return 'wide';
  }
  return 'regular';
}

export function createResponsiveMetrics(width: number, height: number): ResponsiveMetrics {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const sizeClass = getSizeClass(safeWidth);
  const rawScale = 1 + (safeWidth / REFERENCE_WIDTH - 1) * SCALE_INFLUENCE;

  return {
    width: safeWidth,
    height: safeHeight,
    orientation: safeWidth > safeHeight ? 'landscape' : 'portrait',
    sizeClass,
    isSmallHeight: safeHeight <= breakpoints.smallHeightMax,
    contentMaxWidth: breakpoints.contentMaxWidth[sizeClass],
    horizontalGutter: sizeClass === 'compact' ? 16 : sizeClass === 'wide' ? 32 : 24,
    scaleFactor: clamp(rawScale, MIN_SCALE, MAX_SCALE),
  };
}

export function moderateScale(value: number, scaleFactor: number): number {
  return Math.round(value * scaleFactor * 100) / 100;
}
