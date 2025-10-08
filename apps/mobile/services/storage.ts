import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Group {
  id: string;
  name: string;
  currency: 'VND' | 'AUD' | 'USD';
  members: Member[];
  createdAt: string;
  inviteCode?: string;
  lastSyncedAt?: string;
}

export interface Member {
  id: string;
  name: string;
  phone?: string;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  currency: 'VND' | 'AUD' | 'USD';
  paidBy: string;
  split: {
    mode: 'equal' | 'ratio' | 'custom';
    shares: { memberId: string; weight: number; amount?: number }[];
  };
  category: 'food' | 'transport' | 'stay' | 'ticket' | 'other';
  note?: string;
  date: string;
  receiptUrl?: string;
  fxRate?: number;
}

export interface Settlement {
  id: string;
  groupId: string;
  from: string;
  to: string;
  amount: number;
  currency: 'VND' | 'AUD' | 'USD';
  createdAt: string;
  paid?: boolean;
}

const KEYS = {
  GROUPS: '@splitbill:groups',
  EXPENSES: '@splitbill:expenses',
  SETTLEMENTS: '@splitbill:settlements',
  LAST_SYNC: '@splitbill:lastSync',
  PENDING_SYNC: '@splitbill:pendingSync',
};

// Groups
export async function getGroups(): Promise<Group[]> {
  const data = await AsyncStorage.getItem(KEYS.GROUPS);
  return data ? JSON.parse(data) : [];
}

export async function getGroup(id: string): Promise<Group | null> {
  const groups = await getGroups();
  return groups.find(g => g.id === id) || null;
}

export async function saveGroup(group: Group): Promise<void> {
  const groups = await getGroups();
  const idx = groups.findIndex(g => g.id === group.id);
  if (idx >= 0) groups[idx] = group;
  else groups.push(group);
  await AsyncStorage.setItem(KEYS.GROUPS, JSON.stringify(groups));
  await markPendingSync();
}

export async function deleteGroup(id: string): Promise<void> {
  const groups = await getGroups();
  const filtered = groups.filter(g => g.id !== id);
  await AsyncStorage.setItem(KEYS.GROUPS, JSON.stringify(filtered));
  // Also delete related data
  await AsyncStorage.removeItem(`${KEYS.EXPENSES}:${id}`);
  await AsyncStorage.removeItem(`${KEYS.SETTLEMENTS}:${id}`);
}

// Expenses
export async function getExpenses(groupId: string): Promise<Expense[]> {
  const data = await AsyncStorage.getItem(`${KEYS.EXPENSES}:${groupId}`);
  return data ? JSON.parse(data) : [];
}

export async function saveExpense(expense: Expense): Promise<void> {
  const expenses = await getExpenses(expense.groupId);
  const idx = expenses.findIndex(e => e.id === expense.id);
  if (idx >= 0) expenses[idx] = expense;
  else expenses.push(expense);
  await AsyncStorage.setItem(`${KEYS.EXPENSES}:${expense.groupId}`, JSON.stringify(expenses));
  await markPendingSync();
}

export async function deleteExpense(groupId: string, expenseId: string): Promise<void> {
  const expenses = await getExpenses(groupId);
  const filtered = expenses.filter(e => e.id !== expenseId);
  await AsyncStorage.setItem(`${KEYS.EXPENSES}:${groupId}`, JSON.stringify(filtered));
  await markPendingSync();
}

// Settlements
export async function getSettlements(groupId: string): Promise<Settlement[]> {
  const data = await AsyncStorage.getItem(`${KEYS.SETTLEMENTS}:${groupId}`);
  return data ? JSON.parse(data) : [];
}

export async function saveSettlement(settlement: Settlement): Promise<void> {
  const settlements = await getSettlements(settlement.groupId);
  const idx = settlements.findIndex(s => s.id === settlement.id);
  if (idx >= 0) settlements[idx] = settlement;
  else settlements.push(settlement);
  await AsyncStorage.setItem(`${KEYS.SETTLEMENTS}:${settlement.groupId}`, JSON.stringify(settlements));
  await markPendingSync();
}

// Sync management
async function markPendingSync(): Promise<void> {
  await AsyncStorage.setItem(KEYS.PENDING_SYNC, 'true');
}

export async function hasPendingSync(): Promise<boolean> {
  const pending = await AsyncStorage.getItem(KEYS.PENDING_SYNC);
  return pending === 'true';
}

export async function clearPendingSync(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.PENDING_SYNC);
}

export async function getLastSyncTime(): Promise<string | null> {
  return await AsyncStorage.getItem(KEYS.LAST_SYNC);
}

export async function setLastSyncTime(time: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_SYNC, time);
}

export async function getAllExpenses(): Promise<Record<string, Expense[]>> {
  const groups = await getGroups();
  const result: Record<string, Expense[]> = {};
  for (const g of groups) {
    result[g.id] = await getExpenses(g.id);
  }
  return result;
}

export async function getAllSettlements(): Promise<Record<string, Settlement[]>> {
  const groups = await getGroups();
  const result: Record<string, Settlement[]> = {};
  for (const g of groups) {
    result[g.id] = await getSettlements(g.id);
  }
  return result;
}

