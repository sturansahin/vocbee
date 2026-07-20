// src/features/settings/presentation/sections/__tests__/NotificationSettingsSection.test.tsx
import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { NotificationSettingsSection } from '../NotificationSettingsSection';

// jest.setup.js globally mocks @expo/vector-icons but does not include MaterialCommunityIcons/Feather
// (used by this section) — extend it locally for this suite only.
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  Feather: 'Feather',
}));

const colors = {
  textPrimary: '#000',
  textSecondary: '#666',
  surface: '#F5F5F5',
  borderDefault: '#E0E0E0',
  accent: '#FFC814',
};

const baseProps = {
  colors,
  isDarkMode: false,
  preferencesSectionTitle: 'Preferences',
  dailyReminderSectionTitle: 'Daily Reminder',
  notificationActionLabel: 'Notification Action',
  autoMarkLearned: false,
  markAsLearnedLabel: 'Mark as Learned',
  doNotMarkLabel: 'Do Not Mark',
  onPressAutoMarkRow: jest.fn(),
  enableRemindersLabel: 'Enable Reminders',
  reminderEnabled: true,
  renderSwitch: () => <Text testID="fake-switch">SWITCH</Text>,
  startTimeLabel: 'Start Time',
  startHour: '09',
  startMinute: '00',
  onPressStartTime: jest.fn(),
  endTimeLabel: 'End Time',
  endHour: '21',
  endMinute: '00',
  onPressEndTime: jest.fn(),
  frequencyLabel: 'Frequency',
  frequencyValueLabel: 'Every 2 hours',
  onPressFrequency: jest.fn(),
};

describe('NotificationSettingsSection', () => {
  it('renders the auto-mark row with "Do Not Mark" when autoMarkLearned is false', () => {
    const { getByText } = render(<NotificationSettingsSection {...baseProps} />);
    expect(getByText('Do Not Mark')).toBeTruthy();
  });

  it('renders "Mark as Learned" when autoMarkLearned is true', () => {
    const { getByText } = render(<NotificationSettingsSection {...baseProps} autoMarkLearned />);
    expect(getByText('Mark as Learned')).toBeTruthy();
  });

  it('renders time/frequency rows when reminderEnabled is true', () => {
    const { getByText } = render(<NotificationSettingsSection {...baseProps} reminderEnabled />);
    expect(getByText('09:00')).toBeTruthy();
    expect(getByText('21:00')).toBeTruthy();
    expect(getByText('Every 2 hours')).toBeTruthy();
  });

  it('hides time/frequency rows when reminderEnabled is false', () => {
    const { queryByText } = render(
      <NotificationSettingsSection {...baseProps} reminderEnabled={false} />,
    );
    expect(queryByText('Start Time')).toBeNull();
    expect(queryByText('Frequency')).toBeNull();
  });

  it('renders the injected switch component via renderSwitch', () => {
    const { getByTestId } = render(<NotificationSettingsSection {...baseProps} />);
    expect(getByTestId('fake-switch')).toBeTruthy();
  });

  it('calls onPressStartTime when the start-time row is pressed', () => {
    const onPressStartTime = jest.fn();
    const { getByText } = render(
      <NotificationSettingsSection {...baseProps} onPressStartTime={onPressStartTime} />,
    );
    fireEvent.press(getByText('Start Time'));
    expect(onPressStartTime).toHaveBeenCalledTimes(1);
  });
});
