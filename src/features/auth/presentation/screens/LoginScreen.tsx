import React from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';

import { useReducedMotion, useResponsiveLayout } from '@shared/responsive';
import { AppButton, AppInput, AppScrollView, AppText, Divider, Inline, Stack } from '@shared/ui';

import { useLoginController } from '../hooks/useLoginController';

export function LoginScreen() {
  const layout = useResponsiveLayout();
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation();
  const controller = useLoginController(layout.height, reducedMotion);
  const lottieSize = layout.isSmallHeight ? 120 : layout.height > 900 ? 150 : 130;

  return (
    <AppScrollView
      contentContainerStyle={[
        styles.content,
        { justifyContent: layout.isSmallHeight ? 'flex-start' : 'center' },
      ]}
      keyboardAvoiding
      testID="login-screen"
    >
      <Stack gap={layout.isSmallHeight ? 'lg' : '2xl'}>
        <Stack align="center" gap="sm">
          <Animated.View
            style={[
              styles.lottie,
              {
                width: lottieSize,
                height: lottieSize,
                transform: [
                  { translateX: controller.translateX },
                  { translateY: controller.translateY },
                  {
                    rotate: controller.rotation.interpolate({
                      inputRange: [-360, 360],
                      outputRange: ['-360deg', '360deg'],
                    }),
                  },
                  { scale: controller.scale },
                ],
                opacity: controller.opacity,
              },
            ]}
          >
            <LottieView
              autoPlay={!reducedMotion && controller.isAnimating}
              loop={!reducedMotion}
              ref={controller.lottieRef}
              source={
                controller.isAnimating && !reducedMotion
                  ? controller.animatedAnimation
                  : controller.staticAnimation
              }
              speed={1.5}
              style={styles.lottieAsset}
            />
          </Animated.View>
          <AppText accessibilityRole="header" align="center" variant="display">
            VocBee
          </AppText>
          <AppText align="center" color="textSecondary">
            {t('auth.subtitle')}
          </AppText>
        </Stack>

        <Stack gap="lg">
          <AppInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label={t('auth.email')}
            onChangeText={controller.setEmail}
            placeholder={t('auth.emailPlaceholder')}
            returnKeyType="next"
            textContentType="emailAddress"
            value={controller.email}
          />
          <AppInput
            autoComplete="password"
            label={t('auth.password')}
            onChangeText={controller.setPassword}
            onSubmitEditing={controller.handleLogin}
            placeholder={t('auth.passwordPlaceholder')}
            returnKeyType="go"
            secureTextEntry
            textContentType="password"
            value={controller.password}
          />
        </Stack>

        <Inline justify="space-between" wrap>
          <AppButton
            fullWidth={false}
            label={`${t('auth.noAccount')} ${t('auth.signUp')}`}
            onPress={controller.openSignUp}
            testID="login-open-signup"
            variant="ghost"
          />
          <AppButton
            fullWidth={false}
            label={t('auth.forgotPassword')}
            onPress={controller.openForgotPassword}
            testID="login-open-forgot-password"
            variant="ghost"
          />
        </Inline>

        <AppButton
          disabled={controller.isAnimating}
          label={t('auth.logIn')}
          loading={controller.isSubmitting}
          onPress={controller.handleLogin}
          testID="login-submit"
        />

        <Inline align="center">
          <Divider style={styles.divider} />
          <AppText color="textSecondary" variant="caption">
            {t('auth.orContinueWith')}
          </AppText>
          <Divider style={styles.divider} />
        </Inline>

        <Inline align="stretch">
          <AppButton
            fullWidth={false}
            label={t('auth.google')}
            leadingIcon={(color) => <AntDesign color={color} name="google" size={18} />}
            onPress={controller.signInWithGoogle}
            style={styles.socialButton}
            testID="login-google"
            variant="outline"
          />
          {Platform.OS === 'ios' ? (
            <AppButton
              fullWidth={false}
              label={t('auth.apple')}
              leadingIcon={(color) => <AntDesign color={color} name="apple" size={18} />}
              onPress={controller.signInWithApple}
              style={styles.socialButton}
              testID="login-apple"
              variant="outline"
            />
          ) : null}
        </Inline>
      </Stack>
    </AppScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 20,
  },
  lottie: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  lottieAsset: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.15 }],
  },
  divider: {
    flex: 1,
  },
  socialButton: {
    flex: 1,
  },
});
