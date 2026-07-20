import React from 'react';
import type { ThemeColors } from '@shared/theme';
import type { LanguageOption } from './NativeLanguageStep';
import { LanguageSelectionList } from './LanguageSelectionList';

export interface TargetLanguageStepProps {
  languages: readonly LanguageOption[];
  nativeLanguage: string;
  selectedLanguage: string;
  colors?: Pick<
    ThemeColors,
    'textPrimary' | 'textSecondary' | 'surface' | 'borderDefault' | 'accent' | 'background'
  >;
  onSelectLanguage: (languageId: string) => void;
}

export function TargetLanguageStep({
  languages,
  nativeLanguage,
  selectedLanguage,
  onSelectLanguage,
}: TargetLanguageStepProps) {
  return (
    <LanguageSelectionList
      languages={languages.filter((language) => language.id !== nativeLanguage)}
      onSelectLanguage={onSelectLanguage}
      selectedLanguage={selectedLanguage}
    />
  );
}

export default TargetLanguageStep;
