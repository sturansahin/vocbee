import type { StreakRepository } from './contracts';
import {
  getCanonicalStreakState,
  getStreakSummaryFromState,
  normalizeStreakState,
  recordDailyStudyActionState,
} from '../domain/rules';
import { DEFAULT_STREAK_STATE, type RecordStreakResult, type StreakState, type StreakSummary } from '../domain/types';

export class DefaultStreakService {
  constructor(private readonly repository: StreakRepository) {}

  async getStreakState(now = new Date()): Promise<StreakState> {
    try {
      const raw = await this.repository.read();
      if (!raw) return DEFAULT_STREAK_STATE;
      const parsed = normalizeStreakState(raw as Partial<StreakState>);
      const canonical = getCanonicalStreakState(parsed, now);
      if (canonical.currentStreak !== parsed.currentStreak) return this.saveStreakState(canonical);
      return canonical;
    } catch (error) { console.error('[Streak] Failed to load streak state:', error); return DEFAULT_STREAK_STATE; }
  }

  async getStreakSummary(now = new Date()): Promise<StreakSummary> {
    return getStreakSummaryFromState(await this.getStreakState(now), now);
  }

  async saveStreakState(state: Partial<StreakState>, options: { markUnsynced?: boolean } = {}): Promise<StreakState> {
    const normalized = normalizeStreakState(state);
    try { await this.repository.write(normalized, options.markUnsynced !== false); }
    catch (error) { console.error('[Streak] Failed to save streak state:', error); }
    return normalized;
  }

  async restoreStreakState(state?: Partial<StreakState> | null): Promise<StreakState> {
    return state ? this.saveStreakState(state, { markUnsynced: false }) : DEFAULT_STREAK_STATE;
  }

  async clearStreakState(): Promise<void> {
    try { await this.repository.clear(); }
    catch (error) { console.error('[Streak] Failed to clear streak state:', error); }
  }

  async recordDailyStudyAction(now = new Date()): Promise<RecordStreakResult> {
    const result = recordDailyStudyActionState(await this.getStreakState(now), now);
    if (!result.didIncrement) return result;
    return { ...result, state: await this.saveStreakState(result.state) };
  }
}
