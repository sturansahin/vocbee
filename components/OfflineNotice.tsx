import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import * as Network from 'expo-network';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export const OfflineNotice = () => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const [isConnected, setIsConnected] = useState(true);
    const [animation] = useState(new Animated.Value(0));

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
    }, [isConnected]);

    if (isConnected) return null;

    const translateY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, 0],
    });

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    top: insets.top,
                    transform: [{ translateY }]
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
