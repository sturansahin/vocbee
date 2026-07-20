import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '@shared/responsive';
import { useTheme } from '@shared/theme';

export interface ScreenProps extends ViewProps {
  children?: ReactNode;
  edges?: readonly Edge[];
  keyboardAvoiding?: boolean;
  centered?: boolean;
  constrainWidth?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({
  children,
  edges = ['top', 'right', 'bottom', 'left'],
  keyboardAvoiding = false,
  centered = false,
  constrainWidth = true,
  style,
  contentStyle,
  ...props
}: ScreenProps) {
  const { colors } = useTheme();
  const { contentMaxWidth, horizontalGutter } = useResponsiveLayout();
  const content = (
    <View
      style={[
        styles.content,
        constrainWidth && {
          width: '100%',
          maxWidth: contentMaxWidth,
          paddingHorizontal: horizontalGutter,
          alignSelf: 'center',
        },
        centered && styles.centered,
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={[...edges]}
      style={[styles.safeArea, { backgroundColor: colors.background }, style]}
      {...props}
    >
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboard}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
