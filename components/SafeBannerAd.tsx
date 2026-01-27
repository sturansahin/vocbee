import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getBannerAdComponent, getBannerAdSize, areAdsSupported } from '../services/adMobService';

interface SafeBannerAdProps {
    unitId: string;
    size?: any; // BannerAdSize type
    requestOptions?: any;
}

export const SafeBannerAd: React.FC<SafeBannerAdProps> = ({
    unitId,
    size,
    requestOptions
}) => {
    const [hasError, setHasError] = useState(false);

    // If ads are not supported (e.g. Expo Go) or we caught an error, render placeholder
    if (!areAdsSupported() || hasError) {
        // In production you might return null, but for dev seeing a placeholder is helpful
        if (__DEV__) {
            return (
                <View style={styles.placeholder}>
                    <Text style={styles.text}>AdMob Banner (Development Mode)</Text>
                    <Text style={styles.subtext}>Native ads not available in Expo Go</Text>
                </View>
            );
        }
        return null;
    }

    const BannerAd = getBannerAdComponent();
    const BannerAdSize = getBannerAdSize();

    if (!BannerAd) return null;

    return (
        <BannerAd
            unitId={unitId}
            size={size || BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={requestOptions}
            onAdFailedToLoad={(error: any) => {
                console.log('Banner failed to load', error);
                setHasError(true);
            }}
        />
    );
};

const styles = StyleSheet.create({
    placeholder: {
        width: '100%',
        height: 60,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopWidth: 1,
        borderTopColor: '#ccc',
    },
    text: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
    },
    subtext: {
        fontSize: 10,
        color: '#888',
    }
});
