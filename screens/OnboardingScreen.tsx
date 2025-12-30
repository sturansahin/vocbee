import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { Button } from '../components/UIComponents';
import { COLORS } from '../constants';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import { SwarmLogo } from '../components/SwarmLogo';
import { FONT_FAMILY } from '../utils/typography';
import { useTheme } from '../context/ThemeContext';

type OnboardingNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const { colors } = useTheme(); // Use theme
  const [currentStep, setCurrentStep] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentStep + 1, animated: true });
      setCurrentStep(currentStep + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const handleStart = () => {
    navigation.navigate('Login');
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (newIndex !== currentStep && newIndex >= 0 && newIndex < ONBOARDING_STEPS.length) {
      setCurrentStep(newIndex);
    }
  };

  const renderItem = ({ item }: { item: typeof ONBOARDING_STEPS[0] }) => (
    <View style={styles.slide}>
      <View style={[styles.imageContainer, { backgroundColor: colors.surfaceLight }]}>
        <MaterialIcons name={item.icon as any} size={120} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>

        {/* Header Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <SwarmLogo size={30} color={colors.primary} />
          </View>
          <Text style={[styles.logoText, { color: colors.text }]}>VocBee</Text>
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
          />
        </View>

        {/* Dots */}
        <View style={styles.dotsContainer}>
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
            <TouchableOpacity onPress={handleStart} style={[styles.startButton]}>
              <Text style={[styles.startButtonText, { color: colors.primary }]}>Start</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actions}>
            <Button
              title="Skip"
              variant="ghost"
              onPress={handleSkip}
              fullWidth={false}
            />
            <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
              <Text style={[styles.nextButtonText, { color: colors.primary }]}>Next</Text>
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
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: FONT_FAMILY,
    color: '#fff',
    fontSize: 24,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 24,
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  imageContainer: {
    width: SCREEN_WIDTH - 48,
    aspectRatio: 1,
    backgroundColor: 'rgba(168, 201, 158, 0.1)',
    borderRadius: 48,
    marginBottom: 40,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONT_FAMILY,
    color: '#fff',
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceLight,
  },
  dotActive: {
    width: 32,
    backgroundColor: COLORS.primary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  nextButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  nextButtonText: {
    fontFamily: FONT_FAMILY,
    color: COLORS.primary,
    fontSize: 18,
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
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '600',
  },
});

