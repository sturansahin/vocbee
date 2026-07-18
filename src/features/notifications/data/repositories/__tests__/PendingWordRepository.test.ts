// src/features/notifications/data/repositories/__tests__/PendingWordRepository.test.ts
// Verifies the repository reads/writes/clears the SAME AsyncStorage key
// (@pending_notification_word) that services/notificationService.ts used inline before ADIM 6,
// and that legacy payload formats (string wordId, plain-numeric-string) still parse correctly.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@shared/storage';
import { PendingWordRepository } from '../PendingWordRepository';

describe('PendingWordRepository', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('setPendingWord writes to the exact @pending_notification_word key', async () => {
    const repo = new PendingWordRepository();
    await repo.setPendingWord({ wordId: 42, level: 'A1', targetLanguage: 'english' });

    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_NOTIFICATION_WORD);
    expect(raw).toBe(JSON.stringify({ wordId: 42, level: 'A1', targetLanguage: 'english' }));
  });

  it('getPendingWord reads back exactly what was set (round-trip)', async () => {
    const repo = new PendingWordRepository();
    await repo.setPendingWord({ wordId: 7 });
    const result = await repo.getPendingWord();
    expect(result).toEqual({ wordId: 7 });
  });

  it('getPendingWord does not clear the value (caller decides when to clear)', async () => {
    const repo = new PendingWordRepository();
    await repo.setPendingWord({ wordId: 1 });
    await repo.getPendingWord();
    const stillThere = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_NOTIFICATION_WORD);
    expect(stillThere).not.toBeNull();
  });

  it('clearPendingWord removes the key', async () => {
    const repo = new PendingWordRepository();
    await repo.setPendingWord({ wordId: 1 });
    await repo.clearPendingWord();
    const result = await repo.getPendingWord();
    expect(result).toBeNull();
  });

  it('consumePendingWord reads then clears in one call', async () => {
    const repo = new PendingWordRepository();
    await repo.setPendingWord({ wordId: 99 });

    const consumed = await repo.consumePendingWord();
    expect(consumed).toEqual({ wordId: 99 });

    const afterConsume = await repo.getPendingWord();
    expect(afterConsume).toBeNull();
  });

  it('returns null when nothing is stored', async () => {
    const repo = new PendingWordRepository();
    expect(await repo.getPendingWord()).toBeNull();
  });

  it('parses a legacy payload written directly to storage (string wordId)', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.PENDING_NOTIFICATION_WORD,
      JSON.stringify({ wordId: '55' }),
    );
    const repo = new PendingWordRepository();
    expect(await repo.getPendingWord()).toEqual({ wordId: 55 });
  });

  it('parses a legacy plain-numeric-string payload written directly to storage', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_NOTIFICATION_WORD, '123');
    const repo = new PendingWordRepository();
    expect(await repo.getPendingWord()).toEqual({ wordId: 123 });
  });
});
