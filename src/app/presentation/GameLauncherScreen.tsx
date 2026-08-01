import React, { useEffect, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '@app/navigation/types';
import { launchGameSession } from '@features/game';
import { AppButton, AppHeader, AppText, Screen, Stack } from '@shared/ui';
import { onGameEvent } from '../../../modules/vocbee-unity';

export function GameLauncherScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Game'>>();
  const { t } = useTranslation();
  const [launching, setLaunching] = useState(false);
  const [launchFailed, setLaunchFailed] = useState(false);

  useEffect(() => {
    const subscription = onGameEvent((eventJson) => {
      try {
        const event = JSON.parse(eventJson) as { type?: unknown };
        if (event.type === 'error') setLaunchFailed(true);
      } catch {
        setLaunchFailed(true);
      }
    });
    return () => subscription.remove();
  }, []);

  const launch = async () => {
    setLaunching(true);
    setLaunchFailed(false);
    try {
      await launchGameSession();
    } catch {
      setLaunchFailed(true);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <Screen testID="game-launcher-screen">
      <AppHeader
        backAccessibilityLabel={t('common.back')}
        onBack={() => navigation.goBack()}
        title={t('game.title')}
      />
      <Stack align="center" justify="center" style={{ flex: 1 }}>
        <AppText align="center" color="textSecondary">
          {t('game.description')}
        </AppText>
        {launchFailed ? (
          <AppText accessibilityRole="alert" align="center" color="danger">
            {t('game.launchError')}
          </AppText>
        ) : null}
        <AppButton
          fullWidth={false}
          label={t('game.start')}
          leadingIcon={(color) => <MaterialIcons color={color} name="play-arrow" size={22} />}
          loading={launching}
          onPress={launch}
          testID="game-launch"
        />
      </Stack>
    </Screen>
  );
}
