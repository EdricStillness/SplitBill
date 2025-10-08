import * as Storage from './storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

// Network helpers
async function fetchApi(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Sync service
export async function syncWithServer(): Promise<void> {
  try {
    const hasPending = await Storage.hasPendingSync();
    if (!hasPending) {
      // Just pull updates
      const lastSync = await Storage.getLastSyncTime();
      const response = await fetchApi('/sync', {
        method: 'POST',
        body: JSON.stringify({ lastSyncedAt: lastSync }),
      });
      await mergeServerData(response);
      return;
    }

    // Push and pull
    const [groups, expenses, settlements, lastSync] = await Promise.all([
      Storage.getGroups(),
      Storage.getAllExpenses(),
      Storage.getAllSettlements(),
      Storage.getLastSyncTime(),
    ]);

    const response = await fetchApi('/sync', {
      method: 'POST',
      body: JSON.stringify({ groups, expenses, settlements, lastSyncedAt: lastSync }),
    });

    await mergeServerData(response);
    await Storage.clearPendingSync();
  } catch (error) {
    console.warn('Sync failed:', error);
    // Fail silently for offline-first
  }
}

async function mergeServerData(data: any) {
  if (data.groups) {
    const localGroups = await Storage.getGroups();
    for (const serverGroup of data.groups) {
      const local = localGroups.find(g => g.id === serverGroup.id);
      if (!local || (serverGroup.lastSyncedAt && serverGroup.lastSyncedAt > (local.lastSyncedAt || ''))) {
        await Storage.saveGroup(serverGroup);
      }
    }
  }

  if (data.expenses) {
    for (const [groupId, exps] of Object.entries(data.expenses)) {
      const localExps = await Storage.getExpenses(groupId);
      for (const exp of exps as Storage.Expense[]) {
        const local = localExps.find(e => e.id === exp.id);
        if (!local) await Storage.saveExpense(exp);
      }
    }
  }

  if (data.settlements) {
    for (const [groupId, sets] of Object.entries(data.settlements)) {
      const localSets = await Storage.getSettlements(groupId);
      for (const set of sets as Storage.Settlement[]) {
        const local = localSets.find(s => s.id === set.id);
        if (!local) await Storage.saveSettlement(set);
      }
    }
  }

  if (data.lastSyncedAt) {
    await Storage.setLastSyncTime(data.lastSyncedAt);
  }
}

// API methods
export const api = {
  // Groups
  async createGroup(name: string, currency: string, members: Storage.Member[] = []) {
    const group = await fetchApi('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, currency, members }),
    });
    await Storage.saveGroup(group);
    return group;
  },

  async getGroup(id: string) {
    try {
      const group = await fetchApi(`/groups/${id}`);
      await Storage.saveGroup(group);
      return group;
    } catch {
      return await Storage.getGroup(id);
    }
  },

  async getGroups() {
    try {
      const groups = await fetchApi('/groups');
      for (const g of groups) await Storage.saveGroup(g);
      return groups;
    } catch {
      return await Storage.getGroups();
    }
  },

  async generateInvite(groupId: string) {
    return await fetchApi(`/groups/${groupId}/invite`, { method: 'POST' });
  },

  async joinGroup(code: string, member: Storage.Member) {
    const group = await fetchApi(`/groups/join/${code}`, {
      method: 'POST',
      body: JSON.stringify(member),
    });
    await Storage.saveGroup(group);
    return group;
  },

  // Expenses
  async createExpense(expense: Omit<Storage.Expense, 'id'>) {
    const id = `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    const newExpense: Storage.Expense = { id, ...expense };
    await Storage.saveExpense(newExpense);
    
    // Try to sync to server
    try {
      await fetchApi('/expenses', {
        method: 'POST',
        body: JSON.stringify(newExpense),
      });
    } catch {
      // Offline - will sync later
    }
    
    return newExpense;
  },

  async getExpenses(groupId: string) {
    try {
      const expenses = await fetchApi(`/groups/${groupId}/expenses`);
      for (const e of expenses) await Storage.saveExpense(e);
      return expenses;
    } catch {
      return await Storage.getExpenses(groupId);
    }
  },

  // Balance and settlements
  async getBalance(groupId: string) {
    try {
      return await fetchApi(`/groups/${groupId}/balance`);
    } catch {
      // Calculate locally
      const expenses = await Storage.getExpenses(groupId);
      const group = await Storage.getGroup(groupId);
      if (!group) return {};

      const balances: Record<string, number> = {};
      group.members.forEach(m => (balances[m.id] = 0));

      expenses.forEach(e => {
        const total = e.amount * (e.fxRate || 1);
        balances[e.paidBy] = (balances[e.paidBy] || 0) + total;
        const sumW = e.split.shares.reduce((acc, s) => acc + s.weight, 0) || 1;
        e.split.shares.forEach(s => {
          balances[s.memberId] = (balances[s.memberId] || 0) - (total * s.weight) / sumW;
        });
      });

      return balances;
    }
  },

  async getSuggestedSettlements(groupId: string) {
    try {
      return await fetchApi(`/groups/${groupId}/settlements/suggest`, { method: 'POST' });
    } catch {
      // Offline fallback - would need to implement minimizeTransfers locally
      return [];
    }
  },

  async createSettlement(settlement: Omit<Storage.Settlement, 'id' | 'createdAt'>) {
    const id = `set_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    const newSettlement: Storage.Settlement = {
      id,
      ...settlement,
      createdAt: new Date().toISOString(),
      paid: true,
    };
    await Storage.saveSettlement(newSettlement);

    try {
      await fetchApi('/settlements', {
        method: 'POST',
        body: JSON.stringify(newSettlement),
      });
    } catch {
      // Offline - will sync later
    }

    return newSettlement;
  },

  // Exchange rates
  async getExchangeRates(base: string = 'USD') {
    try {
      return await fetchApi(`/exchange-rates?base=${base}`);
    } catch {
      // Fallback rates
      return {
        base,
        rates: { VND: 24000, AUD: 1.5, USD: 1 },
        date: new Date().toISOString(),
      };
    }
  },

  // Upload
  async uploadReceipt(base64: string, filename: string) {
    try {
      return await fetchApi('/upload', {
        method: 'POST',
        body: JSON.stringify({ base64, filename }),
      });
    } catch {
      // Return local reference
      return { url: `local://${Date.now()}_${filename}` };
    }
  },

  getExportUrl(groupId: string) {
    return `${API_URL}/groups/${groupId}/export`;
  },
};

