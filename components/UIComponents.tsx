import React from 'react';
import { TouchableOpacity, Text, View, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { COLORS } from '../constants';
import { FONT_FAMILY } from '../utils/typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: keyof typeof MaterialIcons.glyphMap;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  fullWidth = true
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.buttonPrimary;
      case 'outline':
        return styles.buttonOutline;
      case 'ghost':
        return styles.buttonGhost;
      default:
        return styles.buttonPrimary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.textPrimary;
      case 'ghost':
        return styles.textGhost;
      default:
        return styles.textDefault;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={[styles.buttonBase, getButtonStyle(), fullWidth && styles.fullWidth]}
    >
      {icon && <MaterialIcons name={icon} size={20} color={variant === 'primary' ? COLORS.background : 'white'} />}
      <Text style={[styles.buttonText, getTextStyle()]}>{title}</Text>
      {variant === 'primary' && !icon && (
        <MaterialIcons name="arrow-forward" size={20} color={COLORS.background} />
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
  backgroundColor = COLORS.surface,
  borderColor = COLORS.border,
  labelColor = '#fff',
  textColor = '#fff',
  iconColor = COLORS.textSecondary,
  ...props
}) => {
  return (
    <View style={styles.inputContainer}>
      {label && <Text style={[styles.inputLabel, { color: labelColor }]}>{label}</Text>}
      <View style={[styles.inputWrapper, { backgroundColor, borderColor }]}>
        <TextInput
          style={[styles.textInput, { color: textColor }]}
          placeholderTextColor={iconColor}
          {...props}
        />
        {rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress}>
            <MaterialIcons name={rightIcon} size={22} color={iconColor} />
          </TouchableOpacity>
        ) : icon ? (
          <MaterialIcons name={icon} size={22} color={iconColor} />
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
  backgroundColor = COLORS.background,
  textColor = '#fff'
}) => {
  return (
    <View style={[styles.headerContainer, { backgroundColor }]}>
      {showBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
        >
          <FontAwesome5 name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}

      <View style={styles.headerCenter}>
        {title && <Text style={[styles.headerTitle, { color: textColor }]}>{title}</Text>}
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.headerRight}>
        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Button styles
  buttonBase: {
    height: 56,
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

  // Input styles
  inputContainer: {
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: FONT_FAMILY,
    color: '#fff',
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
    height: 56,
    paddingHorizontal: 16,
  },
  textInput: {
    fontFamily: FONT_FAMILY,
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },

  // Header styles
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 20,
    height: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginLeft: 10,
  },
  placeholder: {
    width: 30,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONT_FAMILY,
    color: '#fff',
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
