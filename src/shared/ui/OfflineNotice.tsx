import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import * as Network from 'expo-network';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export const OfflineNotice = () => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const [isConnected, setIsConnected] = useState(true);
    // Use useRef for Animated.Value to avoid re-creation on re-render
    const animation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const checkConnection = async () => {
            const state = await Network.getNetworkStateAsync();
            setIsConnected(state.isConnected !== false);
        };

        checkConnection();
        const interval = setInterval(checkConnection, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        Animated.timing(animation, {
            toValue: isConnected ? 0 : 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [isConnected, animation]);

    const translateY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, 0],
    });

    const opacity = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    if (isConnected) {
        return null;
    }

    return (
        <Animated.View
            pointerEvents="auto"
            accessibilityElementsHidden={false}
            importantForAccessibility="auto"
            style={[
                styles.container,
                {
                    top: insets.top,
                    transform: [{ translateY }],
                    opacity,
                }
            ]}
        >
            <MaterialIcons name="wifi-off" size={20} color="#fff" />
            <Text style={styles.text}>{t('offline.message')}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#FF6B6B',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginHorizontal: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        gap: 8,
    },
    text: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
