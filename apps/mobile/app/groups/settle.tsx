import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { TextInput, Pressable } from 'react-native';
import Lottie from '../../components/Lottie';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function SettleUp() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');

  async function submit() {
    setLoading(true);
    try {
      await fetch(`${API}/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: id, from, to, amount: Number(amount), currency: 'USD' }),
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return <Lottie autoPlay style={{ flex: 1 }} source={require('@/assets/lottie/success.json')} />;

  return (
    <ThemedView style={{ flex: 1, padding: 16, gap: 12 }}>
      <ThemedText type="title">Settle Up</ThemedText>
      <TextInput placeholder="From memberId" value={from} onChangeText={setFrom} />
      <TextInput placeholder="To memberId" value={to} onChangeText={setTo} />
      <TextInput placeholder="Amount" inputMode="decimal" value={amount} onChangeText={setAmount} />
      <Pressable onPress={submit}>
        <ThemedText type="link">Submit</ThemedText>
      </Pressable>
    </ThemedView>
  );
}
