import { decideAutomaticReviewPrompt, normalizeReviewPromptState } from '../rules';

const NOW = Date.parse('2026-07-14T12:00:00.000Z');
const eligibleState = normalizeReviewPromptState({ appLaunchCount: 3 });
const context = { totalLearnedCount: 15, sessionLearnedCount: 3 };

describe('review prompt eligibility', () => {
  it('allows an eligible iOS session in native mode', () => {
    expect(decideAutomaticReviewPrompt(eligibleState, context, { platform: 'ios', appVersion: '1.0' }, NOW)).toEqual({ shouldPrompt: true, mode: 'native' });
  });

  it.each([
    [{ ...eligibleState, appLaunchCount: 2 }, context, 'not-enough-launches'],
    [eligibleState, { ...context, totalLearnedCount: 14 }, 'not-enough-progress'],
    [eligibleState, { ...context, sessionLearnedCount: 2 }, 'not-enough-session-progress'],
    [{ ...eligibleState, promptedVersions: ['1.0'] }, context, 'already-prompted-version'],
  ])('rejects ineligible state/context with the stable reason', (state, input, reason) => {
    expect(decideAutomaticReviewPrompt(state, input, { platform: 'ios', appVersion: '1.0' }, NOW)).toMatchObject({ shouldPrompt: false, reason });
  });

  it('rejects a future dismissal and unsupported platforms', () => {
    const snoozed = { ...eligibleState, dismissedUntil: '2026-07-15T12:00:00.000Z' };
    expect(decideAutomaticReviewPrompt(snoozed, context, { platform: 'android', appVersion: '1.0' }, NOW).reason).toBe('snoozed');
    expect(decideAutomaticReviewPrompt(eligibleState, context, { platform: 'web', appVersion: '1.0' }, NOW).reason).toBe('unsupported-platform');
  });
});
