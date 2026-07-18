// src/features/setup/presentation/steps/__tests__/TargetLanguageStep.test.tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { TargetLanguageStep } from '../TargetLanguageStep';

const colors = {
  text: '#000',
  textSecondary: '#666',
  surface: '#F5F5F5',
  border: '#E0E0E0',
  primary: '#FFC814',
  background: '#fff',
};

const languages = [
  { id: 'english', name: 'English', nativeName: 'The English Language', flagIcon: 1 },
  { id: 'turkish', name: 'Turkish', nativeName: 'Türkçe', flagIcon: 2 },
];

describe('TargetLanguageStep', () => {
  it('excludes the native language from the list', () => {
    const { getByText, queryByText } = render(
      <TargetLanguageStep
        languages={languages}
        nativeLanguage="turkish"
        selectedLanguage=""
        colors={colors}
        onSelectLanguage={jest.fn()}
      />,
    );
    expect(getByText('English')).toBeTruthy();
    expect(queryByText('Turkish')).toBeNull();
  });

  it('calls onSelectLanguage with the pressed language id', () => {
    const onSelectLanguage = jest.fn();
    const { getByText } = render(
      <TargetLanguageStep
        languages={languages}
        nativeLanguage="turkish"
        selectedLanguage=""
        colors={colors}
        onSelectLanguage={onSelectLanguage}
      />,
    );
    fireEvent.press(getByText('English'));
    expect(onSelectLanguage).toHaveBeenCalledWith('english');
  });
});
