// src/features/setup/presentation/steps/__tests__/SetupCompleteStep.test.tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SetupCompleteStep } from '../SetupCompleteStep';

const colors = { text: '#000', primary: '#FFC814', surface: '#F5F5F5', border: '#E0E0E0' };
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
