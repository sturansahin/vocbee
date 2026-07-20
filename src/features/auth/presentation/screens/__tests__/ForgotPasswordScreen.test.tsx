import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@shared/theme';

import ForgotPasswordScreen from '../ForgotPasswordScreen';

const mockGoBack = jest.fn();
const mockResetPassword = jest.fn();
const mockShowAlert = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock('@shared/ui', () => {
  return {
    ...jest.requireActual('@shared/ui'),
    useAlert: () => ({ showAlert: mockShowAlert }),
  };
});

jest.mock('../../AuthProvider', () => ({
  useAuth: () => ({ resetPassword: mockResetPassword }),
}));

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows success and returns to login after reset email is sent', async () => {
    mockResetPassword.mockResolvedValue(undefined);
    const { getByPlaceholderText, getByText } = render(
      <ThemeProvider forcedMode="light">
        <ForgotPasswordScreen />
      </ThemeProvider>,
    );

    fireEvent.changeText(getByPlaceholderText('auth.enterEmail'), 'bee@example.com');
    fireEvent.press(getByText('forgotPassword.sendResetLink'));

    await waitFor(() => expect(mockResetPassword).toHaveBeenCalledWith('bee@example.com'));
    const successAlert = mockShowAlert.mock.calls[mockShowAlert.mock.calls.length - 1]?.[0];
    expect(successAlert.title).toBe('forgotPassword.emailSent');
    successAlert.buttons[0].onPress();
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows the facade error without navigating', async () => {
    mockResetPassword.mockRejectedValue(new Error('Reset failed'));
    const { getByPlaceholderText, getByText } = render(
      <ThemeProvider forcedMode="dark">
        <ForgotPasswordScreen />
      </ThemeProvider>,
    );

    fireEvent.changeText(getByPlaceholderText('auth.enterEmail'), 'bee@example.com');
    fireEvent.press(getByText('forgotPassword.sendResetLink'));

    await waitFor(() =>
      expect(mockShowAlert).toHaveBeenLastCalledWith({
        title: 'auth.error',
        message: 'Reset failed',
      }),
    );
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('blocks repeated submit while the request is loading', async () => {
    let resolveRequest: (() => void) | undefined;
    mockResetPassword.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const { getByPlaceholderText, getByTestId } = render(
      <ThemeProvider forcedMode="light">
        <ForgotPasswordScreen />
      </ThemeProvider>,
    );
    fireEvent.changeText(getByPlaceholderText('auth.enterEmail'), 'bee@example.com');

    fireEvent.press(getByTestId('forgot-password-submit'));
    fireEvent.press(getByTestId('forgot-password-submit'));
    expect(mockResetPassword).toHaveBeenCalledTimes(1);

    resolveRequest?.();
    await waitFor(() => expect(mockShowAlert).toHaveBeenCalled());
  });
});
