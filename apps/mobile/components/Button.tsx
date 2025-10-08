import React from 'react';
import { Pressable, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useThemeColor } from '../hooks/use-theme-color';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}

export function Button({ title, onPress, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const backgroundColor = useThemeColor({}, variant === 'primary' ? 'tint' : 'background');
  const textColor = useThemeColor({}, variant === 'outline' ? 'text' : 'background');
  const borderColor = useThemeColor({}, 'tint');

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: variant === 'outline' ? 'transparent' : backgroundColor,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor,
          opacity: pressed ? 0.7 : disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

