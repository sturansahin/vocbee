import React, { type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ModalProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useResponsiveLayout } from '@shared/responsive';
import { useTheme } from '@shared/theme';
import { AppText } from '../primitives/AppText';
import { Surface } from '../primitives/Surface';

export interface AppModalProps extends Omit<
  ModalProps,
  'children' | 'onRequestClose' | 'transparent' | 'visible'
> {
  visible: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
  onRequestClose: () => void;
  dismissOnBackdropPress?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function AppModal({
  visible,
  title,
  description,
  children,
  actions,
  onRequestClose,
  dismissOnBackdropPress = true,
  contentStyle,
  animationType = 'fade',
  ...props
}: AppModalProps) {
  const { colors, spacing } = useTheme();
  const { height, horizontalGutter, isSmallHeight } = useResponsiveLayout();

  return (
    <Modal
      animationType={animationType}
      onRequestClose={onRequestClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
      {...props}
    >
      <View
        accessibilityViewIsModal
        style={[
          styles.overlay,
          {
            backgroundColor: colors.overlay,
            paddingHorizontal: horizontalGutter,
            paddingVertical: spacing['2xl'],
          },
        ]}
      >
        <Pressable
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          onPress={dismissOnBackdropPress ? onRequestClose : undefined}
          style={StyleSheet.absoluteFill}
          testID="app-modal-backdrop"
        />
        <Surface
          accessibilityLabel={title}
          accessibilityRole="summary"
          elevation="modal"
          style={[
            styles.card,
            {
              maxHeight: height * (isSmallHeight ? 0.92 : 0.82),
              padding: spacing['2xl'],
            },
            contentStyle,
          ]}
          tone="elevated"
        >
          <AppText accessibilityRole="header" variant="sectionTitle">
            {title}
          </AppText>
          {description ? <AppText color="textSecondary">{description}</AppText> : null}
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </Surface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    gap: 12,
  },
  body: {
    flexGrow: 0,
    gap: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
