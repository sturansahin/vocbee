import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { FONT_FAMILY, useTheme } from '@shared/theme';

type PromptStep = 'enjoyment' | 'rating' | 'feedback';

interface AppRatingPromptProps {
    visible: boolean;
    onDismiss: () => void | Promise<void>;
    onRateInStore: (rating: number) => void | Promise<void>;
    onSendFeedback: (rating?: number) => void | Promise<void>;
}

const STAR_VALUES = [1, 2, 3, 4, 5];

export function AppRatingPrompt({
    visible,
    onDismiss,
    onRateInStore,
    onSendFeedback,
}: AppRatingPromptProps) {
    const { colors, isDarkMode } = useTheme();
    const { t } = useTranslation();
    const [step, setStep] = useState<PromptStep>('enjoyment');
    const [rating, setRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (visible) {
            setStep('enjoyment');
            setRating(0);
            setIsSubmitting(false);
        }
    }, [visible]);

    const runAction = async (action: () => void | Promise<void>) => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await action();
        } finally {
            setIsSubmitting(false);
        }
    };

    const title =
        step === 'rating'
            ? t('reviewPrompt.rateTitle', { defaultValue: 'How would you rate VocBee?' })
            : step === 'feedback'
                ? t('reviewPrompt.feedbackTitle', { defaultValue: 'Help us improve' })
                : t('reviewPrompt.enjoyingTitle', { defaultValue: 'Enjoying VocBee?' });

    const message =
        step === 'rating'
            ? t('reviewPrompt.rateMessage', { defaultValue: 'Your rating helps us keep improving the learning experience.' })
            : step === 'feedback'
                ? t('reviewPrompt.feedbackMessage', { defaultValue: 'Tell us what would make VocBee better for you.' })
                : t('reviewPrompt.enjoyingMessage', { defaultValue: 'If VocBee is helping you learn, we would love a quick rating.' });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={() => runAction(onDismiss)}
        >
            <View style={styles.overlay}>
                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                    <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

                    {step === 'rating' ? (
                        <View style={styles.starRow} accessibilityRole="adjustable">
                            {STAR_VALUES.map(value => {
                                const selected = value <= rating;
                                return (
                                    <Pressable
                                        key={value}
                                        accessibilityRole="button"
                                        accessibilityLabel={t('reviewPrompt.starAccessibilityLabel', {
                                            defaultValue: '{{count}} stars',
                                            count: value,
                                        })}
                                        onPress={() => setRating(value)}
                                        style={styles.starButton}
                                    >
                                        <MaterialIcons
                                            name={selected ? 'star' : 'star-border'}
                                            size={34}
                                            color={selected ? colors.primary : colors.textSecondary}
                                        />
                                    </Pressable>
                                );
                            })}
                        </View>
                    ) : null}

                    <View style={styles.actions}>
                        {step === 'enjoyment' ? (
                            <>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.secondaryButton]}
                                    onPress={() => runAction(onDismiss)}
                                    activeOpacity={0.85}
                                    disabled={isSubmitting}
                                >
                                    <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>
                                        {t('reviewPrompt.later', { defaultValue: 'Later' })}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.secondaryButton]}
                                    onPress={() => setStep('feedback')}
                                    activeOpacity={0.85}
                                    disabled={isSubmitting}
                                >
                                    <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>
                                        {t('reviewPrompt.notYet', { defaultValue: 'Not yet' })}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                                    onPress={() => setStep('rating')}
                                    activeOpacity={0.9}
                                    disabled={isSubmitting}
                                >
                                    <Text style={[styles.primaryText, { color: isDarkMode ? '#000' : '#1a2c22' }]}>
                                        {t('reviewPrompt.yes', { defaultValue: 'Yes' })}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : null}

                        {step === 'rating' ? (
                            <>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.secondaryButton]}
                                    onPress={() => runAction(onDismiss)}
                                    activeOpacity={0.85}
                                    disabled={isSubmitting}
                                >
                                    <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>
                                        {t('reviewPrompt.later', { defaultValue: 'Later' })}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.actionButton,
                                        {
                                            backgroundColor: rating > 0 ? colors.primary : colors.surfaceLight,
                                            opacity: rating > 0 ? 1 : 0.75,
                                        },
                                    ]}
                                    onPress={() => {
                                        if (rating <= 0) return;
                                        const nextAction = rating >= 4
                                            ? () => onRateInStore(rating)
                                            : () => onSendFeedback(rating);
                                        runAction(nextAction);
                                    }}
                                    activeOpacity={0.9}
                                    disabled={rating <= 0 || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator size="small" color={isDarkMode ? '#000' : '#1a2c22'} />
                                    ) : (
                                        <Text
                                            style={[
                                                styles.primaryText,
                                                { color: rating > 0 ? (isDarkMode ? '#000' : '#1a2c22') : colors.textSecondary },
                                            ]}
                                        >
                                            {rating >= 4
                                                ? t('reviewPrompt.rateInStore', { defaultValue: 'Rate in Store' })
                                                : t('reviewPrompt.sendFeedback', { defaultValue: 'Send Feedback' })}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : null}

                        {step === 'feedback' ? (
                            <>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.secondaryButton]}
                                    onPress={() => runAction(onDismiss)}
                                    activeOpacity={0.85}
                                    disabled={isSubmitting}
                                >
                                    <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>
                                        {t('reviewPrompt.later', { defaultValue: 'Later' })}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                                    onPress={() => runAction(() => onSendFeedback())}
                                    activeOpacity={0.9}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator size="small" color={isDarkMode ? '#000' : '#1a2c22'} />
                                    ) : (
                                        <Text style={[styles.primaryText, { color: isDarkMode ? '#000' : '#1a2c22' }]}>
                                            {t('reviewPrompt.sendFeedback', { defaultValue: 'Send Feedback' })}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : null}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        backgroundColor: 'rgba(0, 0, 0, 0.58)',
    },
    card: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 22,
        paddingTop: 24,
        paddingBottom: 18,
    },
    title: {
        fontFamily: FONT_FAMILY,
        fontSize: 19,
        textAlign: 'center',
        lineHeight: 25,
    },
    message: {
        fontFamily: FONT_FAMILY,
        fontSize: 14,
        lineHeight: 20,
        marginTop: 10,
        textAlign: 'center',
    },
    starRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        gap: 4,
    },
    starButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 22,
    },
    actionButton: {
        flex: 1,
        minHeight: 46,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
    },
    primaryText: {
        fontFamily: FONT_FAMILY,
        fontSize: 13,
        textAlign: 'center',
    },
    secondaryText: {
        fontFamily: FONT_FAMILY,
        fontSize: 13,
        textAlign: 'center',
    },
});
