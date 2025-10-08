export type Currency = "VND" | "AUD" | "USD";

export interface Member {
	id: string;
	name: string;
	phone?: string;
}

export interface Group {
	id: string;
	name: string;
	currency: Currency;
	members: Member[];
	createdAt: string; // ISO string
	inviteCode?: string;
	lastSyncedAt?: string;
}

export interface ExpenseShare {
	memberId: string;
	weight: number;
	amount?: number;
}

export interface Expense {
	id: string;
	groupId: string;
	title: string;
	amount: number;
	currency: Currency;
	paidBy: string; // memberId
	split: { mode: "equal" | "ratio" | "custom"; shares: ExpenseShare[] };
	category: "food" | "transport" | "stay" | "ticket" | "other";
	note?: string;
	date: string; // ISO string
	receiptUrl?: string;
	fxRate?: number; // base currency per unit of expense currency
}

export interface Settlement {
	id: string;
	groupId: string;
	from: string; // memberId
	to: string; // memberId
	amount: number;
	currency: Currency;
	createdAt: string; // ISO string
	paid?: boolean;
}

export interface Stores {
	groups: Record<string, Group>;
	expenses: Record<string, Expense[]>; // by groupId
	settlements: Record<string, Settlement[]>; // by groupId
	inviteCodes: Record<string, string>; // code -> groupId
}

export interface SyncPayload {
	groups?: Group[];
	expenses?: Record<string, Expense[]>;
	settlements?: Record<string, Settlement[]>;
	lastSyncedAt: string;
}
