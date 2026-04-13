import React from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FONT_FAMILY } from '../utils/typography';
import { AnimatedCountUp } from './AnimatedCountUp';

interface StreakAlertContentProps {
    statusMessage: string;
    currentLabel: string;
    bestLabel: string;
    currentValue: number;
    bestValue: number;
}

interface StreakStatCardProps {
    label: string;
    value: number;
    numberColor: string;
}

function StreakStatCard({
    label,
    value,
    numberColor,
}: StreakStatCardProps) {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statLabel}>
                {label}
            </Text>
            <View style={styles.numberWrapper}>
                <AnimatedCountUp
                    value={value}
                    style={[styles.number, { color: numberColor }]}
                />
            </View>
        </View>
    );
}

export function StreakAlertContent({
    statusMessage,
    currentLabel,
    bestLabel,
    currentValue,
    bestValue,
}: StreakAlertContentProps) {
    const { colors } = useTheme();
    const numberColor = '#FFC24A';

    return (
        <View style={styles.container}>
            <Text style={[styles.statusMessage, { color: colors.textSecondary }]}>
                {statusMessage}
            </Text>

            <View style={styles.currentCardWrapper}>
                <StreakStatCard
                    label={currentLabel}
                    value={currentValue}
                    numberColor={numberColor}
                />
            </View>

            <Text style={[styles.bestStreakText, { color: colors.textSecondary }]}>
                {`${bestLabel} : ${bestValue}`}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    statusMessage: {
        fontFamily: FONT_FAMILY,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 16,
    },
    currentCardWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    statCard: {
        width: '100%',
        maxWidth: 168,
        minHeight: 108,
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statLabel: {
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        lineHeight: 16,
        textAlign: 'center',
        color: '#FFFFFF',
    },
    numberWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
    },
    number: {
        fontFamily: FONT_FAMILY,
        fontSize: 32,
        lineHeight: 36,
        textAlign: 'center',
    },
    bestStreakText: {
        marginTop: 16,
        fontFamily: FONT_FAMILY,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
});
