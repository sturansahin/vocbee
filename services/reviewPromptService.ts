import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';
import { Linking, Platform } from 'react-native';
import appConfig from '../app.json';
import { STORAGE_KEYS } from '@shared/storage';

const IOS_APP_STORE_ID = '6760262917';
const ANDROID_PACKAGE_NAME = 'com.vocbee.app';
const SUPPORT_EMAIL = 'support@vocbee.com';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const REVIEW_PROMPT_RULES = {
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

type ReviewPromptOutcome =
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

const defaultReviewPromptState: ReviewPromptState = {
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

const appVersion = Constants.expoConfig?.version ?? appConfig.expo.version ?? 'unknown';
const appStoreUrl = appConfig.expo.ios.appStoreUrl;
const playStoreUrl = appConfig.expo.android.playStoreUrl;

function getAutomaticReviewMode(): AutomaticReviewMode {
    return Platform.OS === 'ios' ? 'native' : 'satisfaction';
}

function nowIso(): string {
    return new Date().toISOString();
}

function addDaysIso(days: number): string {
    return new Date(Date.now() + days * MS_PER_DAY).toISOString();
}

function isFutureIso(value: string | null): boolean {
    if (!value) return false;
    const time = Date.parse(value);
    return Number.isFinite(time) && time > Date.now();
}

function daysSince(value: string | null): number {
    if (!value) return Number.POSITIVE_INFINITY;
    const time = Date.parse(value);
    if (!Number.isFinite(time)) return Number.POSITIVE_INFINITY;
    return (Date.now() - time) / MS_PER_DAY;
}

function normalizeState(value: Partial<ReviewPromptState> | null): ReviewPromptState {
    return {
        ...defaultReviewPromptState,
        ...(value ?? {}),
        appLaunchCount: Number.isFinite(value?.appLaunchCount) ? Number(value?.appLaunchCount) : 0,
        promptCount: Number.isFinite(value?.promptCount) ? Number(value?.promptCount) : 0,
        nativeRequestCount: Number.isFinite(value?.nativeRequestCount) ? Number(value?.nativeRequestCount) : 0,
        lastRating: Number.isFinite(value?.lastRating) ? Number(value?.lastRating) : null,
        promptedVersions: Array.isArray(value?.promptedVersions) ? value.promptedVersions : [],
        annualNativeRequestTimestamps: Array.isArray(value?.annualNativeRequestTimestamps)
            ? value.annualNativeRequestTimestamps
            : [],
    };
}

async function readState(): Promise<ReviewPromptState> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.APP_REVIEW_PROMPT_STATE);
        if (!raw) return defaultReviewPromptState;
        return normalizeState(JSON.parse(raw) as Partial<ReviewPromptState>);
    } catch (error) {
        console.warn('[ReviewPrompt] Failed to read state', error);
        return defaultReviewPromptState;
    }
}

async function writeState(state: ReviewPromptState): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.APP_REVIEW_PROMPT_STATE, JSON.stringify(state));
}

async function updateState(updater: (state: ReviewPromptState) => ReviewPromptState): Promise<ReviewPromptState> {
    const current = await readState();
    const next = updater(current);
    await writeState(next);
    return next;
}

function getNativeRequestsInLastYear(state: ReviewPromptState): string[] {
    const cutoff = Date.now() - 365 * MS_PER_DAY;
    return state.annualNativeRequestTimestamps.filter(value => {
        const time = Date.parse(value);
        return Number.isFinite(time) && time >= cutoff;
    });
}

function withCurrentVersion(versions: string[]): string[] {
    return versions.includes(appVersion) ? versions : [...versions, appVersion];
}

function appendQueryParam(url: string, param: string): string {
    return `${url}${url.includes('?') ? '&' : '?'}${param}`;
}

function getStoreReviewUrls(): string[] {
    if (Platform.OS === 'ios') {
        return [
            `itms-apps://itunes.apple.com/app/viewContentsUserReviews/id${IOS_APP_STORE_ID}?action=write-review`,
            appendQueryParam(appStoreUrl, 'action=write-review'),
        ];
    }

    if (Platform.OS === 'android') {
        return [
            `market://details?id=${ANDROID_PACKAGE_NAME}&showAllReviews=true`,
            appendQueryParam(playStoreUrl, 'showAllReviews=true'),
        ];
    }

    return [];
}

export async function recordReviewAppLaunch(): Promise<ReviewPromptState> {
    return updateState(state => ({
        ...state,
        appLaunchCount: state.appLaunchCount + 1,
    }));
}

export async function getAutomaticReviewPromptDecision(
    context: ReviewPromptContext
): Promise<ReviewPromptDecision> {
    const mode = getAutomaticReviewMode();

    if (!REVIEW_PROMPT_RULES.enabled) {
        return { shouldPrompt: false, mode, reason: 'disabled' };
    }

    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        return { shouldPrompt: false, mode, reason: 'unsupported-platform' };
    }

    if (context.isTutorialVisible) {
        return { shouldPrompt: false, mode, reason: 'tutorial-visible' };
    }

    if (context.isBusy) {
        return { shouldPrompt: false, mode, reason: 'busy' };
    }

    const state = await readState();

    if (state.appLaunchCount < REVIEW_PROMPT_RULES.minimumAppLaunches) {
        return { shouldPrompt: false, mode, reason: 'not-enough-launches' };
    }

    if (context.totalLearnedCount < REVIEW_PROMPT_RULES.minimumTotalLearnedWords) {
        return { shouldPrompt: false, mode, reason: 'not-enough-progress' };
    }

    if (context.sessionLearnedCount < REVIEW_PROMPT_RULES.minimumSessionLearnedWords) {
        return { shouldPrompt: false, mode, reason: 'not-enough-session-progress' };
    }

    if (state.promptCount >= REVIEW_PROMPT_RULES.maximumPromptCount) {
        return { shouldPrompt: false, mode, reason: 'max-prompts-reached' };
    }

    if (state.promptedVersions.includes(appVersion)) {
        return { shouldPrompt: false, mode, reason: 'already-prompted-version' };
    }

    if (isFutureIso(state.dismissedUntil)) {
        return { shouldPrompt: false, mode, reason: 'snoozed' };
    }

    if (daysSince(state.lastPromptedAt) < REVIEW_PROMPT_RULES.promptCooldownDays) {
        return { shouldPrompt: false, mode, reason: 'cooldown' };
    }

    if (
        mode === 'native' &&
        getNativeRequestsInLastYear(state).length >= REVIEW_PROMPT_RULES.maximumNativeRequestsPerYear
    ) {
        return { shouldPrompt: false, mode, reason: 'native-yearly-limit' };
    }

    return { shouldPrompt: true, mode };
}

export async function markAutomaticReviewPromptPresented(
    outcome: Extract<ReviewPromptOutcome, 'nativeRequested' | 'satisfactionShown'>
): Promise<ReviewPromptState> {
    const timestamp = nowIso();

    return updateState(state => {
        const recentNativeRequests = getNativeRequestsInLastYear(state);
        const isNative = outcome === 'nativeRequested';

        return {
            ...state,
            promptCount: state.promptCount + 1,
            nativeRequestCount: isNative ? state.nativeRequestCount + 1 : state.nativeRequestCount,
            lastPromptedAt: timestamp,
            lastNativeRequestedAt: isNative ? timestamp : state.lastNativeRequestedAt,
            dismissedUntil: null,
            lastOutcome: outcome,
            promptedVersions: withCurrentVersion(state.promptedVersions),
            annualNativeRequestTimestamps: isNative ? [...recentNativeRequests, timestamp] : recentNativeRequests,
        };
    });
}

export async function dismissReviewPrompt(): Promise<ReviewPromptState> {
    return updateState(state => ({
        ...state,
        dismissedUntil: addDaysIso(REVIEW_PROMPT_RULES.dismissedCooldownDays),
        lastOutcome: 'dismissed',
    }));
}

export async function recordSatisfactionRating(rating: number): Promise<ReviewPromptState> {
    const isPositive = rating >= 4;

    return updateState(state => ({
        ...state,
        lastRating: rating,
        lastOutcome: isPositive ? 'positiveRating' : 'negativeRating',
        dismissedUntil: isPositive
            ? state.dismissedUntil
            : addDaysIso(REVIEW_PROMPT_RULES.negativeFeedbackCooldownDays),
    }));
}

export async function requestNativeReview(): Promise<boolean> {
    let recordedAttempt = false;

    const recordAttempt = async () => {
        if (recordedAttempt) return;
        recordedAttempt = true;
        try {
            await markAutomaticReviewPromptPresented('nativeRequested');
        } catch (error) {
            console.warn('[ReviewPrompt] Failed to record native review attempt', error);
        }
    };

    try {
        const available = await StoreReview.isAvailableAsync();
        const hasAction = await StoreReview.hasAction();

        if (available && hasAction) {
            await StoreReview.requestReview();
            await recordAttempt();
            return true;
        }

        await recordAttempt();
        const fallback = await openStoreReviewPage('native-fallback');
        return fallback.opened;
    } catch (error) {
        console.warn('[ReviewPrompt] Native review request failed', error);
        await recordAttempt();
        const fallback = await openStoreReviewPage('native-error-fallback');
        return fallback.opened;
    }
}

export async function openStoreReviewPage(source: string): Promise<StoreReviewOpenResult> {
    const urls = getStoreReviewUrls();
    const attemptedUrls: string[] = [];

    for (const url of urls) {
        attemptedUrls.push(url);

        try {
            const canOpen = url.startsWith('http') || await Linking.canOpenURL(url);
            if (!canOpen) continue;

            await Linking.openURL(url);
            await updateState(state => ({
                ...state,
                lastOutcome: 'openedStore',
            }));
            console.log(`[ReviewPrompt] Opened store review page (${source})`);
            return { opened: true, attemptedUrls };
        } catch (error) {
            console.warn(`[ReviewPrompt] Failed to open store URL (${source})`, error);
        }
    }

    return { opened: false, attemptedUrls };
}

export async function openReviewFeedbackEmail(rating?: number): Promise<boolean> {
    const subject = encodeURIComponent('VocBee Feedback');
    const body = encodeURIComponent(
        rating && rating > 0
            ? `Rating: ${rating}/5\n\nWhat can we improve?\n`
            : 'What can we improve?\n'
    );
    const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

    try {
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) return false;

        await Linking.openURL(url);
        await updateState(state => ({
            ...state,
            lastOutcome: 'feedbackOpened',
        }));
        return true;
    } catch (error) {
        console.warn('[ReviewPrompt] Failed to open feedback email', error);
        return false;
    }
}
