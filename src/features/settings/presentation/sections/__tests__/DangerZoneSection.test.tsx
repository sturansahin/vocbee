// src/features/settings/presentation/sections/__tests__/DangerZoneSection.test.tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { DangerZoneSection, ProgressDangerRows, LogoutButton } from '../DangerZoneSection';

const colors = {
  textSecondary: '#666',
  danger: '#FF0000',
};

describe('ProgressDangerRows', () => {
  it('renders reset progress and delete account rows', () => {
    const { getByText } = render(
      <ProgressDangerRows
        colors={colors}
        isDarkMode={false}
        resetProgressLabel="Reset Progress"
        resetProgressDescription="This cannot be undone"
        onPressResetProgress={jest.fn()}
        deleteAccountLabel="Delete Account"
        onPressDeleteAccount={jest.fn()}
      />,
    );
    expect(getByText('Reset Progress')).toBeTruthy();
    expect(getByText('Delete Account')).toBeTruthy();
  });

  it('calls onPressDeleteAccount when the delete-account row is pressed', () => {
    const onPressDeleteAccount = jest.fn();
    const { getByText } = render(
      <ProgressDangerRows
        colors={colors}
        isDarkMode={false}
        resetProgressLabel="Reset Progress"
        resetProgressDescription="This cannot be undone"
        onPressResetProgress={jest.fn()}
        deleteAccountLabel="Delete Account"
        onPressDeleteAccount={onPressDeleteAccount}
      />,
    );
    fireEvent.press(getByText('Delete Account'));
    expect(onPressDeleteAccount).toHaveBeenCalledTimes(1);
  });
});

describe('LogoutButton', () => {
  it('renders the logout label and calls onPressLogout when pressed', () => {
    const onPressLogout = jest.fn();
    const { getByText } = render(
      <LogoutButton colors={colors} logoutLabel="Log Out" onPressLogout={onPressLogout} />,
    );
    fireEvent.press(getByText('Log Out'));
    expect(onPressLogout).toHaveBeenCalledTimes(1);
  });
});

describe('DangerZoneSection (composed)', () => {
  it('renders reset/delete rows and the logout button together', () => {
    const { getByText } = render(
      <DangerZoneSection
        colors={colors}
        isDarkMode={false}
        resetProgressLabel="Reset Progress"
        resetProgressDescription="This cannot be undone"
        onPressResetProgress={jest.fn()}
        deleteAccountLabel="Delete Account"
        onPressDeleteAccount={jest.fn()}
        logoutLabel="Log Out"
        onPressLogout={jest.fn()}
      />,
    );
    expect(getByText('Reset Progress')).toBeTruthy();
    expect(getByText('Delete Account')).toBeTruthy();
    expect(getByText('Log Out')).toBeTruthy();
  });
});
