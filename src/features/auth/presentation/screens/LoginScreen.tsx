import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useResponsiveLayout } from '@shared/responsive';
import { AppButton, AppInput, AppScrollView, AppText, Divider, Inline, Stack } from '@shared/ui';

import { useLoginController } from '../hooks/useLoginController';

export function LoginScreen() {
  const layout = useResponsiveLayout();
  const { t } = useTranslation();
  const controller = useLoginController();

  return (
    <AppScrollView contentContainerStyle={styles.content} keyboardAvoiding testID="login-screen">
      <Stack gap={layout.isSmallHeight ? 'lg' : '2xl'} style={styles.formContent}>
        <Stack gap="lg">
          <AppInput
            accessibilityLabel={t('auth.email')}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={controller.setEmail}
            placeholder={t('auth.emailPlaceholder')}
            returnKeyType="next"
            textContentType="emailAddress"
            value={controller.email}
          />
          <AppInput
            accessibilityLabel={t('auth.password')}
            autoComplete="password"
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
            labelStyle={styles.authLinkLabel}
            onPress={controller.openSignUp}
            testID="login-open-signup"
            variant="ghost"
          />
          <AppButton
            fullWidth={false}
            label={t('auth.forgotPassword')}
            labelStyle={styles.authLinkLabel}
            onPress={controller.openForgotPassword}
            testID="login-open-forgot-password"
            variant="ghost"
          />
        </Inline>

        <AppButton
          disabled={controller.isSubmitting}
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
    justifyContent: 'center',
  },
  authLinkLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  formContent: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  divider: {
    flex: 1,
  },
  socialButton: {
    flex: 1,
  },
});
