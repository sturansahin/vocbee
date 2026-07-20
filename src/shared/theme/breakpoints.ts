import type { BreakpointTokens } from './types';

export const breakpoints: BreakpointTokens = Object.freeze({
  compactMax: 374,
  wideMin: 768,
  smallHeightMax: 700,
  contentMaxWidth: Object.freeze({
    compact: 560,
    regular: 680,
    wide: 760,
  }),
});
