import React from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DEFAULT_NOTIFICATION_FREQUENCY_KEY,
  NOTIFICATION_FREQUENCY_KEYS,
} from '@features/notifications';
import { LANGUAGES, LEVELS } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button } from '@shared/ui';

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
import { setupStyles as styles } from './setupStyles';

interface SetupScreenProps {
  facade: SetupFacade;
}

export function SetupScreen({ facade }: SetupScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const controller = useSetupController(facade);

  const stepContent = {
    1: (
      <NativeLanguageStep
        languages={LANGUAGES}
        selectedLanguage={controller.nativeLanguage}
        colors={colors}
        onSelectLanguage={controller.setNativeLanguage}
      />
    ),
    2: (
      <TargetLanguageStep
        languages={LANGUAGES}
        nativeLanguage={controller.nativeLanguage}
        selectedLanguage={controller.targetLanguage}
        colors={colors}
        onSelectLanguage={controller.setTargetLanguage}
      />
    ),
    3: (
      <LevelStep
        levels={LEVELS}
        selectedLevel={controller.level}
        colors={colors}
        onSelectLevel={controller.setLevel}
        onPressTakeTest={controller.takeLevelTest}
      />
    ),
    4: <NotificationPermissionStep colors={colors} />,
    5: (
      <NotificationScheduleStartStep
        colors={colors}
        hourValues={SETUP_HOURS_EXTENDED}
        minuteValues={SETUP_MINUTES_EXTENDED}
        hourScrollRef={controller.startHourRef}
        minuteScrollRef={controller.startMinuteRef}
        onHourMomentumScrollEnd={controller.handleStartHourScroll}
        onMinuteMomentumScrollEnd={controller.handleStartMinuteScroll}
      />
    ),
    6: (
      <NotificationScheduleEndStep
        colors={colors}
        hourValues={SETUP_HOURS_EXTENDED}
        minuteValues={SETUP_MINUTES_EXTENDED}
        hourScrollRef={controller.endHourRef}
        minuteScrollRef={controller.endMinuteRef}
        onHourMomentumScrollEnd={controller.handleEndHourScroll}
        onMinuteMomentumScrollEnd={controller.handleEndMinuteScroll}
      />
    ),
    7: (
      <SetupCompleteStep
        colors={colors}
        frequencyKeys={NOTIFICATION_FREQUENCY_KEYS}
        selectedFrequency={controller.frequency ?? DEFAULT_NOTIFICATION_FREQUENCY_KEY}
        onSelectFrequency={controller.setFrequency}
      />
    ),
  } as const;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.headerContainer}>
        {controller.currentStep > 1 ? (
          <TouchableOpacity onPress={controller.handleBack} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
        <View style={styles.progressWrapper}>
          <View style={[styles.progressBg, { backgroundColor: colors.surfaceLight }]}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: controller.progressWidth, backgroundColor: colors.primary },
              ]}
            />
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.View style={[styles.content, { opacity: controller.fadeAnim }]}>
        <Text style={[styles.titleWhite, { color: colors.text }]}>
          {controller.stepTitle.white}
        </Text>
        <Text style={[styles.titleGreen, { color: colors.primary }]}>
          {controller.stepTitle.green}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {controller.stepSubtitle}
        </Text>
        {stepContent[controller.currentStep as keyof typeof stepContent]}
      </Animated.View>

      <View style={[styles.bottomButton, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title={controller.buttonTitle}
          onPress={controller.handleNext}
          disabled={controller.buttonDisabled}
        />
      </View>

      {controller.isGenerating && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
          <View style={styles.beeContainer}>
            <LottieView
              ref={controller.lottieRef}
              source={controller.animatedAnimation}
              style={styles.lottieAnimation}
              resizeMode="contain"
              loop
              autoPlay
              speed={1.5}
            />
          </View>
        </View>
      )}
    </View>
  );
}
