// src/features/learning/domain/rules.ts
// Layer: domain | Feature: learning | Pure TS (NO SDK). Behavior contract: docs/refactor-v2/03 §4-6.

import { LEVELS, type Level, type TutorialSwipeDirection } from './types';

/**
 * Tutorial swipe gesture rule — VERBATIM extraction of the function previously inlined in
 * screens/HomeScreen.tsx (already covered by screens/__tests__/HomeScreen.test.tsx). Only the
 * prompted practice swipes advance the tutorial: step 1 advances on 'right', step 2 on 'left'.
 */
export function getTutorialSwipeNextStep(
  step: number,
  direction: TutorialSwipeDirection,
): number | null {
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
  return allWordIds.filter((id) => !learned.has(id));
}

const TTS_LANGUAGE_CODES: Record<string, string> = {
  amharic: 'am-ET',
  arabic: 'ar-SA',
  chinese: 'zh-CN',
  english: 'en-US',
  french: 'fr-FR',
  german: 'de-DE',
  hindi: 'hi-IN',
  indonesian: 'id-ID',
  italian: 'it-IT',
  japanese: 'ja-JP',
  korean: 'ko-KR',
  persian: 'fa-IR',
  portuguese: 'pt-BR',
  russian: 'ru-RU',
  serbian: 'sr-RS',
  spanish: 'es-ES',
  swahili: 'sw-KE',
  thai: 'th-TH',
  turkish: 'tr-TR',
  urdu: 'ur-PK',
  vietnamese: 'vi-VN',
};

export function getLearningSpeechLanguage(languageId: string): string {
  return TTS_LANGUAGE_CODES[languageId?.toLowerCase()] || 'en-US';
}

export const DEBUG_FORCE_STREAK_CELEBRATION_ON_RIGHT_SWIPE = false;

export function shouldCelebrateStreak(didIncrement: boolean): boolean {
  return didIncrement || DEBUG_FORCE_STREAK_CELEBRATION_ON_RIGHT_SWIPE;
}

export function shouldShowStreakCelebration(didIncrement: boolean): boolean {
  return shouldCelebrateStreak(didIncrement);
}

export function getStreakCelebrationMessageKey(streakCount: number): string {
  if (streakCount <= 1) return 'home.streakCelebrationStarted';
  if (streakCount % 30 === 0) return 'home.streakCelebrationMonthly';
  if (streakCount % 7 === 0) return 'home.streakCelebrationWeekly';
  if (streakCount >= 3) return 'home.streakCelebrationKeepGoing';
  return 'home.streakCelebrationGeneric';
}
