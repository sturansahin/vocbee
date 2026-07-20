import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '@app/navigation/types';
import { useAuth } from '@features/auth';
import { useTheme } from '@shared/theme';
import { useAlert } from '@shared/ui';
import { getProfileImageSource } from '@shared/utils';
import type { SettingsFacade } from '../../application/contracts';
import { useLanguageSettingsController } from './useLanguageSettingsController';
import { useNotificationSettingsController } from './useNotificationSettingsController';
import { useProfileSettingsController } from './useProfileSettingsController';
import { useProgressSettingsController } from './useProgressSettingsController';
import { useSettingsModalState } from './useSettingsModalState';
import { useSettingsPremiumActions } from './useSettingsPremiumActions';

export function useSettingsScreenController(facade: SettingsFacade) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isDarkMode, colors } = useTheme();
  const { showAlert } = useAlert();
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
  const modalState = useSettingsModalState();
  const notification = useNotificationSettingsController({
    facade,
    notificationSettings,
    updateNotificationSettings,
    showAlert,
    t,
    ...modalState,
  });
  const profileController = useProfileSettingsController({
    facade,
    profile,
    updateProfileData,
    showAlert,
    t,
    openModal: modalState.openModal,
    closeModal: modalState.closeModal,
  });
  const language = useLanguageSettingsController(facade);
  const progress = useProgressSettingsController({
    facade,
    userId: user?.uid ?? '',
    isAdFree: premium.isAdFree,
    deleteAccount,
    signOut,
    navigation,
    showAlert,
    t,
  });

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

  const defaultAvatarSource = isDarkMode
    ? require('../../../../../assets/icons/dflt_dark.png')
    : require('../../../../../assets/icons/dflt_light.png');
  const profileImageSource = getProfileImageSource(profile.image, defaultAvatarSource);

  return {
    facade,
    navigation,
    isDarkMode,
    colors,
    t,
    showAlert,
    profile,
    profileImageSource,
    ...premium,
    ...modalState,
    ...notification,
    ...profileController,
    ...language,
    ...progress,
    handleRateVocBee,
  };
}

export type SettingsScreenController = ReturnType<typeof useSettingsScreenController>;
