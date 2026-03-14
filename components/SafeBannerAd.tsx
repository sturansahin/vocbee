import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
    areAdsSupported,
    ensureAdMobReady,
    getBannerAdComponent,
    getBannerAdSize,
    getDefaultAdRequestOptions,
} from '../services/adMobService';

interface SafeBannerAdProps {
    unitId: string;
    size?: any;
    requestOptions?: any;
}

export const SafeBannerAd: React.FC<SafeBannerAdProps> = ({
    unitId,
    size,
    requestOptions,
}) => {
    const [hasError, setHasError] = useState(false);
    const [isReady, setIsReady] = useState(!areAdsSupported());

    useEffect(() => {
        let isMounted = true;

        if (!areAdsSupported()) {
            setIsReady(false);
            return undefined;
        }

        ensureAdMobReady()
            .then(ready => {
                if (isMounted) {
                    setIsReady(ready);
                }
            })
            .catch(error => {
                console.error('[AdMob] Banner init failed', error);
                if (isMounted) {
                    setHasError(true);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const mergedRequestOptions = {
        ...getDefaultAdRequestOptions(),
        ...(requestOptions ?? {}),
    };

    if (!areAdsSupported()) {
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

    if (!isReady || hasError) {
        if (__DEV__ && !hasError) {
            return (
                <View style={styles.placeholder}>
                    <Text style={styles.text}>AdMob Banner is preparing</Text>
                </View>
            );
        }

        return null;
    }

    const BannerAd = getBannerAdComponent();
    const BannerAdSize = getBannerAdSize();

    if (!BannerAd) {
        return null;
    }

    return (
        <BannerAd
            unitId={unitId}
            size={size || BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={mergedRequestOptions}
            onAdFailedToLoad={(error: any) => {
                console.log('[AdMob] Banner failed to load', error);
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
    },
});
