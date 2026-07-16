import React from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@shared/theme';
import { Button, Input } from '@shared/ui';

import { useLoginController } from '../hooks/useLoginController';
import { authStyles as styles } from './authStyles';

export function LoginScreen() {
  const { colors } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const { t } = useTranslation();
  const controller = useLoginController(screenHeight);
  const isSmallScreen = screenHeight < 700;
  const isLargeScreen = screenHeight > 900;
  const lottieSize = isSmallScreen ? 150 : isLargeScreen ? 150 : 130;
  const titleFontSize = isSmallScreen ? 28 : isLargeScreen ? 40 : 36;
  const subtitleFontSize = isSmallScreen ? 14 : isLargeScreen ? 18 : 16;
  const authLinkFontSize = isSmallScreen ? 12 : 13;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { padding: isSmallScreen ? 20 : 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.logoSection,
            { marginBottom: isSmallScreen ? 24 : 40 },
          ]}
        >
          <Animated.View
            style={[
              styles.lottieContainer,
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
              ref={controller.lottieRef}
              source={
                controller.isAnimating
                  ? controller.animatedAnimation
                  : controller.staticAnimation
              }
              style={{ width: '100%', height: '100%', transform: [{ scale: 1.15 }] }}
              autoPlay={controller.isAnimating}
              loop
              speed={1.5}
            />
          </Animated.View>
          <Text style={[styles.appTitle, { color: colors.text, fontSize: titleFontSize }]}>
            VocBee
          </Text>
          <Text
            style={[
              styles.appSubtitle,
              { color: colors.textSecondary, fontSize: subtitleFontSize },
            ]}
          >
            {t('auth.subtitle')}
          </Text>
        </View>

        <Input
          label={t('auth.email')}
          placeholder={t('auth.emailPlaceholder')}
          icon="mail"
          value={controller.email}
          onChangeText={controller.setEmail}
          backgroundColor={colors.surface}
          borderColor={colors.border}
          labelColor={colors.textSecondary}
          textColor={colors.text}
          iconColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label={t('auth.password')}
          placeholder={t('auth.passwordPlaceholder')}
          value={controller.password}
          onChangeText={controller.setPassword}
          secureTextEntry={!controller.showPassword}
          rightIcon={controller.showPassword ? 'visibility' : 'visibility-off'}
          onRightIconPress={() =>
            controller.setShowPassword(!controller.showPassword)
          }
          backgroundColor={colors.surface}
          borderColor={colors.border}
          labelColor={colors.textSecondary}
          textColor={colors.text}
          iconColor={colors.textSecondary}
        />

        <View style={styles.authLinksRow}>
          <TouchableOpacity
            onPress={controller.openSignUp}
            style={styles.signupInlineButton}
            hitSlop={8}
          >
            <Text
              style={[
                styles.signupText,
                { color: colors.textSecondary, fontSize: authLinkFontSize },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.86}
            >
              {t('auth.noAccount')}{' '}
              <Text style={[styles.signupLink, { color: colors.primary }]}>
                {t('auth.signUp')}
              </Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={controller.openForgotPassword}
            style={styles.forgotButton}
            hitSlop={8}
          >
            <Text
              style={[
                styles.forgotText,
                { color: colors.textSecondary, fontSize: authLinkFontSize },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.86}
            >
              {t('auth.forgotPassword')}
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title={
            controller.isSubmitting
              ? t('auth.loggingIn')
              : controller.isAnimating
                ? ''
                : t('auth.logIn')
          }
          onPress={controller.handleLogin}
          disabled={controller.isSubmitting || controller.isAnimating}
          variant="primary"
        />

        <View style={[styles.divider, { marginVertical: isSmallScreen ? 20 : 32 }]}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text
            style={[
              styles.dividerText,
              { color: colors.textSecondary, fontSize: isSmallScreen ? 12 : 14 },
            ]}
          >
            {t('auth.orContinueWith')}
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <View style={[styles.socialRow, { marginBottom: isSmallScreen ? 8 : 12 }]}>
          <TouchableOpacity
            style={[
              styles.socialButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                height: isSmallScreen ? 44 : isLargeScreen ? 56 : 48,
              },
            ]}
            onPress={controller.signInWithGoogle}
            disabled={controller.isSubmitting}
          >
            <AntDesign
              name="google"
              size={isSmallScreen ? 14 : isLargeScreen ? 20 : 16}
              color={colors.text}
            />
            <Text style={[styles.socialButtonText, { color: colors.text }]}>
              {t('auth.google')}
            </Text>
          </TouchableOpacity>
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[
                styles.socialButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  height: isSmallScreen ? 44 : isLargeScreen ? 56 : 48,
                },
              ]}
              onPress={controller.signInWithApple}
              disabled={controller.isSubmitting}
            >
              <AntDesign
                name="apple"
                size={isSmallScreen ? 14 : isLargeScreen ? 20 : 16}
                color={colors.text}
              />
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
