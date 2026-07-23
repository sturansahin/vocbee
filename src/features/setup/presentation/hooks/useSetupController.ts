import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';

import {
  DEFAULT_NOTIFICATION_FREQUENCY_KEY,
  type NotificationFrequencyKey,
} from '@features/notifications';
import { useAuth } from '@features/auth';
import { useAlert } from '@shared/ui';
import { createSwarmAnimation } from '../../../../../assets/animations/swarmAnimation';
import type { RootStackParamList } from '@app/navigation/types';

import type { SetupFacade } from '../../application/setupContracts';

export const SETUP_TOTAL_STEPS = 5;
export const SETUP_TIME_OPTIONS = Array.from(
  { length: 24 },
  (_, index) => `${index.toString().padStart(2, '0')}:00`,
);

export function useSetupController(facade: SetupFacade, reducedMotion = false) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'NativeLanguage'>>();
  const { showAlert } = useAlert();
  const { refreshNotificationSettings, user } = useAuth();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [level, setLevel] = useState('');
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('21');
  const [endMinute, setEndMinute] = useState('00');
  const [frequency, setFrequency] = useState<NotificationFrequencyKey>(
    DEFAULT_NOTIFICATION_FREQUENCY_KEY,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [waitingForSettings, setWaitingForSettings] = useState(false);
  const lottieRef = useRef<LottieView>(null);
  const progressAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const animatedAnimation = useMemo(() => createSwarmAnimation([1, 0.78, 0.08, 1], false), []);

  const goToStep = (nextStep: number) => {
    if (reducedMotion) {
      setCurrentStep(nextStep);
      fadeAnim.setValue(1);
      return;
    }
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const completeSetup = async () => {
    setIsGenerating(true);
    try {
      await facade.complete(
        {
          nativeLanguage,
          targetLanguage,
          level,
          user: user
            ? {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName,
              }
            : null,
          notificationPermissionGranted,
          startHour,
          startMinute,
          endHour,
          endMinute,
          frequency,
        },
        refreshNotificationSettings,
      );
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (error) {
      console.error('Error saving settings:', error);
      showAlert({ title: t('common.error'), message: t('setup.errorSavingSettings') });
    } finally {
      setIsGenerating(false);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const granted = await facade.requestNotificationPermission();
      if (granted) {
        setNotificationPermissionGranted(true);
        goToStep(5);
        return;
      }
      showAlert({
        title: t('setup.notificationsDisabled'),
        message: t('setup.notificationsDisabledDesc'),
        buttons: [
          {
            text: t('setup.openSettings'),
            onPress: () => {
              setWaitingForSettings(true);
              void facade.openSystemSettings();
            },
          },
          {
            text: t('setup.continueWithout'),
            style: 'cancel',
            onPress: () => {
              setNotificationPermissionGranted(false);
              void completeSetup();
            },
          },
        ],
      });
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setNotificationPermissionGranted(false);
      await completeSetup();
    }
  };

  const setStartTime = (time: string) => {
    const [hour, minute = '00'] = time.split(':');
    setStartHour(hour);
    setStartMinute(minute);
  };

  const setEndTime = (time: string) => {
    const [hour, minute = '00'] = time.split(':');
    setEndHour(hour);
    setEndMinute(minute);
  };

  const handleNext = async () => {
    if (currentStep === SETUP_TOTAL_STEPS) {
      await completeSetup();
    } else if (currentStep === 3) {
      goToStep(notificationPermissionGranted ? 5 : 4);
    } else if (currentStep === 4) {
      await requestNotificationPermission();
    } else {
      goToStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep <= 1) {
      navigation.goBack();
    } else if (currentStep === 5 && !notificationPermissionGranted) {
      goToStep(3);
    } else {
      goToStep(currentStep - 1);
    }
  };

  useEffect(() => {
    if (route.params?.detectedLevel) {
      setLevel(route.params.detectedLevel);
      setCurrentStep(3);
    }
  }, [route.params?.detectedLevel]);

  useEffect(() => {
    facade
      .getNotificationPermissionGranted()
      .then(setNotificationPermissionGranted)
      .catch((error) => console.log('Error checking notification permission:', error));
  }, [facade]);

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: (currentStep / SETUP_TOTAL_STEPS) * 100,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [currentStep, progressAnim]);

  useEffect(() => {
    if (!waitingForSettings || currentStep !== 4) return;
    const interval = setInterval(() => {
      void facade.requestNotificationPermission().then((granted) => {
        if (granted) {
          setWaitingForSettings(false);
          setNotificationPermissionGranted(true);
          goToStep(5);
        }
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [currentStep, facade, waitingForSettings]);

  return {
    currentStep,
    nativeLanguage,
    targetLanguage,
    level,
    frequency,
    isGenerating,
    lottieRef,
    progressWidth: progressAnim.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    }),
    fadeAnim,
    animatedAnimation,
    startTime: `${startHour}:${startMinute}`,
    endTime: `${endHour}:${endMinute}`,
    setNativeLanguage,
    setTargetLanguage,
    setLevel,
    setFrequency,
    setStartTime,
    setEndTime,
    handleNext,
    handleBack,
    takeLevelTest: () => navigation.navigate('LevelTest', { nativeLanguage, targetLanguage }),
    buttonDisabled:
      (currentStep === 1 && !nativeLanguage) ||
      (currentStep === 2 && !targetLanguage) ||
      (currentStep === 3 && !level),
    stepTitle:
      currentStep === 5
        ? { white: t('settings.dailyReminder'), green: '' }
        : {
            white: t(`setup.step${currentStep}TitleWhite`),
            green: t(`setup.step${currentStep}TitleGreen`),
          },
    buttonTitle:
      currentStep === 4
        ? t('setup.enableNotifications')
        : currentStep === SETUP_TOTAL_STEPS
          ? t('setup.startLearning')
          : t('common.continue'),
  };
}
