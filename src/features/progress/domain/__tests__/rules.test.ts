// Pure domain rules — must match services/progressService.ts formulas (behavior contract, docs/architecture.md).
import { calcLevelPercent, isLevelComplete, computeOverallPercent } from '../rules';

describe('progress domain rules', () => {
  it('calcLevelPercent', () => {
    expect(calcLevelPercent(0, 0)).toBe(0); // total <= 0 -> 0
    expect(calcLevelPercent(5, 0)).toBe(0);
    expect(calcLevelPercent(3, 12)).toBe(25);
    expect(calcLevelPercent(1, 3)).toBe(33); // Math.round(33.33)
    expect(calcLevelPercent(12, 12)).toBe(100);
  });

  it('isLevelComplete', () => {
    expect(isLevelComplete(12, 12)).toBe(true);
    expect(isLevelComplete(13, 12)).toBe(true);
    expect(isLevelComplete(5, 12)).toBe(false);
    expect(isLevelComplete(0, 0)).toBe(false); // empty level is never "complete"
  });

  it('computeOverallPercent', () => {
    expect(computeOverallPercent(0, 0)).toBe(0);
    expect(computeOverallPercent(50, 200)).toBe(25);
  });
});
