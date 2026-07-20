import React, { type ReactNode } from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@shared/theme';

export interface InlineProps extends ViewProps {
  children?: ReactNode;
  gap?: keyof ReturnType<typeof useTheme>['spacing'];
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Inline({
  children,
  gap = 'sm',
  align = 'center',
  justify,
  wrap = false,
  style,
  ...props
}: InlineProps) {
  const { spacing } = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap: spacing[gap],
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
