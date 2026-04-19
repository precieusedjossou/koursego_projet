// components/ui/Input.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { FontFamily, FontSize, BorderRadius, Spacing } from '../../constants/Typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  isPassword = false,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const passwordIcon = showPassword ? 'eye-off-outline' : 'eye-outline';

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, focused && styles.focused, error ? styles.inputError : null]}>
        {leftIcon && (
          <Ionicons name={leftIcon} size={18} color={Colors.textLight} style={styles.leftIcon} />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {isPassword ? (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.rightIcon}>
            <Ionicons name={passwordIcon} size={18} color={Colors.textLight} />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={18} color={Colors.textLight} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceGray,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  focused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.error,
  },
  leftIcon: { marginRight: 10 },
  rightIcon: { marginLeft: 10, padding: 4 },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  error: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});
