// src/features/settings/presentation/sections/__tests__/ProfileSettingsSection.test.tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ProfileSettingsSection } from '../ProfileSettingsSection';

const colors = {
  text: '#000000',
  textSecondary: '#666666',
  surface: '#F5F5F5',
  border: '#E0E0E0',
  primary: '#FFC814',
  background: '#FFFFFF',
};

describe('ProfileSettingsSection', () => {
  it('renders profile name and email', () => {
    const { getByText } = render(
      <ProfileSettingsSection
        profileName="Jane Doe"
        profileEmail="jane@example.com"
        profileImageSource={{ uri: 'https://example.com/avatar.png' }}
        hasCustomImage
        isDarkMode={false}
        colors={colors}
        defaultUsernameLabel="User"
        editProfileLabel="Edit Profile"
        onPressAvatar={jest.fn()}
        onPressEditProfile={jest.fn()}
      />,
    );
    expect(getByText('Jane Doe')).toBeTruthy();
    expect(getByText('jane@example.com')).toBeTruthy();
    expect(getByText('Edit Profile')).toBeTruthy();
  });

  it('falls back to defaultUsernameLabel when profileName is empty', () => {
    const { getByText } = render(
      <ProfileSettingsSection
        profileName=""
        profileEmail="jane@example.com"
        profileImageSource={{ uri: 'https://example.com/avatar.png' }}
        hasCustomImage={false}
        isDarkMode={false}
        colors={colors}
        defaultUsernameLabel="User"
        editProfileLabel="Edit Profile"
        onPressAvatar={jest.fn()}
        onPressEditProfile={jest.fn()}
      />,
    );
    expect(getByText('User')).toBeTruthy();
  });

  it('calls onPressEditProfile when the edit button is pressed', () => {
    const onPressEditProfile = jest.fn();
    const { getByText } = render(
      <ProfileSettingsSection
        profileName="Jane"
        profileEmail="jane@example.com"
        profileImageSource={{ uri: 'https://example.com/avatar.png' }}
        hasCustomImage
        isDarkMode={false}
        colors={colors}
        defaultUsernameLabel="User"
        editProfileLabel="Edit Profile"
        onPressAvatar={jest.fn()}
        onPressEditProfile={onPressEditProfile}
      />,
    );
    fireEvent.press(getByText('Edit Profile'));
    expect(onPressEditProfile).toHaveBeenCalledTimes(1);
  });
});
