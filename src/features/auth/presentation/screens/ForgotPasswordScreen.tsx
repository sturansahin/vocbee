import React, { useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import type { RootStackParamList } from '@app/navigation/types';
import { useResponsiveLayout } from '@shared/responsive';
import { AppButton, AppInput, AppScrollView, AppText, Stack, useAlert } from '@shared/ui';

import { validateForgotPassword } from '../../domain/rules';
import { useAuth } from '../AuthProvider';

type ForgotPasswordNavProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordNavProp>();
  const { resetPassword } = useAuth();
  const { showAlert } = useAlert();
  const { isSmallHeight } = useResponsiveLayout();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetPassword = async () => {
    const validationError = validateForgotPassword(email);
    if (validationError) {
      showAlert({
        title: t('auth.error'),
        message: t(`forgotPassword.${validationError}`),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email);
      showAlert({
        title: t('forgotPassword.emailSent'),
        message: t('forgotPassword.checkInbox'),
        buttons: [{ text: t('common.ok'), onPress: () => navigation.goBack() }],
      });
    } catch (error) {
      showAlert({
        title: t('auth.error'),
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScrollView
      contentContainerStyle={{ justifyContent: 'center', paddingVertical: isSmallHeight ? 20 : 32 }}
      keyboardAvoiding
      testID="forgot-password-screen"
    >
      <Stack gap={isSmallHeight ? 'lg' : '2xl'}>
        <Stack gap="sm">
          <AppText accessibilityRole="header" variant="screenTitle">
            {t('forgotPassword.title')}
          </AppText>
          <AppText color="textSecondary">{t('forgotPassword.subtitle')}</AppText>
        </Stack>

        <AppInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label={t('auth.email')}
          onChangeText={setEmail}
          placeholder={t('auth.enterEmail')}
          returnKeyType="send"
          textContentType="emailAddress"
          value={email}
          onSubmitEditing={() => void handleResetPassword()}
        />

        <AppButton
          label={t('forgotPassword.sendResetLink')}
          leadingIcon={(color) => <MaterialIcons color={color} name="send" size={20} />}
          loading={isSubmitting}
          onPress={handleResetPassword}
          testID="forgot-password-submit"
        />

        <AppButton
          label={t('forgotPassword.backToLogin')}
          leadingIcon={(color) => <MaterialIcons color={color} name="arrow-back" size={18} />}
          onPress={() => navigation.goBack()}
          testID="forgot-password-back"
          variant="ghost"
        />
      </Stack>
    </AppScrollView>
  );
}
