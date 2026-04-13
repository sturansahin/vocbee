import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FONT_FAMILY } from '../utils/typography';
import { useTranslation } from 'react-i18next';

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
    title: string;
    message?: string;
    content?: ReactNode;
    buttons?: AlertButton[];
}

interface AlertContextType {
    showAlert: (options: AlertOptions) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
    children: ReactNode;
}

export const AlertProvider = ({ children }: AlertProviderProps) => {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<AlertOptions>({
        title: '',
        message: '',
        content: null,
        buttons: [{ text: t('common.ok') }],
    });

    const showAlert = (options: AlertOptions) => {
        setAlertConfig({
            title: options.title,
            message: options.message || '',
            content: options.content ?? null,
            buttons: options.buttons || [{ text: t('common.ok') }],
        });
        setVisible(true);
    };

    const hideAlert = () => {
        setVisible(false);
    };

    const handleButtonPress = (button: AlertButton) => {
        hideAlert();
        if (button.onPress) {
            button.onPress();
        }
    };

    const getButtonColor = (style?: string) => {
        switch (style) {
            case 'destructive':
                return '#FF453A';
            case 'cancel':
                return colors.textSecondary;
            default:
                return colors.primary;
        }
    };

    const hasContent = alertConfig.content !== null && alertConfig.content !== undefined;

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={hideAlert}
            >
                <View style={styles.overlay}>
                    <View style={[styles.alertBox, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.title, { color: colors.text }]}>
                            {alertConfig.title}
                        </Text>
                        {alertConfig.message ? (
                            <Text
                                style={[
                                    styles.message,
                                    { color: colors.textSecondary },
                                    hasContent ? styles.messageWithContent : null,
                                ]}
                            >
                                {alertConfig.message}
                            </Text>
                        ) : null}
                        {hasContent ? (
                            <View
                                style={[
                                    styles.contentContainer,
                                    !alertConfig.message && styles.contentContainerNoMessage,
                                ]}
                            >
                                {alertConfig.content}
                            </View>
                        ) : null}
                        <View style={[styles.buttonContainer, alertConfig.buttons && alertConfig.buttons.length > 2 && styles.buttonContainerVertical]}>
                            {alertConfig.buttons?.map((button, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        alertConfig.buttons && alertConfig.buttons.length <= 2 && styles.buttonHorizontal,
                                        index > 0 && alertConfig.buttons && alertConfig.buttons.length <= 2 && { borderLeftWidth: 1, borderLeftColor: colors.border },
                                    ]}
                                    onPress={() => handleButtonPress(button)}
                                >
                                    <Text
                                        style={[
                                            styles.buttonText,
                                            { color: getButtonColor(button.style) },
                                            button.style === 'cancel' && styles.buttonTextCancel,
                                        ]}
                                    >
                                        {button.text}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

// Convenience function for simple alerts
export const createAlert = (showAlert: AlertContextType['showAlert']) => ({
    alert: (title: string, message?: string, buttons?: AlertButton[]) => {
        showAlert({ title, message, buttons });
    },
});

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: scale(40),
    },
    alertBox: {
        width: Math.min(SCREEN_WIDTH * 0.85, 360),
        maxWidth: 400,
        minWidth: 280,
        borderRadius: scale(16),
        overflow: 'hidden',
    },
    title: {
        fontFamily: FONT_FAMILY,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        paddingTop: 24,
        paddingHorizontal: 24,
    },
    message: {
        fontFamily: FONT_FAMILY,
        fontSize: 14,
        textAlign: 'center',
        paddingTop: 8,
        paddingHorizontal: 24,
        paddingBottom: 24,
        lineHeight: 20,
    },
    messageWithContent: {
        paddingBottom: 12,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    contentContainerNoMessage: {
        paddingTop: 12,
    },
    buttonContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    buttonContainerVertical: {
        flexDirection: 'column',
    },
    button: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonHorizontal: {
        flex: 1,
    },
    buttonText: {
        fontFamily: FONT_FAMILY,
        fontSize: 16,
        fontWeight: '600',
    },
    buttonTextCancel: {
        fontWeight: '400',
    },
});
