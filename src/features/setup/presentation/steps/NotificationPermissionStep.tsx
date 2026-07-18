// src/features/setup/presentation/steps/NotificationPermissionStep.tsx
// Pure UI extraction of SetupScreens.tsx renderStep4Content (notification permission explainer).
// No behavior change: this step is display-only — the actual permission request/alert logic
// (handleNotificationPermission) stays in the parent screen and is triggered by the shared
// bottom "Enable Notifications" button, not by anything inside this component.

import React from 'react';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FONT_FAMILY } from '@shared/theme';

export interface NotificationPermissionStepProps {
  colors: { text: string; textSecondary: string; primary: string };
}

export const NotificationPermissionStep: React.FC<NotificationPermissionStepProps> = ({
  colors,
}) => {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.notificationContent}>
        <View style={[styles.featureRow, { marginBottom: 16 }]}>
          <MaterialCommunityIcons name="bell-ring" size={20} color={colors.primary} />
          <Text style={[styles.notificationTitle, { color: colors.text }]}>
            {t('setup.learnWithReminders')}
          </Text>
        </View>
        <Text
          style={[styles.notificationDesc, { color: colors.textSecondary, textAlign: 'center' }]}
        >
          {t('setup.notificationBenefits')}
        </Text>
        <View style={styles.notificationFeatures}>
          <View style={styles.featureRow}>
            <MaterialIcons name="check-circle" size={20} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.text }]}>{t('setup.feature1')}</Text>
          </View>
          <View style={styles.featureRow}>
            <MaterialIcons name="check-circle" size={20} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.text }]}>{t('setup.feature2')}</Text>
          </View>
          <View style={styles.featureRow}>
            <MaterialIcons name="check-circle" size={20} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.text }]}>{t('setup.feature3')}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

// Styles copied VERBATIM from screens/SetupScreens.tsx (notificationContent/.../featureText block).
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  notificationContent: {
    paddingVertical: 24,
    paddingBottom: 100,
  },
  notificationTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    flex: 1,
  },
  notificationDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  notificationFeatures: {
    alignSelf: 'stretch',
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
  },
});

export default NotificationPermissionStep;
