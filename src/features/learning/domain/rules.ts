// src/features/learning/domain/rules.ts
// Layer: domain | Feature: learning | Pure TS (NO SDK). Behavior contract: docs/refactor-v2/03 §4-6.

import { LEVELS, type Level, type TutorialSwipeDirection } from './types';

/**
 * Tutorial swipe gesture rule — VERBATIM extraction of the function previously inlined in
 * screens/HomeScreen.tsx (already covered by screens/__tests__/HomeScreen.test.tsx). Only the
 * prompted practice swipes advance the tutorial: step 1 advances on 'right', step 2 on 'left'.
 */
export function getTutorialSwipeNextStep(step: number, direction: TutorialSwipeDirection): number | null {
  if (step === 1 && direction === 'right') {
    return 2;
  }

  if (step === 2 && direction === 'left') {
    return 3;
  }

  return null;
}

/**
 * CEFR level progression A1 → A2 → B1 → B2 → C1. Returns the next level, or null at the last level.
 * Mirrors the order used by services/progressService.checkAndAdvanceLevel (LEVELS[index + 1]).
 */
export function getNextLevel(level: Level): Level | null {
  const index = LEVELS.indexOf(level);
  if (index < 0 || index >= LEVELS.length - 1) return null;
  return LEVELS[index + 1];
}

/**
 * Unlearned word-id selection — pure equivalent of services/progressService.getUnlearnedWords
 * (vocabulary.filter(w => !learnedIds.includes(w.id))). Preserves input order.
 */
export function selectUnlearnedWordIds(allWordIds: number[], learnedWordIds: number[]): number[] {
  const learned = new Set(learnedWordIds);
  return allWordIds.filter(id => !learned.has(id));
}
