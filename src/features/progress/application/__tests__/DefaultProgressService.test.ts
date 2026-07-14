import { DefaultProgressService } from '../DefaultProgressService';
import type { ProgressLocalStore } from '../contracts';
import type { UserProgress } from '../../domain/types';

class FakeStore implements ProgressLocalStore {
  progress: UserProgress = {};
  level: string | null = 'A1';
  last: string | null = null;
  readProgress() { return Promise.resolve(structuredClone(this.progress)); }
  writeProgress(progress: UserProgress) { this.progress = structuredClone(progress); return Promise.resolve(); }
  readCurrentLevel() { return Promise.resolve(this.level); }
  writeCurrentLevel(level: string) { this.level = level; return Promise.resolve(); }
  readLastWordId() { return Promise.resolve(this.last); }
  writeLastWordId(id: number) { this.last = String(id); return Promise.resolve(); }
  clear() { this.progress = {}; this.level = null; this.last = null; return Promise.resolve(); }
  restore(progress: UserProgress | null, level: string | null, last?: number | null) {
    if (progress) this.progress = progress;
    if (level) this.level = level;
    if (last != null) this.last = String(last);
    return Promise.resolve();
  }
}

describe('DefaultProgressService', () => {
  const create = (store = new FakeStore()) => ({
    store,
    service: new DefaultProgressService(store, { getStoredWordIds: async () => [1, 2] }),
  });

  it('adds a learned word once and removes it', async () => {
    const { store, service } = create();
    await service.markWordAsLearned('A1', 1);
    await service.markWordAsLearned('A1', 1);
    expect(store.progress.A1).toEqual([1]);
    await service.unmarkWord('A1', 1);
    expect(store.progress.A1).toEqual([]);
  });

  it('calculates percent and advances only after level completion', async () => {
    const { store, service } = create();
    store.progress.A1 = [1];
    await expect(service.getLevelProgress('A1')).resolves.toBe(50);
    await expect(service.checkAndAdvanceLevel()).resolves.toBe('A1');
    store.progress.A1.push(2);
    await expect(service.checkAndAdvanceLevel()).resolves.toBe('A2');
    expect(store.level).toBe('A2');
  });

  it('restores progress and resume word without marking domain data differently', async () => {
    const { service } = create();
    await service.restoreProgressFromFirebase({ B1: [4, 8] }, 'B1', 8);
    await expect(service.getLearnedWords('B1')).resolves.toEqual([4, 8]);
    await expect(service.getCurrentLevel()).resolves.toBe('B1');
    await expect(service.getLastWordId()).resolves.toBe(8);
  });
});
