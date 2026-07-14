import type { ReviewPlatformGateway, ReviewPromptRepository } from './contracts';
import { addDaysIso, decideAutomaticReviewPrompt, getNativeRequestsInLastYear, REVIEW_PROMPT_RULES } from '../domain/rules';
import type {
  ReviewPromptContext,
  ReviewPromptDecision,
  ReviewPromptOutcome,
  ReviewPromptState,
  StoreReviewOpenResult,
} from '../domain/types';

const SUPPORT_EMAIL = 'support@vocbee.com';

export class DefaultReviewPromptService {
  constructor(
    private readonly repository: ReviewPromptRepository,
    private readonly platform: ReviewPlatformGateway,
    private readonly now: () => number = Date.now
  ) {}

  private async update(updater: (state: ReviewPromptState) => ReviewPromptState): Promise<ReviewPromptState> {
    const next = updater(await this.repository.read());
    await this.repository.write(next);
    return next;
  }

  recordReviewAppLaunch(): Promise<ReviewPromptState> {
    return this.update(state => ({ ...state, appLaunchCount: state.appLaunchCount + 1 }));
  }

  async getAutomaticReviewPromptDecision(context: ReviewPromptContext): Promise<ReviewPromptDecision> {
    return decideAutomaticReviewPrompt(await this.repository.read(), context, this.platform, this.now());
  }

  markAutomaticReviewPromptPresented(outcome: Extract<ReviewPromptOutcome, 'nativeRequested' | 'satisfactionShown'>): Promise<ReviewPromptState> {
    const now = this.now();
    const timestamp = new Date(now).toISOString();
    return this.update(state => {
      const native = outcome === 'nativeRequested';
      const recent = getNativeRequestsInLastYear(state, now);
      return {
        ...state,
        promptCount: state.promptCount + 1,
        nativeRequestCount: native ? state.nativeRequestCount + 1 : state.nativeRequestCount,
        lastPromptedAt: timestamp,
        lastNativeRequestedAt: native ? timestamp : state.lastNativeRequestedAt,
        dismissedUntil: null,
        lastOutcome: outcome,
        promptedVersions: state.promptedVersions.includes(this.platform.appVersion) ? state.promptedVersions : [...state.promptedVersions, this.platform.appVersion],
        annualNativeRequestTimestamps: native ? [...recent, timestamp] : recent,
      };
    });
  }

  dismissReviewPrompt(): Promise<ReviewPromptState> {
    return this.update(state => ({ ...state, dismissedUntil: addDaysIso(this.now(), REVIEW_PROMPT_RULES.dismissedCooldownDays), lastOutcome: 'dismissed' }));
  }

  recordSatisfactionRating(rating: number): Promise<ReviewPromptState> {
    const positive = rating >= 4;
    return this.update(state => ({
      ...state,
      lastRating: rating,
      lastOutcome: positive ? 'positiveRating' : 'negativeRating',
      dismissedUntil: positive ? state.dismissedUntil : addDaysIso(this.now(), REVIEW_PROMPT_RULES.negativeFeedbackCooldownDays),
    }));
  }

  async requestNativeReview(): Promise<boolean> {
    let recorded = false;
    const record = async () => {
      if (recorded) return;
      recorded = true;
      try { await this.markAutomaticReviewPromptPresented('nativeRequested'); }
      catch (error) { console.warn('[ReviewPrompt] Failed to record native review attempt', error); }
    };
    try {
      if (await this.platform.isNativeReviewAvailable()) {
        await this.platform.requestNativeReview();
        await record();
        return true;
      }
      await record();
      return (await this.openStoreReviewPage('native-fallback')).opened;
    } catch (error) {
      console.warn('[ReviewPrompt] Native review request failed', error);
      await record();
      return (await this.openStoreReviewPage('native-error-fallback')).opened;
    }
  }

  async openStoreReviewPage(source: string): Promise<StoreReviewOpenResult> {
    const attemptedUrls: string[] = [];
    for (const url of this.platform.getStoreReviewUrls()) {
      attemptedUrls.push(url);
      try {
        if (!(await this.platform.canOpenUrl(url))) continue;
        await this.platform.openUrl(url);
        await this.update(state => ({ ...state, lastOutcome: 'openedStore' }));
        console.log(`[ReviewPrompt] Opened store review page (${source})`);
        return { opened: true, attemptedUrls };
      } catch (error) { console.warn(`[ReviewPrompt] Failed to open store URL (${source})`, error); }
    }
    return { opened: false, attemptedUrls };
  }

  async openReviewFeedbackEmail(rating?: number): Promise<boolean> {
    const subject = encodeURIComponent('VocBee Feedback');
    const body = encodeURIComponent(rating && rating > 0 ? `Rating: ${rating}/5\n\nWhat can we improve?\n` : 'What can we improve?\n');
    const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    try {
      if (!(await this.platform.canOpenUrl(url))) return false;
      await this.platform.openUrl(url);
      await this.update(state => ({ ...state, lastOutcome: 'feedbackOpened' }));
      return true;
    } catch (error) { console.warn('[ReviewPrompt] Failed to open feedback email', error); return false; }
  }
}
