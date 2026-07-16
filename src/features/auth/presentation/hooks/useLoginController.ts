import { useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';

import { useAlert } from '@/components/CustomAlert';
import { createSwarmAnimation } from '@/assets/animations/swarmAnimation';
import type { RootStackParamList } from '@/types';

import { SOCIAL_AUTH_CANCELLED_ERROR } from '../../domain/types';
import { validateLogin } from '../../domain/rules';
import { useAuth } from '../AuthProvider';
import { createLoginFlyAwayAnimation } from '../animations/loginFlyAway';

export function useLoginController(screenHeight: number) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();
  const { showAlert } = useAlert();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const lottieRef = useRef<LottieView>(null);
  const staticAnimation = useMemo(
    () => createSwarmAnimation([1, 0.78, 0.08, 1], true),
    []
  );
  const animatedAnimation = useMemo(
    () => createSwarmAnimation([1, 0.78, 0.08, 1], false),
    []
  );
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const loginResultRef = useRef<{ setupCompleted: boolean } | null>(null);
  const loginErrorRef = useRef<string | null>(null);
  const animationCompleteRef = useRef(false);
  const loginCompleteRef = useRef(false);

  const navigateAfterAuth = (setupCompleted: boolean) =>
    navigation.navigate(setupCompleted ? 'MainTabs' : 'NativeLanguage');

  const resetAnimation = () => {
    translateX.setValue(0);
    translateY.setValue(0);
    opacity.setValue(1);
    rotation.setValue(0);
    scale.setValue(1);
    lottieRef.current?.reset();
    setIsAnimating(false);
  };

  const finishWhenReady = () => {
    if (!animationCompleteRef.current || !loginCompleteRef.current) return;
    setIsSubmitting(false);
    if (loginErrorRef.current) {
      showAlert({ title: t('auth.loginFailed'), message: loginErrorRef.current });
      resetAnimation();
    } else if (loginResultRef.current) {
      navigateAfterAuth(loginResultRef.current.setupCompleted);
    }
    loginResultRef.current = null;
    loginErrorRef.current = null;
    animationCompleteRef.current = false;
    loginCompleteRef.current = false;
  };

  const handleLogin = () => {
    const validationError = validateLogin(email, password);
    if (validationError) {
      showAlert({ title: t('auth.error'), message: t(`auth.${validationError}`) });
      return;
    }

    loginResultRef.current = null;
    loginErrorRef.current = null;
    animationCompleteRef.current = false;
    loginCompleteRef.current = false;
    setIsAnimating(true);
    setIsSubmitting(true);
    void signIn(email, password)
      .then(result => {
        loginResultRef.current = result;
      })
      .catch((error: unknown) => {
        loginErrorRef.current = error instanceof Error ? error.message : String(error);
      })
      .finally(() => {
        loginCompleteRef.current = true;
        finishWhenReady();
      });
    lottieRef.current?.play();
    createLoginFlyAwayAnimation(
      { translateX, translateY, opacity, rotation, scale },
      screenHeight
    ).start(() => {
      animationCompleteRef.current = true;
      finishWhenReady();
    });
  };

  const handleSocialSignIn = async (
    action: () => Promise<{ setupCompleted: boolean }>
  ) => {
    if (isSubmitting || isAnimating) return;
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
    isAnimating,
    lottieRef,
    staticAnimation,
    animatedAnimation,
    translateX,
    translateY,
    opacity,
    rotation,
    scale,
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
