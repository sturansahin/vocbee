import {
  DEFAULT_REVIEW_PROMPT_STATE,
  type AutomaticReviewMode,
  type ReviewPromptContext,
  type ReviewPromptDecision,
  type ReviewPromptState,
} from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const REVIEW_PROMPT_RULES = {
  enabled: true,
  minimumAppLaunches: 3,
  minimumTotalLearnedWords: 15,
  minimumSessionLearnedWords: 3,
  promptCooldownDays: 30,
  dismissedCooldownDays: 14,
  negativeFeedbackCooldownDays: 90,
  maximumPromptCount: 8,
  maximumNativeRequestsPerYear: 3,
} as const;

export function normalizeReviewPromptState(value: Partial<ReviewPromptState> | null): ReviewPromptState {
  return {
    ...DEFAULT_REVIEW_PROMPT_STATE,
    ...(value ?? {}),
    appLaunchCount: Number.isFinite(value?.appLaunchCount) ? Number(value?.appLaunchCount) : 0,
    promptCount: Number.isFinite(value?.promptCount) ? Number(value?.promptCount) : 0,
    nativeRequestCount: Number.isFinite(value?.nativeRequestCount) ? Number(value?.nativeRequestCount) : 0,
    lastRating: Number.isFinite(value?.lastRating) ? Number(value?.lastRating) : null,
    promptedVersions: Array.isArray(value?.promptedVersions) ? value.promptedVersions : [],
    annualNativeRequestTimestamps: Array.isArray(value?.annualNativeRequestTimestamps) ? value.annualNativeRequestTimestamps : [],
  };
}

export const getNativeRequestsInLastYear = (state: ReviewPromptState, now: number): string[] => {
  const cutoff = now - 365 * MS_PER_DAY;
  return state.annualNativeRequestTimestamps.filter(value => {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) && timestamp >= cutoff;
  });
};

export function decideAutomaticReviewPrompt(
  state: ReviewPromptState,
  context: ReviewPromptContext,
  environment: { platform: string; appVersion: string },
  now: number = Date.now()
): ReviewPromptDecision {
  const mode: AutomaticReviewMode = environment.platform === 'ios' ? 'native' : 'satisfaction';
  if (!REVIEW_PROMPT_RULES.enabled) return { shouldPrompt: false, mode, reason: 'disabled' };
  if (environment.platform !== 'ios' && environment.platform !== 'android') return { shouldPrompt: false, mode, reason: 'unsupported-platform' };
  if (context.isTutorialVisible) return { shouldPrompt: false, mode, reason: 'tutorial-visible' };
  if (context.isBusy) return { shouldPrompt: false, mode, reason: 'busy' };
  if (state.appLaunchCount < REVIEW_PROMPT_RULES.minimumAppLaunches) return { shouldPrompt: false, mode, reason: 'not-enough-launches' };
  if (context.totalLearnedCount < REVIEW_PROMPT_RULES.minimumTotalLearnedWords) return { shouldPrompt: false, mode, reason: 'not-enough-progress' };
  if (context.sessionLearnedCount < REVIEW_PROMPT_RULES.minimumSessionLearnedWords) return { shouldPrompt: false, mode, reason: 'not-enough-session-progress' };
  if (state.promptCount >= REVIEW_PROMPT_RULES.maximumPromptCount) return { shouldPrompt: false, mode, reason: 'max-prompts-reached' };
  if (state.promptedVersions.includes(environment.appVersion)) return { shouldPrompt: false, mode, reason: 'already-prompted-version' };
  const dismissed = state.dismissedUntil ? Date.parse(state.dismissedUntil) : Number.NaN;
  if (Number.isFinite(dismissed) && dismissed > now) return { shouldPrompt: false, mode, reason: 'snoozed' };
  const lastPrompted = state.lastPromptedAt ? Date.parse(state.lastPromptedAt) : Number.NaN;
  if (Number.isFinite(lastPrompted) && (now - lastPrompted) / MS_PER_DAY < REVIEW_PROMPT_RULES.promptCooldownDays) return { shouldPrompt: false, mode, reason: 'cooldown' };
  if (mode === 'native' && getNativeRequestsInLastYear(state, now).length >= REVIEW_PROMPT_RULES.maximumNativeRequestsPerYear) return { shouldPrompt: false, mode, reason: 'native-yearly-limit' };
  return { shouldPrompt: true, mode };
}

export const addDaysIso = (now: number, days: number): string => new Date(now + days * MS_PER_DAY).toISOString();
