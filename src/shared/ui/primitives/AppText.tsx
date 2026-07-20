import React from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { useTheme, type SemanticColors, type TypographyRole } from '@shared/theme';

export interface AppTextProps extends TextProps {
  variant?: TypographyRole;
  color?: keyof SemanticColors;
  align?: TextStyle['textAlign'];
}

export function AppText({
  variant = 'body',
  color = 'textPrimary',
  align,
  style,
  ...props
}: AppTextProps) {
  const { colors, typography } = useTheme();
  const resolvedStyle: StyleProp<TextStyle> = [
    typography[variant],
    { color: colors[color], textAlign: align },
    style,
  ];

  return <Text allowFontScaling style={resolvedStyle} {...props} />;
}
