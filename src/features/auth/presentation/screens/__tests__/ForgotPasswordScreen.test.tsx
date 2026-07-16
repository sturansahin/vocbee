import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ForgotPasswordScreen from '../ForgotPasswordScreen';

const mockGoBack = jest.fn();
const mockResetPassword = jest.fn();
const mockShowAlert = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock('@shared/theme', () => ({
  useTheme: () => ({
    colors: {
      background: '#fff',
      surface: '#f5f5f5',
      border: '#ddd',
      text: '#111',
      textSecondary: '#666',
      primary: '#ffc814',
    },
  }),
  COLORS: {
    background: '#fff',
    primary: '#ffc814',
  },
  FONT_FAMILY: 'System',
}));

jest.mock('@shared/ui', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  return {
    Input: (props: any) => React.createElement(TextInput, props),
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
    const { getByPlaceholderText, getByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('auth.enterEmail'), 'bee@example.com');
    fireEvent.press(getByText('forgotPassword.sendResetLink'));

    await waitFor(() =>
      expect(mockResetPassword).toHaveBeenCalledWith('bee@example.com')
    );
    const successAlert =
      mockShowAlert.mock.calls[mockShowAlert.mock.calls.length - 1]?.[0];
    expect(successAlert.title).toBe('forgotPassword.emailSent');
    successAlert.buttons[0].onPress();
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows the facade error without navigating', async () => {
    mockResetPassword.mockRejectedValue(new Error('Reset failed'));
    const { getByPlaceholderText, getByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('auth.enterEmail'), 'bee@example.com');
    fireEvent.press(getByText('forgotPassword.sendResetLink'));

    await waitFor(() =>
      expect(mockShowAlert).toHaveBeenLastCalledWith({
        title: 'auth.error',
        message: 'Reset failed',
      })
    );
    expect(mockGoBack).not.toHaveBeenCalled();
  });
});
