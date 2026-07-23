import React from 'react';
import { Image, ScrollView, StyleSheet } from 'react-native';
import { SelectionRow } from '@shared/ui';
import type { LanguageOption } from './NativeLanguageStep';

export interface LanguageSelectionListProps {
  languages: readonly LanguageOption[];
  selectedLanguage: string;
  onSelectLanguage: (languageId: string) => void;
}

export function LanguageSelectionList({
  languages,
  selectedLanguage,
  onSelectLanguage,
}: LanguageSelectionListProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {languages.map((language) => (
        <SelectionRow
          description={language.nativeName}
          key={language.id}
          label={language.name}
          leading={
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={language.flagIcon as never}
              style={styles.flag}
            />
          }
          onPress={() => onSelectLanguage(language.id)}
          selected={selectedLanguage === language.id}
          testID={`setup-language-${language.id}`}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    paddingBottom: 16,
  },
  flag: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
});
