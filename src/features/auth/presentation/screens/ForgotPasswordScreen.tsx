import React, { useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types';
import { Input } from '@/components/UIComponents';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { useAlert } from '@/components/CustomAlert';
import { FONT_FAMILY } from '@/utils/typography';
import { useTranslation } from 'react-i18next';

import { validateForgotPassword } from '../../domain/rules';
import { useAuth } from '../AuthProvider';

type ForgotPasswordNavProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
    const navigation = useNavigation<ForgotPasswordNavProp>();
    const { colors } = useTheme();
    const { resetPassword } = useAuth();
    const { showAlert } = useAlert();
    const { height: screenHeight } = useWindowDimensions();
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Responsive calculations
    const isSmallScreen = screenHeight < 700;
    const isLargeScreen = screenHeight > 900;

    // Dynamic sizing
    const titleFontSize = isSmallScreen ? 22 : isLargeScreen ? 30 : 26;
    const subtitleFontSize = isSmallScreen ? 13 : isLargeScreen ? 16 : 15;
    const subtitleLineHeight = subtitleFontSize * 1.5;
    const padding = isSmallScreen ? 20 : 24;
    const titleMarginBottom = isSmallScreen ? 20 : 32;
    const buttonHeight = isSmallScreen ? 48 : 52;
    const buttonFontSize = isSmallScreen ? 14 : 16;

    const handleResetPassword = async () => {
        const validationError = validateForgotPassword(email);
        if (validationError) {
            showAlert({
                title: t('auth.error'),
                message: t(`forgotPassword.${validationError}`),
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await resetPassword(email);
            showAlert({
                title: t('forgotPassword.emailSent'),
                message: t('forgotPassword.checkInbox'),
                buttons: [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
            });
        } catch (error) {
            showAlert({
                title: t('auth.error'),
                message: error instanceof Error ? error.message : String(error),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { padding }]}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Title Section */}
                    <View style={[styles.titleSection, { marginBottom: titleMarginBottom }]}>
                        <Text style={[styles.title, { color: colors.text, fontSize: titleFontSize }]}>
                            {t('forgotPassword.title')}
                        </Text>
                        <Text style={[
                            styles.subtitle,
                            {
                                color: colors.textSecondary,
                                fontSize: subtitleFontSize,
                                lineHeight: subtitleLineHeight,
                            }
                        ]}>
                            {t('forgotPassword.subtitle')}
                        </Text>
                    </View>

                    {/* Email Input */}
                    <Input
                        label={t('auth.email')}
                        placeholder={t('auth.enterEmail')}
                        icon="mail"
                        value={email}
                        onChangeText={setEmail}
                        backgroundColor={colors.surface}
                        borderColor={colors.border}
                        labelColor={colors.textSecondary}
                        textColor={colors.text}
                        iconColor={colors.textSecondary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            isSubmitting && styles.submitButtonDisabled,
                            { backgroundColor: colors.primary, height: buttonHeight }
                        ]}
                        onPress={handleResetPassword}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color={COLORS.background} />
                        ) : (
                            <>
                                <MaterialIcons name="send" size={isSmallScreen ? 18 : 20} color={COLORS.background} />
                                <Text style={[styles.submitButtonText, { fontSize: buttonFontSize }]}>
                                    {t('forgotPassword.sendResetLink')}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Back to Login */}
                    <TouchableOpacity
                        style={styles.backToLogin}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={isSmallScreen ? 14 : 16} color={colors.textSecondary} />
                        <Text style={[styles.backToLoginText, { color: colors.textSecondary, fontSize: isSmallScreen ? 13 : 14 }]}>
                            {t('forgotPassword.backToLogin')}
                        </Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    appTitle: {
        fontFamily: FONT_FAMILY,
        color: '#fff',
        fontSize: 28,
        marginTop: 8,
    },
    titleSection: {},
    title: {
        fontFamily: FONT_FAMILY,
        marginBottom: 12,
    },
    subtitle: {
        fontFamily: FONT_FAMILY,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        fontFamily: FONT_FAMILY,
        color: COLORS.background,
        fontWeight: '600',
    },
    backToLogin: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 24,
    },
    backToLoginText: {
        fontFamily: FONT_FAMILY,
    },
});
