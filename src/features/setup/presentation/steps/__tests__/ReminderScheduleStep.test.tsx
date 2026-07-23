import React from 'react';
import { fireEvent, render as testingRender } from '@testing-library/react-native';

import { ThemeProvider } from '@shared/theme';
import { ReminderScheduleStep } from '../ReminderScheduleStep';

const render = (element: React.ReactElement) =>
  testingRender(<ThemeProvider forcedMode="light">{element}</ThemeProvider>);

const timeOptions = ['09:00', '10:00', '20:00', '21:00'] as const;
const frequencyKeys = ['every1hour', 'every2hours', 'every3hours'] as const;

function renderStep(overrides: Partial<React.ComponentProps<typeof ReminderScheduleStep>> = {}) {
  const props: React.ComponentProps<typeof ReminderScheduleStep> = {
    timeOptions,
    frequencyKeys,
    startTime: '09:00',
    endTime: '21:00',
    selectedFrequency: 'every2hours',
    onSelectStartTime: jest.fn(),
    onSelectEndTime: jest.fn(),
    onSelectFrequency: jest.fn(),
    ...overrides,
  };

  return { ...render(<ReminderScheduleStep {...props} />), props };
}

describe('ReminderScheduleStep', () => {
  it('shows the requested defaults in three collapsed rows', () => {
    const { getByText, queryByTestId } = renderStep();

    expect(getByText('09:00')).toBeTruthy();
    expect(getByText('21:00')).toBeTruthy();
    expect(getByText('settings.every2hours')).toBeTruthy();
    expect(queryByTestId('setup-schedule-start-options')).toBeNull();
  });

  it('opens one list at a time and closes it after selection', () => {
    const onSelectStartTime = jest.fn();
    const { getByTestId, queryByTestId } = renderStep({ onSelectStartTime });

    fireEvent.press(getByTestId('setup-schedule-start'));
    expect(getByTestId('setup-schedule-start-options')).toBeTruthy();

    fireEvent.press(getByTestId('setup-schedule-end'));
    expect(queryByTestId('setup-schedule-start-options')).toBeNull();
    expect(getByTestId('setup-schedule-end-options')).toBeTruthy();

    fireEvent.press(getByTestId('setup-schedule-start'));
    fireEvent.press(getByTestId('setup-schedule-start-option-10:00'));
    expect(onSelectStartTime).toHaveBeenCalledWith('10:00');
    expect(queryByTestId('setup-schedule-start-options')).toBeNull();
  });

  it('selects a frequency from its dropdown list', () => {
    const onSelectFrequency = jest.fn();
    const { getByTestId } = renderStep({ onSelectFrequency });

    fireEvent.press(getByTestId('setup-schedule-frequency'));
    fireEvent.press(getByTestId('setup-schedule-frequency-option-every3hours'));

    expect(onSelectFrequency).toHaveBeenCalledWith('every3hours');
  });
});
