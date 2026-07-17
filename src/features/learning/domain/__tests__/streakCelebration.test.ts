import {
    DEBUG_FORCE_STREAK_CELEBRATION_ON_RIGHT_SWIPE,
    getStreakCelebrationMessageKey,
    shouldShowStreakCelebration,
} from '../rules';

describe('streakCelebration helpers', () => {
    it('returns the starter message for a first-day streak', () => {
        expect(getStreakCelebrationMessageKey(1)).toBe('home.streakCelebrationStarted');
    });

    it('returns the weekly milestone message on multiples of seven', () => {
        expect(getStreakCelebrationMessageKey(7)).toBe('home.streakCelebrationWeekly');
    });

    it('returns the monthly milestone message on multiples of thirty', () => {
        expect(getStreakCelebrationMessageKey(30)).toBe('home.streakCelebrationMonthly');
    });

    it('returns the generic keep-going message for regular streak values', () => {
        expect(getStreakCelebrationMessageKey(4)).toBe('home.streakCelebrationKeepGoing');
        expect(getStreakCelebrationMessageKey(2)).toBe('home.streakCelebrationGeneric');
    });

    it('only shows the celebration when the streak actually increments', () => {
        expect(DEBUG_FORCE_STREAK_CELEBRATION_ON_RIGHT_SWIPE).toBe(false);
        expect(shouldShowStreakCelebration(false)).toBe(false);
        expect(shouldShowStreakCelebration(true)).toBe(true);
    });
});
