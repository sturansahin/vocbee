import type { ShadowTokens } from './types';

export const shadows: ShadowTokens = Object.freeze({
  none: Object.freeze({}),
  card: Object.freeze({
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  }),
  modal: Object.freeze({
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  }),
  floating: Object.freeze({
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  }),
});
