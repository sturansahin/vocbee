// src/features/settings/presentation/sections/LanguageSettingsSection.tsx
// Pure presentational extraction of the language-related settings rows from
// screens/SettingsScreen.tsx (ADIM 3, UI-only section extraction — docs/architecture.md):
// the "Preferences > Language" row (opens the language picker modal) and the "Progress > Change
// Level" + "Progress > Change Language" rows. VERBATIM JSX/styles — no logic. SettingsScreen still
// owns all language/level state and handlers (setShowLanguagePicker, setShowLevelPicker, the
// change-language destructive confirm flow via showAlert).

import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { FONT_FAMILY } from '@shared/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export interface LanguageSettingsSectionProps {
  colors: {
    text: string;
    textSecondary: string;
    surface: string;
    border: string;
    primary: string;
  };
  isDarkMode: boolean;
  preferencesSectionTitle: string;

  languageRowLabel: string;
  isSystemLanguage: boolean;
  systemDefaultLabel: string;
  selectedLanguageFlagIcon: any;
  selectedLanguageName: string | undefined;
  onPressLanguageRow: () => void;

  changeLevelLabel: string;
  currentLevelLabel: string;
  currentLevelRange: string | undefined;
  onPressChangeLevel: () => void;

  changeLanguageLabel: string;
  changeLanguageDescription: string;
  onPressChangeLanguage: () => void;
}

export function LanguageSettingsSection({
  colors,
  isDarkMode,
  preferencesSectionTitle,
  languageRowLabel,
  isSystemLanguage,
  systemDefaultLabel,
  selectedLanguageFlagIcon,
  selectedLanguageName,
  onPressLanguageRow,
}: Pick<
  LanguageSettingsSectionProps,
  | 'colors'
  | 'isDarkMode'
  | 'preferencesSectionTitle'
  | 'languageRowLabel'
  | 'isSystemLanguage'
  | 'systemDefaultLabel'
  | 'selectedLanguageFlagIcon'
  | 'selectedLanguageName'
  | 'onPressLanguageRow'
>) {
  const settingIconStyle = {
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  };

  return (
    <>
      {/* Preferences > Language row */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {preferencesSectionTitle}
      </Text>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomWidth: 0 }]}
          onPress={onPressLanguageRow}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, settingIconStyle]}>
              <Ionicons name="language" size={24} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{languageRowLabel}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {isSystemLanguage ? (
                  <>
                    <MaterialIcons name="phone-iphone" size={12} color={colors.textSecondary} />
                    <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                      {systemDefaultLabel}
                    </Text>
                  </>
                ) : (
                  <>
                    <Image
                      source={selectedLanguageFlagIcon}
                      style={{ width: 12, height: 12, borderRadius: 2 }}
                      resizeMode="contain"
                    />
                    <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                      {selectedLanguageName}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </>
  );
}

/**
 * Bare "Change Level" + "Change Language" rows, meant to be composed by the caller INSIDE its own
 * single "Progress" sectionCard (matching the original SettingsScreen layout exactly — these two
 * rows share one card with the destructive rows rendered by DangerZoneSection). Exported
 * separately from LanguageSettingsSection (which owns its own "Preferences" card) to avoid
 * duplicating a card wrapper that never existed in the original UI.
 */
export function LanguageProgressRows({
  colors,
  isDarkMode,
  changeLevelLabel,
  currentLevelLabel,
  currentLevelRange,
  onPressChangeLevel,
  changeLanguageLabel,
  changeLanguageDescription,
  onPressChangeLanguage,
}: Pick<
  LanguageSettingsSectionProps,
  | 'colors'
  | 'isDarkMode'
  | 'changeLevelLabel'
  | 'currentLevelLabel'
  | 'currentLevelRange'
  | 'onPressChangeLevel'
  | 'changeLanguageLabel'
  | 'changeLanguageDescription'
  | 'onPressChangeLanguage'
>) {
  const settingIconStyle = {
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  };

  return (
    <>
      <TouchableOpacity style={styles.settingItem} onPress={onPressChangeLevel}>
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, settingIconStyle]}>
            <MaterialCommunityIcons name="trophy-outline" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.settingTitle, { color: colors.text }]}>{changeLevelLabel}</Text>
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
              {currentLevelLabel} ({currentLevelRange})
            </Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.settingItem} onPress={onPressChangeLanguage}>
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, settingIconStyle]}>
            <MaterialCommunityIcons name="translate" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.settingTitle, { color: colors.text }]}>{changeLanguageLabel}</Text>
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
              {changeLanguageDescription}
            </Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 8,
  },
  sectionCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
  settingSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(12),
    fontWeight: '500',
    marginTop: 2,
  },
});

export default LanguageSettingsSection;
