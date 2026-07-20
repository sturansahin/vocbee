import React from 'react';
import type { ThemeColors } from '@shared/theme';
import { LanguageSelectionList } from './LanguageSelectionList';

export interface LanguageOption {
  id: string;
  name: string;
  nativeName: string;
  flagIcon: unknown;
}

export interface NativeLanguageStepProps {
  languages: readonly LanguageOption[];
  selectedLanguage: string;
  colors?: Pick<
    ThemeColors,
    'textPrimary' | 'textSecondary' | 'surface' | 'borderDefault' | 'accent' | 'background'
  >;
  onSelectLanguage: (languageId: string) => void;
}

export function NativeLanguageStep({
  languages,
  selectedLanguage,
  onSelectLanguage,
}: NativeLanguageStepProps) {
  return (
    <LanguageSelectionList
      languages={languages}
      onSelectLanguage={onSelectLanguage}
      selectedLanguage={selectedLanguage}
    />
  );
}

export default NativeLanguageStep;
