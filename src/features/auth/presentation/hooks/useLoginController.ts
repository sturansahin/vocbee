import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { useAlert } from '@shared/ui';
import type { RootStackParamList } from '@app/navigation/types';

import { SOCIAL_AUTH_CANCELLED_ERROR } from '../../domain/types';
import { validateLogin } from '../../domain/rules';
import { useAuth } from '../AuthProvider';

export function useLoginController() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();
  const { showAlert } = useAlert();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigateAfterAuth = (setupCompleted: boolean) =>
    navigation.navigate(setupCompleted ? 'MainTabs' : 'NativeLanguage');

  const handleLogin = async () => {
    const validationError = validateLogin(email, password);
    if (validationError) {
      showAlert({ title: t('auth.error'), message: t(`auth.${validationError}`) });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn(email, password);
      navigateAfterAuth(result.setupCompleted);
    } catch (error) {
      showAlert({
        title: t('auth.loginFailed'),
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSignIn = async (action: () => Promise<{ setupCompleted: boolean }>) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await action();
      navigateAfterAuth(result.setupCompleted);
    } catch (error) {
      if (error instanceof Error && error.message === SOCIAL_AUTH_CANCELLED_ERROR) return;
      showAlert({
        title: t('auth.loginFailed'),
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    email,
    password,
    showPassword,
    isSubmitting,
    setEmail,
    setPassword,
    setShowPassword,
    handleLogin,
    signInWithGoogle: () => handleSocialSignIn(signInWithGoogle),
    signInWithApple: () => handleSocialSignIn(signInWithApple),
    openSignUp: () => navigation.navigate('SignUp'),
    openForgotPassword: () => navigation.navigate('ForgotPassword'),
  };
}
