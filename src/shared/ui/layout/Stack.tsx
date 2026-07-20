import React, { type ReactNode } from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@shared/theme';

export interface StackProps extends ViewProps {
  children?: ReactNode;
  gap?: keyof ReturnType<typeof useTheme>['spacing'];
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  style?: StyleProp<ViewStyle>;
}

export function Stack({ children, gap = 'lg', align, justify, style, ...props }: StackProps) {
  const { spacing } = useTheme();
  return (
    <View
      style={[{ gap: spacing[gap], alignItems: align, justifyContent: justify }, style]}
      {...props}
    >
      {children}
    </View>
  );
}
