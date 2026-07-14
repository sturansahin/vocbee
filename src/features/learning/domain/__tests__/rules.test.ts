// Pure learning domain rules. getTutorialSwipeNextStep cases mirror screens/__tests__/HomeScreen.test.tsx.
import {
  getLearningSpeechLanguage,
  getNextLevel,
  getStreakCelebrationMessageKey,
  getTutorialSwipeNextStep,
  selectUnlearnedWordIds,
  shouldCelebrateStreak,
} from '../rules';

describe('learning domain rules', () => {
  describe('getTutorialSwipeNextStep', () => {
    it('only treats prompted tutorial swipes as practice gestures', () => {
      expect(getTutorialSwipeNextStep(1, 'right')).toBe(2);
      expect(getTutorialSwipeNextStep(2, 'left')).toBe(3);
      expect(getTutorialSwipeNextStep(1, 'left')).toBeNull();
      expect(getTutorialSwipeNextStep(2, 'right')).toBeNull();
      expect(getTutorialSwipeNextStep(3, 'right')).toBeNull();
    });
  });

  describe('getNextLevel', () => {
    it('advances A1 -> A2 -> B1 -> B2 -> C1, null at C1', () => {
      expect(getNextLevel('A1')).toBe('A2');
      expect(getNextLevel('A2')).toBe('B1');
      expect(getNextLevel('B1')).toBe('B2');
      expect(getNextLevel('B2')).toBe('C1');
      expect(getNextLevel('C1')).toBeNull();
    });
  });

  describe('selectUnlearnedWordIds', () => {
    it('returns ids not yet learned, preserving order', () => {
      expect(selectUnlearnedWordIds([1, 2, 3, 4], [2, 4])).toEqual([1, 3]);
      expect(selectUnlearnedWordIds([5, 3, 1], [])).toEqual([5, 3, 1]);
      expect(selectUnlearnedWordIds([], [1])).toEqual([]);
      expect(selectUnlearnedWordIds([1, 2], [1, 2])).toEqual([]);
    });
  });

  it('keeps speech language and streak celebration behavior stable', () => {
    expect(getLearningSpeechLanguage('german')).toBe('de-DE');
    expect(getLearningSpeechLanguage('unknown')).toBe('en-US');
    expect(shouldCelebrateStreak(true)).toBe(true);
    expect(shouldCelebrateStreak(false)).toBe(false);
    expect(getStreakCelebrationMessageKey(1)).toBe('home.streakCelebrationStarted');
    expect(getStreakCelebrationMessageKey(7)).toBe('home.streakCelebrationWeekly');
    expect(getStreakCelebrationMessageKey(30)).toBe('home.streakCelebrationMonthly');
    expect(getStreakCelebrationMessageKey(3)).toBe('home.streakCelebrationKeepGoing');
    expect(getStreakCelebrationMessageKey(2)).toBe('home.streakCelebrationGeneric');
  });
});
