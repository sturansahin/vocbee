import type { Orientation } from '@shared/responsive';

const LANDSCAPE_MIN_CARD_HEIGHT = 220;
const LANDSCAPE_MAX_CARD_HEIGHT = 360;
const PORTRAIT_READABLE_CONTENT_HEIGHT = 340;
const PORTRAIT_HEIGHT_HEADROOM = 1.1;
const PORTRAIT_MAX_CARD_HEIGHT = 480;

export const PORTRAIT_MIN_CARD_HEIGHT = Math.round(
  PORTRAIT_READABLE_CONTENT_HEIGHT * PORTRAIT_HEIGHT_HEADROOM,
);

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getHomeWordCardHeight(viewportHeight: number, orientation: Orientation): number {
  if (orientation === 'landscape') {
    return clamp(viewportHeight * 0.54, LANDSCAPE_MIN_CARD_HEIGHT, LANDSCAPE_MAX_CARD_HEIGHT);
  }

  return clamp(viewportHeight * 0.48, PORTRAIT_MIN_CARD_HEIGHT, PORTRAIT_MAX_CARD_HEIGHT);
}
