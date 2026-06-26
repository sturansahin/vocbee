// Pure learning domain rules. getTutorialSwipeNextStep cases mirror screens/__tests__/HomeScreen.test.tsx.
import { getTutorialSwipeNextStep, getNextLevel, selectUnlearnedWordIds } from '../rules';

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
});
