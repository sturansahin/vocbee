export type ReviewPromptOutcome =
  | 'nativeRequested'
  | 'satisfactionShown'
  | 'dismissed'
  | 'positiveRating'
  | 'negativeRating'
  | 'openedStore'
  | 'feedbackOpened';

export type AutomaticReviewMode = 'native' | 'satisfaction';

export interface ReviewPromptState {
  appLaunchCount: number;
  promptCount: number;
  nativeRequestCount: number;
  lastPromptedAt: string | null;
  lastNativeRequestedAt: string | null;
  dismissedUntil: string | null;
  lastRating: number | null;
  lastOutcome: ReviewPromptOutcome | null;
  promptedVersions: string[];
  annualNativeRequestTimestamps: string[];
}

export interface ReviewPromptContext {
  totalLearnedCount: number;
  sessionLearnedCount: number;
  isTutorialVisible?: boolean;
  isBusy?: boolean;
}

export interface ReviewPromptDecision {
  shouldPrompt: boolean;
  mode: AutomaticReviewMode;
  reason?: string;
}

export interface StoreReviewOpenResult {
  opened: boolean;
  attemptedUrls: string[];
}

export const DEFAULT_REVIEW_PROMPT_STATE: ReviewPromptState = {
  appLaunchCount: 0,
  promptCount: 0,
  nativeRequestCount: 0,
  lastPromptedAt: null,
  lastNativeRequestedAt: null,
  dismissedUntil: null,
  lastRating: null,
  lastOutcome: null,
  promptedVersions: [],
  annualNativeRequestTimestamps: [],
};
