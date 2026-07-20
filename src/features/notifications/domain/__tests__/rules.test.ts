// Pure notification domain rules (docs/architecture.md). getDailyNotificationSlotCount cases match
// the outputs exercised by services/__tests__/notificationService.test.ts.
import {
  getDailyNotificationSlotCount,
  capVocabularySlots,
  shouldRescheduleForContentVersion,
  normalizeFrequencyMinutes,
  normalizeNotificationSettings,
  getNotificationFrequencyKey,
  getNotificationFrequencyMinutes,
  isVocabularyNotificationId,
  isStreakNotificationId,
  getNextStreakReminderTime,
  buildVocabularyScheduleTimes,
  getNextVocabularyRefillTime,
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

describe('notification scheduling plan', () => {
  const settings = normalizeNotificationSettings({
    startHour: 9,
    startMinute: 0,
    endHour: 21,
    endMinute: 0,
    frequencyMinutes: 120,
  });

  it('builds local-time slots in the configured window and respects capacity', () => {
    const now = new Date(2026, 3, 12, 8, 0, 0);
    const times = buildVocabularyScheduleTimes(settings, now, 10);
    expect(times).toHaveLength(10);
    expect(new Date(times[0]).getHours()).toBe(9);
    expect(
      times.every((time) => {
        const hour = new Date(time).getHours();
        return hour >= 9 && hour <= 21;
      }),
    ).toBe(true);
  });

  it('returns no slots when capacity is zero', () => {
    expect(buildVocabularyScheduleTimes(settings, new Date(), 0)).toEqual([]);
  });

  it('moves a refill past the normal-window end to next-day start', () => {
    const next = getNextVocabularyRefillTime(new Date(2026, 3, 12, 21, 0, 0), settings);
    expect(next.getDate()).toBe(13);
    expect(next.getHours()).toBe(9);
    expect(next.getMinutes()).toBe(0);
  });

  it('keeps overnight refills inside the configured overnight window', () => {
    const overnight = normalizeNotificationSettings({
      startHour: 22,
      endHour: 6,
      frequencyMinutes: 120,
    });
    const next = getNextVocabularyRefillTime(new Date(2026, 3, 12, 6, 0, 0), overnight);
    expect(next.getHours()).toBe(22);
  });

  it('builds an overnight plan without crossing the configured end', () => {
    const overnight = normalizeNotificationSettings({
      startHour: 22,
      endHour: 6,
      frequencyMinutes: 120,
    });
    const times = buildVocabularyScheduleTimes(overnight, new Date(2026, 3, 12, 21, 0, 0), 5);
    expect(times.map((time) => new Date(time).getHours())).toEqual([22, 0, 2, 4, 6]);
  });

  it('moves a pre-window refill to today start and leaves full-day cadence unchanged', () => {
    const beforeStart = getNextVocabularyRefillTime(new Date(2026, 3, 12, 4, 0, 0), settings);
    expect(beforeStart.getHours()).toBe(9);

    const fullDay = normalizeNotificationSettings({
      startHour: 0,
      endHour: 0,
      frequencyMinutes: 60,
    });
    const fullDayNext = getNextVocabularyRefillTime(new Date(2026, 3, 12, 23, 0, 0), fullDay);
    expect(fullDayNext.getDate()).toBe(13);
    expect(fullDayNext.getHours()).toBe(0);
  });
});

describe('settings, frequency and identifier rules', () => {
  it('normalizes missing/non-finite settings and floors frequency', () => {
    expect(
      normalizeNotificationSettings({
        frequencyMinutes: 30,
        startHour: Number.NaN,
        startMinute: Number.NaN,
        endHour: Number.NaN,
        endMinute: Number.NaN,
      }),
    ).toMatchObject({
      frequencyMinutes: 60,
      startHour: 9,
      startMinute: 0,
      endHour: 21,
      endMinute: 0,
    });
    expect(normalizeNotificationSettings(null)).toMatchObject({ frequencyMinutes: 120 });
  });

  it('maps supported frequency values with the same fallback', () => {
    expect(getNotificationFrequencyMinutes('every6hours')).toBe(360);
    expect(getNotificationFrequencyMinutes('invalid')).toBe(120);
    expect(getNotificationFrequencyKey(1440)).toBe('onceDaily');
    expect(getNotificationFrequencyKey(999)).toBe('every2hours');
  });

  it('recognizes current and legacy notification identifiers', () => {
    expect(isVocabularyNotificationId('vocbee-vocab-1-2')).toBe(true);
    expect(isVocabularyNotificationId('vocbee-refill-1-2')).toBe(true);
    expect(isVocabularyNotificationId('vocbee-1-2')).toBe(true);
    expect(isVocabularyNotificationId('other')).toBe(false);
    expect(isStreakNotificationId('vocbee-streak-reminder')).toBe(true);
    expect(isStreakNotificationId('vocbee-streak-legacy')).toBe(true);
    expect(isStreakNotificationId('other')).toBe(false);
  });

  it('schedules streak for today or tomorrow according to completion/time', () => {
    const noon = new Date(2026, 3, 12, 12, 0, 0);
    expect(getNextStreakReminderTime(noon, false).getDate()).toBe(12);
    expect(getNextStreakReminderTime(noon, false).getHours()).toBe(21);
    expect(getNextStreakReminderTime(noon, true).getDate()).toBe(13);
    expect(getNextStreakReminderTime(new Date(2026, 3, 12, 22, 0, 0), false).getDate()).toBe(13);
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
  it('parses a legacy JSON payload with a string wordId (parseInt fallback)', () => {
    expect(parsePendingWord(JSON.stringify({ wordId: '42' }))).toEqual({ wordId: 42 });
    expect(parsePendingWord(JSON.stringify({ wordId: '42', level: 'B1' }))).toEqual({
      wordId: 42,
      level: 'B1',
    });
  });
  it('parses a legacy plain-numeric-string payload (pre-JSON format)', () => {
    expect(parsePendingWord('42')).toEqual({ wordId: 42 });
    expect(parsePendingWord('not-json')).toBeNull();
  });
});
