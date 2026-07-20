import React, { type ReactNode } from 'react';
import { I18nManager, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@shared/theme';
import { AppText } from '../primitives/AppText';
import { IconButton } from '../primitives/IconButton';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backAccessibilityLabel?: string;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AppHeader({
  title,
  subtitle,
  onBack,
  backAccessibilityLabel = 'Go back',
  trailing,
  style,
}: AppHeaderProps) {
  const { spacing } = useTheme();

  return (
    <View style={[styles.container, { paddingVertical: spacing.sm }, style]}>
      <View style={styles.side}>
        {onBack ? (
          <IconButton
            accessibilityLabel={backAccessibilityLabel}
            icon={(color) => (
              <MaterialIcons
                color={color}
                name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'}
                size={24}
              />
            )}
            onPress={onBack}
          />
        ) : null}
      </View>
      <View accessible accessibilityRole="header" style={styles.title}>
        <AppText align="center" variant="sectionTitle">
          {title}
        </AppText>
        {subtitle ? (
          <AppText align="center" color="textSecondary" variant="caption">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.side}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    alignItems: 'center',
  },
});
