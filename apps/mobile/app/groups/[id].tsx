import React, { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import Lottie from '../../components/Lottie';
import { VictoryPie } from 'victory-native';
import { Linking, Pressable, ScrollView, View, StyleSheet, Share, Alert } from 'react-native';
import { api } from '../../services/api';
import type { Group, Expense } from '../../services/storage';

export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [g, exp] = await Promise.all([
        api.getGroup(id),
        api.getExpenses(id),
      ]);
      setGroup(g);
      setExpenses(exp);
    } catch (error) {
      Alert.alert('Error', 'Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const generateInvite = async () => {
    if (!id) return;
    try {
      const invite = await api.generateInvite(id);
      setInviteCode(invite.code);
      Share.share({
        message: `Join my group "${group?.name}" on SplitBill!\nCode: ${invite.code}\nLink: ${invite.link}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate invite');
    }
  };

  const exportPdf = () => {
    if (!id) return;
    const url = api.getExportUrl(id);
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Lottie autoPlay loop style={styles.loadingAnimation} source={require('@/assets/lottie/loading.json')} />
      </ThemedView>
    );
  }

  if (!group) {
    return <EmptyState title="Group Not Found" />;
  }

  const categoryTotals: Record<string, number> = {};
  expenses.forEach(e => {
    const total = e.currency === group.currency ? e.amount : e.amount * (e.fxRate || 1);
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + total;
  });
  const chartData = Object.entries(categoryTotals).map(([x, y]) => ({ x, y }));
  const totalSpent = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title">{group.name}</ThemedText>
          <ThemedText style={styles.subtitle}>
            {group.members.length} members · {group.currency}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">Members</ThemedText>
          <View style={styles.membersList}>
            {group.members.map(m => (
              <View key={m.id} style={styles.memberChip}>
                <ThemedText style={styles.memberName}>{m.name}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {expenses.length > 0 ? (
          <>
            <View style={styles.section}>
              <ThemedText type="subtitle">Total Spent</ThemedText>
              <ThemedText style={styles.totalAmount}>
                {totalSpent.toFixed(2)} {group.currency}
              </ThemedText>
            </View>

            {chartData.length > 0 && (
              <View style={styles.section}>
                <ThemedText type="subtitle">Expenses by Category</ThemedText>
                <VictoryPie
                  data={chartData}
                  colorScale={['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']}
                  innerRadius={60}
                  labels={({ datum }) => `${datum.x}\n${((datum.y / totalSpent) * 100).toFixed(1)}%`}
                  style={{
                    labels: { fontSize: 12, fill: '#666' },
                  }}
                />
              </View>
            )}

            <View style={styles.section}>
              <ThemedText type="subtitle">Recent Expenses ({expenses.length})</ThemedText>
              {expenses.slice(0, 10).map(e => {
                const paidByMember = group.members.find(m => m.id === e.paidBy);
                return (
                  <View key={e.id} style={styles.expenseCard}>
                    <View style={styles.expenseHeader}>
                      <ThemedText style={styles.expenseTitle}>{e.title}</ThemedText>
                      <ThemedText style={styles.expenseAmount}>
                        {e.amount} {e.currency}
                      </ThemedText>
                    </View>
                    <View style={styles.expenseDetails}>
                      <ThemedText style={styles.expenseDetail}>
                        {e.category} · Paid by {paidByMember?.name || e.paidBy}
                      </ThemedText>
                      <ThemedText style={styles.expenseDetail}>
                        {new Date(e.date).toLocaleDateString()}
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <EmptyState
            title="No Expenses Yet"
            message="Add your first expense to get started"
          />
        )}

        <View style={styles.actions}>
          <Button
            title="Add Expense"
            onPress={() => router.push({ pathname: '/groups/add', params: { id } })}
            style={styles.actionButton}
          />
          <Button
            title="Settle Up"
            variant="secondary"
            onPress={() => router.push({ pathname: '/groups/settle', params: { id } })}
            style={styles.actionButton}
          />
          <Button
            title="Invite Members"
            variant="outline"
            onPress={generateInvite}
            style={styles.actionButton}
          />
          <Button
            title="Export PDF"
            variant="outline"
            onPress={exportPdf}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 24 },
  subtitle: { fontSize: 14, opacity: 0.7, marginTop: 4 },
  section: { marginBottom: 24 },
  membersList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  memberChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  memberName: { fontSize: 14 },
  totalAmount: { fontSize: 32, fontWeight: '700', marginTop: 8 },
  expenseCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    marginBottom: 8,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  expenseTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  expenseAmount: { fontSize: 16, fontWeight: '700' },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  expenseDetail: { fontSize: 12, opacity: 0.7 },
  actions: { gap: 12, marginTop: 24 },
  actionButton: {},
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingAnimation: { width: 150, height: 150 },
});
