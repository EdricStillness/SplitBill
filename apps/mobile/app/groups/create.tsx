import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { api } from '../../services/api';
import Lottie from '../../components/Lottie';

export default function CreateGroup() {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<'VND' | 'AUD' | 'USD'>('USD');
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [members, setMembers] = useState<Array<{ id: string; name: string; phone?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const addMember = () => {
    if (!memberName.trim()) {
      Alert.alert('Error', 'Member name is required');
      return;
    }
    const id = `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    setMembers([...members, { id, name: memberName.trim(), phone: memberPhone.trim() || undefined }]);
    setMemberName('');
    setMemberPhone('');
  };

  const removeMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
  };

  const createGroup = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    setLoading(true);
    try {
      const group = await api.createGroup(name.trim(), currency, members);
      setShowSuccess(true);
      setTimeout(() => {
        router.replace(`/groups/${group.id}`);
      }, 1500);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create group');
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <ThemedView style={styles.successContainer}>
        <Lottie autoPlay loop={false} style={styles.successAnimation} source={require('@/assets/lottie/success.json')} />
        <ThemedText type="title">Group Created!</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ThemedText type="title">Create New Group</ThemedText>

        <Input label="Group Name" value={name} onChangeText={setName} placeholder="Trip to Bali" />

        <View style={styles.section}>
          <ThemedText type="subtitle">Currency</ThemedText>
          <View style={styles.currencyRow}>
            {(['VND', 'AUD', 'USD'] as const).map(curr => (
              <Button
                key={curr}
                title={curr}
                variant={currency === curr ? 'primary' : 'outline'}
                onPress={() => setCurrency(curr)}
                style={styles.currencyButton}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">Members ({members.length})</ThemedText>
          {members.map(m => (
            <View key={m.id} style={styles.memberRow}>
              <View style={styles.memberInfo}>
                <ThemedText>{m.name}</ThemedText>
                {m.phone && <ThemedText style={styles.phone}>{m.phone}</ThemedText>}
              </View>
              <Button title="Remove" variant="outline" onPress={() => removeMember(m.id)} style={styles.removeButton} />
            </View>
          ))}

          <Input label="Member Name" value={memberName} onChangeText={setMemberName} placeholder="John Doe" />
          <Input
            label="Phone (optional)"
            value={memberPhone}
            onChangeText={setMemberPhone}
            placeholder="+1234567890"
            keyboardType="phone-pad"
          />
          <Button title="Add Member" variant="outline" onPress={addMember} />
        </View>

        <Button title="Create Group" onPress={createGroup} loading={loading} disabled={loading} style={styles.createButton} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
  section: { gap: 12 },
  currencyRow: { flexDirection: 'row', gap: 8 },
  currencyButton: { flex: 1 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  memberInfo: { flex: 1 },
  phone: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  removeButton: { paddingHorizontal: 12, minHeight: 36 },
  createButton: { marginTop: 24 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  successAnimation: { width: 200, height: 200 },
});

