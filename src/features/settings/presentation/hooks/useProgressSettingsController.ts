import type { TFunction } from 'i18next';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/types';
import { useAlert } from '@shared/ui';
import { buildAccountConfirmation } from '../../application/accountConfirmations';
import type { SettingsFacade } from '../../application/contracts';

interface ProgressControllerOptions {
  facade: SettingsFacade;
  userId: string;
  isAdFree: boolean;
  deleteAccount(): Promise<void>;
  signOut(): Promise<void>;
  navigation: StackNavigationProp<RootStackParamList>;
  showAlert: ReturnType<typeof useAlert>['showAlert'];
  t: TFunction;
}

export function useProgressSettingsController({
  facade,
  userId,
  isAdFree,
  deleteAccount,
  signOut,
  navigation,
  showAlert,
  t,
}: ProgressControllerOptions) {
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
            await facade.resetForLanguageChange(userId);
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
            await facade.resetLearningProgress(userId);
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
          message: isAdFree
            ? `${t('settings.deleteAccountConfirmDesc')}\n\n${t(
                'settings.deleteAccountSubscriptionNote',
              )}`
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

  return {
    handleChangeLanguage,
    handleResetProgress,
    handleDeleteAccount,
    handleLogout,
  };
}
