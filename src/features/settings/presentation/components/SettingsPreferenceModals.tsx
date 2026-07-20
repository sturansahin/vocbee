import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { isUserLevel } from '@features/vocabulary';
import { LANGUAGES, LEVELS } from '@shared/i18n';
import { AppModal, SelectionRow } from '@shared/ui';
import type { SettingsScreenController } from '../hooks/useSettingsScreenController';

interface SettingsPreferenceModalsProps {
  controller: SettingsScreenController;
}

export function SettingsPreferenceModals({ controller: c }: SettingsPreferenceModalsProps) {
  const { colors, t } = c;

  const useSystemLanguage = async () => {
    const language = await c.facade.useSystemLanguage();
    c.setSelectedLanguage(language);
    c.setIsSystemLanguage(true);
    c.closeModal();
  };

  const changeLanguage = async (language: string) => {
    c.setSelectedLanguage(language);
    c.setIsSystemLanguage(false);
    await c.facade.changeLanguage(language);
    c.closeModal();
  };

  const changeLevel = async (level: string) => {
    if (!isUserLevel(level)) {
      console.error('Invalid user level selected:', level);
      return;
    }
    if (level === c.currentLevel) {
      c.closeModal();
      return;
    }
    try {
      await c.facade.changeUserLevel(level);
      c.setCurrentLevel(level);
      c.closeModal();
    } catch (error) {
      console.error('Error saving level:', error);
      c.showAlert({
        title: t('common.error'),
        message: t('settings.changeLevelFailed', {
          defaultValue: 'Failed to update level. Please try again.',
        }),
      });
    }
  };

  return (
    <>
      <AppModal
        visible={c.modal === 'language'}
        title={t('settings.selectLanguage')}
        onRequestClose={c.closeModal}
      >
        <View accessibilityRole="radiogroup" style={localStyles.list}>
          <SelectionRow
            label={t('settings.systemDefault')}
            description={c.facade.getDeviceLanguage().toUpperCase()}
            leading={<MaterialIcons name="phone-iphone" size={22} color={colors.accent} />}
            selected={c.isSystemLanguage}
            onPress={() => void useSystemLanguage()}
          />
          {LANGUAGES.map((language) => {
            const selected = !c.isSystemLanguage && c.selectedLanguage === language.code;
            return (
              <SelectionRow
                key={language.id}
                label={language.name}
                description={language.nativeName}
                leading={
                  <Image source={language.flagIcon} style={localStyles.flag} resizeMode="contain" />
                }
                selected={selected}
                onPress={() => void changeLanguage(language.code || 'en')}
              />
            );
          })}
        </View>
      </AppModal>

      <AppModal
        visible={c.modal === 'level'}
        title={t('settings.selectLevel')}
        onRequestClose={c.closeModal}
      >
        <View accessibilityRole="radiogroup" style={localStyles.list}>
          {LEVELS.map((level) => (
            <SelectionRow
              key={level.id}
              label={`${t(`level.${level.id}`)} · ${level.range}`}
              description={t(`level.${level.id}Desc`)}
              selected={c.currentLevel === level.id}
              onPress={() => void changeLevel(level.id)}
            />
          ))}
        </View>
      </AppModal>
    </>
  );
}

const localStyles = StyleSheet.create({
  list: {
    gap: 8,
  },
  flag: {
    width: 24,
    height: 18,
    borderRadius: 2,
  },
});
