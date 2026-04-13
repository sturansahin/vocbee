import AsyncStorage from '@react-native-async-storage/async-storage';
import { markAsUnsynced } from './storage';
import { STORAGE_KEYS } from './storageKeys';

const STREAK_KEY = STORAGE_KEYS.STREAK;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export interface StreakState {
    currentStreak: number;
    longestStreak: number;
    brokenStreak: number | null;
    lastQualifiedDay: string | null;
    lastQualifiedAt: string | null;
}

export interface StreakSummary extends StreakState {
    storedCurrentStreak: number;
    completedToday: boolean;
    atRisk: boolean;
    isBroken: boolean;
    status: StreakStatus;
}

export interface RecordStreakResult {
    state: StreakState;
    didIncrement: boolean;
    completedToday: boolean;
}

interface SaveStreakOptions {
    markUnsynced?: boolean;
}

export type StreakStatus = 'inactive' | 'completedToday' | 'atRisk' | 'broken';

export const DEFAULT_STREAK_STATE: StreakState = {
    currentStreak: 0,
    longestStreak: 0,
    brokenStreak: null,
    lastQualifiedDay: null,
    lastQualifiedAt: null,
};

export const DEFAULT_STREAK_SUMMARY: StreakSummary = {
    ...DEFAULT_STREAK_STATE,
    storedCurrentStreak: 0,
    completedToday: false,
    atRisk: false,
    isBroken: false,
    status: 'inactive',
};

function normalizeCount(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return 0;
    }

    return Math.max(0, Math.floor(value));
}

function isValidDayKey(value: unknown): value is string {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeTimestamp(value: unknown): string | null {
    if (typeof value !== 'string' || value.trim().length === 0) {
        return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function normalizeStreakState(state?: Partial<StreakState> | null): StreakState {
    const normalized: StreakState = {
        currentStreak: normalizeCount(state?.currentStreak),
        longestStreak: normalizeCount(state?.longestStreak),
        brokenStreak: normalizeCount(state?.brokenStreak) || null,
        lastQualifiedDay: isValidDayKey(state?.lastQualifiedDay) ? state!.lastQualifiedDay : null,
        lastQualifiedAt: normalizeTimestamp(state?.lastQualifiedAt),
    };

    if (normalized.currentStreak > 0) {
        normalized.brokenStreak = null;
    }

    if (normalized.longestStreak < normalized.currentStreak) {
        normalized.longestStreak = normalized.currentStreak;
    }

    if (normalized.brokenStreak && normalized.longestStreak < normalized.brokenStreak) {
        normalized.longestStreak = normalized.brokenStreak;
    }

    return normalized;
}

export function getLocalDayKey(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function dayKeyToNoonDate(dayKey: string): Date | null {
    if (!isValidDayKey(dayKey)) {
        return null;
    }

    const [year, month, day] = dayKey.split('-').map(Number);
    const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDayDifference(fromDayKey: string, toDayKey: string): number | null {
    const fromDate = dayKeyToNoonDate(fromDayKey);
    const toDate = dayKeyToNoonDate(toDayKey);

    if (!fromDate || !toDate) {
        return null;
    }

    return Math.round((toDate.getTime() - fromDate.getTime()) / DAY_IN_MS);
}

function getDerivedStreakState(state: StreakState, now: Date = new Date()) {
    const normalized = normalizeStreakState(state);
    const todayKey = getLocalDayKey(now);

    if (normalized.currentStreak <= 0) {
        return {
            normalized,
            status: normalized.brokenStreak ? 'broken' as const : 'inactive' as const,
            effectiveCurrentStreak: 0,
        };
    }

    if (!normalized.lastQualifiedDay) {
        return {
            normalized,
            status: 'inactive' as const,
            effectiveCurrentStreak: 0,
        };
    }

    const dayDifference = getDayDifference(normalized.lastQualifiedDay, todayKey);

    if (dayDifference === null) {
        return {
            normalized,
            status: 'inactive' as const,
            effectiveCurrentStreak: 0,
        };
    }

    if (dayDifference <= 0) {
        return {
            normalized,
            status: 'completedToday' as const,
            effectiveCurrentStreak: normalized.currentStreak,
        };
    }

    if (dayDifference === 1) {
        return {
            normalized,
            status: 'atRisk' as const,
            effectiveCurrentStreak: normalized.currentStreak,
        };
    }

    return {
        normalized,
        status: 'broken' as const,
        effectiveCurrentStreak: 0,
    };
}

function getCanonicalStreakState(state: StreakState, now: Date = new Date()): StreakState {
    const derived = getDerivedStreakState(state, now);

    if (derived.status === 'broken') {
        return {
            ...derived.normalized,
            brokenStreak: derived.normalized.brokenStreak ?? derived.normalized.currentStreak,
            currentStreak: 0,
        };
    }

    if (derived.effectiveCurrentStreak === derived.normalized.currentStreak) {
        return derived.normalized;
    }

    return {
        ...derived.normalized,
        brokenStreak: null,
        currentStreak: derived.effectiveCurrentStreak,
    };
}

export function isStreakCompletedToday(
    state: StreakState,
    now: Date = new Date()
): boolean {
    return getDerivedStreakState(state, now).status === 'completedToday';
}

export function getStreakStatus(
    state: StreakState,
    now: Date = new Date()
): StreakStatus {
    return getDerivedStreakState(state, now).status;
}

export function getStreakStatusMessageKey(status: StreakStatus): string {
    switch (status) {
        case 'completedToday':
            return 'home.streakDoneToday';
        case 'atRisk':
            return 'home.streakAtRisk';
        case 'broken':
            return 'home.streakBroken';
        default:
            return 'home.startStreak';
    }
}

export function getStreakSummaryFromState(
    state: StreakState,
    now: Date = new Date()
): StreakSummary {
    const derived = getDerivedStreakState(state, now);
    const { normalized, status, effectiveCurrentStreak } = derived;

    return {
        ...normalized,
        currentStreak: effectiveCurrentStreak,
        storedCurrentStreak: normalized.brokenStreak ?? normalized.currentStreak,
        completedToday: status === 'completedToday',
        atRisk: status === 'atRisk',
        isBroken: status === 'broken',
        status,
    };
}

export async function getStreakState(now: Date = new Date()): Promise<StreakState> {
    try {
        const raw = await AsyncStorage.getItem(STREAK_KEY);
        if (!raw) {
            return DEFAULT_STREAK_STATE;
        }

        const parsed = normalizeStreakState(JSON.parse(raw));
        const canonical = getCanonicalStreakState(parsed, now);

        if (canonical.currentStreak !== parsed.currentStreak) {
            return saveStreakState(canonical);
        }

        return canonical;
    } catch (error) {
        console.error('[Streak] Failed to load streak state:', error);
        return DEFAULT_STREAK_STATE;
    }
}

export async function getStreakSummary(now: Date = new Date()): Promise<StreakSummary> {
    const state = await getStreakState(now);
    return getStreakSummaryFromState(state, now);
}

export async function saveStreakState(
    state: Partial<StreakState>,
    options: SaveStreakOptions = {}
): Promise<StreakState> {
    const normalized = normalizeStreakState(state);

    try {
        await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(normalized));

        if (options.markUnsynced !== false) {
            await markAsUnsynced();
        }
    } catch (error) {
        console.error('[Streak] Failed to save streak state:', error);
    }

    return normalized;
}

export async function restoreStreakState(
    state?: Partial<StreakState> | null
): Promise<StreakState> {
    if (!state) {
        return DEFAULT_STREAK_STATE;
    }

    return saveStreakState(state, { markUnsynced: false });
}

export async function clearStreakState(): Promise<void> {
    try {
        await AsyncStorage.removeItem(STREAK_KEY);
    } catch (error) {
        console.error('[Streak] Failed to clear streak state:', error);
    }
}

export async function recordDailyStudyAction(
    now: Date = new Date()
): Promise<RecordStreakResult> {
    const current = await getStreakState(now);
    const todayKey = getLocalDayKey(now);

    if (current.lastQualifiedDay === todayKey) {
        return {
            state: current,
            didIncrement: false,
            completedToday: true,
        };
    }

    const nextState = normalizeStreakState(current);

    if (!current.lastQualifiedDay) {
        nextState.currentStreak = 1;
    } else {
        const dayDifference = getDayDifference(current.lastQualifiedDay, todayKey);

        if (dayDifference === 1) {
            nextState.currentStreak = current.currentStreak + 1;
        } else {
            nextState.currentStreak = 1;
        }
    }

    nextState.longestStreak = Math.max(nextState.longestStreak, nextState.currentStreak);
    nextState.brokenStreak = null;
    nextState.lastQualifiedDay = todayKey;
    nextState.lastQualifiedAt = now.toISOString();

    const persistedState = await saveStreakState(nextState);

    return {
        state: persistedState,
        didIncrement: true,
        completedToday: true,
    };
}
