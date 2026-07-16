import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '@shared/theme';
import { createSwarmAnimation } from '../../../assets/animations/swarmAnimation';

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const { colors } = useTheme();
    const lottieRef = useRef<LottieView>(null);
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.96)).current;

    // Yellow bee color (same as LoginScreen) — hoisted as constant to avoid referential inequality
    const beeColor = useMemo<[number, number, number, number]>(() => [1, 0.78, 0.08, 1], []);

    // Animated version (wings flapping) - beeColor is stable via useMemo
    const animatedAnimation = useMemo(() => createSwarmAnimation(beeColor, false), [beeColor]);

    useEffect(() => {
        // Keep the splash background opaque immediately to avoid showing the
        // root view between native splash hide and JS splash mount.
        Animated.parallel([
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 240,
                useNativeDriver: true,
            }),
            Animated.spring(logoScale, {
                toValue: 1,
                damping: 18,
                stiffness: 170,
                mass: 0.9,
                useNativeDriver: true,
            }),
        ]).start();

        // Start Lottie animation
        lottieRef.current?.play();

        // Minimum splash duration (2.5 seconds) then finish
        const timer = setTimeout(() => {
            onFinish();
        }, 2500);

        return () => clearTimeout(timer);
    }, [onFinish, logoOpacity, logoScale]);

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: colors.background }
            ]}
        >
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: logoOpacity,
                        transform: [{ scale: logoScale }],
                    },
                ]}
            >
                <LottieView
                    ref={lottieRef}
                    source={animatedAnimation}
                    style={styles.lottieAnimation}
                    resizeMode="contain"
                    loop={true}
                    speed={1.1}
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
    },
    lottieAnimation: {
        width: 200,
        height: 200,  // Compensate for off-center bee in Lottie canvas
    },
});
