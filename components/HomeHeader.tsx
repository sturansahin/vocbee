import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { HEADER_FONT_FAMILY } from '../utils/typography';
import { StreakChip } from './StreakChip';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

interface HomeHeaderProps {
    titleColor: string;
    iconColor: string;
    placeholderColor?: string;
    streakCount: number;
    streakCompletedToday: boolean;
    streakAtRisk: boolean;
    streakTextColor: string;
    streakAccentColor: string;
    streakAccessibilityLabel?: string;
    onPressStreak?: () => void;
    onPressFavorites?: () => void;
    onPressSettings?: () => void;
    showPlaceholders?: boolean;
}

export function HomeHeader({
    titleColor,
    iconColor,
    placeholderColor = 'rgba(255,255,255,0.12)',
    streakCount,
    streakCompletedToday,
    streakAtRisk,
    streakTextColor,
    streakAccentColor,
    streakAccessibilityLabel,
    onPressStreak,
    onPressFavorites,
    onPressSettings,
    showPlaceholders = false,
}: HomeHeaderProps) {
    return (
        <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
                <Text style={[styles.headerTitle, { color: titleColor }]}>VOCBEE</Text>
            </View>
            <View style={styles.headerButtons}>
                {showPlaceholders ? (
                    <>
                        <View style={[styles.streakPlaceholder, { backgroundColor: placeholderColor }]} />
                        <View style={[styles.iconPlaceholder, { backgroundColor: placeholderColor }]} />
                        <View style={[styles.iconPlaceholder, { backgroundColor: placeholderColor }]} />
                    </>
                ) : (
                    <>
                        <StreakChip
                            count={streakCount}
                            completedToday={streakCompletedToday}
                            atRisk={streakAtRisk}
                            textColor={streakTextColor}
                            accentColor={streakAccentColor}
                            accessibilityLabel={streakAccessibilityLabel}
                            onPress={onPressStreak}
                        />
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={onPressFavorites}
                            activeOpacity={0.8}
                        >
                            <Feather name="star" size={24} color={iconColor} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={onPressSettings}
                            activeOpacity={0.8}
                        >
                            <Feather name="settings" size={24} color={iconColor} />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: scale(16),
        paddingHorizontal: 20,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: moderateScale(22),
        fontFamily: HEADER_FONT_FAMILY,
        letterSpacing: scale(6),
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerButton: {
        padding: 4,
    },
    streakPlaceholder: {
        width: 42,
        height: 32,
        borderRadius: 16,
    },
    iconPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
});
