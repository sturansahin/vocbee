import { act, renderHook } from '@testing-library/react-native';
import { useStreakCelebrationAnimation } from '../useStreakCelebrationAnimation';

describe('useStreakCelebrationAnimation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses a static reduced-motion presentation and completes exactly once', () => {
    const onComplete = jest.fn();
    const { result, unmount } = renderHook(() =>
      useStreakCelebrationAnimation({
        visible: true,
        celebrationKey: 7,
        splitOffset: 64,
        reducedMotion: true,
        onComplete,
      }),
    );

    expect((result.current.values.fireOpacity as any).__getValue()).toBe(1);
    expect((result.current.values.countOpacity as any).__getValue()).toBe(1);
    act(() => {
      jest.advanceTimersByTime(1400);
      jest.runOnlyPendingTimers();
    });
    expect(onComplete).toHaveBeenCalledTimes(1);

    unmount();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
