import React, { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@shared/theme';
import { AppText } from '../primitives/AppText';
import { Surface } from '../primitives/Surface';

export interface SectionCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SectionCard({ title, description, children, style }: SectionCardProps) {
  const { borderDefault } = useTheme().colors;
  const { spacing } = useTheme();

  return (
    <View style={[styles.wrapper, { gap: spacing.sm }, style]}>
      {title ? (
        <AppText accessibilityRole="header" variant="sectionTitle">
          {title}
        </AppText>
      ) : null}
      {description ? (
        <AppText color="textSecondary" variant="caption">
          {description}
        </AppText>
      ) : null}
      <Surface style={[styles.card, { borderColor: borderDefault }]}>{children}</Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  card: {
    overflow: 'hidden',
    borderWidth: 1,
  },
});
