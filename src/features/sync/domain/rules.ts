export const MUTATION_SYNC_DEBOUNCE_MS = 5 * 60 * 1000;

export function isSyncDue(
  hasUnsyncedChanges: boolean,
  lastSyncTime: Date | null,
  nowMs: number,
): boolean {
  if (!hasUnsyncedChanges) return false;
  if (!lastSyncTime) return true;
  return nowMs - lastSyncTime.getTime() >= MUTATION_SYNC_DEBOUNCE_MS;
}
