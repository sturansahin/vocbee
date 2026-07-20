// src/features/setup/presentation/steps/__tests__/SetupCompleteStep.test.tsx
import React from 'react';
import { fireEvent, render as testingRender } from '@testing-library/react-native';
import { ThemeProvider } from '@shared/theme';
import { SetupCompleteStep } from '../SetupCompleteStep';

const render = (element: React.ReactElement) =>
  testingRender(<ThemeProvider forcedMode="light">{element}</ThemeProvider>);

const colors = {
  textPrimary: '#000',
  accent: '#FFC814',
  surface: '#F5F5F5',
  borderDefault: '#E0E0E0',
};
const frequencyKeys = ['every1hour', 'every2hours', 'every3hours'] as const;

describe('SetupCompleteStep', () => {
  it('renders the frequency label and all frequency options', () => {
    const { getByText } = render(
      <SetupCompleteStep
        colors={colors}
        frequencyKeys={frequencyKeys}
        selectedFrequency="every1hour"
        onSelectFrequency={jest.fn()}
      />,
    );
    expect(getByText('setup.frequency')).toBeTruthy();
    expect(getByText('settings.every1hour')).toBeTruthy();
    expect(getByText('settings.every2hours')).toBeTruthy();
    expect(getByText('settings.every3hours')).toBeTruthy();
  });

  it('calls onSelectFrequency when a frequency row is pressed', () => {
    const onSelectFrequency = jest.fn();
    const { getByText } = render(
      <SetupCompleteStep
        colors={colors}
        frequencyKeys={frequencyKeys}
        selectedFrequency="every1hour"
        onSelectFrequency={onSelectFrequency}
      />,
    );
    fireEvent.press(getByText('settings.every2hours'));
    expect(onSelectFrequency).toHaveBeenCalledWith('every2hours');
  });
});
