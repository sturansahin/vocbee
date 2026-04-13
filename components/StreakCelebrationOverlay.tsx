import React, { useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { FONT_FAMILY } from '../utils/typography';
import { AnimatedCountUp } from './AnimatedCountUp';

const FIRE_ANIMATION = require('../assets/animations/fire.json');
const FIRE_TOTAL_FRAMES = 106;
const FIRE_FPS = 30;
const FIRE_LOOP_DURATION_MS = 800;
const FIRE_PLAYBACK_SPEED = (FIRE_TOTAL_FRAMES / FIRE_FPS) / (FIRE_LOOP_DURATION_MS / 1000);
const FIRE_SIZE = 176;
const FIRE_VISUAL_OFFSET_Y = -10;
const EMBER_SIZE = 26;
const COUNT_CLUSTER_WIDTH = 128;
const COUNT_CLUSTER_HEIGHT = 72;
const INTRO_PHASE_ESTIMATE = 320;
const CENTER_HOLD_DURATION = 920;
const SPLIT_HOLD_DURATION = 1580;
const COUNT_UP_DELAY = INTRO_PHASE_ESTIMATE + CENTER_HOLD_DURATION + 120;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

interface StreakCelebrationOverlayProps {
    visible: boolean;
    celebrationKey: number;
    streakCount: number;
    streakLabel: string;
    message: string;
    onComplete: () => void;
}

export function StreakCelebrationOverlay({
    visible,
    celebrationKey,
    streakCount,
    streakLabel,
    message,
    onComplete,
}: StreakCelebrationOverlayProps) {
    const { isDarkMode, colors } = useTheme();
    const insets = useSafeAreaInsets();
    const lottieRef = useRef<any>(null);
    const animationRef = useRef<Animated.CompositeAnimation | null>(null);
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const emberScale = useRef(new Animated.Value(0.18)).current;
    const emberOpacity = useRef(new Animated.Value(0)).current;
    const fireOpacity = useRef(new Animated.Value(0)).current;
    const fireScale = useRef(new Animated.Value(0.4)).current;
    const fireTranslateX = useRef(new Animated.Value(0)).current;
    const countOpacity = useRef(new Animated.Value(0)).current;
    const countTranslateX = useRef(new Animated.Value(0)).current;
    const countTranslateY = useRef(new Animated.Value(22)).current;
    const messageOpacity = useRef(new Animated.Value(0)).current;
    const messageTranslateY = useRef(new Animated.Value(18)).current;

    const splitOffset = useMemo(() => Math.min(scale(86), SCREEN_WIDTH * 0.18), []);

    const palette = useMemo(() => {
        return isDarkMode
            ? {
                backdropColor: '#000000',
                title: '#FFF7EB',
                label: 'rgba(255,247,235,0.78)',
                message: 'rgba(255,247,235,0.92)',
                ember: ['#FF8F1F', '#FFC24A'] as const,
            }
            : {
                backdropColor: '#FFFFFF',
                title: '#6A3300',
                label: 'rgba(106,51,0,0.72)',
                message: colors.text,
                ember: ['#FF8F1F', '#FFD24A'] as const,
            };
    }, [colors.text, isDarkMode]);

    useEffect(() => {
        if (!visible) {
            animationRef.current?.stop();
            lottieRef.current?.reset?.();
            return;
        }

        backdropOpacity.setValue(0);
        emberScale.setValue(0.18);
        emberOpacity.setValue(0);
        fireOpacity.setValue(0);
        fireScale.setValue(0.4);
        fireTranslateX.setValue(0);
        countOpacity.setValue(0);
        countTranslateX.setValue(0);
        countTranslateY.setValue(22);
        messageOpacity.setValue(0);
        messageTranslateY.setValue(18);

        lottieRef.current?.reset?.();
        lottieRef.current?.play?.();

        animationRef.current?.stop();
        animationRef.current = Animated.sequence([
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 180,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.timing(emberOpacity, {
                        toValue: 1,
                        duration: 90,
                        useNativeDriver: true,
                    }),
                    Animated.parallel([
                        Animated.spring(emberScale, {
                            toValue: 1,
                            speed: 16,
                            bounciness: 7,
                            useNativeDriver: true,
                        }),
                        Animated.timing(emberOpacity, {
                            toValue: 0,
                            duration: 170,
                            delay: 35,
                            easing: Easing.out(Easing.quad),
                            useNativeDriver: true,
                        }),
                        Animated.timing(fireOpacity, {
                            toValue: 1,
                            duration: 220,
                            delay: 90,
                            easing: Easing.out(Easing.cubic),
                            useNativeDriver: true,
                        }),
                        Animated.spring(fireScale, {
                            toValue: 1,
                            speed: 14,
                            bounciness: 8,
                            useNativeDriver: true,
                        }),
                    ]),
                ]),
            ]),
            Animated.delay(CENTER_HOLD_DURATION),
            Animated.parallel([
                Animated.spring(fireTranslateX, {
                    toValue: -splitOffset,
                    speed: 12,
                    bounciness: 6,
                    useNativeDriver: true,
                }),
                Animated.timing(countOpacity, {
                    toValue: 1,
                    duration: 220,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.spring(countTranslateX, {
                    toValue: splitOffset,
                    speed: 12,
                    bounciness: 6,
                    useNativeDriver: true,
                }),
                Animated.spring(countTranslateY, {
                    toValue: 0,
                    speed: 13,
                    bounciness: 5,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.delay(90),
                    Animated.parallel([
                        Animated.timing(messageOpacity, {
                            toValue: 1,
                            duration: 240,
                            easing: Easing.out(Easing.cubic),
                            useNativeDriver: true,
                        }),
                        Animated.spring(messageTranslateY, {
                            toValue: 0,
                            speed: 13,
                            bounciness: 5,
                            useNativeDriver: true,
                        }),
                    ]),
                ]),
            ]),
            Animated.delay(SPLIT_HOLD_DURATION),
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 320,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(fireOpacity, {
                    toValue: 0,
                    duration: 260,
                    useNativeDriver: true,
                }),
                Animated.timing(countOpacity, {
                    toValue: 0,
                    duration: 220,
                    useNativeDriver: true,
                }),
                Animated.timing(messageOpacity, {
                    toValue: 0,
                    duration: 220,
                    useNativeDriver: true,
                }),
            ]),
        ]);

        animationRef.current.start(({ finished }) => {
            if (finished) {
                onComplete();
            }
        });

        return () => {
            animationRef.current?.stop();
        };
    }, [
        celebrationKey,
        backdropOpacity,
        countOpacity,
        countTranslateX,
        countTranslateY,
        emberOpacity,
        emberScale,
        fireOpacity,
        fireScale,
        fireTranslateX,
        messageOpacity,
        messageTranslateY,
        onComplete,
        splitOffset,
        visible,
    ]);

    if (!visible) {
        return null;
    }

    return (
        <View
            style={styles.overlayRoot}
            pointerEvents="auto"
            testID="streak-celebration-overlay"
        >
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        opacity: backdropOpacity,
                        backgroundColor: palette.backdropColor,
                    },
                ]}
            />

            <View
                style={[
                    styles.content,
                    {
                        paddingTop: insets.top + scale(18),
                        paddingBottom: Math.max(insets.bottom + scale(28), scale(42)),
                    },
                ]}
                pointerEvents="none"
            >
                <View style={styles.stage}>
                    <Animated.View
                        style={[
                            styles.emberWrapper,
                            {
                                opacity: emberOpacity,
                                transform: [{ scale: emberScale }],
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={palette.ember}
                            start={{ x: 0.2, y: 0.1 }}
                            end={{ x: 0.8, y: 1 }}
                            style={styles.emberDot}
                        />
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.fireCluster,
                            {
                                opacity: fireOpacity,
                                transform: [
                                    { translateX: fireTranslateX },
                                    { scale: fireScale },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.fireAnimationOffset}>
                            <LottieView
                                ref={lottieRef}
                                source={FIRE_ANIMATION}
                                autoPlay
                                loop
                                speed={FIRE_PLAYBACK_SPEED}
                                style={styles.fireAnimation}
                            />
                        </View>
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.countCluster,
                            {
                                opacity: countOpacity,
                                transform: [
                                    { translateX: countTranslateX },
                                    { translateY: countTranslateY },
                                ],
                            },
                        ]}
                    >
                        <AnimatedCountUp
                            value={streakCount}
                            delay={COUNT_UP_DELAY}
                            duration={780}
                            style={[styles.streakCount, { color: palette.title }]}
                            testID="streak-celebration-count"
                        />
                        <Text style={[styles.streakLabel, { color: palette.label }]}>
                            {streakLabel}
                        </Text>
                    </Animated.View>
                </View>

                <Animated.View
                    style={[
                        styles.messageContainer,
                        {
                            opacity: messageOpacity,
                            transform: [{ translateY: messageTranslateY }],
                        },
                    ]}
                >
                    <Text style={[styles.messageText, { color: palette.message }]}>
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
        alignItems: 'center',
        justifyContent: 'center',
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    fireAnimation: {
        width: FIRE_SIZE,
        height: FIRE_SIZE,
    },
    fireAnimationOffset: {
        transform: [{ translateY: FIRE_VISUAL_OFFSET_Y }],
    },
    countCluster: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: COUNT_CLUSTER_WIDTH,
        minWidth: COUNT_CLUSTER_WIDTH,
        height: COUNT_CLUSTER_HEIGHT,
        marginLeft: -(COUNT_CLUSTER_WIDTH / 2),
        marginTop: -(COUNT_CLUSTER_HEIGHT / 2),
        alignItems: 'center',
        justifyContent: 'center',
    },
    streakCount: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(64),
        lineHeight: moderateScale(70),
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
        fontSize: moderateScale(12),
        lineHeight: 16,
        textAlign: 'center',
        letterSpacing: 1.4,
    },
    messageContainer: {
        marginTop: scale(12),
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
    },
    messageText: {
        fontFamily: FONT_FAMILY,
        fontSize: moderateScale(16),
        lineHeight: moderateScale(22),
        textAlign: 'center',
    },
});
