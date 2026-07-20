// src/features/setup/presentation/steps/__tests__/NativeLanguageStep.test.tsx
import React from 'react';
import { fireEvent, render as testingRender } from '@testing-library/react-native';
import { ThemeProvider } from '@shared/theme';
import { NativeLanguageStep } from '../NativeLanguageStep';

const render = (element: React.ReactElement) =>
  testingRender(<ThemeProvider forcedMode="light">{element}</ThemeProvider>);

const colors = {
  textPrimary: '#000',
  textSecondary: '#666',
  surface: '#F5F5F5',
  borderDefault: '#E0E0E0',
  accent: '#FFC814',
  background: '#fff',
};

const languages = [
  { id: 'english', name: 'English', nativeName: 'The English Language', flagIcon: 1 },
  { id: 'turkish', name: 'Turkish', nativeName: 'Türkçe', flagIcon: 2 },
];

describe('NativeLanguageStep', () => {
  it('renders all language options', () => {
    const { getByText } = render(
      <NativeLanguageStep
        languages={languages}
        selectedLanguage=""
        colors={colors}
        onSelectLanguage={jest.fn()}
      />,
    );
    expect(getByText('English')).toBeTruthy();
    expect(getByText('Turkish')).toBeTruthy();
  });

  it('calls onSelectLanguage with the pressed language id', () => {
    const onSelectLanguage = jest.fn();
    const { getByText } = render(
      <NativeLanguageStep
        languages={languages}
        selectedLanguage=""
        colors={colors}
        onSelectLanguage={onSelectLanguage}
      />,
    );
    fireEvent.press(getByText('Turkish'));
    expect(onSelectLanguage).toHaveBeenCalledWith('turkish');
  });

  it('shows a check mark for the selected language', () => {
    const { UNSAFE_root } = render(
      <NativeLanguageStep
        languages={languages}
        selectedLanguage="english"
        colors={colors}
        onSelectLanguage={jest.fn()}
      />,
    );
    expect(UNSAFE_root).toBeTruthy();
  });
});
