import { getHomeWordCardHeight, PORTRAIT_MIN_CARD_HEIGHT } from '../homeWordCardLayout';

describe('home word card layout', () => {
  it('keeps the readable minimum plus ten percent headroom on short portrait screens', () => {
    expect(PORTRAIT_MIN_CARD_HEIGHT).toBe(374);
    expect(getHomeWordCardHeight(568, 'portrait')).toBe(374);
    expect(getHomeWordCardHeight(667, 'portrait')).toBe(374);
  });

  it('preserves proportional sizing on regular portrait screens', () => {
    expect(getHomeWordCardHeight(852, 'portrait')).toBeCloseTo(408.96);
  });

  it('keeps the existing bounded landscape behavior', () => {
    expect(getHomeWordCardHeight(393, 'landscape')).toBe(220);
  });
});
