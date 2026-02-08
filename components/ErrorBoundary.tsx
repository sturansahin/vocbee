import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import i18n from '../services/i18n';
import { DARK_COLORS, LIGHT_COLORS } from '../constants';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

// Wrapper to inject theme into class component
function withThemeColors(WrappedComponent: typeof ErrorBoundaryInner) {
    return function ThemedErrorBoundary(props: Props) {
        const colorScheme = useColorScheme();
        const isDark = colorScheme === 'dark';
        const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
        return <WrappedComponent {...props} themeColors={colors} />;
    };
}

interface InnerProps extends Props {
    themeColors: typeof DARK_COLORS;
}

class ErrorBoundaryInner extends Component<InnerProps, State> {
    constructor(props: InnerProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRestart = async () => {
        try {
            await Updates.reloadAsync();
        } catch (error) {
            this.setState({ hasError: false, error: null });
        }
    };

    render() {
        const colors = this.props.themeColors;

        if (this.state.hasError) {
            return (
                <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                    <View style={styles.content}>
                        <MaterialIcons name="error-outline" size={64} color={colors.error} />

                        <Text style={[styles.title, { color: colors.text }]}>{i18n.t('errorBoundary.title')}</Text>

                        <Text style={[styles.message, { color: colors.textSecondary }]}>
                            {i18n.t('errorBoundary.message')}
                        </Text>

                        {this.state.error && (
                            <View style={[styles.errorBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={[styles.errorText, { color: colors.error }]}>
                                    {this.state.error.toString()}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.button}
                            onPress={this.handleRestart}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>{i18n.t('errorBoundary.restart')}</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}

export const ErrorBoundary = withThemeColors(ErrorBoundaryInner);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
        width: '100%',
        alignItems: 'center',
        maxWidth: 400,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    errorBox: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        width: '100%',
        marginBottom: 24,
    },
    errorText: {
        fontSize: 12,
        fontFamily: 'monospace',
    },
    button: {
        backgroundColor: '#FFD700',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
