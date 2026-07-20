import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import i18n from '@shared/i18n';
import { useTheme, type ThemeColors } from '@shared/theme';
import { AppButton } from './primitives/AppButton';

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
    const { colors } = useTheme();
    return <WrappedComponent {...props} themeColors={colors} />;
  };
}

interface InnerProps extends Props {
  themeColors: ThemeColors;
}

export class ErrorBoundaryInner extends Component<InnerProps, State> {
  constructor(props: InnerProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
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
            <MaterialIcons name="error-outline" size={64} color={colors.danger} />

            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {i18n.t('errorBoundary.title')}
            </Text>

            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {i18n.t('errorBoundary.message')}
            </Text>

            {__DEV__ && this.state.error && (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: colors.surface, borderColor: colors.borderDefault },
                ]}
              >
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}

            <AppButton
              fullWidth={false}
              label={i18n.t('errorBoundary.restart')}
              onPress={this.handleRestart}
            />
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
});
