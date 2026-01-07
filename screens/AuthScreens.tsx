import React, { useState, useRef, useMemo } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { Button, Input, Header } from '../components/UIComponents';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { COLORS } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../components/CustomAlert';
import { FONT_FAMILY } from '../utils/typography';
import { createSwarmAnimation } from '../assets/animations/swarmAnimation';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type AuthNavProp = StackNavigationProp<RootStackParamList>;

export const LoginScreen = () => {
  const navigation = useNavigation<AuthNavProp>();
  const { colors, isDarkMode } = useTheme();
  const { signIn, signInWithGoogle, isLoading } = useAuth();
  const { showAlert } = useAlert();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Lottie animation ref
  const lottieRef = useRef<LottieView>(null);

  // Yellow bee color
  const beeColor: [number, number, number, number] = [1, 0.78, 0.08, 1]; // #FFC814 - golden yellow

  // Static animation (wings at rest) - shown initially
  const staticAnimation = useMemo(() => createSwarmAnimation(beeColor, true), []);

  // Animated version (wings flapping) - shown when animating
  const animatedAnimation = useMemo(() => createSwarmAnimation(beeColor, false), []);

  // Animated values for fly-away effect
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current; // Rotation for direction
  const scale = useRef(new Animated.Value(1)).current; // Scale for perspective

  // Reset animation to initial state
  const resetAnimation = () => {
    translateX.setValue(0);
    translateY.setValue(0);
    opacity.setValue(1);
    rotation.setValue(0);
    scale.setValue(1);
    lottieRef.current?.reset();
    setIsAnimating(false);
  };

  // Actual login logic (called after animation)
  const performLogin = async () => {
    setIsSubmitting(true);
    try {
      const result = await signIn(email, password);

      // Navigate based on setup status
      if (result && result.setupCompleted) {
        navigation.navigate('MainTabs');
      } else {
        navigation.navigate('NativeLanguage');
      }
    } catch (error: any) {
      showAlert({ title: 'Login Failed', message: error.message });
      // Reset animation on failure so user can try again
      resetAnimation();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle login with fly-away animation
  const handleLoginWithAnimation = () => {
    // Validate first
    if (!email || !password) {
      showAlert({ title: 'Error', message: 'Please fill in all fields' });
      return;
    }

    setIsAnimating(true);

    // Start Lottie wing animation
    lottieRef.current?.play();

    // Create realistic bee fly-away animation
    Animated.sequence([
      // Wait a moment for wings to start flapping
      Animated.delay(150),

      // Move left with rotation (face left) - like hovering
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -50,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: -25, // Tilt left
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -15, // Slight up movement
          duration: 350,
          useNativeDriver: true,
        }),
      ]),

      // Move right with rotation (face right) - swoop across
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 70,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 25, // Tilt right
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 10, // Dip down slightly
          duration: 450,
          useNativeDriver: true,
        }),
      ]),

      // Prepare for takeoff - center and tilt up
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 20,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: -45, // Tilt up-left for takeoff angle
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),

      // Fly away - diagonal up-left with spin
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -SCREEN_HEIGHT,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -100, // Fly off to the left side
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: -60, // Keep angled during flight
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.3, // Get smaller as it flies away
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // After animation completes, perform actual login
      performLogin();
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Logo Section with Lottie Animation */}
        <View style={styles.logoSection}>
          <Animated.View
            style={[
              styles.lottieContainer,
              {
                transform: [
                  { translateX: translateX },
                  { translateY: translateY },
                  {
                    rotate: rotation.interpolate({
                      inputRange: [-360, 360],
                      outputRange: ['-360deg', '360deg'],
                    })
                  },
                  { scale: scale },
                ],
                opacity: opacity,
              },
            ]}
          >
            <LottieView
              ref={lottieRef}
              source={isAnimating ? animatedAnimation : staticAnimation}
              style={styles.lottieAnimation}
              autoPlay={isAnimating}
              loop={true}
              speed={1.5}
            />
          </Animated.View>
          <Text style={[styles.appTitle, { color: colors.text }]}>VocBee</Text>
          <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>Master new words effortlessly.</Text>
        </View>

        {/* Form */}
        <Input
          label="Email"
          placeholder="Email or Username"
          icon="mail"
          value={email}
          onChangeText={setEmail}
          backgroundColor={colors.surface}
          borderColor={colors.border}
          labelColor={colors.textSecondary}
          textColor={colors.text}
          iconColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Password"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
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
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={[styles.forgotText, { color: colors.textSecondary }]}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <Button
          title={isSubmitting ? "Logging in..." : isAnimating ? "" : "Log In"}
          onPress={handleLoginWithAnimation}
          disabled={isSubmitting || isAnimating}
          variant="primary"
        />

        {isSubmitting && (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
        )}

        {/* Social Buttons - Disabled
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>Or continue with</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={signInWithGoogle}
          >
            <AntDesign name="google" size={16} color={colors.text} />
            <Text style={[styles.socialButtonText, { color: colors.text }]}>Google</Text>
          </TouchableOpacity>
        </View>
        */}

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
  const { signUp, signInWithGoogle, signOut, isLoading } = useAuth();
  const { showAlert } = useAlert();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      showAlert({ title: 'Error', message: 'Please fill in all fields' });
      return;
    }

    if (password !== confirmPassword) {
      showAlert({ title: 'Error', message: 'Passwords do not match' });
      return;
    }

    if (password.length < 6) {
      showAlert({ title: 'Error', message: 'Password must be at least 6 characters' });
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(email, password, name);
      // Sign out immediately after signup to require login
      await signOut();
      showAlert({
        title: 'Account Created!',
        message: 'Your account has been created successfully. Please log in to continue.',
        buttons: [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      });
    } catch (error: any) {
      showAlert({ title: 'Sign Up Failed', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          label="Full Name"
          placeholder="Enter your name"
          icon="person"
          value={name}
          onChangeText={setName}
          backgroundColor={colors.surface}
          borderColor={colors.border}
          labelColor={colors.textSecondary}
          textColor={colors.text}
          iconColor={colors.textSecondary}
        />
        <Input
          label="Email"
          placeholder="Enter your email"
          icon="mail"
          value={email}
          onChangeText={setEmail}
          backgroundColor={colors.surface}
          borderColor={colors.border}
          labelColor={colors.textSecondary}
          textColor={colors.text}
          iconColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Password"
          placeholder="Create password"
          value={password}
          onChangeText={setPassword}
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
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          rightIcon={showConfirmPassword ? "visibility" : "visibility-off"}
          onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
          backgroundColor={colors.surface}
          borderColor={colors.border}
          labelColor={colors.textSecondary}
          textColor={colors.text}
          iconColor={colors.textSecondary}
        />

        <Button
          title={isSubmitting ? "Creating account..." : "Sign Up"}
          onPress={handleSignUp}
          disabled={isSubmitting}
        />

        {isSubmitting && (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
        )}

        {/* Divider & Socials - Disabled 
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>Or continue with</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={signInWithGoogle}
          >
            <AntDesign name="google" size={16} color={colors.text} />
            <Text style={[styles.socialButtonText, { color: colors.text }]}>Google</Text>
          </TouchableOpacity>
        </View>
        */}

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
  lottieContainer: {
    width: 100,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieAnimation: {
    width: 100,
    height: 92,
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
    marginTop: 24,
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
    fontSize: 28,
    lineHeight: 44,
  },
  titleGreen: {
    fontFamily: FONT_FAMILY,
    color: COLORS.primary,
  },
});
