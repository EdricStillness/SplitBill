import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import Lottie from './Lottie';

interface EmptyStateProps {
  title: string;
  message?: string;
  animation?: any;
}

export function EmptyState({ title, message, animation }: EmptyStateProps) {
  return (
    <ThemedView style={styles.container}>
      {animation && (
        <Lottie
          autoPlay
          loop
          style={styles.animation}
          source={animation}
        />
      )}
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      {message && (
        <ThemedText style={styles.message}>{message}</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  animation: {
    width: 200,
    height: 200,
  },
  title: {
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
});

