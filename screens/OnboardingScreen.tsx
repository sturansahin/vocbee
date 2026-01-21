import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import { SwarmLogo } from '../components/SwarmLogo';
import { FONT_FAMILY } from '../utils/typography';
import { useTheme } from '../context/ThemeContext';
import { STORAGE_KEYS } from '../services/storageKeys';

type OnboardingNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

const ONBOARDING_STEPS = [
  {
    id: '1',
    icon: 'menu-book',
    title: 'Learn New Words Daily',
    subtitle: 'Discover and master new vocabulary with personalized daily lessons tailored to your level.',
  },
  {
    id: '2',
    icon: 'style',
    title: 'Practice with Flashcards',
    subtitle: 'Reinforce your learning with interactive flashcards. Swipe to mark words as learned.',
  },
  {
    id: '3',
    icon: 'trending-up',
    title: 'Track Your Progress',
    subtitle: 'Monitor your learning journey and celebrate your achievements as you grow.',
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const { colors } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [currentStep, setCurrentStep] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  console.log('[Onboarding] Rendering...');

  // Responsive calculations
  const isSmallScreen = screenHeight < 700;
  const isLargeScreen = screenHeight > 900;

  // Dynamic sizing based on screen dimensions
  const iconSize = Math.min(screenWidth * 0.25, isSmallScreen ? 80 : 120);
  const imageContainerSize = Math.min(screenWidth - 48, isSmallScreen ? screenHeight * 0.3 : screenHeight * 0.35);
  const titleFontSize = isSmallScreen ? 22 : isLargeScreen ? 32 : 26;
  const subtitleFontSize = isSmallScreen ? 14 : isLargeScreen ? 18 : 16;
  const logoSize = isSmallScreen ? 32 : 40;  // Arı ikonu büyütüldü
  const logoTextSize = isSmallScreen ? 20 : 24;
  const verticalPadding = isSmallScreen ? 20 : 40;

  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const markOnboardingAsSeen = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING, 'true');
    } catch (error) {
      console.error('Error marking onboarding as seen:', error);
    }
  };

  const handleNext = async () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentStep + 1, animated: true });
      setCurrentStep(currentStep + 1);
    } else {
      await markOnboardingAsSeen();
      navigation.navigate('Login');
    }
  };

  const handleSkip = async () => {
    await markOnboardingAsSeen();
    navigation.navigate('Login');
  };

  const handleStart = async () => {
    await markOnboardingAsSeen();
    navigation.navigate('Login');
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / screenWidth);
    if (newIndex !== currentStep && newIndex >= 0 && newIndex < ONBOARDING_STEPS.length) {
      setCurrentStep(newIndex);
    }
  };

  const renderItem = ({ item }: { item: typeof ONBOARDING_STEPS[0] }) => (
    <View style={[styles.slide, { width: screenWidth }]}>
      <View style={[
        styles.imageContainer,
        {
          backgroundColor: colors.surfaceLight,
          width: imageContainerSize,
          height: imageContainerSize,
          borderRadius: imageContainerSize * 0.15,
          marginBottom: isSmallScreen ? 20 : 40,
        }
      ]}>
        <MaterialIcons name={item.icon as any} size={iconSize} color={colors.primary} />
      </View>
      <Text style={[
        styles.title,
        {
          color: colors.text,
          fontSize: titleFontSize,
          marginBottom: isSmallScreen ? 8 : 16,
        }
      ]}>
        {item.title}
      </Text>
      <Text style={[
        styles.subtitle,
        {
          color: colors.textSecondary,
          fontSize: subtitleFontSize,
          lineHeight: subtitleFontSize * 1.5,
        }
      ]}>
        {item.subtitle}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingVertical: verticalPadding }]}>

        {/* Header Logo */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { width: logoSize + 10, height: logoSize + 10 }]}>
            <SwarmLogo size={logoSize} color={colors.primary} />
          </View>
          <Text style={[styles.logoText, { color: colors.text, fontSize: logoTextSize }]}>VocBee</Text>
        </View>

        {/* Carousel with FlatList */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={ONBOARDING_STEPS}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            bounces={false}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
          />
        </View>

        {/* Dots */}
        <View style={[styles.dotsContainer, { marginBottom: isSmallScreen ? 20 : 40 }]}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: index === currentStep ? colors.primary : colors.border },
                index === currentStep && styles.dotActive
              ]}
            />
          ))}
        </View>

        {/* Actions - Start button on last step, Skip/Next otherwise */}
        {isLastStep ? (
          <View style={styles.startButtonContainer}>
            <TouchableOpacity onPress={handleStart} style={styles.startButton}>
              <Text style={[styles.startButtonText, { color: colors.primary, fontSize: subtitleFontSize + 2 }]}>Start</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={[styles.skipButtonText, { color: colors.textSecondary, fontSize: subtitleFontSize + 2 }]}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
              <Text style={[styles.nextButtonText, { color: colors.primary, fontSize: subtitleFontSize + 2 }]}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 0,
    paddingHorizontal: 24,
  },
  logoContainer: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: FONT_FAMILY,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  imageContainer: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 32,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  skipButton: {
    paddingRight: 16,
    paddingLeft: 0,
    paddingVertical: 12,
  },
  skipButtonText: {
    fontFamily: FONT_FAMILY,
  },
  nextButton: {
    paddingLeft: 16,
    paddingRight: 0,
    paddingVertical: 12,
  },
  nextButtonText: {
    fontFamily: FONT_FAMILY,
  },
  startButtonContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  startButton: {
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  startButtonText: {
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
});
