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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { Input, Header } from '../components/UIComponents';
import { MaterialIcons } from '@expo/vector-icons';
import { SwarmLogo } from '../components/SwarmLogo';
import { COLORS } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../components/CustomAlert';
import { FONT_FAMILY } from '../utils/typography';

type ForgotPasswordNavProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
    const navigation = useNavigation<ForgotPasswordNavProp>();
    const { colors } = useTheme();
    const { resetPassword } = useAuth();
    const { showAlert } = useAlert();

    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            showAlert({ title: 'Error', message: 'Please enter your email address' });
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert({ title: 'Error', message: 'Please enter a valid email address' });
            return;
        }

        setIsSubmitting(true);
        try {
            await resetPassword(email);
            showAlert({
                title: 'Email Sent!',
                message: 'Check your inbox for password reset instructions.',
                buttons: [{ text: 'OK', onPress: () => navigation.goBack() }]
            });
        } catch (error: any) {
            showAlert({ title: 'Error', message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header
                showBack
                onBack={() => navigation.goBack()}
                backgroundColor={colors.background}
                textColor={colors.text}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo Section */}
                    <View style={styles.logoSection}>
                        <SwarmLogo size={80} color={COLORS.primary} />
                        <Text style={[styles.appTitle, { color: colors.text }]}>VocBee</Text>
                    </View>

                    {/* Title Section */}
                    <View style={styles.titleSection}>
                        <Text style={[styles.title, { color: colors.text }]}>Forgot Password?</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            No worries! Enter your email and we'll send you a link to reset your password.
                        </Text>
                    </View>

                    {/* Email Input */}
                    <Input
                        label="Email"
                        placeholder="Enter your email"
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
                        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                        onPress={handleResetPassword}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color={COLORS.background} />
                        ) : (
                            <>
                                <MaterialIcons name="send" size={20} color={COLORS.background} />
                                <Text style={styles.submitButtonText}>Send Reset Link</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Back to Login */}
                    <TouchableOpacity
                        style={styles.backToLogin}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={16} color={colors.textSecondary} />
                        <Text style={[styles.backToLoginText, { color: colors.textSecondary }]}>
                            Back to Login
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
        padding: 24,
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
    titleSection: {
        marginBottom: 32,
    },
    title: {
        fontFamily: FONT_FAMILY,
        color: '#fff',
        fontSize: 26,
        marginBottom: 12,
    },
    subtitle: {
        fontFamily: FONT_FAMILY,
        color: COLORS.textSecondary,
        fontSize: 15,
        lineHeight: 22,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        height: 52,
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
        fontSize: 16,
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
        fontSize: 14,
    },
});
