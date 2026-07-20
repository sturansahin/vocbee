import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@shared/theme';
import { ConnectionErrorScreen } from '../ConnectionErrorScreen';

const mockRetryConnection = jest.fn();
const mockAuthState = { isLoading: false };

jest.mock('@features/auth', () => ({
  useAuth: () => ({
    retryConnection: mockRetryConnection,
    isLoading: mockAuthState.isLoading,
  }),
}));

describe('ConnectionErrorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.isLoading = false;
  });

  it('retries through auth and exposes the action label', () => {
    const { getByRole } = render(
      <ThemeProvider forcedMode="light">
        <ConnectionErrorScreen />
      </ThemeProvider>,
    );
    fireEvent.press(getByRole('button', { name: 'connection.retry' }));
    expect(mockRetryConnection).toHaveBeenCalledTimes(1);
  });

  it('publishes busy/disabled state while retrying', () => {
    mockAuthState.isLoading = true;
    const { getByRole } = render(
      <ThemeProvider forcedMode="dark">
        <ConnectionErrorScreen />
      </ThemeProvider>,
    );
    expect(getByRole('button', { name: 'connection.retry' })).toHaveProp('accessibilityState', {
      busy: true,
      disabled: true,
    });
  });
});
