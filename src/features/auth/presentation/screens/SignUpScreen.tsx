import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button, Header, Input } from '@/components/UIComponents';
import { useAlert } from '@/components/CustomAlert';
import { useTheme } from '@/context/ThemeContext';
import type { RootStackParamList } from '@/types';

import type { AuthPresentationGateway } from '../../application/presentationContracts';
import { validateRegistration } from '../../domain/rules';
import { SOCIAL_AUTH_CANCELLED_ERROR } from '../../domain/types';
import { useAuth } from '../AuthProvider';
import { authStyles as styles } from './authStyles';

interface SignUpScreenProps {
  gateway: AuthPresentationGateway;
}

export function SignUpScreen({ gateway }: SignUpScreenProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const { signUp, signInWithGoogle, signInWithApple, signOut } = useAuth();
  const { showAlert } = useAlert();
  const { height: screenHeight } = useWindowDimensions();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasAcceptedPrivacyPolicy, setHasAcceptedPrivacyPolicy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSmallScreen = screenHeight < 700;
  const isLargeScreen = screenHeight > 900;
  const titleFontSize = isSmallScreen ? 22 : isLargeScreen ? 32 : 28;

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

  const handleSocialSignIn = async (
    action: () => Promise<{ setupCompleted: boolean }>
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await action();
      if (result.setupCompleted) navigation.navigate('MainTabs');
      else navigation.navigate('NativeLanguage');
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

  const inputColors = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    labelColor: colors.textSecondary,
    textColor: colors.text,
    iconColor: colors.textSecondary,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        showBack
        onBack={() => navigation.goBack()}
        backgroundColor={colors.background}
        textColor={colors.text}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContentSignup,
          { padding: isSmallScreen ? 20 : 24 },
        ]}
      >
        <View
          style={[
            styles.titleSection,
            { marginBottom: isSmallScreen ? 20 : 32 },
          ]}
        >
          <Text
            style={[
              styles.titleWhite,
              {
                color: colors.text,
                fontSize: titleFontSize,
                lineHeight: titleFontSize * 1.5,
              },
            ]}
          >
            {t('auth.startYourLanguage')}
            {'\n'}
            <Text style={[styles.titleGreen, { color: colors.primary }]}>
              {t('auth.journeyToday')}
            </Text>
          </Text>
        </View>
        <Input
          label={t('auth.fullName')}
          placeholder={t('auth.namePlaceholder')}
          icon="person"
          value={name}
          onChangeText={setName}
          {...inputColors}
        />
        <Input
          label={t('auth.email')}
          placeholder={t('auth.enterEmail')}
          icon="mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          {...inputColors}
        />
        <Input
          label={t('auth.password')}
          placeholder={t('auth.createPassword')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          rightIcon={showPassword ? 'visibility' : 'visibility-off'}
          onRightIconPress={() => setShowPassword(value => !value)}
          {...inputColors}
        />
        <Input
          label={t('auth.confirmPassword')}
          placeholder={t('auth.confirmPasswordPlaceholder')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          rightIcon={showConfirmPassword ? 'visibility' : 'visibility-off'}
          onRightIconPress={() => setShowConfirmPassword(value => !value)}
          {...inputColors}
        />

        <View style={styles.privacyConsentRow}>
          <TouchableOpacity
            testID="privacy-consent-checkbox"
            onPress={() => setHasAcceptedPrivacyPolicy(value => !value)}
            style={styles.privacyCheckboxButton}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: hasAcceptedPrivacyPolicy }}
          >
            <MaterialIcons
              name={
                hasAcceptedPrivacyPolicy ? 'check-box' : 'check-box-outline-blank'
              }
              size={24}
              color={
                hasAcceptedPrivacyPolicy ? colors.primary : colors.textSecondary
              }
            />
          </TouchableOpacity>
          <Text style={[styles.privacyConsentText, { color: colors.textSecondary }]}>
            {t('auth.acceptPrivacyPrefix')}{' '}
            <Text
              testID="privacy-policy-link"
              style={[styles.privacyConsentLink, { color: colors.primary }]}
              onPress={() => void gateway.openPrivacyPolicy()}
            >
              {t('settings.privacyPolicy')}
            </Text>
            .
          </Text>
        </View>

        <Button
          title={isSubmitting ? t('auth.creatingAccount') : t('auth.signUp')}
          onPress={handleSignUp}
          disabled={isSubmitting || !hasAcceptedPrivacyPolicy}
        />
        {isSubmitting && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginTop: 16 }}
          />
        )}
        <View style={[styles.divider, { marginVertical: isSmallScreen ? 20 : 32 }]}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
            {t('auth.orContinueWith')}
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>
        <View style={[styles.socialRow, { marginBottom: isSmallScreen ? 20 : 32 }]}>
          <TouchableOpacity
            style={[
              styles.socialButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => void handleSocialSignIn(signInWithGoogle)}
            disabled={isSubmitting}
          >
            <AntDesign name="google" size={16} color={colors.text} />
            <Text style={[styles.socialButtonText, { color: colors.text }]}>
              {t('auth.google')}
            </Text>
          </TouchableOpacity>
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[
                styles.socialButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => void handleSocialSignIn(signInWithApple)}
              disabled={isSubmitting}
            >
              <AntDesign name="apple" size={16} color={colors.text} />
              <Text style={[styles.socialButtonText, { color: colors.text }]}>
                {t('auth.apple')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
