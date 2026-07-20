import React, { type ReactNode } from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@shared/theme';

export type SurfaceElevation = 'none' | 'card' | 'modal' | 'floating';
export type SurfaceTone = 'default' | 'elevated' | 'muted';

export interface SurfaceProps extends ViewProps {
  children?: ReactNode;
  elevation?: SurfaceElevation;
  tone?: SurfaceTone;
  radius?: keyof ReturnType<typeof useTheme>['radii'];
  style?: StyleProp<ViewStyle>;
}

export function Surface({
  children,
  elevation = 'none',
  tone = 'default',
  radius = 'lg',
  style,
  ...props
}: SurfaceProps) {
  const { colors, radii, shadows } = useTheme();
  const backgroundColor =
    tone === 'elevated'
      ? colors.surfaceElevated
      : tone === 'muted'
        ? colors.surfaceMuted
        : colors.surface;

  return (
    <View
      style={[{ backgroundColor, borderRadius: radii[radius] }, shadows[elevation], style]}
      {...props}
    >
      {children}
    </View>
  );
}
