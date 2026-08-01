import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@shared/theme';
import { GameLauncherScreen } from '../GameLauncherScreen';

const mockLaunchGameSession = jest.fn();
const mockOnGameEvent = jest.fn();
const mockRemoveGameEventListener = jest.fn();

jest.mock('@features/game', () => ({
  launchGameSession: () => mockLaunchGameSession(),
}));
jest.mock('../../../../modules/vocbee-unity', () => ({
  onGameEvent: (listener: (eventJson: string) => void) => mockOnGameEvent(listener),
}));

describe('GameLauncherScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnGameEvent.mockReturnValue({ remove: mockRemoveGameEventListener });
  });

  it('shows a recoverable error when the native game cannot launch', async () => {
    mockLaunchGameSession.mockRejectedValueOnce(new Error('Unity unavailable'));
    const screen = render(
      <ThemeProvider forcedMode="light">
        <GameLauncherScreen />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'game.start' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('game.launchError'));
    expect(mockLaunchGameSession).toHaveBeenCalledTimes(1);
  });

  it('shows asynchronous native errors and removes the listener on unmount', () => {
    let listener: (eventJson: string) => void = () => undefined;
    mockOnGameEvent.mockImplementation((next) => {
      listener = next;
      return { remove: mockRemoveGameEventListener };
    });
    const screen = render(
      <ThemeProvider forcedMode="light">
        <GameLauncherScreen />
      </ThemeProvider>,
    );

    act(() => listener('{"type":"error","code":"UNITY_LAUNCH_FAILED"}'));
    expect(screen.getByRole('alert')).toHaveTextContent('game.launchError');

    screen.unmount();
    expect(mockRemoveGameEventListener).toHaveBeenCalledTimes(1);
  });
});
