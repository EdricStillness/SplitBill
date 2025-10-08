import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSync } from '@/hooks/use-sync';

const queryClient = new QueryClient();

function AppContent() {
  useSync(); // Enable background sync
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="groups/index" options={{ title: 'Groups' }} />
        <Stack.Screen name="groups/[id]" options={{ title: 'Group Details' }} />
        <Stack.Screen name="groups/create" options={{ title: 'Create Group' }} />
        <Stack.Screen name="groups/add" options={{ title: 'Add Expense' }} />
        <Stack.Screen name="groups/settle" options={{ title: 'Settle Up' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
