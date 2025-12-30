/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/components/common/Button.tsx
 * Creato: 2025-12-30
 * Descrizione: Componente Button riutilizzabile
 * =============================================================================
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#0066CC' : '#fff'} />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 8,
  },
  // Variants
  primary: { backgroundColor: '#0066CC' },
  secondary: { backgroundColor: '#E5E5EA' },
  outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#0066CC' },
  danger: { backgroundColor: '#FF3B30' },
  // Sizes
  small: { paddingVertical: 8, paddingHorizontal: 16 },
  medium: { paddingVertical: 14, paddingHorizontal: 24 },
  large: { paddingVertical: 18, paddingHorizontal: 32 },
  // States
  disabled: { opacity: 0.5 },
  // Text styles
  text: { fontWeight: '600' },
  primaryText: { color: '#fff' },
  secondaryText: { color: '#1C1C1E' },
  outlineText: { color: '#0066CC' },
  dangerText: { color: '#fff' },
  smallText: { fontSize: 14 },
  mediumText: { fontSize: 16 },
  largeText: { fontSize: 18 },
});

export default Button;
