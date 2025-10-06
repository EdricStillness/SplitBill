import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useQuery } from '@tanstack/react-query';
import Lottie from '../../components/Lottie';
import { VictoryPie } from 'victory-native';
import { Linking, Pressable } from 'react-native';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: group, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => (await fetch(`${API}/groups/${id}`)).json(),
  });
  const { data: expenses } = useQuery({
    queryKey: ['expenses', id],
    queryFn: async () => (await fetch(`${API}/groups/${id}/expenses`)).json(),
    enabled: !!id,
  });

  if (isLoading)
    return <Lottie autoPlay loop style={{ flex: 1 }} source={require('@/assets/lottie/loading.json')} />;

  const categoryTotals: Record<string, number> = {};
  (expenses || []).forEach((e: any) => (categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount));
  const chartData = Object.entries(categoryTotals).map(([x, y]) => ({ x, y }));

  return (
    <ThemedView style={{ flex: 1, padding: 16, gap: 12 }}>
      <ThemedText type="title">{group?.name}</ThemedText>
      <VictoryPie data={chartData} colorScale="qualitative" innerRadius={50} />
      <Pressable onPress={() => Linking.openURL(`${API}/groups/${id}/export`)}>
        <ThemedText type="link">Export PDF</ThemedText>
      </Pressable>
    </ThemedView>
  );
}
