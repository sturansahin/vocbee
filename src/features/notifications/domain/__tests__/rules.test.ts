// Pure notification domain rules (docs/refactor-v2/37 §7). getDailyNotificationSlotCount cases match
// the outputs exercised by services/__tests__/notificationService.test.ts.
import {
  getDailyNotificationSlotCount,
  capVocabularySlots,
  shouldRescheduleForContentVersion,
  normalizeFrequencyMinutes,
  serializePendingWord,
  parsePendingWord,
} from '../rules';
import { MAX_VOCABULARY_NOTIFICATIONS } from '../constants';

describe('getDailyNotificationSlotCount', () => {
  it('default window 09:00-21:00 @ 120min -> 7 per day', () => {
    expect(getDailyNotificationSlotCount(540, 1260, 120)).toBe(7);
  });
  it('full day @ 60min -> 24 per day', () => {
    expect(getDailyNotificationSlotCount(0, 0, 60)).toBe(24);
  });
  it('full day @ 120min -> 12 per day', () => {
    expect(getDailyNotificationSlotCount(0, 0, 120)).toBe(12);
  });
  it('overnight window (22:00-06:00) wraps past midnight', () => {
    // range = (1440-1320)+360 = 480; 480/120 + 1 = 5
    expect(getDailyNotificationSlotCount(1320, 360, 120)).toBe(5);
  });
  it('once-daily (1440) yields 1-2 slots', () => {
    expect(getDailyNotificationSlotCount(540, 1260, 1440)).toBe(1); // 720/1440=0 +1
  });
});

describe('capVocabularySlots', () => {
  it('never exceeds 63 (64 - 1 streak reserve)', () => {
    expect(capVocabularySlots(100)).toBe(MAX_VOCABULARY_NOTIFICATIONS);
    expect(capVocabularySlots(63)).toBe(63);
    expect(capVocabularySlots(10)).toBe(10);
  });
});

describe('shouldRescheduleForContentVersion', () => {
  it('true when stored version differs from 4 (or missing), false when equal', () => {
    expect(shouldRescheduleForContentVersion('3')).toBe(true);
    expect(shouldRescheduleForContentVersion(null)).toBe(true);
    expect(shouldRescheduleForContentVersion(undefined)).toBe(true);
    expect(shouldRescheduleForContentVersion('4')).toBe(false);
  });
});

describe('normalizeFrequencyMinutes', () => {
  it('floors at 60, passes through valid options', () => {
    expect(normalizeFrequencyMinutes(30)).toBe(60);
    expect(normalizeFrequencyMinutes(59)).toBe(60);
    expect(normalizeFrequencyMinutes(60)).toBe(60);
    expect(normalizeFrequencyMinutes(120)).toBe(120);
    expect(normalizeFrequencyMinutes(1440)).toBe(1440);
  });
});

describe('pending word serialization', () => {
  it('round-trips full + minimal payloads', () => {
    const full = { wordId: 42, level: 'A1', targetLanguage: 'english' };
    expect(parsePendingWord(serializePendingWord(full))).toEqual(full);
    expect(parsePendingWord(serializePendingWord({ wordId: 7 }))).toEqual({ wordId: 7 });
  });
  it('returns null for invalid / missing wordId', () => {
    expect(parsePendingWord(null)).toBeNull();
    expect(parsePendingWord('')).toBeNull();
    expect(parsePendingWord('not-json')).toBeNull();
    expect(parsePendingWord(JSON.stringify({ level: 'A1' }))).toBeNull();
    expect(parsePendingWord(JSON.stringify({ wordId: 'x' }))).toBeNull();
  });
});
