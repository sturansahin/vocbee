import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Linking,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { RootStackParamList } from '../types';
import { Button } from '../components/UIComponents';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LANGUAGES, LEVELS, COLORS } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { FONT_FAMILY } from '../utils/typography';
import { generateVocabulary, getFirstLevelForUserLevel } from '../services/vocabularyService';
import { setCurrentLevel, resetProgress } from '../services/progressService';
import {
  requestNotificationPermissions,
  saveNotificationSettings,
  scheduleVocabularyNotifications,
} from '../services/notificationService';
import { useAlert } from '../components/CustomAlert';
import { useAuth } from '../context/AuthContext';
import { SwarmLogo } from '../components/SwarmLogo';
import LottieView from 'lottie-react-native';
import { createSwarmAnimation } from '../assets/animations/swarmAnimation';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';

type SetupNavProp = StackNavigationProp<RootStackParamList>;
type SetupRouteProp = RouteProp<RootStackParamList, 'NativeLanguage'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Constants for time picker
const HOURS_LIST = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES_LIST = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const HOURS_EXTENDED = [...HOURS_LIST, ...HOURS_LIST, ...HOURS_LIST];
const MINUTES_EXTENDED = [...MINUTES_LIST, ...MINUTES_LIST, ...MINUTES_LIST];
const FREQUENCIES = ['Every 30 minutes', 'Every hour', 'Every 2 hours'];
const ITEM_HEIGHT = 44;

// Unified Setup Screen with Steps (5 steps: language -> language -> level -> notifications -> schedule)
export const SetupScreen = () => {
  const navigation = useNavigation<SetupNavProp>();
  const route = useRoute<SetupRouteProp>();
  const { colors, isDarkMode } = useTheme();
  const { showAlert } = useAlert();
  const { refreshNotificationSettings } = useAuth();
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
  const [frequency, setFrequency] = useState('Every 2 hours');
  const [isGenerating, setIsGenerating] = useState(false);
  const [waitingForSettings, setWaitingForSettings] = useState(false);

  // Wheel picker refs
  const startHourRef = useRef<any>(null);
  const startMinuteRef = useRef<any>(null);
  const endHourRef = useRef<any>(null);
  const endMinuteRef = useRef<any>(null);

  // Animated values
  const progressAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const beeRotation = useRef(new Animated.Value(0)).current;
  const beeBounce = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef<LottieView>(null);

  // Yellow bee color for Lottie animation
  const beeColor: [number, number, number, number] = [1, 0.78, 0.08, 1]; // #FFC814
  const animatedAnimation = React.useMemo(() => createSwarmAnimation(beeColor, false), []);

  const totalSteps = 7; // 7 steps: native -> target -> level -> notifications -> start time -> end time -> frequency

  // Handle detected level from quiz
  useEffect(() => {
    if (route.params?.detectedLevel) {
      setLevel(route.params.detectedLevel);
      setCurrentStep(3);
    }
  }, [route.params]);

  // Check notification permission on mount
  useEffect(() => {
    const checkExistingPermission = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'granted') {
          setNotificationPermissionGranted(true);
        }
      } catch (error) {
        console.log('Error checking notification permission:', error);
      }
    };
    checkExistingPermission();
  }, []);

  // Animate progress bar when step changes
  useEffect(() => {
    const targetProgress = (currentStep / totalSteps) * 100;
    Animated.spring(progressAnim, {
      toValue: targetProgress,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [currentStep]);

  // Auto-scroll wheel pickers on step 5 (start time) and step 6 (end time)
  useEffect(() => {
    if (currentStep === 5) {
      setTimeout(() => {
        const startHourIndex = HOURS_LIST.indexOf(startHour) + HOURS_LIST.length;
        const startMinuteIndex = MINUTES_LIST.indexOf(startMinute) + MINUTES_LIST.length;
        startHourRef.current?.scrollTo({ y: startHourIndex * ITEM_HEIGHT, animated: false });
        startMinuteRef.current?.scrollTo({ y: startMinuteIndex * ITEM_HEIGHT, animated: false });
      }, 100);
    }
    if (currentStep === 6) {
      setTimeout(() => {
        const endHourIndex = HOURS_LIST.indexOf(endHour) + HOURS_LIST.length;
        const endMinuteIndex = MINUTES_LIST.indexOf(endMinute) + MINUTES_LIST.length;
        endHourRef.current?.scrollTo({ y: endHourIndex * ITEM_HEIGHT, animated: false });
        endMinuteRef.current?.scrollTo({ y: endMinuteIndex * ITEM_HEIGHT, animated: false });
      }, 100);
    }
  }, [currentStep]);

  // Poll for notification permission every 2 seconds when waiting
  useEffect(() => {
    if (!waitingForSettings || currentStep !== 4) return;

    const checkPermission = async () => {
      const granted = await requestNotificationPermissions();
      if (granted) {
        setWaitingForSettings(false);
        setNotificationPermissionGranted(true);
        goToStep(5);
      }
    };

    const interval = setInterval(checkPermission, 2000);
    return () => clearInterval(interval);
  }, [waitingForSettings, currentStep]);

  // Bee animation for loading
  useEffect(() => {
    if (isGenerating) {
      // Start wing flapping animation (rotation)
      const rotateAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(beeRotation, {
            toValue: 1,
            duration: 150,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(beeRotation, {
            toValue: -1,
            duration: 150,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(beeRotation, {
            toValue: 0,
            duration: 150,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );

      // Start bounce animation
      const bounceAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(beeBounce, {
            toValue: -10,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(beeBounce, {
            toValue: 10,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      rotateAnimation.start();
      bounceAnimation.start();

      return () => {
        rotateAnimation.stop();
        bounceAnimation.stop();
        beeRotation.setValue(0);
        beeBounce.setValue(0);
      };
    }
  }, [isGenerating]);

  const goToStep = (newStep: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(newStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const getFrequencyMinutes = (freq: string): number => {
    switch (freq) {
      case 'Every 30 minutes': return 30;
      case 'Every hour': return 60;
      default: return 120;
    }
  };

  const handleNotificationPermission = async () => {
    try {
      const granted = await requestNotificationPermissions();
      console.log('Notification permission result:', granted);

      if (granted) {
        setNotificationPermissionGranted(true);
        goToStep(5);
      } else {
        // Show themed alert with options
        showAlert({
          title: t('setup.notificationsDisabled'),
          message: t('setup.notificationsDisabledDesc'),
          buttons: [
            {
              text: t('setup.openSettings'),
              onPress: () => {
                setWaitingForSettings(true);
                Linking.openSettings();
              }
            },
            {
              text: t('setup.continueWithout'),
              style: 'cancel',
              onPress: () => {
                setNotificationPermissionGranted(false);
                handleFinalStep();
              }
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      // Continue without notifications on error
      setNotificationPermissionGranted(false);
      handleFinalStep();
    }
  };

  const handleFinalStep = async () => {
    setIsGenerating(true);
    try {
      // Save user level to AsyncStorage
      await AsyncStorage.setItem('@user_level', level);

      // Get initial level based on user selection
      const initialLevel = getFirstLevelForUserLevel(level);

      // Save preferences and progress to Firestore
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Save email to AsyncStorage
        await AsyncStorage.setItem('@profile_email', currentUser.email || '');

        // Save name from Firebase Auth displayName
        if (currentUser.displayName) {
          await AsyncStorage.setItem('@profile_name', currentUser.displayName);
        }

        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, {
          setupCompleted: true,
          preferences: {
            nativeLanguage: nativeLanguage,
            targetLanguage: targetLanguage,
            level: level,
          },
          progress: {
            currentLevel: initialLevel,
            learnedWords: {},
            skippedWords: {},
            lastSync: serverTimestamp(),
          },
          notificationSettings: notificationPermissionGranted ? {
            enabled: true,
            startHour: parseInt(startHour),
            startMinute: parseInt(startMinute),
            endHour: parseInt(endHour),
            endMinute: parseInt(endMinute),
            frequencyMinutes: getFrequencyMinutes(frequency),
          } : { enabled: false },
        }, { merge: true });
        console.log('Saved preferences to Firestore');
      }

      // Save notification settings locally
      if (notificationPermissionGranted) {
        await saveNotificationSettings({
          enabled: true,
          startHour: parseInt(startHour),
          startMinute: parseInt(startMinute),
          endHour: parseInt(endHour),
          endMinute: parseInt(endMinute),
          frequencyMinutes: getFrequencyMinutes(frequency),
          autoMarkLearned: true,
        });
        await scheduleVocabularyNotifications();
      } else {
        // Save disabled state so Settings screen shows correct toggle
        await saveNotificationSettings({
          enabled: false,
        });
      }

      // Refresh AuthContext notification settings to ensure sync
      await refreshNotificationSettings();

      // Generate vocabulary for selected language pair
      await generateVocabulary(nativeLanguage, targetLanguage);

      // Reset local progress to ensure clean slate for new language
      await resetProgress();

      // Set initial level
      await setCurrentLevel(initialLevel);

      console.log(`Vocabulary generated: ${nativeLanguage} -> ${targetLanguage}, starting at ${initialLevel}`);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsGenerating(false);
    }
    navigation.navigate('MainTabs');
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      if (currentStep === 3) {
        // After level selection, check if notification permission already granted
        if (notificationPermissionGranted) {
          // Skip to step 5 (start time) since permission already granted
          goToStep(5);
        } else {
          // Go to notification permission step
          goToStep(4);
        }
      } else if (currentStep === 4) {
        // Request notification permission
        await handleNotificationPermission();
      } else {
        goToStep(currentStep + 1);
      }
    } else {
      // Final step (7) - save everything
      await handleFinalStep();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      if ((currentStep === 5 || currentStep === 6 || currentStep === 7) && !notificationPermissionGranted) {
        goToStep(3); // Skip back to level if no permission
      } else {
        goToStep(currentStep - 1);
      }
    } else {
      navigation.goBack();
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return { white: t('setup.step1TitleWhite'), green: t('setup.step1TitleGreen') };
      case 2: return { white: t('setup.step2TitleWhite'), green: t('setup.step2TitleGreen') };
      case 3: return { white: t('setup.step3TitleWhite'), green: t('setup.step3TitleGreen') };
      case 4: return { white: t('setup.step4TitleWhite'), green: t('setup.step4TitleGreen') };
      case 5: return { white: t('setup.step5TitleWhite'), green: t('setup.step5TitleGreen') };
      case 6: return { white: t('setup.step6TitleWhite'), green: t('setup.step6TitleGreen') };
      case 7: return { white: t('setup.step7TitleWhite'), green: t('setup.step7TitleGreen') };
      default: return { white: "", green: "" };
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1: return t('setup.step1Subtitle');
      case 2: return t('setup.step2Subtitle');
      case 3: return t('setup.step3Subtitle');
      case 4: return t('setup.step4Subtitle');
      case 5: return t('setup.step5Subtitle');
      case 6: return t('setup.step6Subtitle');
      case 7: return t('setup.step7Subtitle');
      default: return "";
    }
  };

  const getButtonTitle = () => {
    switch (currentStep) {
      case 1:
      case 2:
      case 3:
      case 5:
      case 6: return t('common.continue');
      case 4: return t('setup.enableNotifications');
      case 7: return t('setup.startLearning');
      default: return t('common.continue');
    }
  };

  const isButtonDisabled = () => {
    switch (currentStep) {
      case 1: return !nativeLanguage;
      case 2: return !targetLanguage;
      case 3: return !level;
      default: return false;
    }
  };

  // Render functions for each step
  const renderStep1Content = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.languageList}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.id}
            onPress={() => setNativeLanguage(lang.id)}
            style={[
              styles.languageItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
              nativeLanguage === lang.id && [styles.languageItemSelected, { borderColor: colors.primary }]
            ]}
          >
            <Image
              source={lang.flagIcon}
              style={{ width: 32, height: 32, borderRadius: 4 }}
              resizeMode="contain"
            />
            <View style={styles.languageInfo}>
              <Text style={[styles.languageName, { color: colors.text }]}>{lang.name}</Text>
              <Text style={[styles.languageNative, { color: colors.textSecondary }]}>{lang.nativeName}</Text>
            </View>
            {nativeLanguage === lang.id && (
              <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="check" size={16} color={colors.background} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderStep2Content = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.languageList}>
        {LANGUAGES.filter(l => l.id !== nativeLanguage).map((lang) => (
          <TouchableOpacity
            key={lang.id}
            onPress={() => setTargetLanguage(lang.id)}
            style={[
              styles.languageItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
              targetLanguage === lang.id && [styles.languageItemSelected, { borderColor: colors.primary }]
            ]}
          >
            <Image
              source={lang.flagIcon}
              style={{ width: 32, height: 32, borderRadius: 4 }}
              resizeMode="contain"
            />
            <View style={styles.languageInfo}>
              <Text style={[styles.languageName, { color: colors.text }]}>{lang.name}</Text>
              <Text style={[styles.languageNative, { color: colors.textSecondary }]}>{lang.nativeName}</Text>
            </View>
            {targetLanguage === lang.id && (
              <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="check" size={16} color={colors.background} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderStep3Content = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.levelList}>
        {LEVELS.map((lvl) => (
          <TouchableOpacity
            key={lvl.id}
            onPress={() => setLevel(lvl.id)}
            style={[
              styles.levelItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
              level === lvl.id && [styles.levelItemSelected, { borderColor: colors.primary }]
            ]}
          >
            <View style={styles.levelRow}>
              <View style={[
                styles.levelRadio,
                { borderColor: colors.border },
                level === lvl.id && [styles.levelRadioSelected, { borderColor: colors.primary }]
              ]}>
                {level === lvl.id && <View style={[styles.levelRadioInner, { backgroundColor: colors.primary }]} />}
              </View>
              <View style={styles.levelContent}>
                <View style={styles.levelHeader}>
                  <Text style={[styles.levelTitle, { color: colors.text }]}>{lvl.title}</Text>
                  <View style={[styles.levelBadge, { backgroundColor: `${colors.primary}33` }]}>
                    <Text style={[styles.levelRange, { color: colors.primary }]}>{lvl.range}</Text>
                  </View>
                </View>
                <Text style={[styles.levelDesc, { color: colors.textSecondary }]}>{lvl.description}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.testLink}
        onPress={() => navigation.navigate('LevelTest')}
      >
        <MaterialIcons name="quiz" size={20} color={colors.textSecondary} />
        <Text style={[styles.testLinkText, { color: colors.textSecondary }]}>{t('setup.takeTest')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep4Content = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.notificationContent}>
        <View style={[styles.featureRow, { marginBottom: 16 }]}>
          <MaterialCommunityIcons name="bell-ring" size={20} color={colors.primary} />
          <Text style={[styles.notificationTitle, { color: colors.text }]}>
            {t('setup.learnWithReminders')}
          </Text>
        </View>
        <Text style={[styles.notificationDesc, { color: colors.textSecondary, textAlign: 'center' }]}>
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

  // Step 5 - Start Time
  const renderStep5Content = () => (
    <View style={[styles.scrollView, { justifyContent: 'center' }]}>
      <View style={styles.scheduleContainer}>
        <View style={[styles.scheduleSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.scheduleLabelRow}>
            <MaterialIcons name="wb-sunny" size={20} color={colors.primary} />
            <Text style={[styles.scheduleLabel, { color: colors.text }]}>{t('setup.startTime')}</Text>
          </View>
          <View style={styles.timePickerRow}>
            {/* Hour */}
            <View style={styles.wheelColumn}>
              <View style={styles.wheelScrollWrapper}>
                <View style={[styles.wheelCenterIndicator, { borderColor: colors.primary }]} pointerEvents="none" />
                <ScrollView
                  ref={startHourRef}
                  style={styles.wheelScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.wheelScrollContent}
                  decelerationRate="fast"
                  nestedScrollEnabled={true}
                  snapToInterval={ITEM_HEIGHT}
                  onMomentumScrollEnd={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    const index = Math.round(y / ITEM_HEIGHT);
                    const actualIndex = ((index % HOURS_LIST.length) + HOURS_LIST.length) % HOURS_LIST.length;
                    setStartHour(HOURS_LIST[actualIndex]);
                    const snappedY = index * ITEM_HEIGHT;
                    if (y !== snappedY) {
                      startHourRef.current?.scrollTo({ y: snappedY, animated: true });
                    }
                  }}
                >
                  {HOURS_EXTENDED.map((hour, idx) => (
                    <View key={`sh-${idx}`} style={styles.wheelItem}>
                      <Text style={[styles.wheelItemText, { color: colors.text }]}>{hour}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
            <Text style={[styles.timeSeparator, { color: colors.text }]}>:</Text>
            {/* Minute */}
            <View style={styles.wheelColumn}>
              <View style={styles.wheelScrollWrapper}>
                <View style={[styles.wheelCenterIndicator, { borderColor: colors.primary }]} pointerEvents="none" />
                <ScrollView
                  ref={startMinuteRef}
                  style={styles.wheelScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.wheelScrollContent}
                  decelerationRate="fast"
                  nestedScrollEnabled={true}
                  snapToInterval={ITEM_HEIGHT}
                  onMomentumScrollEnd={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    const index = Math.round(y / ITEM_HEIGHT);
                    const actualIndex = ((index % MINUTES_LIST.length) + MINUTES_LIST.length) % MINUTES_LIST.length;
                    setStartMinute(MINUTES_LIST[actualIndex]);
                    const snappedY = index * ITEM_HEIGHT;
                    if (y !== snappedY) {
                      startMinuteRef.current?.scrollTo({ y: snappedY, animated: true });
                    }
                  }}
                >
                  {MINUTES_EXTENDED.map((minute, idx) => (
                    <View key={`sm-${idx}`} style={styles.wheelItem}>
                      <Text style={[styles.wheelItemText, { color: colors.text }]}>{minute}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  // Step 6 - End Time
  const renderStep6Content = () => (
    <View style={[styles.scrollView, { justifyContent: 'center' }]}>
      <View style={styles.scheduleContainer}>
        <View style={[styles.scheduleSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.scheduleLabelRow}>
            <MaterialIcons name="nightlight-round" size={20} color={colors.primary} />
            <Text style={[styles.scheduleLabel, { color: colors.text }]}>{t('setup.endTime')}</Text>
          </View>
          <View style={styles.timePickerRow}>
            {/* Hour */}
            <View style={styles.wheelColumn}>
              <View style={styles.wheelScrollWrapper}>
                <View style={[styles.wheelCenterIndicator, { borderColor: colors.primary }]} pointerEvents="none" />
                <ScrollView
                  ref={endHourRef}
                  style={styles.wheelScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.wheelScrollContent}
                  decelerationRate="fast"
                  nestedScrollEnabled={true}
                  snapToInterval={ITEM_HEIGHT}
                  onMomentumScrollEnd={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    const index = Math.round(y / ITEM_HEIGHT);
                    const actualIndex = ((index % HOURS_LIST.length) + HOURS_LIST.length) % HOURS_LIST.length;
                    setEndHour(HOURS_LIST[actualIndex]);
                    const snappedY = index * ITEM_HEIGHT;
                    if (y !== snappedY) {
                      endHourRef.current?.scrollTo({ y: snappedY, animated: true });
                    }
                  }}
                >
                  {HOURS_EXTENDED.map((hour, idx) => (
                    <View key={`eh-${idx}`} style={styles.wheelItem}>
                      <Text style={[styles.wheelItemText, { color: colors.text }]}>{hour}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
            <Text style={[styles.timeSeparator, { color: colors.text }]}>:</Text>
            {/* Minute */}
            <View style={styles.wheelColumn}>
              <View style={styles.wheelScrollWrapper}>
                <View style={[styles.wheelCenterIndicator, { borderColor: colors.primary }]} pointerEvents="none" />
                <ScrollView
                  ref={endMinuteRef}
                  style={styles.wheelScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.wheelScrollContent}
                  decelerationRate="fast"
                  nestedScrollEnabled={true}
                  snapToInterval={ITEM_HEIGHT}
                  onMomentumScrollEnd={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    const index = Math.round(y / ITEM_HEIGHT);
                    const actualIndex = ((index % MINUTES_LIST.length) + MINUTES_LIST.length) % MINUTES_LIST.length;
                    setEndMinute(MINUTES_LIST[actualIndex]);
                    const snappedY = index * ITEM_HEIGHT;
                    if (y !== snappedY) {
                      endMinuteRef.current?.scrollTo({ y: snappedY, animated: true });
                    }
                  }}
                >
                  {MINUTES_EXTENDED.map((minute, idx) => (
                    <View key={`em-${idx}`} style={styles.wheelItem}>
                      <Text style={[styles.wheelItemText, { color: colors.text }]}>{minute}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  // Step 7 - Frequency
  const renderStep7Content = () => (
    <View style={[styles.scrollView, { justifyContent: 'center' }]}>
      <View style={styles.scheduleContainer}>
        <View style={[styles.scheduleSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.scheduleLabelRow}>
            <Feather name="repeat" size={18} color={colors.primary} />
            <Text style={[styles.scheduleLabel, { color: colors.text }]}>{t('setup.frequency')}</Text>
          </View>
          <View style={styles.frequencyList}>
            {FREQUENCIES.map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[
                  styles.frequencyItem,
                  { borderColor: colors.border },
                  frequency === freq && { borderColor: colors.primary, backgroundColor: `${colors.primary}15` }
                ]}
                onPress={() => setFrequency(freq)}
              >
                <Text style={[
                  styles.frequencyText,
                  { color: frequency === freq ? colors.primary : colors.text }
                ]}>{freq}</Text>
                {frequency === freq && (
                  <MaterialIcons name="check" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const insets = useSafeAreaInsets();
  const stepTitle = getStepTitle();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header with animated progress */}
      <View style={styles.headerContainer}>
        {currentStep > 1 ? (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}

        <View style={styles.progressWrapper}>
          <View style={[styles.progressBg, { backgroundColor: colors.surfaceLight }]}>
            <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: colors.primary }]} />
          </View>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* Content with fade animation */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={[styles.titleWhite, { color: colors.text }]}>{stepTitle.white}</Text>
        <Text style={[styles.titleGreen, { color: colors.primary }]}>{stepTitle.green}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{getStepSubtitle()}</Text>

        {currentStep === 1 && renderStep1Content()}
        {currentStep === 2 && renderStep2Content()}
        {currentStep === 3 && renderStep3Content()}
        {currentStep === 4 && renderStep4Content()}
        {currentStep === 5 && renderStep5Content()}
        {currentStep === 6 && renderStep6Content()}
        {currentStep === 7 && renderStep7Content()}
      </Animated.View>

      <View style={[styles.bottomButton, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title={getButtonTitle()}
          onPress={handleNext}
          disabled={isButtonDisabled()}
        />
      </View>

      {/* Loading Overlay */}
      {isGenerating && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
          <View style={styles.beeContainer}>
            <LottieView
              ref={lottieRef}
              source={animatedAnimation}
              style={styles.lottieAnimation}
              resizeMode="contain"
              loop={true}
              autoPlay={true}
              speed={1.5}
            />
          </View>
        </View>
      )}
    </View>
  );
};

// Export individual screens for backward compatibility
export const NativeLanguageScreen = SetupScreen;
export const TargetLanguageScreen = SetupScreen;
export const LevelSelectionScreen = SetupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  progressBg: {
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  titleWhite: {
    fontFamily: FONT_FAMILY,
    color: '#fff',
    fontSize: 28,
  },
  titleGreen: {
    fontFamily: FONT_FAMILY,
    color: COLORS.primary,
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  languageList: {
    gap: 12,
    paddingBottom: 100,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  languageItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  languageInfo: {
    flex: 1,
    marginLeft: 20,
  },
  languageName: {
    fontFamily: FONT_FAMILY,
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  languageNative: {
    fontFamily: FONT_FAMILY,
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelList: {
    gap: 16,
    paddingBottom: 24,
  },
  levelItem: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  levelItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  levelRadio: {
    marginTop: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelRadioSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  levelRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  levelContent: {
    flex: 1,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  levelTitle: {
    fontFamily: FONT_FAMILY,
    color: '#fff',
    fontSize: 18,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  levelRange: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: COLORS.primary,
  },
  levelDesc: {
    fontFamily: FONT_FAMILY,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  testLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginBottom: 80,
  },
  testLinkText: {
    fontFamily: FONT_FAMILY,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 32,
  },
  // Step 4 - Notification Permission
  notificationContent: {
    paddingVertical: 24,
    paddingBottom: 100,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  notificationIconSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  notificationIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
  // Step 5 - Notification Schedule
  scheduleContainer: {
    gap: 16,
    paddingBottom: 120,
  },
  scheduleSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  scheduleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  scheduleLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  wheelColumn: {
    alignItems: 'center',
  },
  wheelScrollWrapper: {
    height: ITEM_HEIGHT * 3,
    width: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  wheelCenterIndicator: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    zIndex: 10,
  },
  wheelScroll: {
    flex: 1,
  },
  wheelScrollContent: {
    paddingVertical: ITEM_HEIGHT,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemText: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
  },
  timeSeparator: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  frequencyList: {
    gap: 8,
  },
  frequencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  frequencyText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  beeContainer: {
    width: 120,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  lottieAnimation: {
    width: 120,
    height: 112,
    marginLeft: 12,  // Compensate for off-center bee in Lottie canvas
  },
});
