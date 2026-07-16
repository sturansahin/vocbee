import React, { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { FONT_FAMILY, useTheme } from '@shared/theme';
import type { RootStackParamList } from '@app/navigation/types';

import type { OnboardingFacade } from '../../application/contracts';

type OnboardingNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

interface OnboardingStepSpec {
  id: string;
  titleKey: string;
  subtitleKey: string;
  image: ImageSourcePropType;
  titleFallback?: string;
  subtitleFallback?: string;
}

interface OnboardingStep extends OnboardingStepSpec {
  title: string;
  subtitle: string;
}

const ONBOARDING_STEP_SPECS: readonly OnboardingStepSpec[] = [
  {
    id: 'daily-words',
    titleKey: 'onboarding.title1',
    subtitleKey: 'onboarding.subtitle1',
    image: require('@/assets/image/onboard1.png'),
  },
  {
    id: 'progress',
    titleKey: 'onboarding.title4',
    subtitleKey: 'onboarding.subtitle4',
    titleFallback: 'Let words come to you',
    subtitleFallback: 'Get timely reminders, keep your learning streak alive, and return when it matters.',
    image: require('@/assets/image/onboard2.png'),
  },
  {
    id: 'cards',
    titleKey: 'onboarding.title2',
    subtitleKey: 'onboarding.subtitle2',
    image: require('@/assets/image/onboard3.png'),
  },
  {
    id: 'reminders',
    titleKey: 'onboarding.title3',
    subtitleKey: 'onboarding.subtitle3',
    image: require('@/assets/image/onboard4.png'),
  },
];

const ONBOARDING_IMAGE_SCALE = 1.3;
const ONBOARDING_IMAGE_BASE = {
  widthRatio: {
    small: 0.83,
    regular: 0.885,
  },
  heightRatio: {
    small: 0.377,
    regular: 0.462,
  },
  maxWidth: {
    regular: 382,
    large: 431,
  },
  maxHeight: {
    regular: 410,
    large: 470,
  },
  visualAreaRatio: {
    small: 0.4,
    regular: 0.469,
  },
  visualAreaMaxHeight: {
    regular: 431,
    large: 492,
  },
} as const;

interface OnboardingScreenProps {
  facade: OnboardingFacade;
}

export default function OnboardingScreen({ facade }: OnboardingScreenProps) {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [currentStep, setCurrentStep] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingStep>>(null);

  const steps = useMemo<OnboardingStep[]>(
    () =>
      ONBOARDING_STEP_SPECS.map(step => ({
        ...step,
        title: t(step.titleKey, { defaultValue: step.titleFallback }),
        subtitle: t(step.subtitleKey, { defaultValue: step.subtitleFallback }),
      })),
    [t]
  );

  const isSmallScreen = screenHeight < 700;
  const isLargeScreen = screenHeight > 900;
  const titleFontSize = isSmallScreen ? 22 : isLargeScreen ? 32 : 27;
  const subtitleFontSize = isSmallScreen ? 14 : isLargeScreen ? 18 : 16;
  const verticalPadding = isSmallScreen ? 18 : 28;
  const imageWidthRatio = isSmallScreen
    ? ONBOARDING_IMAGE_BASE.widthRatio.small
    : ONBOARDING_IMAGE_BASE.widthRatio.regular;
  const imageHeightRatio = isSmallScreen
    ? ONBOARDING_IMAGE_BASE.heightRatio.small
    : ONBOARDING_IMAGE_BASE.heightRatio.regular;
  const visualAreaRatio = isSmallScreen
    ? ONBOARDING_IMAGE_BASE.visualAreaRatio.small
    : ONBOARDING_IMAGE_BASE.visualAreaRatio.regular;
  const maxImageWidth = isLargeScreen
    ? ONBOARDING_IMAGE_BASE.maxWidth.large
    : ONBOARDING_IMAGE_BASE.maxWidth.regular;
  const maxImageHeight = isLargeScreen
    ? ONBOARDING_IMAGE_BASE.maxHeight.large
    : ONBOARDING_IMAGE_BASE.maxHeight.regular;
  const maxVisualAreaHeight = isLargeScreen
    ? ONBOARDING_IMAGE_BASE.visualAreaMaxHeight.large
    : ONBOARDING_IMAGE_BASE.visualAreaMaxHeight.regular;
  const imageWidth = Math.min(screenWidth * imageWidthRatio, maxImageWidth) * ONBOARDING_IMAGE_SCALE;
  const imageHeight = Math.min(screenHeight * imageHeightRatio, maxImageHeight) * ONBOARDING_IMAGE_SCALE;
  const visualAreaHeight = Math.min(screenHeight * visualAreaRatio, maxVisualAreaHeight) * ONBOARDING_IMAGE_SCALE;
  const isLastStep = currentStep === steps.length - 1;

  const completeOnboarding = async () => {
    try {
      await facade.complete();
    } catch (error) {
      console.error('Error marking onboarding as seen:', error);
    } finally {
      navigation.navigate('Login');
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      flatListRef.current?.scrollToIndex({ index: nextStep, animated: true });
      setCurrentStep(nextStep);
      return;
    }

    completeOnboarding();
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / screenWidth);

    if (newIndex !== currentStep && newIndex >= 0 && newIndex < steps.length) {
      setCurrentStep(newIndex);
    }
  };

  const renderItem = ({ item }: { item: OnboardingStep }) => (
    <View style={[styles.slide, { width: screenWidth }]}>
      <View style={[styles.copyContainer, { paddingTop: isSmallScreen ? 34 : isLargeScreen ? 68 : 52 }]}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: titleFontSize,
              marginBottom: isSmallScreen ? 8 : 14,
            },
          ]}
        >
          {item.title}
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
              fontSize: subtitleFontSize,
              lineHeight: subtitleFontSize * 1.5,
            },
          ]}
        >
          {item.subtitle}
        </Text>
      </View>

      <View style={[styles.visualArea, { height: visualAreaHeight }]}>
        <Image
          source={item.image}
          resizeMode="contain"
          style={[
            styles.visualImage,
            {
              width: imageWidth,
              height: imageHeight,
            },
          ]}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingVertical: verticalPadding }]}>
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={steps}
            renderItem={renderItem}
            keyExtractor={item => item.id}
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

        <View style={[styles.dotsContainer, { marginBottom: isSmallScreen ? 20 : 34 }]}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: index === currentStep ? colors.primary : colors.border },
                index === currentStep && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {isLastStep ? (
          <View style={styles.startButtonContainer}>
            <TouchableOpacity onPress={completeOnboarding} style={styles.startButton}>
              <Text style={[styles.startButtonText, { color: colors.primary, fontSize: subtitleFontSize + 2 }]}>
                {t('onboarding.start')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity onPress={completeOnboarding} style={styles.skipButton}>
              <Text style={[styles.skipButtonText, { color: colors.textSecondary, fontSize: subtitleFontSize + 2 }]}>
                {t('onboarding.skip')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
              <Text style={[styles.nextButtonText, { color: colors.primary, fontSize: subtitleFontSize + 2 }]}>
                {t('onboarding.next')}
              </Text>
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
  carouselContainer: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'space-between',
  },
  copyContainer: {
    paddingHorizontal: 28,
  },
  title: {
    fontFamily: FONT_FAMILY,
    textAlign: 'left',
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    textAlign: 'left',
    maxWidth: 340,
  },
  visualArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualImage: {},
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
