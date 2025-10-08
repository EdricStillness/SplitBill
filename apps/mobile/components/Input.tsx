import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import { useThemeColor } from '../hooks/use-theme-color';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  style?: any;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  keyboardType = 'default',
  multiline,
  numberOfLines,
  error,
  style,
}: InputProps) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'text');

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: textColor }]}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={`${textColor}80`}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[
          styles.input,
          {
            color: textColor,
            backgroundColor,
            borderColor: error ? '#ff4444' : `${borderColor}40`,
          },
          multiline && { height: (numberOfLines || 3) * 20 + 16 },
        ]}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  error: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
});

