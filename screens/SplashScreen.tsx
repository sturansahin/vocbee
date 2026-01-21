import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '../context/ThemeContext';
import { createSwarmAnimation } from '../assets/animations/swarmAnimation';

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const { colors } = useTheme();
    const lottieRef = useRef<LottieView>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Yellow bee color (same as LoginScreen)
    const beeColor: [number, number, number, number] = [1, 0.78, 0.08, 1]; // #FFC814

    // Animated version (wings flapping)
    const animatedAnimation = useMemo(() => createSwarmAnimation(beeColor, false), []);

    useEffect(() => {
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        // Start Lottie animation
        lottieRef.current?.play();

        // Minimum splash duration (1.5 seconds) then finish
        const timer = setTimeout(() => {
            onFinish();
        }, 1500);

        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <Animated.View
            style={[
                styles.container,
                { backgroundColor: colors.background, opacity: fadeAnim }
            ]}
        >
            <View style={styles.logoContainer}>
                <LottieView
                    ref={lottieRef}
                    source={animatedAnimation}
                    style={styles.lottieAnimation}
                    resizeMode="cover"
                    loop={true}
                    speed={1.5}
                />
            </View>
        </Animated.View>
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
        height: 188,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
    },
    lottieAnimation: {
        width: 200,
        height: 188,
    },
});
