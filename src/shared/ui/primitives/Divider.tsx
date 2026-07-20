import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@shared/theme';

export interface DividerProps {
  inset?: number;
  strong?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Divider({ inset = 0, strong = false, style }: DividerProps) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          height: StyleSheetHairlineWidth,
          marginStart: inset,
          backgroundColor: strong ? colors.borderStrong : colors.borderDefault,
        },
        style,
      ]}
    />
  );
}

const StyleSheetHairlineWidth = 1;
