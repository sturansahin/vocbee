import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton, AppModal, AppText } from '@shared/ui';
import type { SettingsScreenController } from '../hooks/useSettingsScreenController';

const FAQ_KEYS = [
  ...Array.from({ length: 5 }, (_, index) => `help.basics.${index + 1}`),
  ...Array.from({ length: 3 }, (_, index) => `help.levels.${index + 1}`),
  ...Array.from({ length: 2 }, (_, index) => `help.reminders.${index + 1}`),
  ...Array.from({ length: 3 }, (_, index) => `help.data.${index + 1}`),
];

interface SettingsHelpModalProps {
  controller: SettingsScreenController;
}

export function SettingsHelpModal({ controller: c }: SettingsHelpModalProps) {
  return (
    <AppModal
      visible={c.modal === 'help'}
      title={c.t('help.title')}
      onRequestClose={c.closeModal}
      actions={
        <AppButton
          fullWidth={false}
          label={c.t('common.close', { defaultValue: 'Close' })}
          onPress={c.closeModal}
          variant="secondary"
        />
      }
    >
      {FAQ_KEYS.map((key) => {
        const [group, number] = key.replace('help.', '').split('.');
        return (
          <View key={key} style={styles.item}>
            <AppText variant="bodyStrong">{c.t(`help.${group}.q${number}`)}</AppText>
            <AppText color="textSecondary">{c.t(`help.${group}.a${number}`)}</AppText>
          </View>
        );
      })}
      <View style={styles.item}>
        <AppText variant="bodyStrong">{c.t('help.support.title')}</AppText>
        <AppText color="textSecondary">{c.t('help.support.desc')}</AppText>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  item: {
    gap: 8,
    paddingVertical: 8,
  },
});
