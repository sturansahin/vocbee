import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import LottieView from 'lottie-react-native';

import {
  DEFAULT_NOTIFICATION_FREQUENCY_KEY,
  NOTIFICATION_FREQUENCY_KEYS,
} from '@features/notifications';
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
  SETUP_HOURS_EXTENDED,
  SETUP_MINUTES_EXTENDED,
  useSetupController,
} from '../hooks/useSetupController';
import {
  LevelStep,
  NativeLanguageStep,
  NotificationPermissionStep,
  NotificationScheduleEndStep,
  NotificationScheduleStartStep,
  SetupCompleteStep,
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
      <NotificationScheduleStartStep
        colors={colors}
        hourScrollRef={controller.startHourRef}
        hourValues={SETUP_HOURS_EXTENDED}
        minuteScrollRef={controller.startMinuteRef}
        minuteValues={SETUP_MINUTES_EXTENDED}
        onHourMomentumScrollEnd={controller.handleStartHourScroll}
        onMinuteMomentumScrollEnd={controller.handleStartMinuteScroll}
      />
    ),
    6: (
      <NotificationScheduleEndStep
        colors={colors}
        hourScrollRef={controller.endHourRef}
        hourValues={SETUP_HOURS_EXTENDED}
        minuteScrollRef={controller.endMinuteRef}
        minuteValues={SETUP_MINUTES_EXTENDED}
        onHourMomentumScrollEnd={controller.handleEndHourScroll}
        onMinuteMomentumScrollEnd={controller.handleEndMinuteScroll}
      />
    ),
    7: (
      <SetupCompleteStep
        colors={colors}
        frequencyKeys={NOTIFICATION_FREQUENCY_KEYS}
        onSelectFrequency={controller.setFrequency}
        selectedFrequency={controller.frequency ?? DEFAULT_NOTIFICATION_FREQUENCY_KEY}
      />
    ),
  } as const;

  return (
    <Screen
      contentStyle={styles.screenContent}
      edges={['top', 'left', 'right']}
      testID="setup-screen"
    >
      <View style={styles.header}>
        {controller.currentStep > 1 ? (
          <IconButton
            accessibilityLabel="Go to previous setup step"
            icon={(color) => <FontAwesome5 color={color} name="arrow-left" size={22} />}
            onPress={controller.handleBack}
            testID="setup-back"
          />
        ) : (
          <View style={styles.headerSide} />
        )}
        <ProgressBar
          accessibilityLabel={`Setup progress, step ${controller.currentStep} of 7`}
          style={styles.progress}
          value={controller.currentStep / 7}
        />
        <View style={styles.headerSide} />
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: reducedMotion ? 1 : controller.fadeAnim,
            paddingTop: layout.isSmallHeight ? 4 : 16,
          },
        ]}
      >
        <Stack gap="xs">
          <AppText accessibilityRole="header" variant="screenTitle">
            {controller.stepTitle.white}
          </AppText>
          <AppText color="accent" variant="screenTitle">
            {controller.stepTitle.green}
          </AppText>
          <AppText color="textSecondary">{controller.stepSubtitle}</AppText>
        </Stack>
        <View style={styles.step}>
          {stepContent[controller.currentStep as keyof typeof stepContent]}
        </View>
      </Animated.View>

      <BottomActionBar>
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
  screenContent: {
    paddingHorizontal: 0,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerSide: {
    width: 44,
  },
  progress: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: 20,
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
