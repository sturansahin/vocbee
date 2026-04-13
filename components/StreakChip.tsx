import React from 'react';
import {
    Image,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import { FONT_FAMILY } from '../utils/typography';

const FIRE_ICON = require('../assets/icons/fire.png');

interface StreakChipProps {
    count: number;
    completedToday: boolean;
    atRisk: boolean;
    textColor: string;
    accentColor: string;
    style?: StyleProp<ViewStyle>;
    accessibilityLabel?: string;
    onPress?: () => void;
}

export function StreakChip({
    count,
    completedToday,
    atRisk,
    textColor,
    accentColor,
    style,
    accessibilityLabel,
    onPress,
}: StreakChipProps) {
    const chipContent = (
        <View
            style={[
                styles.content,
                atRisk && !completedToday && styles.atRisk,
            ]}
        >
            <Image source={FIRE_ICON} style={styles.icon} resizeMode="contain" />
            <Text
                style={[
                    styles.count,
                    {
                        color: textColor,
                    },
                    completedToday && { color: accentColor },
                ]}
            >
                {count}
            </Text>
        </View>
    );

    if (!onPress) {
        return <View style={[styles.pressable, style]}>{chipContent}</View>;
    }

    return (
        <Pressable
            onPress={onPress}
            style={[styles.pressable, style]}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
        >
            {chipContent}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressable: {
        flexShrink: 0,
        minHeight: 32,
        paddingHorizontal: 4,
        justifyContent: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    atRisk: {
        opacity: 0.92,
    },
    icon: {
        width: 18,
        height: 18,
    },
    count: {
        fontFamily: FONT_FAMILY,
        fontSize: 14,
        lineHeight: 16,
        includeFontPadding: false,
    },
});
