import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import type { RootStackParamList } from '@app/navigation/types';
import { useResponsiveLayout } from '@shared/responsive';
import { useTheme } from '@shared/theme';
import {
  AppButton,
  AppHeader,
  AppInput,
  AppScrollView,
  AppText,
  Divider,
  Inline,
  Stack,
  useAlert,
} from '@shared/ui';

import type { AuthPresentationGateway } from '../../application/presentationContracts';
import { validateRegistration } from '../../domain/rules';
import { SOCIAL_AUTH_CANCELLED_ERROR } from '../../domain/types';
import { useAuth } from '../AuthProvider';

interface SignUpScreenProps {
  gateway: AuthPresentationGateway;
}

export function SignUpScreen({ gateway }: SignUpScreenProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { signUp, signInWithGoogle, signInWithApple, signOut } = useAuth();
  const { showAlert } = useAlert();
  const { isSmallHeight } = useResponsiveLayout();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasAcceptedPrivacyPolicy, setHasAcceptedPrivacyPolicy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async () => {
    const validationError = validateRegistration({
      name,
      email,
      password,
      confirmPassword,
      hasAcceptedPrivacyPolicy,
    });
    if (validationError) {
      showAlert({ title: t('auth.error'), message: t(`auth.${validationError}`) });
      return;
    }
    setIsSubmitting(true);
    try {
      await signUp(email, password, name);
      await signOut();
      showAlert({
        title: t('auth.accountCreated'),
        message: t('auth.accountCreatedDesc'),
        buttons: [{ text: t('common.ok'), onPress: () => navigation.navigate('Login') }],
      });
    } catch (error) {
      showAlert({
        title: t('auth.signUpFailed'),
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
      navigation.navigate(result.setupCompleted ? 'MainTabs' : 'NativeLanguage');
    } catch (error) {
      if (error instanceof Error && error.message === SOCIAL_AUTH_CANCELLED_ERROR) return;
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
      contentContainerStyle={{ paddingVertical: isSmallHeight ? 12 : 24 }}
      keyboardAvoiding
      testID="signup-screen"
    >
      <AppHeader
        backAccessibilityLabel={t('common.back', { defaultValue: 'Back' })}
        onBack={() => navigation.goBack()}
        title={t('auth.signUp')}
      />
      <Stack gap={isSmallHeight ? 'lg' : '2xl'} style={styles.formContent}>
        <Stack gap="xs">
          <AppText accessibilityRole="header" variant="screenTitle">
            {t('auth.startYourLanguage')}
          </AppText>
          <AppText color="accent" variant="screenTitle">
            {t('auth.journeyToday')}
          </AppText>
        </Stack>

        <Stack gap="lg">
          <AppInput
            autoComplete="name"
            label={t('auth.fullName')}
            onChangeText={setName}
            placeholder={t('auth.namePlaceholder')}
            textContentType="name"
            value={name}
          />
          <AppInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label={t('auth.email')}
            onChangeText={setEmail}
            placeholder={t('auth.enterEmail')}
            textContentType="emailAddress"
            value={email}
          />
          <AppInput
            autoComplete="new-password"
            label={t('auth.password')}
            onChangeText={setPassword}
            placeholder={t('auth.createPassword')}
            secureTextEntry
            textContentType="newPassword"
            value={password}
          />
          <AppInput
            autoComplete="new-password"
            label={t('auth.confirmPassword')}
            onChangeText={setConfirmPassword}
            onSubmitEditing={() => void handleSignUp()}
            placeholder={t('auth.confirmPasswordPlaceholder')}
            returnKeyType="done"
            secureTextEntry
            textContentType="newPassword"
            value={confirmPassword}
          />
        </Stack>

        <Inline align="flex-start" style={styles.consentRow}>
          <Pressable
            accessibilityLabel={`${t('auth.acceptPrivacyPrefix')} ${t('settings.privacyPolicy')}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: hasAcceptedPrivacyPolicy }}
            onPress={() => setHasAcceptedPrivacyPolicy((accepted) => !accepted)}
            style={styles.checkbox}
            testID="privacy-consent-checkbox"
          >
            <MaterialIcons
              color={hasAcceptedPrivacyPolicy ? colors.accent : colors.textSecondary}
              name={hasAcceptedPrivacyPolicy ? 'check-box' : 'check-box-outline-blank'}
              size={26}
            />
          </Pressable>
          <AppText color="textSecondary" style={styles.consentCopy} variant="caption">
            {t('auth.acceptPrivacyPrefix')}{' '}
            <AppText
              accessibilityRole="link"
              onPress={() => void gateway.openPrivacyPolicy()}
              style={[styles.privacyPolicyLabel, { color: colors.accent }]}
              testID="privacy-policy-link"
              variant="caption"
            >
              {t('settings.privacyPolicy')}
            </AppText>
          </AppText>
        </Inline>

        <AppButton
          disabled={!hasAcceptedPrivacyPolicy}
          label={t('auth.signUp')}
          loading={isSubmitting}
          onPress={handleSignUp}
          testID="signup-submit"
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
            onPress={() => void handleSocialSignIn(signInWithGoogle)}
            style={styles.socialButton}
            variant="outline"
          />
          {Platform.OS === 'ios' ? (
            <AppButton
              fullWidth={false}
              label={t('auth.apple')}
              leadingIcon={(color) => <AntDesign color={color} name="apple" size={18} />}
              onPress={() => void handleSocialSignIn(signInWithApple)}
              style={styles.socialButton}
              variant="outline"
            />
          ) : null}
        </Inline>
      </Stack>
    </AppScrollView>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentCopy: {
    flex: 1,
    paddingTop: 12,
  },
  consentRow: {
    width: '100%',
  },
  divider: {
    flex: 1,
  },
  formContent: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  privacyPolicyLabel: {
    textDecorationLine: 'underline',
  },
  socialButton: {
    flex: 1,
  },
});
