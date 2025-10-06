import type { Settlement } from "./types";

// Given net balances, produce minimal set of transfers using a greedy approach.
// Input: map<memberId, netAmount> (positive = should receive, negative = should pay)
// Output: Settlement[] with (from,to,amount). Amounts are positive numbers.
export function minimizeTransfers(balances: Record<string, number>): Array<Pick<Settlement, "from" | "to" | "amount">> {
	const eps = 1e-6;
	const creditors: { id: string; amt: number }[] = [];
	const debtors: { id: string; amt: number }[] = [];

	for (const [id, v] of Object.entries(balances)) {
		if (Math.abs(v) < eps) continue;
		if (v > 0) creditors.push({ id, amt: v });
		else debtors.push({ id, amt: -v }); // store as positive debt
	}

	// Greedy: always match max creditor with max debtor
	creditors.sort((a, b) => b.amt - a.amt);
	debtors.sort((a, b) => b.amt - a.amt);

	const res: Array<Pick<Settlement, "from" | "to" | "amount">> = [];
	let i = 0,
		j = 0;
	while (i < creditors.length && j < debtors.length) {
		const c = creditors[i];
		const d = debtors[j];
		if (!c || !d) break;
		const pay = Math.min(c.amt, d.amt);
		if (pay > eps) res.push({ from: d.id, to: c.id, amount: round2(pay) });
		c.amt = round6(c.amt - pay);
		d.amt = round6(d.amt - pay);
		if (c.amt <= eps) i++;
		if (d.amt <= eps) j++;
	}

	return res;
}

export function round2(n: number): number {
	return Math.round(n * 100) / 100;
}

export function round6(n: number): number {
	return Math.round(n * 1e6) / 1e6;
}
