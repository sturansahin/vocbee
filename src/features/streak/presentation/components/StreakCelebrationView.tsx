import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ThemeColors } from '@shared/theme';
import { FONT_FAMILY } from '@shared/theme';
import { AnimatedCountUp } from './AnimatedCountUp';
import {
  STREAK_COUNT_UP_DELAY,
  type useStreakCelebrationAnimation,
} from '../hooks/useStreakCelebrationAnimation';

const FIRE_ANIMATION = require('../../../../../assets/animations/fire.json');
const FIRE_PLAYBACK_SPEED = 106 / 30 / 0.8;
const FIRE_SIZE = 176;
const EMBER_SIZE = 26;
const COUNT_CLUSTER_WIDTH = 128;
const COUNT_CLUSTER_HEIGHT = 72;

interface StreakCelebrationViewProps {
  streakCount: number;
  streakLabel: string;
  message: string;
  colors: ThemeColors;
  topInset: number;
  bottomInset: number;
  reducedMotion: boolean;
  moderateScale(value: number): number;
  animation: ReturnType<typeof useStreakCelebrationAnimation>;
}

export function StreakCelebrationView({
  streakCount,
  streakLabel,
  message,
  colors,
  topInset,
  bottomInset,
  reducedMotion,
  moderateScale,
  animation,
}: StreakCelebrationViewProps) {
  const { lottieRef, values } = animation;

  return (
    <View
      accessibilityLabel={`${streakCount} ${streakLabel}. ${message}`}
      accessibilityLiveRegion="assertive"
      accessibilityRole="summary"
      style={styles.overlayRoot}
      pointerEvents="auto"
      testID="streak-celebration-overlay"
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: values.backdropOpacity,
            backgroundColor: colors.celebrationBackdrop,
          },
        ]}
      />
      <View
        style={[
          styles.content,
          {
            paddingTop: topInset + moderateScale(18),
            paddingBottom: Math.max(bottomInset + moderateScale(28), moderateScale(42)),
          },
        ]}
        pointerEvents="none"
      >
        <View style={styles.stage}>
          <Animated.View
            style={[
              styles.emberWrapper,
              {
                opacity: values.emberOpacity,
                transform: [{ scale: values.emberScale }],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.emberPrimary, colors.emberSecondary]}
              start={{ x: 0.2, y: 0.1 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.emberDot}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.fireCluster,
              {
                opacity: values.fireOpacity,
                transform: [{ translateX: values.fireTranslateX }, { scale: values.fireScale }],
              },
            ]}
          >
            <View style={styles.fireAnimationOffset}>
              <LottieView
                ref={lottieRef}
                source={FIRE_ANIMATION}
                autoPlay={!reducedMotion}
                loop={!reducedMotion}
                speed={FIRE_PLAYBACK_SPEED}
                style={styles.fireAnimation}
              />
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.countCluster,
              {
                opacity: values.countOpacity,
                transform: [
                  { translateX: values.countTranslateX },
                  { translateY: values.countTranslateY },
                ],
              },
            ]}
          >
            <AnimatedCountUp
              value={streakCount}
              delay={reducedMotion ? 0 : STREAK_COUNT_UP_DELAY}
              duration={reducedMotion ? 0 : 780}
              style={[
                styles.streakCount,
                {
                  color: colors.celebrationText,
                  fontSize: moderateScale(64),
                  lineHeight: moderateScale(70),
                },
              ]}
              testID="streak-celebration-count"
            />
            <Text
              style={[
                styles.streakLabel,
                { color: colors.celebrationLabel, fontSize: moderateScale(12) },
              ]}
            >
              {streakLabel}
            </Text>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.messageContainer,
            {
              marginTop: moderateScale(12),
              opacity: values.messageOpacity,
              transform: [{ translateY: values.messageTranslateY }],
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              {
                color: colors.celebrationMessage,
                fontSize: moderateScale(16),
                lineHeight: moderateScale(22),
              },
            ]}
          >
            {message}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9500,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  stage: {
    width: '100%',
    maxWidth: 360,
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emberWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: EMBER_SIZE,
    height: EMBER_SIZE,
    marginLeft: -(EMBER_SIZE / 2),
    marginTop: -(EMBER_SIZE / 2),
  },
  emberDot: {
    width: EMBER_SIZE,
    height: EMBER_SIZE,
    borderRadius: EMBER_SIZE / 2,
  },
  fireCluster: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: FIRE_SIZE,
    height: FIRE_SIZE,
    marginLeft: -(FIRE_SIZE / 2),
    marginTop: -(FIRE_SIZE / 2),
  },
  fireAnimation: {
    width: FIRE_SIZE,
    height: FIRE_SIZE,
  },
  fireAnimationOffset: {
    transform: [{ translateY: -10 }],
  },
  countCluster: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: COUNT_CLUSTER_WIDTH,
    height: COUNT_CLUSTER_HEIGHT,
    marginLeft: -(COUNT_CLUSTER_WIDTH / 2),
    marginTop: -(COUNT_CLUSTER_HEIGHT / 2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCount: {
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    textShadowColor: 'rgba(255,143,31,0.28)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 18,
  },
  streakLabel: {
    position: 'absolute',
    top: '100%',
    marginTop: 6,
    width: COUNT_CLUSTER_WIDTH,
    fontFamily: FONT_FAMILY,
    lineHeight: 16,
    textAlign: 'center',
    letterSpacing: 1.4,
  },
  messageContainer: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  messageText: {
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
  },
});
