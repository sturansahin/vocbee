import React, { useState, useRef, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image, StyleSheet, Modal, Animated, TextInput, Dimensions, Pressable, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { COLORS, LANGUAGES, LEVELS } from '../constants';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useMonetization } from '@features/monetization';
import { FONT_FAMILY } from '../utils/typography';
import { RootStackParamList } from '../types';
import { resetProgress, setCurrentLevel, getCurrentLevel } from '../services/progressService';
import { getFirstLevelForUserLevel, getUserLevelFromCefrLevel, isUserLevel, UserLevel } from '../services/vocabularyService';
import { forceSync } from '../services/SyncService';
import { clearFavoritesOnFirebase } from '../services/favoritesService';
import { clearAllLocalData, STORAGE_KEYS } from '@shared/storage';
import { useAlert } from '../components/CustomAlert';
import * as ImagePicker from 'expo-image-picker';
import {
   getNotificationSettings,
   requestNotificationPermissions,
   scheduleVocabularyNotifications,
   cancelAllNotifications,
   sendTestNotification,
} from '@features/notifications';
import {
   getNotificationFrequencyKey,
   getNotificationFrequencyMinutes,
   NOTIFICATION_FREQUENCY_KEYS,
   NotificationFrequencyKey,
} from '@features/notifications';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { updateProfile } from 'firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import i18n, { getDeviceLanguage, setToDeviceLanguage, isUsingSystemLanguage } from '../services/i18n';
import appConfig from '../app.json';
import { openStoreReviewPage } from '../services/reviewPromptService';
import {
   getProfileImageSource,
   PROFILE_AVATARS,
   ProfileAvatarOption,
} from '../utils/profileAvatar';
// Phase 7 (ADIM 3, docs/refactor-v2/27): pure UI section components extracted from this screen.
// SettingsScreen still owns all state/handlers/modals/business logic; sections only render.
import {
   ProfileSettingsSection,
   PremiumSettingsSection,
   LanguageSettingsSection,
   LanguageProgressRows,
   NotificationSettingsSection,
   ProgressDangerRows,
   LogoutButton,
} from '../src/features/settings/presentation/sections';

// ─────────────────────────────────────────────────────────────────────────────
// Responsive Utilities
// ─────────────────────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 393; // iPhone 14 Pro base width
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;


// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const HOURS_LIST = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES_LIST = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const HOURS_EXTENDED = [...HOURS_LIST, ...HOURS_LIST, ...HOURS_LIST];
const MINUTES_EXTENDED = [...MINUTES_LIST, ...MINUTES_LIST, ...MINUTES_LIST];
const APP_VERSION = Constants.expoConfig?.version ?? appConfig.expo.version;
const AVATAR_COLUMNS = 3;

const chunkItems = <T,>(items: readonly T[], size: number): T[][] => {
   const rows: T[][] = [];
   for (let i = 0; i < items.length; i += size) {
      rows.push(items.slice(i, i + size));
   }
   return rows;
};

const PROFILE_AVATAR_ROWS = chunkItems(PROFILE_AVATARS, AVATAR_COLUMNS);

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedSwitch Component - Unified toggle with variants
// ─────────────────────────────────────────────────────────────────────────────
interface AnimatedSwitchProps {
   value: boolean;
   onToggle: () => void;
   variant?: 'default' | 'theme';
}

const AnimatedSwitch: React.FC<AnimatedSwitchProps> = ({ value, onToggle, variant = 'default' }) => {
   const translateX = useRef(new Animated.Value(value ? 22 : 2)).current;
   const bgColor = useRef(new Animated.Value(value ? 1 : 0)).current;

   useEffect(() => {
      Animated.parallel([
         Animated.spring(translateX, {
            toValue: value ? 22 : 2,
            useNativeDriver: true,
            friction: 8,
            tension: 100,
         }),
         Animated.timing(bgColor, {
            toValue: value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
         }),
      ]).start();
   }, [value, translateX, bgColor]);

   // Colors based on variant
   const activeColor = variant === 'theme' ? '#1a1a1a' : COLORS.primary;
   const backgroundColor = bgColor.interpolate({
      inputRange: [0, 1],
      outputRange: ['#ffffff', activeColor],
   });

   return (
      <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
         <Animated.View style={[
            styles.switchTrack,
            { backgroundColor },
            !value && { borderWidth: 1, borderColor: '#d0d0d0' },
            value && variant === 'theme' && { borderWidth: 1, borderColor: '#444444' }
         ]}>
            <Animated.View style={[styles.switchThumb, { transform: [{ translateX }] }]}>
               {variant === 'theme' && (
                  <MaterialIcons
                     name={value ? 'nightlight-round' : 'wb-sunny'}
                     size={16}
                     color={value ? '#FFD700' : '#FFA500'}
                  />
               )}
            </Animated.View>
         </Animated.View>
      </TouchableOpacity>
   );
};


export default function SettingsScreen() {
   const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
   const { isDarkMode, colors } = useTheme();
   const {
      signOut,
      deleteAccount,
      user,
      profile,
      updateProfileData,
      notificationSettings,
      updateNotificationSettings
   } = useAuth();
   const {
      isAdFree,
      isLoading: isPremiumLoading,
      activeEntitlement,
      presentRemoveAdsPaywall,
      restorePurchases,
      openCustomerCenter,
   } = useMonetization();
   const { showAlert } = useAlert();
   const insets = useSafeAreaInsets();
   const { t } = useTranslation();

   // Initialize state from context (use fallback to context values)
   const [reminderEnabled, setReminderEnabled] = useState(notificationSettings.enabled);
   const [autoMarkLearned, setAutoMarkLearned] = useState(notificationSettings.autoMarkLearned);
   const [startHour, setStartHour] = useState(notificationSettings.startHour.toString().padStart(2, '0'));
   const [startMinute, setStartMinute] = useState(notificationSettings.startMinute.toString().padStart(2, '0'));
   const [endHour, setEndHour] = useState(notificationSettings.endHour.toString().padStart(2, '0'));
   const [endMinute, setEndMinute] = useState(notificationSettings.endMinute.toString().padStart(2, '0'));
   const [frequency, setFrequency] = useState<NotificationFrequencyKey>(
      getNotificationFrequencyKey(notificationSettings.frequencyMinutes)
   );

   const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);
   const [tempHour, setTempHour] = useState('09');
   const [tempMinute, setTempMinute] = useState('00');
   const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
   const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
   const [isSystemLanguage, setIsSystemLanguage] = useState(false);
   const [showLanguagePicker, setShowLanguagePicker] = useState(false);
   const [showHelpModal, setShowHelpModal] = useState(false);
   const [showPrivacyModal, setShowPrivacyModal] = useState(false);
   const [showLevelPicker, setShowLevelPicker] = useState(false);
   const [currentLevel, setCurrentLevelState] = useState<UserLevel>('beginner');
   const [showAutoMarkPicker, setShowAutoMarkPicker] = useState(false);
   const [premiumAction, setPremiumAction] = useState<'paywall' | 'restore' | 'manage' | null>(null);

   // Profile states
   const [showEditProfileModal, setShowEditProfileModal] = useState(false);
   const [showImagePickerModal, setShowImagePickerModal] = useState(false);
   const [showAvatarPickerModal, setShowAvatarPickerModal] = useState(false);

   // Temp states for editing
   const [tempName, setTempName] = useState('');
   const [tempEmail, setTempEmail] = useState('');

   // No Loading state needed!

   const handleRateVocBeePress = async () => {
      const result = await openStoreReviewPage('settings');

      if (!result.opened) {
         showAlert({
            title: t('common.error'),
            message: t('reviewPrompt.storeOpenError', {
               defaultValue: 'We could not open the store review page. Please try again later.',
            }),
         });
      }
   };

   // Sync state when context updates (e.g. initial load finishes)
   useEffect(() => {
      setReminderEnabled(notificationSettings.enabled);
      setAutoMarkLearned(notificationSettings.autoMarkLearned);
      setStartHour(notificationSettings.startHour.toString().padStart(2, '0'));
      setStartMinute(notificationSettings.startMinute.toString().padStart(2, '0'));
      setEndHour(notificationSettings.endHour.toString().padStart(2, '0'));
      setEndMinute(notificationSettings.endMinute.toString().padStart(2, '0'));
      setFrequency(getNotificationFrequencyKey(notificationSettings.frequencyMinutes));
   }, [notificationSettings]);

   // Load current level from AsyncStorage on mount
   useEffect(() => {
      const loadLevel = async () => {
         try {
            const savedUserLevel = await AsyncStorage.getItem(STORAGE_KEYS.USER_LEVEL);
            if (isUserLevel(savedUserLevel)) {
               setCurrentLevelState(savedUserLevel);
               return;
            }

            // Fallback for older installs / fresh login where only CEFR level exists locally.
            const currentCefrLevel = await getCurrentLevel();
            const derivedUserLevel = getUserLevelFromCefrLevel(currentCefrLevel);
            setCurrentLevelState(derivedUserLevel);
            await AsyncStorage.setItem(STORAGE_KEYS.USER_LEVEL, derivedUserLevel);
         } catch (error) {
            console.error('Error loading level:', error);
         }
      };
      loadLevel();
   }, []);

   // Check if using system language on mount
   useEffect(() => {
      const checkSystemLanguage = async () => {
         const isSystem = await isUsingSystemLanguage();
         setIsSystemLanguage(isSystem);
      };
      checkSystemLanguage();
   }, []);

   // Handle reminder toggle with permission request
   const handleReminderToggle = async () => {
      const newValue = !reminderEnabled;
      if (newValue) {
         const granted = await requestNotificationPermissions();
         if (!granted) {
            showAlert({
               title: t('settings.permissionRequired'),
               message: t('settings.enableNotificationsInSettings'),
               buttons: [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                     text: t('settings.openSettings'),
                     onPress: () => Linking.openSettings(),
                  },
               ],
            });
            return;
         }
      }
      setReminderEnabled(newValue);
      updateNotificationSettings({ enabled: newValue }).catch(console.error);
   };

   // Handle auto-mark toggle
   const handleAutoMarkToggle = () => {
      const newValue = !autoMarkLearned;
      setAutoMarkLearned(newValue);
      updateNotificationSettings({ autoMarkLearned: newValue }).catch(console.error);
   };

   // Save time settings
   const saveTimeSettings = async (type: 'start' | 'end', hour: string, minute: string) => {
      if (type === 'start') {
         await updateNotificationSettings({
            startHour: parseInt(hour),
            startMinute: parseInt(minute),
         });
      } else {
         await updateNotificationSettings({
            endHour: parseInt(hour),
            endMinute: parseInt(minute),
         });
      }
   };

   // Save frequency
   const handleFrequencyChange = async (freq: NotificationFrequencyKey) => {
      // setFrequency(freq); // Handled by effect
      await updateNotificationSettings({ frequencyMinutes: getNotificationFrequencyMinutes(freq) });
   };

   // Refs for wheel picker scroll
   const hourScrollRef = useRef<any>(null);
   const minuteScrollRef = useRef<any>(null);
   const ITEM_HEIGHT = 44; // Height of each wheel item

   // Auto-scroll to selected values when picker opens (start from middle section)
   useEffect(() => {
      if (showTimePicker) {
         setTimeout(() => {
            const hourIndex = HOURS_LIST.indexOf(tempHour) + HOURS_LIST.length; // Start from middle section
            const minuteIndex = MINUTES_LIST.indexOf(tempMinute) + MINUTES_LIST.length;
            hourScrollRef.current?.scrollTo({ y: hourIndex * ITEM_HEIGHT, animated: false });
            minuteScrollRef.current?.scrollTo({ y: minuteIndex * ITEM_HEIGHT, animated: false });
         }, 100);
      }
   }, [showTimePicker]);

   // Removed separate loadLevel useEffect as it is merged above

   // Removed local profile loading useEffect - data now comes from AuthContext

   // Pick image from gallery
   const pickImageFromGallery = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
         showAlert({ title: t('settings.permissionRequired'), message: t('settings.grantPhotoLibraryAccess') });
         return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
         mediaTypes: ImagePicker.MediaTypeOptions.Images,
         allowsEditing: true,
         aspect: [1, 1],
         quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
         const uri = result.assets[0].uri;
         await updateProfileData({ image: uri });
         setShowImagePickerModal(false);
      }
   };

   // Take photo with camera
   const takePhotoWithCamera = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
         showAlert({ title: t('settings.permissionRequired'), message: t('settings.grantCameraAccess') });
         return;
      }

      const result = await ImagePicker.launchCameraAsync({
         allowsEditing: true,
         aspect: [1, 1],
         quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
         const uri = result.assets[0].uri;
         await updateProfileData({ image: uri });
         setShowImagePickerModal(false);
      }
   };

   // Remove profile image
   const removeProfileImage = async () => {
      await updateProfileData({ image: null });
      setShowImagePickerModal(false);
   };

   const selectAvatar = async (avatar: ProfileAvatarOption) => {
      await updateProfileData({ image: avatar.value });
      setShowAvatarPickerModal(false);
   };

   // Save profile changes (local only - Firebase sync happens daily)
   const saveProfileChanges = async () => {
      try {
         // Validation
         if (!tempName.trim()) {
            showAlert({ title: t('settings.invalidName'), message: t('settings.nameEmpty') });
            return;
         }

         if (tempName.trim().length < 2) {
            showAlert({ title: t('settings.invalidName'), message: t('settings.nameTooShort') });
            return;
         }

         await updateProfileData({ name: tempName.trim() });

         setShowEditProfileModal(false);
         showAlert({ title: t('common.success'), message: t('settings.profileUpdated') });
      } catch (error) {
         console.error('Error saving profile:', error);
         showAlert({ title: t('common.error'), message: t('settings.profileSaveFailed') });
      }
   };

   // Open edit profile modal
   const openEditProfileModal = () => {
      setTempName(profile.name);
      setTempEmail(profile.email);
      setShowEditProfileModal(true);
   };

   const formatAdFreeExpiration = (): string => {
      if (!activeEntitlement?.expirationDate) {
         return t('settings.adFreeLifetime');
      }

      return t('settings.adFreeActiveUntil', {
         date: new Date(activeEntitlement.expirationDate).toLocaleDateString(),
      });
   };

   const runPremiumAction = async (
      action: 'paywall' | 'restore' | 'manage',
      task: () => Promise<void>
   ) => {
      if (premiumAction) {
         return;
      }

      setPremiumAction(action);
      try {
         await task();
      } catch (error) {
         console.error(`[Settings] Premium action failed (${action})`, error);
         showAlert({
            title: t('common.error'),
            message: t('settings.premiumActionFailed'),
         });
      } finally {
         setPremiumAction(null);
      }
   };

   const handleRemoveAdsPress = () => {
      runPremiumAction('paywall', async () => {
         const unlocked = await presentRemoveAdsPaywall();
         if (unlocked) {
            showAlert({
               title: t('common.success'),
               message: t('settings.removeAdsSuccess'),
            });
         }
      });
   };

   const handleRestorePurchasesPress = () => {
      runPremiumAction('restore', async () => {
         const restored = await restorePurchases();
         showAlert({
            title: restored ? t('common.success') : t('common.warning'),
            message: restored
               ? t('settings.restorePurchasesSuccess')
               : t('settings.restorePurchasesEmpty'),
         });
      });
   };

   const handleManageSubscriptionPress = () => {
      runPremiumAction('manage', async () => {
         await openCustomerCenter();
      });
   };

   // Extracted verbatim from the inline onPress handlers so DangerZoneSection/LanguageSettingsSection
   // can receive them as typed props (ADIM 3, UI-only section extraction — logic unchanged).
   const handleChangeLanguagePress = () => {
      showAlert({
         title: t('settings.changeLangConfirmTitle'),
         message: t('settings.changeLangConfirmDesc'),
         buttons: [
            { text: t('common.cancel'), style: 'cancel' },
            {
               text: t('common.continue'),
               style: 'destructive',
               onPress: async () => {
                  // FIRST: Clear favorites on Firebase while we have user ID
                  if (user?.uid) {
                     await clearFavoritesOnFirebase(user.uid);
                  }
                  // Cancel all scheduled notifications (old language words)
                  await cancelAllNotifications();
                  // Clear userData cache so AuthContext fetches fresh data after setup
                  await clearAllLocalData({ preserveStreak: true });
                  await resetProgress();
                  await forceSync(user?.uid || '');
                  navigation.reset({
                     index: 0,
                     routes: [{ name: 'NativeLanguage' }],
                  });
               }
            }
         ]
      });
   };

   const handleResetProgressPress = () => {
      showAlert({
         title: t('settings.resetConfirmTitle'),
         message: t('settings.resetConfirmDesc'),
         buttons: [
            { text: t('common.cancel'), style: 'cancel' },
            {
               text: t('settings.reset'),
               style: 'destructive',
               onPress: async () => {
                  // FIRST: Clear favorites on Firebase
                  if (user?.uid) {
                     await clearFavoritesOnFirebase(user.uid);
                  }
                  await resetProgress();
                  // Cancel stale notifications and reschedule with reset vocabulary
                  await cancelAllNotifications();
                  scheduleVocabularyNotifications().catch(console.error);
                  // Sync empty progress to Firebase
                  await forceSync(user?.uid || '');
                  showAlert({ title: t('common.success'), message: t('settings.resetProgressSuccess') });
               }
            }
         ]
      });
   };

   const handleDeleteAccountPress = () => {
      showAlert({
         title: t('settings.deleteAccountConfirmTitle'),
         message: isAdFree
            ? `${t('settings.deleteAccountConfirmDesc')}\n\n${t('settings.deleteAccountSubscriptionNote')}`
            : t('settings.deleteAccountConfirmDesc'),
         buttons: [
            { text: t('common.cancel'), style: 'cancel' },
            {
               text: t('settings.deleteAccount'),
               style: 'destructive',
               onPress: async () => {
                  try {
                     await deleteAccount();
                     // Navigate to login screen after successful deletion
                     navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                     });
                  } catch (error) {
                     console.error('Delete account error:', error);
                     showAlert({
                        title: t('common.error'),
                        message: t('settings.deleteAccountError')
                     });
                  }
               }
            }
         ]
      });
   };

   const handleLogoutPress = () => {
      showAlert({
         title: t('settings.logoutConfirmTitle'),
         message: t('settings.logoutConfirmDesc'),
         buttons: [
            { text: t('common.cancel'), style: 'cancel' },
            {
               text: t('settings.logout'), style: 'destructive', onPress: async () => {
                  try {
                     await signOut();
                     navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                     });
                  } catch (error) {
                     console.error('Logout error:', error);
                  }
               }
            }
         ]
      });
   };

   // Dynamic styles based on theme
   const dynamicStyles = {
      container: { backgroundColor: colors.background },
      sectionCard: { backgroundColor: colors.surface, borderColor: colors.border },
      text: { color: colors.text },
      textSecondary: { color: colors.textSecondary },
      settingIcon: { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
      modalContent: { backgroundColor: colors.surface, borderColor: colors.border },
   };
   const defaultAvatarSource = isDarkMode
      ? require('../assets/icons/dflt_dark.png')
      : require('../assets/icons/dflt_light.png');
   const profileImageSource = getProfileImageSource(profile.image, defaultAvatarSource);

   return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
         {/* Header with Back Button */}
         <View style={[styles.header, { paddingTop: Math.max(insets.top, scale(12)) }]}>
            <TouchableOpacity
               onPress={() => navigation.goBack()}
               style={styles.backButton}
            >
               <FontAwesome5 name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.title')}</Text>
            <View style={styles.headerSpacer} />
         </View>

         <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Profile */}
            <ProfileSettingsSection
               profileName={profile.name}
               profileEmail={profile.email}
               profileImageSource={profileImageSource}
               hasCustomImage={!!profile.image}
               isDarkMode={isDarkMode}
               colors={colors}
               defaultUsernameLabel={t('settings.defaultUsername')}
               editProfileLabel={t('settings.editProfile')}
               onPressAvatar={() => setShowImagePickerModal(true)}
               onPressEditProfile={openEditProfileModal}
            />

            {/* Section: Premium */}
            <PremiumSettingsSection
               isAdFree={isAdFree}
               isPremiumLoading={isPremiumLoading}
               premiumAction={premiumAction}
               adFreeStatusText={formatAdFreeExpiration()}
               colors={colors}
               isDarkMode={isDarkMode}
               sectionTitle={t('settings.premium')}
               removeAdsActiveLabel={t('settings.adFreeActive')}
               removeAdsLabel={t('settings.removeAds')}
               removeAdsDescription={t('settings.removeAdsDesc')}
               restorePurchasesLabel={t('settings.restorePurchases')}
               restorePurchasesDescription={t('settings.restorePurchasesDesc')}
               manageSubscriptionLabel={t('settings.manageSubscription')}
               manageSubscriptionDescription={t('settings.manageSubscriptionDesc')}
               onPressRemoveAds={handleRemoveAdsPress}
               onPressRestorePurchases={handleRestorePurchasesPress}
               onPressManageSubscription={handleManageSubscriptionPress}
            />

            {/* Section: Preferences (Language row) */}
            <LanguageSettingsSection
               colors={colors}
               isDarkMode={isDarkMode}
               preferencesSectionTitle={t('settings.preferences')}
               languageRowLabel={t('settings.language')}
               isSystemLanguage={isSystemLanguage}
               systemDefaultLabel={t('settings.systemDefault')}
               selectedLanguageFlagIcon={LANGUAGES.find(l => l.code === selectedLanguage)?.flagIcon}
               selectedLanguageName={LANGUAGES.find(l => l.code === selectedLanguage)?.name}
               onPressLanguageRow={() => setShowLanguagePicker(true)}
            />

            {/* Section: Preferences (Notification action row) + Daily Reminder card */}
            <NotificationSettingsSection
               colors={colors}
               isDarkMode={isDarkMode}
               preferencesSectionTitle={t('settings.preferences')}
               dailyReminderSectionTitle={t('settings.dailyReminder')}
               notificationActionLabel={t('settings.notificationAction')}
               autoMarkLearned={autoMarkLearned}
               markAsLearnedLabel={t('settings.markasLearned')}
               doNotMarkLabel={t('settings.doNotMark')}
               onPressAutoMarkRow={() => setShowAutoMarkPicker(true)}
               enableRemindersLabel={t('settings.enableReminders')}
               reminderEnabled={reminderEnabled}
               renderSwitch={() => <AnimatedSwitch value={reminderEnabled} onToggle={handleReminderToggle} />}
               startTimeLabel={t('settings.startTime')}
               startHour={startHour}
               startMinute={startMinute}
               onPressStartTime={() => {
                  setTempHour(startHour);
                  setTempMinute(startMinute);
                  setShowTimePicker('start');
               }}
               endTimeLabel={t('settings.endTime')}
               endHour={endHour}
               endMinute={endMinute}
               onPressEndTime={() => {
                  setTempHour(endHour);
                  setTempMinute(endMinute);
                  setShowTimePicker('end');
               }}
               frequencyLabel={t('settings.frequency')}
               frequencyValueLabel={t(`settings.${frequency}`)}
               onPressFrequency={() => setShowFrequencyPicker(true)}
            />

            {/* Section: Progress (Change Level / Change Language rows) */}
            <Text style={[styles.sectionTitle, dynamicStyles.textSecondary]}>{t('settings.progress')}</Text>
            <View style={[styles.sectionCard, dynamicStyles.sectionCard]}>
               <LanguageProgressRows
                  colors={colors}
                  isDarkMode={isDarkMode}
                  changeLevelLabel={t('settings.changeLevel')}
                  currentLevelLabel={t(`level.${currentLevel}`)}
                  currentLevelRange={LEVELS.find(l => l.id === currentLevel)?.range}
                  onPressChangeLevel={() => setShowLevelPicker(true)}
                  changeLanguageLabel={t('settings.changeLanguage')}
                  changeLanguageDescription={t('settings.changeLanguageDesc')}
                  onPressChangeLanguage={handleChangeLanguagePress}
               />
               {/* Section: Progress (destructive rows — Reset Progress / Delete Account) */}
               <ProgressDangerRows
                  colors={colors}
                  isDarkMode={isDarkMode}
                  resetProgressLabel={t('settings.resetProgress')}
                  resetProgressDescription={t('settings.resetProgressDesc')}
                  onPressResetProgress={handleResetProgressPress}
                  deleteAccountLabel={t('settings.deleteAccount')}
                  onPressDeleteAccount={handleDeleteAccountPress}
               />
            </View>

            {/* Section: Support */}
            <Text style={[styles.sectionTitle, dynamicStyles.textSecondary]}>{t('settings.support')}</Text>
            <View style={[styles.sectionCard, dynamicStyles.sectionCard]}>
               <TouchableOpacity style={styles.settingItem} onPress={() => setShowHelpModal(true)}>
                  <View style={styles.settingLeft}>
                     <View style={[styles.settingIcon, dynamicStyles.settingIcon]}>
                        <MaterialCommunityIcons name="help" size={20} color={colors.primary} />
                     </View>
                     <Text style={[styles.settingTitle, dynamicStyles.text]}>{t('settings.helpFaq')}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
               </TouchableOpacity>
               <TouchableOpacity style={styles.settingItem} onPress={handleRateVocBeePress}>
                  <View style={styles.settingLeft}>
                     <View style={[styles.settingIcon, dynamicStyles.settingIcon]}>
                        <MaterialCommunityIcons name="star-outline" size={24} color={colors.primary} />
                     </View>
                     <Text style={[styles.settingTitle, dynamicStyles.text]}>
                        {t('settings.rateVocBee', { defaultValue: 'Rate VocBee' })}
                     </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
               </TouchableOpacity>
               <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 0 }]} onPress={() => Linking.openURL('https://vocbee.online/privacypolicy')}>
                  <View style={styles.settingLeft}>
                     <View style={[styles.settingIcon, dynamicStyles.settingIcon]}>
                        <MaterialCommunityIcons name="security" size={24} color={colors.primary} />
                     </View>
                     <Text style={[styles.settingTitle, dynamicStyles.text]}>{t('settings.privacyPolicy')}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
               </TouchableOpacity>
            </View>



            {/* Log Out Button */}
            <LogoutButton
               colors={colors}
               logoutLabel={t('settings.logout')}
               onPressLogout={handleLogoutPress}
            />

            <Text style={[styles.versionText, dynamicStyles.textSecondary, { marginTop: 12, marginBottom: 0 }]}>VocBee v{APP_VERSION}</Text>
         </ScrollView>

         {/* Time Picker Modal - Wheel Style */}
         <Modal
            visible={showTimePicker !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setShowTimePicker(null)}
         >
            <View style={styles.modalOverlay}>
               <TouchableOpacity
                  style={StyleSheet.absoluteFill}
                  activeOpacity={1}
                  onPress={() => setShowTimePicker(null)}
               />
               <View style={[styles.modalContent, dynamicStyles.modalContent]}>
                  <Text style={[styles.modalTitle, dynamicStyles.text]}>
                     {showTimePicker === 'start' ? t('settings.selectStartTime') : t('settings.selectEndTime')}
                  </Text>

                  {/* Wheel Picker Container */}
                  <View style={styles.wheelPickerContainer}>
                     {/* Hours Column */}
                     <View style={styles.wheelColumn}>
                        <Text style={[styles.wheelLabel, dynamicStyles.textSecondary]}>{t('settings.hour')}</Text>
                        <View style={styles.wheelScrollWrapper}>
                           <View style={[styles.wheelCenterIndicator, { borderColor: colors.primary }]} pointerEvents="none" />
                           <ScrollView
                              ref={hourScrollRef}
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
                                 setTempHour(HOURS_LIST[actualIndex]);

                                 // Reset to middle section if scrolled too far
                                 if (index < HOURS_LIST.length || index >= HOURS_LIST.length * 2) {
                                    const middleIndex = actualIndex + HOURS_LIST.length;
                                    setTimeout(() => {
                                       hourScrollRef.current?.scrollTo({ y: middleIndex * ITEM_HEIGHT, animated: false });
                                    }, 100);
                                 }
                              }}
                           >
                              {HOURS_EXTENDED.map((hour, idx) => (
                                 <View key={`hour-${idx}`} style={styles.wheelItem}>
                                    <Text style={[styles.wheelItemText, { color: colors.text }]}>{hour}</Text>
                                 </View>
                              ))}
                           </ScrollView>
                        </View>
                     </View>

                     {/* Separator */}
                     <Text style={[styles.wheelSeparator, dynamicStyles.text]}>:</Text>

                     {/* Minutes Column */}
                     <View style={styles.wheelColumn}>
                        <Text style={[styles.wheelLabel, dynamicStyles.textSecondary]}>{t('settings.min')}</Text>
                        <View style={styles.wheelScrollWrapper}>
                           <View style={[styles.wheelCenterIndicator, { borderColor: colors.primary }]} pointerEvents="none" />
                           <ScrollView
                              ref={minuteScrollRef}
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
                                 setTempMinute(MINUTES_LIST[actualIndex]);

                                 // Reset to middle section if scrolled too far
                                 if (index < MINUTES_LIST.length || index >= MINUTES_LIST.length * 2) {
                                    const middleIndex = actualIndex + MINUTES_LIST.length;
                                    setTimeout(() => {
                                       minuteScrollRef.current?.scrollTo({ y: middleIndex * ITEM_HEIGHT, animated: false });
                                    }, 100);
                                 }
                              }}
                           >
                              {MINUTES_EXTENDED.map((minute, idx) => (
                                 <View key={`minute-${idx}`} style={styles.wheelItem}>
                                    <Text style={[styles.wheelItemText, { color: colors.text }]}>{minute}</Text>
                                 </View>
                              ))}
                           </ScrollView>
                        </View>
                     </View>
                  </View>

                  <TouchableOpacity
                     style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                     onPress={() => {
                        const type = showTimePicker as 'start' | 'end';
                        const h = tempHour;
                        const m = tempMinute;
                        // Close modal FIRST to unmount heavy ScrollViews
                        setShowTimePicker(null);
                        if (type === 'start') {
                           setStartHour(h);
                           setStartMinute(m);
                        } else {
                           setEndHour(h);
                           setEndMinute(m);
                        }
                        // Fire-and-forget — scheduling already runs in background
                        saveTimeSettings(type, h, m).catch(console.error);
                     }}
                  >
                     <Text style={styles.confirmButtonText}>{t('common.confirm')}</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </Modal>

         {/* Frequency Picker Modal */}
         <Modal
            visible={showFrequencyPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowFrequencyPicker(false)}
         >
            <TouchableOpacity
               style={styles.modalOverlay}
               activeOpacity={1}
               onPress={() => setShowFrequencyPicker(false)}
            >
               <View style={[styles.modalContent, dynamicStyles.modalContent]}>
                  <Text style={[styles.modalTitle, dynamicStyles.text]}>{t('settings.selectFrequency')}</Text>
                  {NOTIFICATION_FREQUENCY_KEYS.map((freqKey) => (
                     <TouchableOpacity
                        key={freqKey}
                        style={[
                           styles.pickerItem,
                           { borderBottomColor: colors.border },
                           frequency === freqKey && { backgroundColor: `${colors.primary}20` }
                        ]}
                        onPress={() => {
                           setFrequency(freqKey);
                           setShowFrequencyPicker(false);
                           // Fire-and-forget — scheduling already runs in background
                           handleFrequencyChange(freqKey).catch(console.error);
                        }}
                     >
                        <Text style={[
                           styles.pickerItemText,
                           { color: colors.text },
                           frequency === freqKey && { color: colors.primary }
                        ]}>{t(`settings.${freqKey}`)}</Text>
                     </TouchableOpacity>
                  ))}
               </View>
            </TouchableOpacity>
         </Modal>

         {/* Language Picker Modal */}
         <Modal
            visible={showLanguagePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowLanguagePicker(false)}
         >
            <TouchableOpacity
               style={styles.modalOverlay}
               activeOpacity={1}
               onPress={() => setShowLanguagePicker(false)}
            >
               <View style={[styles.modalContent, dynamicStyles.modalContent, { maxHeight: '70%' }]}>
                  <Text style={[styles.modalTitle, dynamicStyles.text]}>{t('settings.selectLanguage')}</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                     {/* System Default Language Option */}
                     <TouchableOpacity
                        style={[
                           styles.pickerItem,
                           { borderBottomColor: colors.border },
                           isSystemLanguage && { backgroundColor: `${colors.primary}20` }
                        ]}
                        onPress={async () => {
                           const deviceLang = await setToDeviceLanguage();
                           setSelectedLanguage(deviceLang);
                           setIsSystemLanguage(true);
                           
                           // Reschedule notifications with new language (system default)
                           const settings = await getNotificationSettings();
                           if (settings.enabled) {
                              scheduleVocabularyNotifications().catch(err =>
                                 console.error('[Settings] Failed to reschedule notifications after system language change:', err)
                              );
                              console.log('[Settings] Notifications rescheduled after switching to system language');
                           }
                           
                           setShowLanguagePicker(false);
                        }}
                     >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                           <MaterialIcons name="phone-iphone" size={22} color={colors.primary} />
                           <Text style={[
                              styles.pickerItemText,
                              { color: colors.text },
                              isSystemLanguage && { color: colors.primary }
                           ]}>{t('settings.systemDefault')}</Text>
                           <Text style={[
                              styles.pickerItemNativeName,
                              { color: colors.textSecondary },
                              isSystemLanguage && { color: colors.primary }
                           ]}> ({getDeviceLanguage().toUpperCase()})</Text>
                        </View>
                     </TouchableOpacity>
                     {LANGUAGES.map((lang) => (
                        <TouchableOpacity
                           key={lang.id}
                           style={[
                              styles.pickerItem,
                              { borderBottomColor: colors.border },
                              !isSystemLanguage && selectedLanguage === lang.code && { backgroundColor: `${colors.primary}20` }
                           ]}
                           onPress={async () => {
                              const langCode = lang.code || 'en';
                              setSelectedLanguage(langCode);
                              setIsSystemLanguage(false);
                              await i18n.changeLanguage(langCode);
                              
                              // Reschedule notifications with new language
                              // This ensures notification content (i18n.t strings) uses the new language
                              const settings = await getNotificationSettings();
                              if (settings.enabled) {
                                 scheduleVocabularyNotifications().catch(err =>
                                    console.error('[Settings] Failed to reschedule notifications after language change:', err)
                                 );
                                 console.log('[Settings] Notifications rescheduled after UI language change');
                              }
                              
                              setShowLanguagePicker(false);
                           }}
                        >
                           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Image
                                 source={lang.flagIcon}
                                 style={{ width: 24, height: 18, borderRadius: 2 }}
                                 resizeMode="contain"
                              />
                              <Text style={[
                                 styles.pickerItemText,
                                 { color: colors.text },
                                 !isSystemLanguage && selectedLanguage === lang.code && { color: colors.primary }
                              ]}>{lang.name}</Text>
                              <Text style={[
                                 styles.pickerItemNativeName,
                                 { color: colors.textSecondary },
                                 !isSystemLanguage && selectedLanguage === lang.code && { color: colors.primary }
                              ]}> ({lang.nativeName})</Text>
                           </View>
                        </TouchableOpacity>
                     ))}
                  </ScrollView>
               </View>
            </TouchableOpacity>
         </Modal>

         {/* Level Picker Modal */}
         <Modal
            visible={showLevelPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowLevelPicker(false)}
         >
            <TouchableOpacity
               style={styles.modalOverlay}
               activeOpacity={1}
               onPress={() => setShowLevelPicker(false)}
            >
               <View style={[styles.modalContent, dynamicStyles.modalContent, { maxHeight: '70%' }]}>
                  <Text style={[styles.modalTitle, dynamicStyles.text]}>{t('settings.selectLevel')}</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                     {LEVELS.map((level) => (
                        <TouchableOpacity
                           key={level.id}
                           style={[
                              styles.levelPickerItem,
                              currentLevel === level.id && { backgroundColor: `${colors.primary}20` }
                           ]}
                           onPress={async () => {
                              if (!isUserLevel(level.id)) {
                                 console.error('Invalid user level selected:', level.id);
                                 return;
                              }

                              if (level.id === currentLevel) {
                                 setShowLevelPicker(false);
                                 return;
                              }

                              try {
                                 await AsyncStorage.setItem(STORAGE_KEYS.USER_LEVEL, level.id);
                                 // Update the CEFR level for vocabulary service
                                 const cefrLevel = getFirstLevelForUserLevel(level.id);
                                 await setCurrentLevel(cefrLevel);
                                 setCurrentLevelState(level.id);
                                 setShowLevelPicker(false);
                                 
                                 // Reschedule notifications with new level  
                                 // This ensures all tracked notifications have correct level metadata
                                 const settings = await getNotificationSettings();
                                 if (settings.enabled) {
                                    scheduleVocabularyNotifications().catch(console.error);
                                    console.log('[Settings] Notifications rescheduled after level change');
                                 }
                              } catch (error) {
                                 console.error('Error saving level:', error);
                                 showAlert({
                                    title: t('common.error'),
                                    message: t('settings.changeLevelFailed', {
                                       defaultValue: 'Failed to update level. Please try again.',
                                    }),
                                 });
                              }
                           }}
                        >
                           <View style={styles.levelPickerRow}>
                              <View style={{ flex: 1 }}>
                                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                    <Text style={[
                                       styles.levelPickerTitle,
                                       { color: colors.text },
                                       currentLevel === level.id && { color: colors.primary }
                                    ]}>{t(`level.${level.id}`)}</Text>
                                    <View style={[styles.levelBadge, { backgroundColor: `${colors.primary}33` }]}>
                                       <Text style={[styles.levelRange, { color: colors.primary }]}>{level.range}</Text>
                                    </View>
                                 </View>
                                 <Text style={[
                                    styles.levelPickerDesc,
                                    { color: colors.textSecondary },
                                    currentLevel === level.id && { color: colors.primary }
                                 ]}>{t(`level.${level.id}Desc`)}</Text>
                              </View>
                              {currentLevel === level.id && (
                                 <MaterialIcons name="check" size={24} color={colors.primary} />
                              )}
                           </View>
                        </TouchableOpacity>
                     ))}
                  </ScrollView>
               </View>
            </TouchableOpacity>
         </Modal>

         {/* Auto-Mark Picker Modal */}
         <Modal
            visible={showAutoMarkPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowAutoMarkPicker(false)}
         >
            <TouchableOpacity
               style={styles.modalOverlay}
               activeOpacity={1}
               onPress={() => setShowAutoMarkPicker(false)}
            >
               <View style={[styles.modalContent, dynamicStyles.modalContent]}>
                  <Text style={[styles.modalTitle, dynamicStyles.text]}>{t('settings.notificationAction')}</Text>

                  <TouchableOpacity
                     style={[
                        styles.autoMarkOption,
                        { borderBottomColor: colors.border },
                        autoMarkLearned && { backgroundColor: `${colors.primary}20` }
                     ]}
                     onPress={() => {
                        setAutoMarkLearned(true);
                        setShowAutoMarkPicker(false);
                        updateNotificationSettings({ autoMarkLearned: true }).catch(console.error);
                     }}
                  >
                     <View style={styles.autoMarkOptionContent}>
                        <MaterialCommunityIcons
                           name="check-circle"
                           size={24}
                           color={autoMarkLearned ? colors.primary : colors.textSecondary}
                        />
                        <View style={{ flex: 1 }}>
                           <Text style={[styles.autoMarkOptionTitle, { color: autoMarkLearned ? colors.primary : colors.text }]}>
                              {t('settings.markasLearned')}
                           </Text>
                           <Text style={[styles.autoMarkOptionDesc, { color: colors.textSecondary }]}>
                              {t('settings.autoMarkDesc1')}
                           </Text>
                        </View>
                     </View>
                     {autoMarkLearned && (
                        <MaterialIcons name="check" size={24} color={colors.primary} />
                     )}
                  </TouchableOpacity>

                  <TouchableOpacity
                     style={[
                        styles.autoMarkOption,
                        { borderBottomWidth: 0 },
                        !autoMarkLearned && { backgroundColor: `${colors.primary}20` }
                     ]}
                     onPress={() => {
                        setAutoMarkLearned(false);
                        setShowAutoMarkPicker(false);
                        updateNotificationSettings({ autoMarkLearned: false }).catch(console.error);
                     }}
                  >
                     <View style={styles.autoMarkOptionContent}>
                        <MaterialCommunityIcons
                           name="close-circle-outline"
                           size={24}
                           color={!autoMarkLearned ? colors.primary : colors.textSecondary}
                        />
                        <View style={{ flex: 1 }}>
                           <Text style={[styles.autoMarkOptionTitle, { color: !autoMarkLearned ? colors.primary : colors.text }]}>
                              {t('settings.doNotMark')}
                           </Text>
                           <Text style={[styles.autoMarkOptionDesc, { color: colors.textSecondary }]}>
                              {t('settings.autoMarkDesc2')}
                           </Text>
                        </View>
                     </View>
                     {!autoMarkLearned && (
                        <MaterialIcons name="check" size={24} color={colors.primary} />
                     )}
                  </TouchableOpacity>
               </View>
            </TouchableOpacity>
         </Modal>

         {/* Image Picker Modal */}
         <Modal
            visible={showImagePickerModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowImagePickerModal(false)}
         >
            <View style={styles.modalOverlay}>
               <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={() => setShowImagePickerModal(false)}
               />
               <View
                  style={[styles.modalContent, styles.imagePickerModalContent, dynamicStyles.modalContent]}
                  onStartShouldSetResponder={() => true}
               >
                  <Text style={[styles.modalTitle, dynamicStyles.text]}>{t('settings.changePhotoTitle')}</Text>

                  <ScrollView
                     style={styles.imagePickerScroll}
                     contentContainerStyle={styles.imagePickerScrollContent}
                     showsVerticalScrollIndicator={false}
                  >
                     <TouchableOpacity
                        style={[styles.imagePickerOption, { borderBottomColor: colors.border }]}
                        onPress={takePhotoWithCamera}
                     >
                        <View style={[styles.imagePickerIcon, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                           <MaterialIcons name="camera-alt" size={24} color={colors.primary} />
                        </View>
                        <Text style={[styles.imagePickerOptionText, dynamicStyles.text]}>{t('settings.takePhoto')}</Text>
                     </TouchableOpacity>

                     <TouchableOpacity
                        style={[styles.imagePickerOption, { borderBottomColor: colors.border }]}
                        onPress={pickImageFromGallery}
                     >
                        <View style={[styles.imagePickerIcon, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                           <MaterialIcons name="photo-library" size={24} color={colors.primary} />
                        </View>
                        <Text style={[styles.imagePickerOptionText, dynamicStyles.text]}>{t('settings.chooseFromGallery')}</Text>
                     </TouchableOpacity>

                     <TouchableOpacity
                        style={[styles.imagePickerOption, { borderBottomColor: colors.border }]}
                        onPress={() => {
                           setShowImagePickerModal(false);
                           setShowAvatarPickerModal(true);
                        }}
                     >
                        <View style={[styles.imagePickerIcon, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                           <MaterialIcons name="face" size={24} color={colors.primary} />
                        </View>
                        <Text style={[styles.imagePickerOptionText, dynamicStyles.text]}>{t('settings.selectAvatar')}</Text>
                     </TouchableOpacity>

                     {profile.image && (
                        <TouchableOpacity
                           style={[styles.imagePickerOption, { borderBottomWidth: 0 }]}
                           onPress={removeProfileImage}
                        >
                           <View style={[styles.imagePickerIcon, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
                              <MaterialIcons name="delete" size={24} color={colors.error} />
                           </View>
                           <Text style={[styles.imagePickerOptionText, { color: colors.error }]}>{t('settings.removePhoto')}</Text>
                        </TouchableOpacity>
                     )}
                  </ScrollView>

                  <TouchableOpacity
                     style={[styles.cancelButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                     onPress={() => setShowImagePickerModal(false)}
                  >
                     <Text style={[styles.cancelButtonText, dynamicStyles.text]}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </Modal>

         {/* Avatar Picker Modal */}
         <Modal
            visible={showAvatarPickerModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowAvatarPickerModal(false)}
         >
            <View style={styles.modalOverlay}>
               <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={() => setShowAvatarPickerModal(false)}
               />
               <View
                  style={[styles.modalContent, styles.avatarPickerModalContent, dynamicStyles.modalContent]}
                  onStartShouldSetResponder={() => true}
               >
                  <Text style={[styles.modalTitle, dynamicStyles.text]}>{t('settings.selectAvatar')}</Text>

                  <View style={styles.avatarGrid}>
                     {PROFILE_AVATAR_ROWS.map((row, rowIndex) => (
                        <View key={`avatar-row-${rowIndex}`} style={styles.avatarGridRow}>
                           {row.map((avatar, avatarIndex) => {
                              const selected = profile.image === avatar.value;
                              const optionNumber = rowIndex * AVATAR_COLUMNS + avatarIndex + 1;

                              return (
                                 <TouchableOpacity
                                    key={avatar.id}
                                    style={styles.avatarBareOption}
                                    onPress={() => selectAvatar(avatar)}
                                    activeOpacity={0.72}
                                    accessibilityRole="button"
                                    accessibilityLabel={t('settings.avatarOptionAccessibility', {
                                       number: optionNumber,
                                       defaultValue: `Avatar ${optionNumber}`,
                                    })}
                                    accessibilityState={{ selected }}
                                 >
                                    <Image source={avatar.source} style={styles.avatarBareImage} />
                                    {selected && (
                                       <MaterialIcons
                                          name="check-circle"
                                          size={24}
                                          color={colors.primary}
                                          style={styles.avatarSelectedIcon}
                                       />
                                    )}
                                 </TouchableOpacity>
                              );
                           })}
                        </View>
                     ))}
                  </View>

                  <TouchableOpacity
                     style={[styles.cancelButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                     onPress={() => setShowAvatarPickerModal(false)}
                  >
                     <Text style={[styles.cancelButtonText, dynamicStyles.text]}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </Modal>

         {/* Edit Profile Modal */}
         <Modal
            visible={showEditProfileModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowEditProfileModal(false)}
         >
            <TouchableOpacity
               style={styles.modalOverlay}
               activeOpacity={1}
               onPress={() => setShowEditProfileModal(false)}
            >
               <View
                  style={[styles.modalContent, dynamicStyles.modalContent, { width: '90%' }]}
                  onStartShouldSetResponder={() => true}
               >
                  <Text style={[styles.modalTitle, dynamicStyles.text]}>{t('settings.editProfileTitle')}</Text>

                  <View style={styles.inputContainer}>
                     <Text style={[styles.inputLabel, dynamicStyles.textSecondary]}>{t('settings.nameLabel')}</Text>
                     <TextInput
                        style={[
                           styles.textInput,
                           {
                              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                              color: colors.text,
                              borderColor: colors.border
                           }
                        ]}
                        value={tempName}
                        onChangeText={setTempName}
                        placeholder={t('settings.namePlaceholder')}
                        placeholderTextColor={colors.textSecondary}
                     />
                  </View>

                  <View style={styles.modalButtonRow}>
                     <TouchableOpacity
                        style={[styles.modalButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                        onPress={() => setShowEditProfileModal(false)}
                     >
                        <Text style={[styles.modalButtonText, dynamicStyles.text]}>{t('common.cancel')}</Text>
                     </TouchableOpacity>
                     <TouchableOpacity
                        style={[
                           styles.modalButton,
                           { backgroundColor: colors.primary },
                           tempName === profile.name && { opacity: 0.5 }
                        ]}
                        onPress={saveProfileChanges}
                        disabled={tempName === profile.name}
                     >
                        <Text style={[styles.modalButtonText, { color: isDarkMode ? '#000' : '#fff' }]}>{t('common.save')}</Text>
                     </TouchableOpacity>
                  </View>
               </View>
            </TouchableOpacity>
         </Modal>

         {/* Help & FAQ Modal */}
         <Modal
            visible={showHelpModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowHelpModal(false)}
         >
            <View style={styles.modalOverlay}>
               <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={() => setShowHelpModal(false)}
               />
               <View
                  style={[styles.modalContent, dynamicStyles.modalContent, { width: '90%', maxHeight: '80%' }]}
               >
                  <View style={styles.modalHeader}>
                     <Text style={[styles.modalTitle, dynamicStyles.text]}>{t('help.title')}</Text>
                     <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                        <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                     </TouchableOpacity>
                  </View>
                  <ScrollView
                     showsVerticalScrollIndicator={true}
                     style={styles.modalScroll}
                     nestedScrollEnabled={true}
                     contentContainerStyle={{ paddingBottom: 20 }}
                  >
                     {/* Learning Basics */}
                     <View style={styles.faqItem}>
                        <Text style={[styles.faqQuestion, dynamicStyles.text]}>{t('help.basics.q1')}</Text>
                        <Text style={[styles.faqAnswer, dynamicStyles.textSecondary]}>
                           {t('help.basics.a1')}
                        </Text>
                     </View>

                     <View style={styles.faqItem}>
                        <Text style={[styles.faqQuestion, dynamicStyles.text]}>{t('help.basics.q2')}</Text>
                        <Text style={[styles.faqAnswer, dynamicStyles.textSecondary]}>
                           {t('help.basics.a2')}
                        </Text>
                     </View>

                     <View style={styles.faqItem}>
                        <Text style={[styles.faqQuestion, dynamicStyles.text]}>{t('help.basics.q3')}</Text>
                        <Text style={[styles.faqAnswer, dynamicStyles.textSecondary]}>
                           {t('help.basics.a3')}
                        </Text>
                     </View>

                     <View style={styles.faqItem}>
                        <Text style={[styles.faqQuestion, dynamicStyles.text]}>{t('help.basics.q4')}</Text>
                        <Text style={[styles.faqAnswer, dynamicStyles.textSecondary]}>
                           {t('help.basics.a4')}
                        </Text>
                     </View>

                     <View style={styles.faqItem}>
                        <Text style={[styles.faqQuestion, dynamicStyles.text]}>{t('help.basics.q5')}</Text>
                        <Text style={[styles.faqAnswer, dynamicStyles.textSecondary]}>
                           {t('help.basics.a5')}
                        </Text>
                     </View>

                     {/* Progress & Levels */}
                     <View style={styles.faqItem}>
                        <Text style={[styles.faqQuestion, dynamicStyles.text]}>{t('help.levels.q1')}</Text>
                        <Text style={[styles.faqAnswer, dynamicStyles.textSecondary]}>
                           {t('help.levels.a1')}
                        </Text>
                     </View>

                     <View style={styles.faqItem}>
                        <Text style={[styles.faqQuestion, dynamicStyles.text]}>{t('help.levels.q2')}</Text>
                        <Text style={[styles.faqAnswer, dynamicStyles.textSecondary]}>
                           {t('help.levels.a2')}
                        </Text>
                     </View>

                     <View style={styles.faqItem}>
                        <Text style={[styles.faqQuestion, dynamicStyles.text]}>{t('help.levels.q3')}</Text>
                        <Text style={[styles.faqAnswer, dynamicStyles.textSecondary]}>
                           {t('help.levels.a3')}
                        </Text>
                     </View>

                     {/* Reminders & Notifications */}
                     <View style={styles.faqItem}>
                        <Text style={[styles.faqQuestion, dynamicStyles.text]}>{t('help.reminders.q1')}</Text>
                        <Text style={[styles.faqAnswer, dynamicStyles.textSecondary]}>
                           {t('help.reminders.a1')}
                        </Text>
                     </View>

                     <View style={styles.faqItem}>
                        <Text style={[styles.faqQuestion, dynamicStyles.text]}>{t('help.reminders.q2')}</Text>
                        <Text style={[styles.faqAnswer, dynamicStyles.textSecondary]}>
                           {t('help.reminders.a2')}
                        </Text>
                     </View>

                     {/* Data & Sync */}
                     <View style={styles.faqItem}>
                        <Text style={[styles.faqQuestion, dynamicStyles.text]}>{t('help.data.q1')}</Text>
                        <Text style={[styles.faqAnswer, dynamicStyles.textSecondary]}>
                           {t('help.data.a1')}
                        </Text>
                     </View>

                     <View style={styles.faqItem}>
                        <Text style={[styles.faqQuestion, dynamicStyles.text]}>{t('help.data.q2')}</Text>
                        <Text style={[styles.faqAnswer, dynamicStyles.textSecondary]}>
                           {t('help.data.a2')}
                        </Text>
                     </View>

                     <View style={styles.faqItem}>
                        <Text style={[styles.faqQuestion, dynamicStyles.text]}>{t('help.data.q3')}</Text>
                        <Text style={[styles.faqAnswer, dynamicStyles.textSecondary]}>
                           {t('help.data.a3')}
                        </Text>
                     </View>

                     {/* Support */}
                     <View style={[styles.faqItem, { borderBottomWidth: 0 }]}>
                        <Text style={[styles.faqQuestion, dynamicStyles.text]}>{t('help.support.title')}</Text>
                        <Text style={[styles.faqAnswer, dynamicStyles.textSecondary]}>
                           {t('help.support.desc')}
                        </Text>
                     </View>
                  </ScrollView>
               </View>
            </View>
         </Modal>

         {/* Privacy Policy Modal */}
         <Modal
            visible={showPrivacyModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowPrivacyModal(false)}
         >
            <TouchableOpacity
               style={styles.modalOverlay}
               activeOpacity={1}
               onPress={() => setShowPrivacyModal(false)}
            >
               <View
                  style={[styles.modalContent, dynamicStyles.modalContent, { width: '90%', maxHeight: '80%' }]}
                  onStartShouldSetResponder={() => true}
               >
                  <View style={styles.modalHeader}>
                     <Text style={[styles.modalTitle, dynamicStyles.text]}>{t('settings.privacyPolicy')}</Text>
                     <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                        <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                     </TouchableOpacity>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                     <Text style={[styles.policyDate, dynamicStyles.textSecondary]}>{t('settings.privacyLastUpdated')}</Text>
                     <View style={styles.policySection}>
                        <Text style={[styles.policyHeading, dynamicStyles.text]}>{t('settings.privacyDataCollection')}</Text>
                        <Text style={[styles.policyText, dynamicStyles.textSecondary]}>{t('settings.privacyDataCollectionDesc')}</Text>
                     </View>
                     <View style={styles.policySection}>
                        <Text style={[styles.policyHeading, dynamicStyles.text]}>{t('settings.privacyDataUsage')}</Text>
                        <Text style={[styles.policyText, dynamicStyles.textSecondary]}>{t('settings.privacyDataUsageDesc')}</Text>
                     </View>
                     <View style={styles.policySection}>
                        <Text style={[styles.policyHeading, dynamicStyles.text]}>{t('settings.privacyYourRights')}</Text>
                        <Text style={[styles.policyText, dynamicStyles.textSecondary]}>{t('settings.privacyYourRightsDesc')}</Text>
                     </View>
                     <View style={[styles.policySection, { marginBottom: 0 }]}>
                        <Text style={[styles.policyHeading, dynamicStyles.text]}>{t('settings.privacyContact')}</Text>
                        <Text style={[styles.policyText, dynamicStyles.textSecondary]}>privacy@vocbee.com</Text>
                     </View>
                  </ScrollView>
               </View>
            </TouchableOpacity>
         </Modal>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: COLORS.background,
   },
   header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: scale(16),
      paddingBottom: scale(8),
      gap: scale(12),
   },
   backButton: {
      width: scale(44),
      height: scale(44),
      borderRadius: scale(22),
      alignItems: 'center',
      justifyContent: 'center',
   },
   headerTitle: {
      fontFamily: FONT_FAMILY,
      fontSize: moderateScale(20),
      flex: 1,
      textAlign: 'center',
   },
   headerSpacer: {
      width: scale(44),
   },
   scrollView: {
      flex: 1,
      paddingHorizontal: 16,
   },
   scrollContent: {
      paddingTop: 24,
      paddingBottom: 40,
   },
   logoutText: {
      color: COLORS.textSecondary,
   },
   profileSection: {
      alignItems: 'center',
      marginBottom: 32,
   },
   avatarContainer: {
      position: 'relative',
      marginBottom: 16,
   },
   avatar: {
      width: scale(112),
      height: scale(112),
      borderRadius: scale(56),
      borderWidth: scale(4),
      borderColor: COLORS.surface,
   },
   avatarPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
   },
   editBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: COLORS.primary,
      padding: 6,
      borderRadius: 12,
      borderWidth: 4,
      borderColor: COLORS.background,
   },
   profileName: {
      fontFamily: FONT_FAMILY,
      color: '#fff',
      fontSize: moderateScale(24),
   },
   profileEmail: {
      fontFamily: FONT_FAMILY,
      color: COLORS.textSecondary,
      fontSize: moderateScale(14),
      fontWeight: '500',
      marginBottom: 16,
   },
   editButton: {
      paddingHorizontal: 24,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
   },
   editButtonText: {
      fontFamily: FONT_FAMILY,
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
   },
   sectionTitle: {
      fontFamily: FONT_FAMILY,
      color: COLORS.textSecondary,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,
      marginLeft: 8,
   },
   sectionCard: {
      backgroundColor: COLORS.surface,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
   },
   settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)',
   },
   settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
   },
   settingLeftFlexible: {
      flex: 1,
      minWidth: 0,
      paddingRight: 12,
   },
   settingTextContent: {
      flex: 1,
      minWidth: 0,
   },
   settingIcon: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
      backgroundColor: 'rgba(255,255,255,0.05)',
      alignItems: 'center',
      justifyContent: 'center',
   },
   settingTitle: {
      fontFamily: FONT_FAMILY,
      color: '#fff',
      fontSize: moderateScale(16),
      fontWeight: '500',
   },
   settingSubtitle: {
      fontFamily: FONT_FAMILY,
      color: COLORS.primary,
      fontSize: moderateScale(12),
      fontWeight: '500',
      marginTop: 2,
   },
   versionText: {
      fontFamily: FONT_FAMILY,
      color: COLORS.textSecondary,
      fontSize: 12,
      textAlign: 'center',
      marginBottom: 40,
   },
   modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 0,
   },
   modalContent: {
      width: '80%',
      maxHeight: '60%',
      backgroundColor: COLORS.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
   },
   modalTitle: {
      fontFamily: FONT_FAMILY,
      color: '#fff',
      fontSize: 18,
      marginBottom: 16,
      textAlign: 'center',
   },
   pickerScroll: {
      maxHeight: 300,
   },
   pickerItem: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 8,
   },
   pickerItemSelected: {
      backgroundColor: 'rgba(255, 204, 0, 0.15)',
   },
   pickerItemText: {
      fontFamily: FONT_FAMILY,
      color: '#fff',
      fontSize: 16,
      textAlign: 'center',
   },
   pickerItemTextSelected: {
      fontFamily: FONT_FAMILY,
      color: COLORS.primary,
   },
   switchTrack: {
      width: 48,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
   },
   switchThumb: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000ff',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 3,
   },
   logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 16,
      marginTop: 24,
      marginBottom: 16,
      borderRadius: 12,
   },
   logoutButtonText: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      fontWeight: '600',
   },
   pickerItemNativeName: {
      fontSize: 14,
      fontWeight: 'bold',
   },
   privacyHeading: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      marginBottom: 8,
   },
   privacyText: {
      fontFamily: FONT_FAMILY,
      fontSize: 14,
      lineHeight: 20,
   },
   levelPickerItem: {
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 8,
   },
   levelPickerRow: {
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
      alignItems: 'center',
      justifyContent: 'center',
   },
   levelRadioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
   },
   levelPickerTitle: {
      fontFamily: FONT_FAMILY,
      fontSize: 18,
   },
   levelPickerDesc: {
      fontFamily: FONT_FAMILY,
      fontSize: 14,
      lineHeight: 20,
   },
   levelBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
   },
   levelRange: {
      fontFamily: FONT_FAMILY,
      fontSize: 12,
   },
   wheelPickerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
   },
   wheelColumn: {
      alignItems: 'center',
      width: 80,
   },
   wheelLabel: {
      fontFamily: FONT_FAMILY,
      fontSize: 12,
      marginBottom: 8,
   },
   wheelScroll: {
      height: 200,
      width: 70,
   },
   wheelScrollContent: {
      paddingTop: 78,
      paddingBottom: 78,
   },
   wheelItem: {
      height: 44,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
   },
   wheelItemText: {
      fontFamily: FONT_FAMILY,
      fontSize: 18,
   },
   wheelSeparator: {
      fontSize: 32,
      fontWeight: 'bold',
      marginHorizontal: 8,
      marginTop: 18,
   },
   confirmButton: {
      marginTop: 16,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
   },
   confirmButtonText: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      color: '#000',
   },
   wheelScrollWrapper: {
      position: 'relative',
      height: 200,
   },
   wheelCenterIndicator: {
      position: 'absolute',
      top: 78,
      left: 0,
      right: 0,
      height: 44,
      borderTopWidth: 2,
      borderBottomWidth: 2,
      borderRadius: 8,
      zIndex: 1,
   },
   autoMarkOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderRadius: 12,
      marginBottom: 8,
   },
   autoMarkOptionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
   },
   autoMarkOptionTitle: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      marginBottom: 4,
   },
   autoMarkOptionDesc: {
      fontFamily: FONT_FAMILY,
      fontSize: 13,
   },
   // Profile Modal Styles
   imagePickerModalContent: {
      width: '90%',
      maxWidth: 420,
      maxHeight: '85%',
   },
   avatarPickerModalContent: {
      width: '88%',
      maxWidth: 380,
   },
   imagePickerScroll: {
      maxHeight: SCREEN_HEIGHT * 0.58,
   },
   imagePickerScrollContent: {
      paddingBottom: 4,
   },
   imagePickerOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      gap: 16,
   },
   imagePickerIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
   },
   imagePickerOptionText: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
   },
   avatarGrid: {
      gap: 16,
   },
   avatarGridRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
   },
   avatarBareOption: {
      width: '30%',
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
   },
   avatarBareImage: {
      width: '100%',
      height: '100%',
      borderRadius: 999,
   },
   avatarSelectedIcon: {
      position: 'absolute',
      right: 0,
      bottom: 0,
   },
   cancelButton: {
      marginTop: 16,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
   },
   cancelButtonText: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
   },
   inputContainer: {
      marginBottom: 16,
   },
   inputLabel: {
      fontFamily: FONT_FAMILY,
      fontSize: 14,
      marginBottom: 8,
   },
   textInput: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
   },
   modalButtonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
   },
   modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
   },
   modalButtonText: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
   },
   // Help & Privacy Modal Styles
   modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
   },
   modalScroll: {
      maxHeight: 400,
   },
   faqItem: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(128,128,128,0.2)',
   },
   faqQuestion: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      marginBottom: 8,
   },
   faqAnswer: {
      fontFamily: FONT_FAMILY,
      fontSize: 14,
      lineHeight: 20,
   },
   policyDate: {
      fontFamily: FONT_FAMILY,
      fontSize: 12,
      marginBottom: 16,
   },
   policySection: {
      marginBottom: 20,
   },
   policyHeading: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      marginBottom: 8,
   },
   policyText: {
      fontFamily: FONT_FAMILY,
      fontSize: 14,
      lineHeight: 20,
   },
});
