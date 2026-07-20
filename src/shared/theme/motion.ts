import type { MotionTokens } from './types';

export const motion: MotionTokens = Object.freeze({
  duration: Object.freeze({
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 400,
  }),
  easing: Object.freeze({
    standard: [0.2, 0, 0, 1] as const,
    emphasized: [0.2, 0, 0, 1.2] as const,
  }),
});
