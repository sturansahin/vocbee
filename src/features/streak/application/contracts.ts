import type { StreakState } from '../domain/types';

export interface StreakRepository {
  read(): Promise<unknown | null>;
  write(state: StreakState, markUnsynced: boolean): Promise<void>;
  clear(): Promise<void>;
}
