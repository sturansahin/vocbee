// src/features/setup/presentation/steps/TargetLanguageStep.tsx
// Pure UI extraction of SetupScreens.tsx renderStep2Content (target language picker).
// No behavior change: same filtered list (excludes native language), same selection callback,
// same styles (verbatim, shared visual language with NativeLanguageStep).

import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONT_FAMILY } from '@shared/theme';
import type { LanguageOption } from './NativeLanguageStep';

export interface TargetLanguageStepProps {
  languages: readonly LanguageOption[];
  nativeLanguage: string;
  selectedLanguage: string;
  colors: { text: string; textSecondary: string; surface: string; border: string; primary: string; background: string };
  onSelectLanguage: (languageId: string) => void;
}

export const TargetLanguageStep: React.FC<TargetLanguageStepProps> = ({
  languages,
  nativeLanguage,
  selectedLanguage,
  colors,
  onSelectLanguage,
}) => (
  <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
    <View style={styles.languageList}>
      {languages.filter((l) => l.id !== nativeLanguage).map((lang) => (
        <TouchableOpacity
          key={lang.id}
          onPress={() => onSelectLanguage(lang.id)}
          style={[
            styles.languageItem,
            { backgroundColor: colors.surface, borderColor: colors.border },
            selectedLanguage === lang.id && [styles.languageItemSelected, { borderColor: colors.primary }],
          ]}
        >
          <Image
            source={lang.flagIcon as never}
            style={{ width: 32, height: 32, borderRadius: 4 }}
            resizeMode="contain"
          />
          <View style={styles.languageInfo}>
            <Text style={[styles.languageName, { color: colors.text }]}>{lang.name}</Text>
            <Text style={[styles.languageNative, { color: colors.textSecondary }]}>{lang.nativeName}</Text>
          </View>
          {selectedLanguage === lang.id && (
            <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="check" size={16} color={colors.background} />
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  </ScrollView>
);

// Styles copied VERBATIM from screens/SetupScreens.tsx (languageList/languageItem/... block).
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  languageList: {
    gap: 12,
    paddingBottom: 100,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  languageItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  languageInfo: {
    flex: 1,
    marginLeft: 20,
  },
  languageName: {
    fontFamily: FONT_FAMILY,
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  languageNative: {
    fontFamily: FONT_FAMILY,
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TargetLanguageStep;
