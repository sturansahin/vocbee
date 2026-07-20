import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@features/auth';
import { useTheme } from '@shared/theme';
import { AppButton, AppText, Screen, Stack, Surface } from '@shared/ui';

export function ConnectionErrorScreen() {
  const { colors } = useTheme();
  const { retryConnection, isLoading } = useAuth();
  const { t } = useTranslation();

  return (
    <Screen centered testID="connection-error-screen">
      <Stack align="center" gap="2xl" style={{ width: '100%' }}>
        <Surface
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          tone="muted"
        >
          <MaterialIcons color={colors.danger} name="wifi-off" size={64} />
        </Surface>
        <Stack align="center" gap="md">
          <AppText accessibilityRole="header" align="center" variant="screenTitle">
            {t('connection.title')}
          </AppText>
          <AppText align="center" color="textSecondary">
            {t('connection.message')}
          </AppText>
        </Stack>
        <AppButton
          fullWidth={false}
          label={t('connection.retry')}
          leadingIcon={(color) => <MaterialIcons color={color} name="refresh" size={20} />}
          loading={isLoading}
          onPress={retryConnection}
          testID="connection-retry"
        />
      </Stack>
    </Screen>
  );
}
