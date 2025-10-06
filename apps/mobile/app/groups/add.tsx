import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { TextInput, Pressable } from 'react-native';
import Lottie from '../../components/Lottie';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function AddExpense() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  async function submit() {
    setLoading(true);
    try {
      await fetch(`${API}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: id,
          title,
          amount: Number(amount),
          currency: 'USD',
          paidBy: 'me',
          split: { mode: 'equal', shares: [{ memberId: 'me', weight: 1 }] },
          category: 'other',
          date: new Date().toISOString(),
        }),
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return <Lottie autoPlay style={{ flex: 1 }} source={require('@/assets/lottie/success.json')} />;

  return (
    <ThemedView style={{ flex: 1, padding: 16, gap: 12 }}>
      <ThemedText type="title">Add Expense</ThemedText>
      <TextInput placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput placeholder="Amount" inputMode="decimal" value={amount} onChangeText={setAmount} />
      <Pressable onPress={submit}>
        <ThemedText type="link">Submit</ThemedText>
      </Pressable>
    </ThemedView>
  );
}
