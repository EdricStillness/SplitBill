import React, { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { ScrollView, View, StyleSheet, Alert, Pressable } from 'react-native';
import Lottie from '../../components/Lottie';
import { api } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';
import type { Group } from '../../services/storage';

const CATEGORIES = ['food', 'transport', 'stay', 'ticket', 'other'] as const;
const SPLIT_MODES = ['equal', 'ratio', 'custom'] as const;

export default function AddExpense() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'VND' | 'AUD' | 'USD'>('USD');
  const [paidBy, setPaidBy] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('other');
  const [splitMode, setSplitMode] = useState<typeof SPLIT_MODES[number]>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [fxRate, setFxRate] = useState('');

  useEffect(() => {
    loadGroup();
  }, [id]);

  const loadGroup = async () => {
    if (!id) return;
    try {
      const g = await api.getGroup(id);
      setGroup(g);
      setCurrency(g.currency);
      if (g.members.length > 0) {
        setPaidBy(g.members[0]!.id);
        setSelectedMembers(g.members.map((m: any) => m.id));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load group');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      try {
        const uploaded = await api.uploadReceipt(result.assets[0].base64, 'receipt.jpg');
        setReceiptUrl(uploaded.url);
        Alert.alert('Success', 'Receipt uploaded');
      } catch (error) {
        Alert.alert('Error', 'Failed to upload receipt');
      }
    }
  };

  const fetchExchangeRate = async () => {
    if (currency === group?.currency) {
      setFxRate('');
      return;
    }
    try {
      const rates = await api.getExchangeRates(currency);
      const rate = rates.rates[group?.currency || 'USD'];
      if (rate) setFxRate(rate.toString());
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch exchange rate');
    }
  };

  const toggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Amount must be greater than 0');
      return;
    }
    if (!paidBy) {
      Alert.alert('Error', 'Please select who paid');
      return;
    }
    if (selectedMembers.length === 0) {
      Alert.alert('Error', 'Please select at least one member to split among');
      return;
    }

    setLoading(true);
    try {
      const shares = selectedMembers.map(memberId => ({
        memberId,
        weight: 1, // Equal split by default
      }));

      await api.createExpense({
        groupId: id!,
        title: title.trim(),
        amount: amountNum,
        currency,
        paidBy,
        split: { mode: splitMode, shares },
        category,
        note: note.trim() || undefined,
        date: new Date().toISOString(),
        receiptUrl: receiptUrl || undefined,
        fxRate: fxRate ? parseFloat(fxRate) : undefined,
      });

      setShowSuccess(true);
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create expense');
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <ThemedView style={styles.successContainer}>
        <Lottie autoPlay loop={false} style={styles.successAnimation} source={require('@/assets/lottie/success.json')} />
        <ThemedText type="title">Expense Added!</ThemedText>
      </ThemedView>
    );
  }

  if (!group) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Lottie autoPlay loop style={styles.loadingAnimation} source={require('@/assets/lottie/loading.json')} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ThemedText type="title">Add Expense</ThemedText>

        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Lunch at restaurant" />
        <Input label="Amount" value={amount} onChangeText={setAmount} placeholder="100" keyboardType="numeric" />

        <View style={styles.section}>
          <ThemedText type="subtitle">Currency</ThemedText>
          <View style={styles.row}>
            {(['VND', 'AUD', 'USD'] as const).map(curr => (
              <Button
                key={curr}
                title={curr}
                variant={currency === curr ? 'primary' : 'outline'}
                onPress={() => {
                  setCurrency(curr);
                  if (curr !== group.currency) fetchExchangeRate();
                }}
                style={styles.flexButton}
              />
            ))}
          </View>
          {currency !== group.currency && (
            <Input
              label={`Exchange Rate (${currency} to ${group.currency})`}
              value={fxRate}
              onChangeText={setFxRate}
              placeholder="1.5"
              keyboardType="numeric"
            />
          )}
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">Category</ThemedText>
          <View style={styles.row}>
            {CATEGORIES.map(cat => (
              <Button
                key={cat}
                title={cat}
                variant={category === cat ? 'primary' : 'outline'}
                onPress={() => setCategory(cat)}
                style={styles.flexButton}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">Paid By</ThemedText>
          <View style={styles.row}>
            {group.members.map(m => (
              <Button
                key={m.id}
                title={m.name}
                variant={paidBy === m.id ? 'primary' : 'outline'}
                onPress={() => setPaidBy(m.id)}
                style={styles.flexButton}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">Split Among</ThemedText>
          <View style={styles.row}>
            {group.members.map(m => (
              <Button
                key={m.id}
                title={m.name}
                variant={selectedMembers.includes(m.id) ? 'primary' : 'outline'}
                onPress={() => toggleMember(m.id)}
                style={styles.flexButton}
              />
            ))}
          </View>
        </View>

        <Input label="Note (optional)" value={note} onChangeText={setNote} placeholder="Tip included" multiline numberOfLines={2} />

        <Button title={receiptUrl ? 'Receipt Attached ✓' : 'Attach Receipt'} variant="outline" onPress={pickImage} />

        <Button title="Add Expense" onPress={submit} loading={loading} disabled={loading} style={styles.submitButton} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
  section: { gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flexButton: { flex: 1, minWidth: 80 },
  submitButton: { marginTop: 24 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  successAnimation: { width: 200, height: 200 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingAnimation: { width: 150, height: 150 },
});
