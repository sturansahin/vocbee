export type ProgressSyncMode = 'legacy' | 'dual';

export function resolveProgressSyncMode(value: unknown): ProgressSyncMode {
  return value === 'dual' ? 'dual' : 'legacy';
}

/** Safe rollout default: production behavior is unchanged until rules and the dual-write release are ready. */
export function getProgressSyncMode(): ProgressSyncMode {
  return resolveProgressSyncMode(process.env.EXPO_PUBLIC_PROGRESS_SYNC_MODE);
}
