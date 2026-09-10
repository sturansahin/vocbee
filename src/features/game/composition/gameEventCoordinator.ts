import { recordDailyStudyAction } from '@features/streak';

import {
  onGameEvent,
  type GameLifecycleEvent,
  type ReviewCompletedGameEvent,
} from '../../../../modules/vocbee-unity';
import type { GameSessionV4 } from '../domain/gameSession';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1']);
const REVIEW_FIELDS = [
  'bridgeVersion',
  'eventVersion',
  'level',
  'sessionId',
  'targetCount',
  'type',
];

let stopActiveCoordinator: (() => void) | null = null;

export function parseGameLifecycleEvent(eventJson: string): GameLifecycleEvent | null {
  let value: unknown;
  try {
    value = JSON.parse(eventJson);
  } catch {
    return null;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const event = value as Record<string, unknown>;
  if (event.type === 'finished') {
    return typeof event.sessionId === 'string' && UUID.test(event.sessionId)
      ? { type: 'finished', sessionId: event.sessionId }
      : null;
  }
  if (
    event.type !== 'reviewCompleted' ||
    JSON.stringify(Object.keys(event).sort()) !== JSON.stringify(REVIEW_FIELDS) ||
    event.eventVersion !== 1 ||
    event.bridgeVersion !== 1 ||
    typeof event.sessionId !== 'string' ||
    !UUID.test(event.sessionId) ||
    typeof event.level !== 'string' ||
    !LEVELS.has(event.level) ||
    !Number.isSafeInteger(event.targetCount) ||
    (event.targetCount as number) <= 0
  ) {
    return null;
  }
  return event as ReviewCompletedGameEvent;
}

export function startGameEventCoordinator(
  session: Pick<GameSessionV4, 'sessionId' | 'level'>,
): () => void {
  stopActiveCoordinator?.();
  let completed = false;
  let subscription: { remove(): void } | null = null;
  const stop = () => {
    subscription?.remove();
    subscription = null;
    if (stopActiveCoordinator === stop) stopActiveCoordinator = null;
  };
  stopActiveCoordinator = stop;
  subscription = onGameEvent((eventJson) => {
    const event = parseGameLifecycleEvent(eventJson);
    if (!event || event.sessionId !== session.sessionId) return;
    if (event.type === 'finished') {
      stop();
      return;
    }
    if (completed || event.level !== session.level) return;
    completed = true;
    void recordDailyStudyAction().catch((error: unknown) => {
      console.error('[Game] Failed to record review completion', error);
    });
  });
  return stop;
}
