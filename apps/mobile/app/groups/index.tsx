import React from 'react';
import { Link, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useQuery } from '@tanstack/react-query';
import Lottie from '../../components/Lottie';
import { Pressable, FlatList, View } from 'react-native';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function GroupsScreen() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await fetch(`${API}/groups`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  if (isLoading)
    return <Lottie autoPlay loop style={{ flex: 1 }} source={require('@/assets/lottie/loading.json')} />;

  return (
    <ThemedView style={{ flex: 1, padding: 16, gap: 12 }}>
      <ThemedText type="title">Groups</ThemedText>
      <Pressable
        onPress={async () => {
          const res = await fetch(`${API}/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Demo Trip',
              currency: 'USD',
              members: [
                { id: 'me', name: 'Me' },
                { id: 'friend', name: 'Friend' }
              ],
            }),
          });
          const g = await res.json();
          router.push(`/groups/${g.id}`);
        }}
      >
        <ThemedText type="link">+ Create Demo Group</ThemedText>
      </Pressable>
      <FlatList
        data={data || []}
        keyExtractor={(g: any) => g.id}
        renderItem={({ item }: any) => (
          <View style={{ paddingVertical: 8, gap: 6 }}>
            <Pressable onPress={() => router.push(`/groups/${item.id}`)}>
              <ThemedText>{item.name}</ThemedText>
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <Pressable onPress={() => router.push({ pathname: '/groups/add', params: { id: item.id } })}>
                <ThemedText type="link">Add Expense</ThemedText>
              </Pressable>
              <Pressable onPress={() => router.push({ pathname: '/groups/settle', params: { id: item.id } })}>
                <ThemedText type="link">Settle Up</ThemedText>
              </Pressable>
            </View>
          </View>
        )}
      />
    </ThemedView>
  );
}
