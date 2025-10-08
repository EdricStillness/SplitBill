import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import Lottie from '../../components/Lottie';
import { Pressable, FlatList, View, StyleSheet, RefreshControl } from 'react-native';
import { api } from '../../services/api';
import type { Group } from '../../services/storage';

export default function GroupsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await api.getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Lottie autoPlay loop style={styles.loadingAnimation} source={require('@/assets/lottie/loading.json')} />
      </ThemedView>
    );
  }

  if (groups.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <EmptyState
          title="No Groups Yet"
          message="Create your first group to start tracking expenses"
        />
        <View style={styles.emptyActions}>
          <Button
            title="Create Group"
            onPress={() => router.push('/groups/create')}
          />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">My Groups</ThemedText>
        <Button
          title="+ New Group"
          onPress={() => router.push('/groups/create')}
          style={styles.newButton}
        />
      </View>

      <FlatList
        data={groups}
        keyExtractor={(g: any) => g.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }: any) => (
          <Pressable
            onPress={() => router.push(`/groups/${item.id}`)}
            style={styles.groupCard}
          >
            <View style={styles.groupHeader}>
              <ThemedText type="subtitle">{item.name}</ThemedText>
              <ThemedText style={styles.currency}>{item.currency}</ThemedText>
            </View>
            <ThemedText style={styles.memberCount}>
              {item.members.length} member{item.members.length !== 1 ? 's' : ''}
            </ThemedText>
            <View style={styles.groupActions}>
              <Pressable
                onPress={(e: any) => {
                  e.stopPropagation();
                  router.push({ pathname: '/groups/add', params: { id: item.id } });
                }}
                style={styles.actionLink}
              >
                <ThemedText type="link" style={styles.actionText}>+ Expense</ThemedText>
              </Pressable>
              <Pressable
                onPress={(e: any) => {
                  e.stopPropagation();
                  router.push({ pathname: '/groups/settle', params: { id: item.id } });
                }}
                style={styles.actionLink}
              >
                <ThemedText type="link" style={styles.actionText}>Settle Up</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  newButton: { paddingHorizontal: 16, minHeight: 40 },
  list: { padding: 16, paddingTop: 8 },
  groupCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    marginBottom: 12,
    gap: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currency: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  memberCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  groupActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  actionLink: {
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 14,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingAnimation: { width: 150, height: 150 },
  emptyActions: { padding: 24 },
});
