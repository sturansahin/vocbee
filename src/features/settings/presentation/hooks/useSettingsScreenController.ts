import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import type { RootStackParamList } from '@app/navigation/types';
import { useAuth } from '@features/auth';
import {
  getNotificationFrequencyKey,
  getNotificationFrequencyMinutes,
  type NotificationFrequencyKey,
} from '@features/notifications';
import type { UserLevel } from '@features/vocabulary';
import { useTheme } from '@shared/theme';
import { useAlert } from '@shared/ui';
import { getProfileImageSource, type ProfileAvatarOption } from '@shared/utils';

import { buildAccountConfirmation } from '../../application/accountConfirmations';
import type { AvatarSource, SettingsFacade } from '../../application/contracts';
import { useSettingsPremiumActions } from './useSettingsPremiumActions';

const padTime = (value: number) => value.toString().padStart(2, '0');

export function useSettingsScreenController(facade: SettingsFacade) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isDarkMode, colors } = useTheme();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    signOut,
    deleteAccount,
    user,
    profile,
    updateProfileData,
    notificationSettings,
    updateNotificationSettings,
  } = useAuth();
  const premium = useSettingsPremiumActions();

  const [reminderEnabled, setReminderEnabled] = useState(notificationSettings.enabled);
  const [autoMarkLearned, setAutoMarkLearned] = useState(notificationSettings.autoMarkLearned);
  const [startHour, setStartHour] = useState(padTime(notificationSettings.startHour));
  const [startMinute, setStartMinute] = useState(padTime(notificationSettings.startMinute));
  const [endHour, setEndHour] = useState(padTime(notificationSettings.endHour));
  const [endMinute, setEndMinute] = useState(padTime(notificationSettings.endMinute));
  const [frequency, setFrequency] = useState<NotificationFrequencyKey>(
    getNotificationFrequencyKey(notificationSettings.frequencyMinutes),
  );
  const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);
  const [tempHour, setTempHour] = useState('09');
  const [tempMinute, setTempMinute] = useState('00');
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(facade.getSelectedLanguage());
  const [isSystemLanguage, setIsSystemLanguage] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<UserLevel>('beginner');
  const [showAutoMarkPicker, setShowAutoMarkPicker] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [showAvatarPickerModal, setShowAvatarPickerModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setReminderEnabled(notificationSettings.enabled);
    setAutoMarkLearned(notificationSettings.autoMarkLearned);
    setStartHour(padTime(notificationSettings.startHour));
    setStartMinute(padTime(notificationSettings.startMinute));
    setEndHour(padTime(notificationSettings.endHour));
    setEndMinute(padTime(notificationSettings.endMinute));
    setFrequency(getNotificationFrequencyKey(notificationSettings.frequencyMinutes));
  }, [notificationSettings]);

  useEffect(() => {
    void facade
      .loadUserLevel()
      .then(setCurrentLevel)
      .catch((error) => console.error('Error loading level:', error));
    void facade.isUsingSystemLanguage().then(setIsSystemLanguage);
  }, [facade]);

  const openTimePicker = (type: 'start' | 'end') => {
    setTempHour(type === 'start' ? startHour : endHour);
    setTempMinute(type === 'start' ? startMinute : endMinute);
    setShowTimePicker(type);
  };

  const handleReminderToggle = async () => {
    const enabled = !reminderEnabled;
    if (enabled && !(await facade.requestNotificationPermission())) {
      showAlert({
        title: t('settings.permissionRequired'),
        message: t('settings.enableNotificationsInSettings'),
        buttons: [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('settings.openSettings'), onPress: () => void facade.openSystemSettings() },
        ],
      });
      return;
    }
    setReminderEnabled(enabled);
    void updateNotificationSettings({ enabled }).catch(console.error);
  };

  const confirmTime = () => {
    if (!showTimePicker) return;
    const type = showTimePicker;
    const hour = tempHour;
    const minute = tempMinute;
    setShowTimePicker(null);
    if (type === 'start') {
      setStartHour(hour);
      setStartMinute(minute);
    } else {
      setEndHour(hour);
      setEndMinute(minute);
    }
    const update =
      type === 'start'
        ? { startHour: Number(hour), startMinute: Number(minute) }
        : { endHour: Number(hour), endMinute: Number(minute) };
    void updateNotificationSettings(update).catch(console.error);
  };

  const changeFrequency = (nextFrequency: NotificationFrequencyKey) => {
    setFrequency(nextFrequency);
    setShowFrequencyPicker(false);
    void updateNotificationSettings({
      frequencyMinutes: getNotificationFrequencyMinutes(nextFrequency),
    }).catch(console.error);
  };

  const changeAutoMark = (enabled: boolean) => {
    setAutoMarkLearned(enabled);
    setShowAutoMarkPicker(false);
    void updateNotificationSettings({ autoMarkLearned: enabled }).catch(console.error);
  };

  const pickProfileImage = async (source: AvatarSource) => {
    const result = await facade.pickAndUpdateAvatar(source, updateProfileData);
    if (result.status === 'selected') {
      setShowImagePickerModal(false);
    } else if (result.status === 'permission-denied') {
      showAlert({
        title: t('settings.permissionRequired'),
        message:
          source === 'camera'
            ? t('settings.grantCameraAccess')
            : t('settings.grantPhotoLibraryAccess'),
      });
    } else if (result.status === 'error') {
      console.error('Error selecting profile image:', result.error);
      showAlert({ title: t('common.error'), message: t('settings.profileSaveFailed') });
    }
  };

  const removeProfileImage = async () => {
    await updateProfileData({ image: null });
    setShowImagePickerModal(false);
  };

  const selectAvatar = async (avatar: ProfileAvatarOption) => {
    await updateProfileData({ image: avatar.value });
    setShowAvatarPickerModal(false);
  };

  const openEditProfile = () => {
    setTempName(profile.name);
    setShowEditProfileModal(true);
  };

  const saveProfile = async () => {
    try {
      const result = await facade.updateProfileName(tempName, updateProfileData);
      if (result === 'empty' || result === 'too-short') {
        showAlert({
          title: t('settings.invalidName'),
          message: t(result === 'empty' ? 'settings.nameEmpty' : 'settings.nameTooShort'),
        });
        return;
      }
      setShowEditProfileModal(false);
      showAlert({ title: t('common.success'), message: t('settings.profileUpdated') });
    } catch (error) {
      console.error('Error saving profile:', error);
      showAlert({ title: t('common.error'), message: t('settings.profileSaveFailed') });
    }
  };

  const handleRateVocBee = async () => {
    if (!(await facade.openStoreReview()).opened) {
      showAlert({
        title: t('common.error'),
        message: t('reviewPrompt.storeOpenError', {
          defaultValue: 'We could not open the store review page. Please try again later.',
        }),
      });
    }
  };

  const handleChangeLanguage = () => {
    showAlert({
      title: t('settings.changeLangConfirmTitle'),
      message: t('settings.changeLangConfirmDesc'),
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.continue'),
          style: 'destructive',
          onPress: async () => {
            await facade.resetForLanguageChange(user?.uid ?? '');
            navigation.reset({ index: 0, routes: [{ name: 'NativeLanguage' }] });
          },
        },
      ],
    });
  };

  const handleResetProgress = () => {
    showAlert({
      title: t('settings.resetConfirmTitle'),
      message: t('settings.resetConfirmDesc'),
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.reset'),
          style: 'destructive',
          onPress: async () => {
            await facade.resetLearningProgress(user?.uid ?? '');
            showAlert({ title: t('common.success'), message: t('settings.resetProgressSuccess') });
          },
        },
      ],
    });
  };

  const handleDeleteAccount = () => {
    showAlert(
      buildAccountConfirmation(
        {
          title: t('settings.deleteAccountConfirmTitle'),
          message: premium.isAdFree
            ? `${t('settings.deleteAccountConfirmDesc')}\n\n${t('settings.deleteAccountSubscriptionNote')}`
            : t('settings.deleteAccountConfirmDesc'),
          cancelLabel: t('common.cancel'),
          confirmLabel: t('settings.deleteAccount'),
        },
        () => {
          void deleteAccount()
            .then(() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }))
            .catch((error) => {
              console.error('Delete account error:', error);
              showAlert({
                title: t('common.error'),
                message: t('settings.deleteAccountError'),
              });
            });
        },
      ),
    );
  };

  const handleLogout = () => {
    showAlert(
      buildAccountConfirmation(
        {
          title: t('settings.logoutConfirmTitle'),
          message: t('settings.logoutConfirmDesc'),
          cancelLabel: t('common.cancel'),
          confirmLabel: t('settings.logout'),
        },
        () => {
          void signOut()
            .then(() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }))
            .catch((error) => console.error('Logout error:', error));
        },
      ),
    );
  };

  const defaultAvatarSource = isDarkMode
    ? require('../../../../../assets/icons/dflt_dark.png')
    : require('../../../../../assets/icons/dflt_light.png');
  const profileImageSource = getProfileImageSource(profile.image, defaultAvatarSource);
  return {
    facade,
    navigation,
    isDarkMode,
    colors,
    insets,
    t,
    showAlert,
    profile,
    profileImageSource,
    ...premium,
    reminderEnabled,
    autoMarkLearned,
    startHour,
    startMinute,
    endHour,
    endMinute,
    frequency,
    showTimePicker,
    setShowTimePicker,
    tempHour,
    setTempHour,
    tempMinute,
    setTempMinute,
    hourScrollRef,
    minuteScrollRef,
    showFrequencyPicker,
    setShowFrequencyPicker,
    selectedLanguage,
    setSelectedLanguage,
    isSystemLanguage,
    setIsSystemLanguage,
    showLanguagePicker,
    setShowLanguagePicker,
    showHelpModal,
    setShowHelpModal,
    showLevelPicker,
    setShowLevelPicker,
    currentLevel,
    setCurrentLevel,
    showAutoMarkPicker,
    setShowAutoMarkPicker,
    showEditProfileModal,
    setShowEditProfileModal,
    showImagePickerModal,
    setShowImagePickerModal,
    showAvatarPickerModal,
    setShowAvatarPickerModal,
    tempName,
    setTempName,
    openTimePicker,
    handleReminderToggle,
    confirmTime,
    changeFrequency,
    changeAutoMark,
    pickProfileImage,
    removeProfileImage,
    selectAvatar,
    openEditProfile,
    saveProfile,
    handleRateVocBee,
    handleChangeLanguage,
    handleResetProgress,
    handleDeleteAccount,
    handleLogout,
  };
}

export type SettingsScreenController = ReturnType<typeof useSettingsScreenController>;
