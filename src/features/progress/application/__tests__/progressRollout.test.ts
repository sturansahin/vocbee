import { resolveProgressSyncMode } from '../progressRollout';

describe('progress rollout mode', () => {
  it('only enables dual mode for the exact reviewed value', () => {
    expect(resolveProgressSyncMode('dual')).toBe('dual');
    expect(resolveProgressSyncMode('DUAL')).toBe('legacy');
    expect(resolveProgressSyncMode(true)).toBe('legacy');
    expect(resolveProgressSyncMode(undefined)).toBe('legacy');
  });
});
