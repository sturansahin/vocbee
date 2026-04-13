// Keep this disabled in normal app flow. Enable temporarily only for local QA.
export const DEBUG_FORCE_STREAK_CELEBRATION_ON_RIGHT_SWIPE = false;

export function shouldShowStreakCelebration(didIncrement: boolean): boolean {
    return didIncrement || DEBUG_FORCE_STREAK_CELEBRATION_ON_RIGHT_SWIPE;
}

export function getStreakCelebrationMessageKey(streakCount: number): string {
    if (streakCount <= 1) {
        return 'home.streakCelebrationStarted';
    }

    if (streakCount > 0 && streakCount % 30 === 0) {
        return 'home.streakCelebrationMonthly';
    }

    if (streakCount > 0 && streakCount % 7 === 0) {
        return 'home.streakCelebrationWeekly';
    }

    if (streakCount >= 3) {
        return 'home.streakCelebrationKeepGoing';
    }

    return 'home.streakCelebrationGeneric';
}
