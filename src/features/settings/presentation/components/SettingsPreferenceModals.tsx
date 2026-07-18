import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { isUserLevel } from '@features/vocabulary';
import { LANGUAGES, LEVELS } from '@shared/i18n';

import type { SettingsScreenController } from '../hooks/useSettingsScreenController';
import { settingsStyles as styles } from './settingsScreenStyles';

interface SettingsPreferenceModalsProps {
  controller: SettingsScreenController;
}

export function SettingsPreferenceModals({ controller: c }: SettingsPreferenceModalsProps) {
  const { colors, t } = c;
  const modalStyle = { backgroundColor: colors.surface, borderColor: colors.border };

  const useSystemLanguage = async () => {
    const language = await c.facade.useSystemLanguage();
    c.setSelectedLanguage(language);
    c.setIsSystemLanguage(true);
    c.setShowLanguagePicker(false);
  };

  const changeLanguage = async (language: string) => {
    c.setSelectedLanguage(language);
    c.setIsSystemLanguage(false);
    await c.facade.changeLanguage(language);
    c.setShowLanguagePicker(false);
  };

  const changeLevel = async (level: string) => {
    if (!isUserLevel(level)) {
      console.error('Invalid user level selected:', level);
      return;
    }
    if (level === c.currentLevel) {
      c.setShowLevelPicker(false);
      return;
    }
    try {
      await c.facade.changeUserLevel(level);
      c.setCurrentLevel(level);
      c.setShowLevelPicker(false);
    } catch (error) {
      console.error('Error saving level:', error);
      c.showAlert?.({
        title: t('common.error'),
        message: t('settings.changeLevelFailed', {
          defaultValue: 'Failed to update level. Please try again.',
        }),
      });
    }
  };

  return (
    <>
      <Modal
        visible={c.showLanguagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => c.setShowLanguagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => c.setShowLanguagePicker(false)}
          />
          <View style={[styles.modalContent, modalStyle, { maxHeight: '70%' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('settings.selectLanguage')}
            </Text>
            <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  { borderBottomColor: colors.border },
                  c.isSystemLanguage && { backgroundColor: `${colors.primary}20` },
                ]}
                onPress={() => void useSystemLanguage()}
              >
                <View style={rowStyle}>
                  <MaterialIcons name="phone-iphone" size={22} color={colors.primary} />
                  <Text
                    style={[
                      styles.pickerItemText,
                      { color: c.isSystemLanguage ? colors.primary : colors.text },
                    ]}
                  >
                    {t('settings.systemDefault')}
                  </Text>
                  <Text
                    style={[
                      styles.pickerItemNativeName,
                      {
                        color: c.isSystemLanguage ? colors.primary : colors.textSecondary,
                      },
                    ]}
                  >
                    {' '}
                    ({c.facade.getDeviceLanguage().toUpperCase()})
                  </Text>
                </View>
              </TouchableOpacity>
              {LANGUAGES.map((language) => {
                const selected = !c.isSystemLanguage && c.selectedLanguage === language.code;
                return (
                  <TouchableOpacity
                    key={language.id}
                    style={[
                      styles.pickerItem,
                      { borderBottomColor: colors.border },
                      selected && { backgroundColor: `${colors.primary}20` },
                    ]}
                    onPress={() => void changeLanguage(language.code || 'en')}
                  >
                    <View style={rowStyle}>
                      <Image source={language.flagIcon} style={flagStyle} resizeMode="contain" />
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: selected ? colors.primary : colors.text },
                        ]}
                      >
                        {language.name}
                      </Text>
                      <Text
                        style={[
                          styles.pickerItemNativeName,
                          { color: selected ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        {' '}
                        ({language.nativeName})
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={c.showLevelPicker}
        transparent
        animationType="fade"
        onRequestClose={() => c.setShowLevelPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => c.setShowLevelPicker(false)} />
          <View style={[styles.modalContent, modalStyle, { maxHeight: '70%' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('settings.selectLevel')}
            </Text>
            <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
              {LEVELS.map((level) => {
                const selected = c.currentLevel === level.id;
                return (
                  <TouchableOpacity
                    key={level.id}
                    style={[
                      styles.levelPickerItem,
                      selected && { backgroundColor: `${colors.primary}20` },
                    ]}
                    onPress={() => void changeLevel(level.id)}
                  >
                    <View style={styles.levelPickerRow}>
                      <View style={{ flex: 1 }}>
                        <View style={levelTitleRowStyle}>
                          <Text
                            style={[
                              styles.levelPickerTitle,
                              { color: selected ? colors.primary : colors.text },
                            ]}
                          >
                            {t(`level.${level.id}`)}
                          </Text>
                          <View
                            style={[styles.levelBadge, { backgroundColor: `${colors.primary}33` }]}
                          >
                            <Text style={[styles.levelRange, { color: colors.primary }]}>
                              {level.range}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.levelPickerDesc,
                            {
                              color: selected ? colors.primary : colors.textSecondary,
                            },
                          ]}
                        >
                          {t(`level.${level.id}Desc`)}
                        </Text>
                      </View>
                      {selected && <MaterialIcons name="check" size={24} color={colors.primary} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const rowStyle = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 };
const flagStyle = { width: 24, height: 18, borderRadius: 2 };
const levelTitleRowStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 10,
  marginBottom: 4,
};
