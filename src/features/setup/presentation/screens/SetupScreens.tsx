import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import LottieView from 'lottie-react-native';

import { NOTIFICATION_FREQUENCY_KEYS } from '@features/notifications';
import { LANGUAGES, LEVELS } from '@shared/i18n';
import { useReducedMotion, useResponsiveLayout } from '@shared/responsive';
import { useTheme } from '@shared/theme';
import {
  AppButton,
  AppText,
  BottomActionBar,
  IconButton,
  LoadingState,
  ProgressBar,
  Screen,
  Stack,
} from '@shared/ui';

import type { SetupFacade } from '../../application/setupContracts';
import {
  SETUP_TIME_OPTIONS,
  SETUP_TOTAL_STEPS,
  useSetupController,
} from '../hooks/useSetupController';
import {
  LevelStep,
  NativeLanguageStep,
  NotificationPermissionStep,
  ReminderScheduleStep,
  TargetLanguageStep,
} from '../steps';

interface SetupScreenProps {
  facade: SetupFacade;
}

export function SetupScreen({ facade }: SetupScreenProps) {
  const { colors } = useTheme();
  const layout = useResponsiveLayout();
  const reducedMotion = useReducedMotion();
  const controller = useSetupController(facade, reducedMotion);

  const stepContent = {
    1: (
      <NativeLanguageStep
        colors={colors}
        languages={LANGUAGES}
        onSelectLanguage={controller.setNativeLanguage}
        selectedLanguage={controller.nativeLanguage}
      />
    ),
    2: (
      <TargetLanguageStep
        colors={colors}
        languages={LANGUAGES}
        nativeLanguage={controller.nativeLanguage}
        onSelectLanguage={controller.setTargetLanguage}
        selectedLanguage={controller.targetLanguage}
      />
    ),
    3: (
      <LevelStep
        colors={colors}
        levels={LEVELS}
        onPressTakeTest={controller.takeLevelTest}
        onSelectLevel={controller.setLevel}
        selectedLevel={controller.level}
      />
    ),
    4: <NotificationPermissionStep colors={colors} />,
    5: (
      <ReminderScheduleStep
        endTime={controller.endTime}
        frequencyKeys={NOTIFICATION_FREQUENCY_KEYS}
        onSelectEndTime={controller.setEndTime}
        onSelectFrequency={controller.setFrequency}
        onSelectStartTime={controller.setStartTime}
        selectedFrequency={controller.frequency}
        startTime={controller.startTime}
        timeOptions={SETUP_TIME_OPTIONS}
      />
    ),
  } as const;

  return (
    <Screen edges={['top', 'left', 'right']} testID="setup-screen">
      <View style={styles.header}>
        {controller.currentStep > 1 ? (
          <IconButton
            accessibilityLabel="Go to previous setup step"
            icon={(color) => <FontAwesome5 color={color} name="arrow-left" size={18} />}
            onPress={controller.handleBack}
            testID="setup-back"
          />
        ) : (
          <View style={styles.headerSide} />
        )}
        <ProgressBar
          accessibilityLabel={`Setup progress, step ${controller.currentStep} of ${SETUP_TOTAL_STEPS}`}
          style={styles.progress}
          value={controller.currentStep / SETUP_TOTAL_STEPS}
        />
        <View style={styles.headerSide} />
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: reducedMotion ? 1 : controller.fadeAnim,
            paddingTop: layout.isSmallHeight ? 0 : 8,
          },
        ]}
      >
        <Stack gap="xs">
          <AppText accessibilityRole="header" variant="screenTitle">
            {controller.stepTitle.white}
          </AppText>
          {controller.stepTitle.green ? (
            <AppText color="accent" variant="screenTitle">
              {controller.stepTitle.green}
            </AppText>
          ) : null}
        </Stack>
        <View style={styles.step}>
          {stepContent[controller.currentStep as keyof typeof stepContent]}
        </View>
      </Animated.View>

      <BottomActionBar style={styles.bottomBar}>
        <AppButton
          disabled={controller.buttonDisabled}
          label={controller.buttonTitle}
          loading={controller.isGenerating}
          onPress={controller.handleNext}
          testID="setup-next"
        />
      </BottomActionBar>

      {controller.isGenerating ? (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
          {reducedMotion ? (
            <LoadingState title={controller.buttonTitle} />
          ) : (
            <LottieView
              autoPlay
              loop
              ref={controller.lottieRef}
              resizeMode="contain"
              source={controller.animatedAnimation}
              speed={1.5}
              style={styles.lottie}
            />
          )}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    paddingHorizontal: 0,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSide: {
    width: 44,
  },
  progress: {
    flex: 1,
    height: 4,
  },
  content: {
    flex: 1,
    gap: 12,
  },
  step: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: 140,
    height: 132,
  },
});
