import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FONT_FAMILY } from '../utils/typography';
import { useTranslation } from 'react-i18next';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export function ConnectionErrorScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { retryConnection, isLoading } = useAuth();
    const { t } = useTranslation();

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
                    <MaterialIcons name="wifi-off" size={64} color={colors.error || '#EF4444'} />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>
                    {t('connection.title')}
                </Text>

                <Text style={[styles.message, { color: colors.textSecondary }]}>
                    {t('connection.message')}
                </Text>

                <TouchableOpacity
                    style={[styles.retryButton, { backgroundColor: colors.primary }]}
                    onPress={retryConnection}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Text style={styles.retryButtonText}>{t('common.loading')}</Text>
                    ) : (
                        <>
                            <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
                            <Text style={styles.retryButtonText}>{t('connection.retry')}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontFamily: FONT_FAMILY,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        gap: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
