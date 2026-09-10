const mockOnGameEvent = jest.fn();
const mockRemove = jest.fn();
const mockRecordDailyStudyAction = jest.fn();
let listener: ((eventJson: string) => void) | undefined;

jest.mock('../../../../../modules/vocbee-unity', () => ({
  onGameEvent: (callback: (eventJson: string) => void) => mockOnGameEvent(callback),
}));
jest.mock('@features/streak', () => ({
  recordDailyStudyAction: () => mockRecordDailyStudyAction(),
}));

import { parseGameLifecycleEvent, startGameEventCoordinator } from '../gameEventCoordinator';

const session = {
  sessionId: '123e4567-e89b-42d3-a456-426614174000',
  level: 'A1' as const,
};
const completion = {
  type: 'reviewCompleted',
  eventVersion: 1,
  bridgeVersion: 1,
  sessionId: session.sessionId,
  level: session.level,
  targetCount: 3,
};

beforeEach(() => {
  jest.clearAllMocks();
  listener = undefined;
  mockRecordDailyStudyAction.mockResolvedValue({ didIncrement: true });
  mockOnGameEvent.mockImplementation((callback) => {
    listener = callback;
    return { remove: mockRemove };
  });
});

it('accepts only the minimum typed lifecycle events', () => {
  expect(parseGameLifecycleEvent(JSON.stringify(completion))).toEqual(completion);
  expect(
    parseGameLifecycleEvent(JSON.stringify({ type: 'finished', sessionId: session.sessionId })),
  ).toEqual({ type: 'finished', sessionId: session.sessionId });
  for (const invalid of [
    '{bad json',
    JSON.stringify({ ...completion, targetCount: 0 }),
    JSON.stringify({ ...completion, score: 10 }),
    JSON.stringify({ ...completion, eventVersion: 2 }),
  ]) {
    expect(parseGameLifecycleEvent(invalid)).toBeNull();
  }
});

it('records only the active session first completion and cleans up on finish', async () => {
  const stop = startGameEventCoordinator(session);
  listener?.(JSON.stringify({ ...completion, sessionId: '00000000-0000-4000-8000-000000000000' }));
  listener?.(JSON.stringify({ ...completion, level: 'B1' }));
  listener?.(JSON.stringify(completion));
  listener?.(JSON.stringify(completion));
  await Promise.resolve();

  expect(mockRecordDailyStudyAction).toHaveBeenCalledTimes(1);
  expect(mockRemove).not.toHaveBeenCalled();
  listener?.(JSON.stringify({ type: 'finished', sessionId: session.sessionId }));
  expect(mockRemove).toHaveBeenCalledTimes(1);
  stop();
  expect(mockRemove).toHaveBeenCalledTimes(1);
});
