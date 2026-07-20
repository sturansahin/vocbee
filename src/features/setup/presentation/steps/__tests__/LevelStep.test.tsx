// src/features/setup/presentation/steps/__tests__/LevelStep.test.tsx
import React from 'react';
import { fireEvent, render as testingRender } from '@testing-library/react-native';
import { ThemeProvider } from '@shared/theme';
import { LevelStep } from '../LevelStep';

const render = (element: React.ReactElement) =>
  testingRender(<ThemeProvider forcedMode="light">{element}</ThemeProvider>);

const colors = {
  textPrimary: '#000',
  textSecondary: '#666',
  surface: '#F5F5F5',
  borderDefault: '#E0E0E0',
  accent: '#FFC814',
};

const levels = [
  { id: 'beginner', range: 'A1-A2' },
  { id: 'intermediate', range: 'B1-B2' },
];

describe('LevelStep', () => {
  it('renders all level options with their range badge', () => {
    const { getByText } = render(
      <LevelStep
        levels={levels}
        selectedLevel=""
        colors={colors}
        onSelectLevel={jest.fn()}
        onPressTakeTest={jest.fn()}
      />,
    );
    expect(getByText(/A1-A2/)).toBeTruthy();
    expect(getByText(/B1-B2/)).toBeTruthy();
  });

  it('calls onSelectLevel when a level row is pressed', () => {
    const onSelectLevel = jest.fn();
    const { getByTestId } = render(
      <LevelStep
        levels={levels}
        selectedLevel=""
        colors={colors}
        onSelectLevel={onSelectLevel}
        onPressTakeTest={jest.fn()}
      />,
    );
    fireEvent.press(getByTestId('setup-level-intermediate'));
    expect(onSelectLevel).toHaveBeenCalledWith('intermediate');
  });

  it('calls onPressTakeTest when the take-test link is pressed', () => {
    const onPressTakeTest = jest.fn();
    const { getByText } = render(
      <LevelStep
        levels={levels}
        selectedLevel=""
        colors={colors}
        onSelectLevel={jest.fn()}
        onPressTakeTest={onPressTakeTest}
      />,
    );
    fireEvent.press(getByText('setup.takeTest'));
    expect(onPressTakeTest).toHaveBeenCalledTimes(1);
  });
});
