import React from 'react';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ThemeColors } from '@shared/theme';
import { AppText, Inline, Stack, Surface } from '@shared/ui';

export interface NotificationPermissionStepProps {
  colors?: Pick<ThemeColors, 'textPrimary' | 'textSecondary' | 'accent'>;
}

export function NotificationPermissionStep(_: NotificationPermissionStepProps) {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Surface style={styles.card} tone="muted">
        <Stack gap="xl">
          <Inline>
            <MaterialCommunityIcons name="bell-ring" size={24} />
            <AppText variant="sectionTitle">{t('setup.learnWithReminders')}</AppText>
          </Inline>
          <AppText align="center" color="textSecondary">
            {t('setup.notificationBenefits')}
          </AppText>
          <Stack gap="md">
            {['setup.feature1', 'setup.feature2', 'setup.feature3'].map((key) => (
              <Inline key={key}>
                <MaterialIcons name="check-circle" size={20} />
                <AppText style={styles.feature}>{t(key)}</AppText>
              </Inline>
            ))}
          </Stack>
        </Stack>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 24,
    paddingBottom: 100,
  },
  card: {
    padding: 20,
  },
  feature: {
    flex: 1,
  },
});

export default NotificationPermissionStep;
