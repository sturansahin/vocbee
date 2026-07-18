// src/features/setup/presentation/steps/__tests__/NotificationPermissionStep.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { NotificationPermissionStep } from '../NotificationPermissionStep';

// jest.setup.js globally mocks @expo/vector-icons but does not include MaterialCommunityIcons
// (used by this step for the bell-ring icon) — extend it locally for this suite only.
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

const colors = { text: '#000', textSecondary: '#666', primary: '#FFC814' };

describe('NotificationPermissionStep', () => {
  it('renders the notification benefits copy', () => {
    const { getByText } = render(<NotificationPermissionStep colors={colors} />);
    expect(getByText('setup.learnWithReminders')).toBeTruthy();
    expect(getByText('setup.notificationBenefits')).toBeTruthy();
    expect(getByText('setup.feature1')).toBeTruthy();
    expect(getByText('setup.feature2')).toBeTruthy();
    expect(getByText('setup.feature3')).toBeTruthy();
  });
});
