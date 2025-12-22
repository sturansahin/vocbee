import React, { useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';
import { Button } from '../components/UIComponents';
import { COLORS } from '../constants';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import { FONT_FAMILY } from '../utils/typography';

type OnboardingNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

const ONBOARDING_STEPS = [
  {
    icon: 'menu-book',
    title: 'Learn New Words Daily',
    subtitle: 'Discover and master new vocabulary with personalized daily lessons tailored to your level.',
  },
  {
    icon: 'style',
    title: 'Practice with Flashcards',
    subtitle: 'Reinforce your learning with interactive flashcards. Swipe to mark words as learned.',
  },
  {
    icon: 'trending-up',
    title: 'Track Your Progress',
    subtitle: 'Monitor your learning journey and celebrate your achievements as you grow.',
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const currentContent = ONBOARDING_STEPS[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* Header Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialIcons name="local-florist" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.logoText}>VocBee</Text>
        </View>

        {/* Carousel Content */}
        <View style={styles.carouselContainer}>
          <View style={styles.imageContainer}>
            <MaterialIcons name={currentContent.icon as any} size={120} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>{currentContent.title}</Text>
          <Text style={styles.subtitle}>
            {currentContent.subtitle}
          </Text>

          {/* Dots */}
          <View style={styles.dotsContainer}>
            {ONBOARDING_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStep && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Skip"
            variant="ghost"
            onPress={handleSkip}
            fullWidth={false}
          />
          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>

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
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 224, 123, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoText: {
    fontFamily: FONT_FAMILY,
    color: '#fff',
    fontSize: 24,
  },
  carouselContainer: {
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
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
    marginTop: 32,
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
  },
  nextButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  nextButtonText: {
    fontFamily: FONT_FAMILY,
    color: COLORS.primary,
    fontSize: 16,
  },
});
