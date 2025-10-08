import React, { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/Button';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import Lottie from '../../components/Lottie';
import { api } from '../../services/api';
import { EmptyState } from '@/components/EmptyState';
import type { Group } from '../../services/storage';

interface Settlement {
  from: string;
  to: string;
  amount: number;
  currency: string;
}

export default function SettleUp() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [suggestions, setSuggestions] = useState<Settlement[]>([]);
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [g, bal, sug] = await Promise.all([
        api.getGroup(id),
        api.getBalance(id),
        api.getSuggestedSettlements(id),
      ]);
      setGroup(g);
      setBalances(bal);
      setSuggestions(sug);
    } catch (error) {
      Alert.alert('Error', 'Failed to load settlement data');
    } finally {
      setLoading(false);
    }
  };

  const settleAll = async () => {
    if (!group || suggestions.length === 0) return;
    
    Alert.alert(
      'Confirm Settlement',
      `This will create ${suggestions.length} settlement(s). Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setSettling(true);
            try {
              for (const s of suggestions) {
                await api.createSettlement({
                  groupId: id!,
                  from: s.from,
                  to: s.to,
                  amount: s.amount,
                  currency: s.currency as any,
                });
              }
              setShowSuccess(true);
              setTimeout(() => {
                router.back();
              }, 1500);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to create settlements');
              setSettling(false);
            }
          },
        },
      ]
    );
  };

  const settleOne = async (settlement: Settlement) => {
    if (!group) return;
    
    setSettling(true);
    try {
      await api.createSettlement({
        groupId: id!,
        from: settlement.from,
        to: settlement.to,
        amount: settlement.amount,
        currency: settlement.currency as any,
      });
      
      // Reload data
      await loadData();
      Alert.alert('Success', 'Settlement recorded');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create settlement');
    } finally {
      setSettling(false);
    }
  };

  if (showSuccess) {
    return (
      <ThemedView style={styles.successContainer}>
        <Lottie autoPlay loop={false} style={styles.successAnimation} source={require('@/assets/lottie/success.json')} />
        <ThemedText type="title">All Settled!</ThemedText>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Lottie autoPlay loop style={styles.loadingAnimation} source={require('@/assets/lottie/loading.json')} />
      </ThemedView>
    );
  }

  if (!group) {
    return (
      <EmptyState
        title="Group Not Found"
        message="Unable to load group data"
      />
    );
  }

  const hasDebts = suggestions.length > 0;

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ThemedText type="title">Settle Up</ThemedText>
        <ThemedText style={styles.subtitle}>Group: {group.name}</ThemedText>

        {/* Current Balances */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Current Balances</ThemedText>
          {group.members.map(m => {
            const balance = balances[m.id] || 0;
            const isPositive = balance > 0;
            const isZero = Math.abs(balance) < 0.01;
            return (
              <View key={m.id} style={styles.balanceRow}>
                <ThemedText style={styles.memberName}>{m.name}</ThemedText>
                <ThemedText
                  style={[
                    styles.balanceAmount,
                    isZero ? {} : isPositive ? styles.positive : styles.negative,
                  ]}
                >
                  {isZero ? '✓ Settled' : `${isPositive ? '+' : ''}${balance.toFixed(2)} ${group.currency}`}
                </ThemedText>
              </View>
            );
          })}
        </View>

        {/* Suggested Settlements */}
        {hasDebts ? (
          <View style={styles.section}>
            <ThemedText type="subtitle">Suggested Settlements (Minimized)</ThemedText>
            <ThemedText style={styles.hint}>
              These {suggestions.length} payment{suggestions.length > 1 ? 's' : ''} will settle all debts:
            </ThemedText>
            {suggestions.map((s, i) => {
              const fromMember = group.members.find(m => m.id === s.from);
              const toMember = group.members.find(m => m.id === s.to);
              return (
                <View key={i} style={styles.settlementCard}>
                  <View style={styles.settlementInfo}>
                    <ThemedText style={styles.settlementText}>
                      <ThemedText style={styles.bold}>{fromMember?.name || s.from}</ThemedText>
                      {' → '}
                      <ThemedText style={styles.bold}>{toMember?.name || s.to}</ThemedText>
                    </ThemedText>
                    <ThemedText style={styles.settlementAmount}>
                      {s.amount.toFixed(2)} {s.currency}
                    </ThemedText>
                  </View>
                  <Button
                    title="Mark Paid"
                    variant="outline"
                    onPress={() => settleOne(s)}
                    disabled={settling}
                    style={styles.settleButton}
                  />
                </View>
              );
            })}
            <Button
              title="Mark All as Settled"
              onPress={settleAll}
              loading={settling}
              disabled={settling}
              style={styles.settleAllButton}
            />
          </View>
        ) : (
          <EmptyState
            title="All Settled Up! 🎉"
            message="Everyone is even. No payments needed."
            animation={require('@/assets/lottie/success.json')}
          />
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 20 },
  subtitle: { fontSize: 14, opacity: 0.7, marginBottom: 8 },
  section: { gap: 12 },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    marginBottom: 8,
  },
  memberName: { fontSize: 16, fontWeight: '600' },
  balanceAmount: { fontSize: 16, fontWeight: '700' },
  positive: { color: '#4caf50' },
  negative: { color: '#f44336' },
  hint: { fontSize: 14, opacity: 0.7, fontStyle: 'italic' },
  settlementCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    gap: 12,
    marginBottom: 12,
  },
  settlementInfo: { gap: 4 },
  settlementText: { fontSize: 16 },
  bold: { fontWeight: '700' },
  settlementAmount: { fontSize: 20, fontWeight: '700', color: '#2196f3' },
  settleButton: { minHeight: 40 },
  settleAllButton: { marginTop: 8 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  successAnimation: { width: 200, height: 200 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingAnimation: { width: 150, height: 150 },
});
