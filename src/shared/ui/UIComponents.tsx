import React from 'react';
import { TouchableOpacity, Text, View, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { COLORS, FONT_FAMILY, useTheme } from '@shared/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: keyof typeof MaterialIcons.glyphMap;
  fullWidth?: boolean;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  fullWidth = true,
  disabled = false,
}) => {
  const { colors } = useTheme(); // Use dynamic theme

  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return [styles.buttonPrimary, { backgroundColor: colors.primary }];
      case 'secondary':
        return [
          styles.buttonPrimary,
          { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
        ];
      case 'outline':
        return [styles.buttonOutline, { borderColor: colors.border }];
      case 'ghost':
        return styles.buttonGhost;
      default:
        return [styles.buttonPrimary, { backgroundColor: colors.primary }];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return [styles.textPrimary, { color: '#000000' }];
      case 'secondary':
        return [styles.textDefault, { color: colors.text }];
      case 'outline':
        return [styles.textDefault, { color: colors.text }];
      case 'ghost':
        return [styles.textGhost, { color: colors.textSecondary }];
      default:
        return [styles.textPrimary, { color: '#000000' }];
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return '#000000';
      case 'secondary':
        return colors.text;
      case 'outline':
        return colors.text;
      case 'ghost':
        return colors.textSecondary;
      default:
        return '#000000';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      disabled={disabled}
      style={[
        styles.buttonBase,
        getButtonStyle(),
        fullWidth && styles.fullWidth,
        disabled && styles.buttonDisabled,
      ]}
    >
      {icon && <MaterialIcons name={icon} size={20} color={getIconColor()} />}
      <Text style={[styles.buttonText, getTextStyle()]}>{title}</Text>
      {variant === 'primary' && !icon && (
        <MaterialIcons name="arrow-forward" size={20} color={'#000000'} />
      )}
    </TouchableOpacity>
  );
};

interface InputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onRightIconPress?: () => void;
  backgroundColor?: string;
  borderColor?: string;
  labelColor?: string;
  textColor?: string;
  iconColor?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  rightIcon,
  onRightIconPress,
  backgroundColor,
  borderColor,
  labelColor,
  textColor,
  iconColor,
  ...props
}) => {
  const { colors } = useTheme();

  const finalBg = backgroundColor || colors.surface;
  const finalBorder = borderColor || colors.border;
  const finalLabelColor = labelColor || colors.text; // Was white default? Usually text color.
  const finalTextColor = textColor || colors.text; // Was white default.
  const finalIconColor = iconColor || colors.textSecondary;

  return (
    <View style={styles.inputContainer}>
      {label && <Text style={[styles.inputLabel, { color: finalLabelColor }]}>{label}</Text>}
      <View style={[styles.inputWrapper, { backgroundColor: finalBg, borderColor: finalBorder }]}>
        <TextInput
          style={[styles.textInput, { color: finalTextColor }]}
          placeholderTextColor={finalIconColor}
          {...props}
        />
        {rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress}>
            <MaterialIcons name={rightIcon} size={22} color={finalIconColor} />
          </TouchableOpacity>
        ) : icon ? (
          <MaterialIcons name={icon} size={22} color={finalIconColor} />
        ) : null}
      </View>
    </View>
  );
};

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack,
  onBack,
  rightAction,
  backgroundColor,
  textColor,
}) => {
  const { colors } = useTheme();
  const finalBg = backgroundColor || colors.background;
  const finalTextColor = textColor || colors.text; // Was #fff default.

  return (
    <View style={[styles.headerContainer, { backgroundColor: finalBg }]}>
      {showBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={24} color={finalTextColor} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}

      <View style={styles.headerCenter}>
        {title && <Text style={[styles.headerTitle, { color: finalTextColor }]}>{title}</Text>}
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.headerRight}>{rightAction}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Button styles
  buttonBase: {
    minHeight: 56,
    paddingVertical: 12,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  fullWidth: {
    width: '100%',
  },
  buttonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
  },
  textPrimary: {
    color: COLORS.background,
  },
  textGhost: {
    color: COLORS.textSecondary,
  },
  textDefault: {
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Input styles
  inputContainer: {
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  textInput: {
    fontFamily: FONT_FAMILY,
    flex: 1,
    fontSize: 16,
    height: '100%',
  },

  // Header styles
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 30,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontFamily: FONT_FAMILY,
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
