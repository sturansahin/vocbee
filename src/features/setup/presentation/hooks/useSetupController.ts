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

const TOTAL_STEPS = 7;
export const SETUP_ITEM_HEIGHT = 44;
export const SETUP_HOURS = Array.from({ length: 24 }, (_, index) =>
  index.toString().padStart(2, '0')
);
export const SETUP_MINUTES = Array.from({ length: 60 }, (_, index) =>
  index.toString().padStart(2, '0')
);
export const SETUP_HOURS_EXTENDED = [...SETUP_HOURS, ...SETUP_HOURS, ...SETUP_HOURS];
export const SETUP_MINUTES_EXTENDED = [
  ...SETUP_MINUTES,
  ...SETUP_MINUTES,
  ...SETUP_MINUTES,
];

const normalizedWheelValue = (offset: number, values: readonly string[]): string => {
  const index = Math.round(offset / SETUP_ITEM_HEIGHT);
  return values[((index % values.length) + values.length) % values.length];
};

export function useSetupController(facade: SetupFacade) {
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
    DEFAULT_NOTIFICATION_FREQUENCY_KEY
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [waitingForSettings, setWaitingForSettings] = useState(false);
  const startHourRef = useRef<any>(null);
  const startMinuteRef = useRef<any>(null);
  const endHourRef = useRef<any>(null);
  const endMinuteRef = useRef<any>(null);
  const lottieRef = useRef<LottieView>(null);
  const progressAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const animatedAnimation = useMemo(
    () => createSwarmAnimation([1, 0.78, 0.08, 1], false),
    []
  );

  const goToStep = (nextStep: number) => {
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
        refreshNotificationSettings
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

  const handleNext = async () => {
    if (currentStep === TOTAL_STEPS) {
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
    } else if (
      (currentStep === 5 || currentStep === 6 || currentStep === 7) &&
      !notificationPermissionGranted
    ) {
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
      .catch(error => console.log('Error checking notification permission:', error));
  }, [facade]);

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: (currentStep / TOTAL_STEPS) * 100,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [currentStep, progressAnim]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep === 5) {
        startHourRef.current?.scrollTo({
          y: (SETUP_HOURS.indexOf(startHour) + SETUP_HOURS.length) * SETUP_ITEM_HEIGHT,
          animated: false,
        });
        startMinuteRef.current?.scrollTo({
          y: (SETUP_MINUTES.indexOf(startMinute) + SETUP_MINUTES.length) * SETUP_ITEM_HEIGHT,
          animated: false,
        });
      } else if (currentStep === 6) {
        endHourRef.current?.scrollTo({
          y: (SETUP_HOURS.indexOf(endHour) + SETUP_HOURS.length) * SETUP_ITEM_HEIGHT,
          animated: false,
        });
        endMinuteRef.current?.scrollTo({
          y: (SETUP_MINUTES.indexOf(endMinute) + SETUP_MINUTES.length) * SETUP_ITEM_HEIGHT,
          animated: false,
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStep, endHour, endMinute, startHour, startMinute]);

  useEffect(() => {
    if (!waitingForSettings || currentStep !== 4) return;
    const interval = setInterval(() => {
      void facade.requestNotificationPermission().then(granted => {
        if (granted) {
          setWaitingForSettings(false);
          setNotificationPermissionGranted(true);
          goToStep(5);
        }
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [currentStep, facade, waitingForSettings]);

  const wheelHandler =
    (values: readonly string[], setter: (value: string) => void, ref: React.RefObject<any>) =>
    (event: any) => {
      const y = event.nativeEvent.contentOffset.y;
      setter(normalizedWheelValue(y, values));
      const index = Math.round(y / SETUP_ITEM_HEIGHT);
      const snappedY = index * SETUP_ITEM_HEIGHT;
      if (y !== snappedY) ref.current?.scrollTo({ y: snappedY, animated: true });
    };

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
    startHourRef,
    startMinuteRef,
    endHourRef,
    endMinuteRef,
    setNativeLanguage,
    setTargetLanguage,
    setLevel,
    setFrequency,
    handleNext,
    handleBack,
    handleStartHourScroll: wheelHandler(SETUP_HOURS, setStartHour, startHourRef),
    handleStartMinuteScroll: wheelHandler(SETUP_MINUTES, setStartMinute, startMinuteRef),
    handleEndHourScroll: wheelHandler(SETUP_HOURS, setEndHour, endHourRef),
    handleEndMinuteScroll: wheelHandler(SETUP_MINUTES, setEndMinute, endMinuteRef),
    takeLevelTest: () => navigation.navigate('LevelTest', { nativeLanguage, targetLanguage }),
    buttonDisabled:
      (currentStep === 1 && !nativeLanguage) ||
      (currentStep === 2 && !targetLanguage) ||
      (currentStep === 3 && !level),
    stepTitle: {
      white: t(`setup.step${currentStep}TitleWhite`),
      green: t(`setup.step${currentStep}TitleGreen`),
    },
    stepSubtitle: t(`setup.step${currentStep}Subtitle`),
    buttonTitle:
      currentStep === 4
        ? t('setup.enableNotifications')
        : currentStep === 7
          ? t('setup.startLearning')
          : t('common.continue'),
  };
}
