import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '@shared/responsive';
import { useTheme } from '@shared/theme';

export interface AppScrollViewProps extends ScrollViewProps {
  children?: ReactNode;
  edges?: readonly Edge[];
  keyboardAvoiding?: boolean;
  constrainWidth?: boolean;
}

export function AppScrollView({
  children,
  edges = ['top', 'right', 'bottom', 'left'],
  keyboardAvoiding = false,
  constrainWidth = true,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
  ...props
}: AppScrollViewProps) {
  const { colors } = useTheme();
  const { contentMaxWidth, horizontalGutter } = useResponsiveLayout();
  const scrollView = (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        constrainWidth && {
          width: '100%',
          maxWidth: contentMaxWidth,
          paddingHorizontal: horizontalGutter,
          alignSelf: 'center',
        },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    >
      {children}
    </ScrollView>
  );

  return (
    <SafeAreaView
      edges={[...edges]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboard}
        >
          {scrollView}
        </KeyboardAvoidingView>
      ) : (
        scrollView
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
    flexGrow: 1,
  },
});
