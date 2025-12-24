import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { Button, Input, Header } from '../components/UIComponents';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { SwarmLogo } from '../components/SwarmLogo';
import { COLORS } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { FONT_FAMILY } from '../utils/typography';

type AuthNavProp = StackNavigationProp<RootStackParamList>;

export const LoginScreen = () => {
  const navigation = useNavigation<AuthNavProp>();
  const { colors, isDarkMode } = useTheme();
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <SwarmLogo size={100} color={COLORS.primary} />
          <Text style={[styles.appTitle, { color: colors.text }]}>VocBee</Text>
          <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>Master new words effortlessly.</Text>
        </View>

        {/* Form */}
        <Input
          label="Email"
          placeholder="Email or Username"
          icon="mail"
          backgroundColor={colors.surface}
          borderColor={colors.border}
          labelColor={colors.textSecondary}
          textColor={colors.text}
          iconColor={colors.textSecondary}
        />
        <Input
          label="Password"
          placeholder="Password"
          secureTextEntry={!showPassword}
          rightIcon={showPassword ? "visibility" : "visibility-off"}
          onRightIconPress={() => setShowPassword(!showPassword)}
          backgroundColor={colors.surface}
          borderColor={colors.border}
          labelColor={colors.textSecondary}
          textColor={colors.text}
          iconColor={colors.textSecondary}
        />

        <View style={styles.forgotContainer}>
          <TouchableOpacity>
            <Text style={[styles.forgotText, { color: colors.textSecondary }]}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <Button title="Log In" onPress={() => navigation.navigate('NativeLanguage')} />

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>Or continue with</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Social Buttons */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={[styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AntDesign name="google" size={16} color={colors.text} />
            <Text style={[styles.socialButtonText, { color: colors.text }]}>Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.signupRow}>
          <Text style={[styles.signupText, { color: colors.textSecondary }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={[styles.signupLink, { color: colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export const SignUpScreen = () => {
  const navigation = useNavigation<AuthNavProp>();
  const { colors, isDarkMode } = useTheme();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        showBack
        onBack={() => navigation.goBack()}
        backgroundColor={colors.background}
        textColor={colors.text}
      />
      <ScrollView contentContainerStyle={styles.scrollContentSignup}>

        <View style={styles.titleSection}>
          <Text style={[styles.titleWhite, { color: colors.text }]}>
            Start your language{"\n"}
            <Text style={[styles.titleGreen, { color: colors.primary }]}>journey today.</Text>
          </Text>
        </View>

        <Input
          label="Email"
          placeholder="Enter your email"
          icon="mail"
          backgroundColor={colors.surface}
          borderColor={colors.border}
          labelColor={colors.textSecondary}
          textColor={colors.text}
          iconColor={colors.textSecondary}
        />
        <Input
          label="Password"
          placeholder="Create password"
          secureTextEntry={!showPassword}
          rightIcon={showPassword ? "visibility" : "visibility-off"}
          onRightIconPress={() => setShowPassword(!showPassword)}
          backgroundColor={colors.surface}
          borderColor={colors.border}
          labelColor={colors.textSecondary}
          textColor={colors.text}
          iconColor={colors.textSecondary}
        />
        <Input
          label="Confirm Password"
          placeholder="Confirm password"
          secureTextEntry={!showConfirmPassword}
          rightIcon={showConfirmPassword ? "visibility" : "visibility-off"}
          onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
          backgroundColor={colors.surface}
          borderColor={colors.border}
          labelColor={colors.textSecondary}
          textColor={colors.text}
          iconColor={colors.textSecondary}
        />

        <Button title="Sign Up" onPress={() => navigation.navigate('NativeLanguage')} />

        {/* Divider & Socials */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>Or continue with</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={[styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AntDesign name="google" size={16} color={colors.text} />
            <Text style={[styles.socialButtonText, { color: colors.text }]}>Google</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  scrollContentSignup: {
    flexGrow: 1,
    padding: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontFamily: FONT_FAMILY,
    color: '#fff',
    fontSize: 36,
    marginBottom: 8,
    marginTop: 8,
  },
  appSubtitle: {
    fontFamily: FONT_FAMILY,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontFamily: FONT_FAMILY,
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontSize: 13,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontFamily: FONT_FAMILY,
    marginHorizontal: 16,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  socialButton: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialButtonText: {
    fontFamily: FONT_FAMILY,
    color: '#fff',
    fontWeight: '500',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    fontFamily: FONT_FAMILY,
    color: COLORS.textSecondary,
  },
  signupLink: {
    fontFamily: FONT_FAMILY,
    color: COLORS.primary,
  },
  titleSection: {
    marginBottom: 32,
    marginTop: 8,
  },
  titleWhite: {
    fontFamily: FONT_FAMILY,
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    lineHeight: 44,
  },
  titleGreen: {
    color: COLORS.primary,
  },
});
