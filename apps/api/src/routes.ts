import express from "express";
import { z } from "zod";
import { Expense, Group, Member, Settlement, Stores } from "./types";
import { minimizeTransfers, round2 } from "./utils";
import { generateGroupPdf } from "./pdf";

const r = express.Router();

// In-memory store (replace with DB later)
const store: Stores = { groups: {}, expenses: {}, settlements: {}, inviteCodes: {} };

// Schemas
const currency = z.enum(["VND", "AUD", "USD"]);
const memberSchema = z.object({ id: z.string(), name: z.string().min(1), phone: z.string().optional() });
const groupCreateSchema = z.object({ name: z.string().min(1), currency, members: z.array(memberSchema).default([]) });

const expenseShareSchema = z.object({ memberId: z.string(), weight: z.number().positive(), amount: z.number().optional() });
const expenseCreateSchema = z.object({
	groupId: z.string(),
	title: z.string().min(1),
	amount: z.number().positive(),
	currency,
	paidBy: z.string(),
	split: z.object({
		mode: z.enum(["equal", "ratio", "custom"]),
		shares: z.array(expenseShareSchema).min(1),
	}),
	category: z.enum(["food", "transport", "stay", "ticket", "other"]),
	note: z.string().optional(),
	date: z.string().datetime(),
	receiptUrl: z.string().url().optional(),
	fxRate: z.number().positive().optional(),
});

const settlementCreateSchema = z.object({
	groupId: z.string(),
	from: z.string(),
	to: z.string(),
	amount: z.number().positive(),
	currency,
});

// Helpers
function assertGroupExists(id: string): Group {
	const g = store.groups[id];
	if (!g) throw httpError(404, "Group not found");
	return g;
}

function httpError(status: number, message: string) {
	const err = new Error(message) as Error & { status?: number };
	err.status = status;
	return err;
}

// Routes
r.post("/groups", (req, res, next) => {
	try {
		const body = groupCreateSchema.parse(req.body);
		const id = `grp_${Date.now().toString(36)}`;
		const group: Group = { id, name: body.name, currency: body.currency, members: body.members as Member[], createdAt: new Date().toISOString() };
		store.groups[id] = group;
		store.expenses[id] = [];
		store.settlements[id] = [];
		res.status(201).json(group);
		} catch (e: any) {
			if (e instanceof z.ZodError) return res.status(400).json({ error: e.flatten() });
		next(e);
	}
});

r.get("/groups/:id", (req, res, next) => {
	try {
		const g = assertGroupExists(req.params.id);
		res.json(g);
	} catch (e) {
		next(e);
	}
});

// list groups
r.get("/groups", (_req, res) => {
	res.json(Object.values(store.groups));
});

r.post("/groups/:id/invite", (req, res, next) => {
	try {
		const g = assertGroupExists(req.params.id);
		// Generate or reuse invite code
		if (!g.inviteCode) {
			const code = `INV-${g.id.slice(-4)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
			g.inviteCode = code;
			store.inviteCodes[code] = g.id;
		}
		res.json({ code: g.inviteCode, link: `${req.protocol}://${req.get("host")}/join/${g.inviteCode}` });
	} catch (e) {
		next(e);
	}
});

// Join group by invite code
r.post("/groups/join/:code", (req, res, next) => {
	try {
		const code = req.params.code.toUpperCase();
		const groupId = store.inviteCodes[code];
		if (!groupId) throw httpError(404, "Invalid invite code");
		const g = assertGroupExists(groupId);
		const memberSchema = z.object({ id: z.string(), name: z.string().min(1), phone: z.string().optional() });
		const body = memberSchema.parse(req.body);
		// Check if member already exists
		if (!g.members.find(m => m.id === body.id)) {
			g.members.push(body as Member);
		}
		res.json(g);
	} catch (e: any) {
		if (e instanceof z.ZodError) return res.status(400).json({ error: e.flatten() });
		next(e);
	}
});

r.post("/expenses", (req, res, next) => {
	try {
		const body = expenseCreateSchema.parse(req.body);
		const g = assertGroupExists(body.groupId);
		// Validate members involved
		const memberIds = new Set(g.members.map((m) => m.id));
		if (!memberIds.has(body.paidBy)) throw httpError(400, "paidBy must be a member of the group");
		for (const s of body.split.shares) if (!memberIds.has(s.memberId)) throw httpError(400, "share memberId not in group");

		const id = `exp_${Date.now().toString(36)}`;
		const exp: Expense = { id, ...(body as any) } as Expense;
		store.expenses[g.id] = store.expenses[g.id] || [];
		store.expenses[g.id]!.push(exp);
		res.status(201).json(exp);
		} catch (e: any) {
			if (e instanceof z.ZodError) return res.status(400).json({ error: e.flatten() });
		next(e);
	}
});

r.get("/groups/:id/expenses", (req, res, next) => {
	try {
		const g = assertGroupExists(req.params.id);
		res.json(store.expenses[g.id] ?? []);
	} catch (e) {
		next(e);
	}
});

// Compute net balance per member
r.get("/groups/:id/balance", (req, res, next) => {
	try {
		const g = assertGroupExists(req.params.id);
		const balances: Record<string, number> = Object.fromEntries(g.members.map((m) => [m.id, 0]));
		const expenses = store.expenses[g.id] ?? [];
		for (const e of expenses) {
			// total in group currency: if fxRate provided and currency differs, convert amount to group currency
			const total = e.currency === g.currency || !e.fxRate ? e.amount : e.amount * (e.fxRate || 1);
			balances[e.paidBy] = (balances[e.paidBy] || 0) + total;
			// Calculate each share owed
			const weights = e.split.shares.map((s) => s.weight);
			const sumW = weights.reduce((a, b) => a + b, 0) || 1;
			for (const s of e.split.shares) {
				const owe = round2((total * s.weight) / sumW);
			balances[s.memberId] = (balances[s.memberId] || 0) - owe;
			}
		}
		res.json(balances);
	} catch (e) {
		next(e);
	}
});

r.post("/groups/:id/settlements/suggest", (req, res, next) => {
	try {
		const g = assertGroupExists(req.params.id);
		const balances = req.body && typeof req.body === "object" ? (req.body as Record<string, number>) : undefined;
		let b: Record<string, number>;
		if (balances) b = balances;
		else {
			// recompute balances if not provided
			const tmpReq: any = { params: { id: g.id } };
			const tmpRes: any = { json: (v: any) => v };
			// reuse logic
			const expenses = store.expenses[g.id] ?? [];
			b = Object.fromEntries(g.members.map((m) => [m.id, 0]));
			for (const e of expenses) {
				const total = e.currency === g.currency || !e.fxRate ? e.amount : e.amount * (e.fxRate || 1);
			b[e.paidBy] = (b[e.paidBy] || 0) + total;
				const sumW = e.split.shares.reduce((acc, s) => acc + s.weight, 0) || 1;
			for (const s of e.split.shares) b[s.memberId] = (b[s.memberId] || 0) - round2((total * s.weight) / sumW);
			}
		}
		const suggestions = minimizeTransfers(b).map((s) => ({ ...s, currency: g.currency }));
		res.json(suggestions);
	} catch (e) {
		next(e);
	}
});

r.post("/settlements", (req, res, next) => {
	try {
		const body = settlementCreateSchema.parse(req.body);
		const g = assertGroupExists(body.groupId);
		const id = `set_${Date.now().toString(36)}`;
		const s: Settlement = { id, ...body, createdAt: new Date().toISOString(), paid: true };
		store.settlements[g.id] = store.settlements[g.id] || [];
		store.settlements[g.id]!.push(s);
		res.status(201).json(s);
		} catch (e: any) {
			if (e instanceof z.ZodError) return res.status(400).json({ error: e.flatten() });
		next(e);
	}
});

// Upload receipt (base64 or URL)
r.post("/upload", (req, res) => {
	try {
		const { base64, filename } = req.body;
		if (!base64 && !req.body.url) return res.status(400).json({ error: "base64 or url required" });
		
		if (base64) {
			// In production, upload to S3/CDN. For now, return a mock URL
			const id = `receipt_${Date.now().toString(36)}`;
			const url = `https://storage.example.com/receipts/${id}_${filename || 'receipt.jpg'}`;
			res.json({ url });
		} else {
			res.json({ url: req.body.url });
		}
	} catch (e) {
		res.status(500).json({ error: "Upload failed" });
	}
});

// Get exchange rates
r.get("/exchange-rates", async (req, res) => {
	try {
		const { base = "USD" } = req.query;
		// Mock rates - in production, use real API like exchangerate-api.com
		const rates: Record<string, Record<string, number>> = {
			USD: { VND: 24000, AUD: 1.5, USD: 1 },
			VND: { USD: 1/24000, AUD: 1.5/24000, VND: 1 },
			AUD: { USD: 1/1.5, VND: 24000/1.5, AUD: 1 }
		};
		res.json({ base, rates: rates[base as string] || rates.USD, date: new Date().toISOString() });
	} catch (e) {
		res.status(500).json({ error: "Failed to fetch rates" });
	}
});

// Sync endpoint for offline-first
r.post("/sync", (req, res, next) => {
	try {
		const { groups, expenses, settlements, lastSyncedAt } = req.body;
		const now = new Date().toISOString();
		
		// Merge incoming data
		if (groups) {
			groups.forEach((g: Group) => {
				if (!store.groups[g.id] || (g.lastSyncedAt && g.lastSyncedAt > (store.groups[g.id]?.lastSyncedAt || ''))) {
					store.groups[g.id] = { ...g, lastSyncedAt: now };
					if (g.inviteCode) store.inviteCodes[g.inviteCode] = g.id;
				}
			});
		}
		
		if (expenses) {
			Object.entries(expenses).forEach(([groupId, exps]) => {
				if (!store.expenses[groupId]) store.expenses[groupId] = [];
				(exps as Expense[]).forEach((e: Expense) => {
					const idx = store.expenses[groupId]!.findIndex(x => x.id === e.id);
					if (idx === -1) store.expenses[groupId]!.push(e);
					else store.expenses[groupId]![idx] = e;
				});
			});
		}
		
		if (settlements) {
			Object.entries(settlements).forEach(([groupId, sets]) => {
				if (!store.settlements[groupId]) store.settlements[groupId] = [];
				(sets as Settlement[]).forEach((s: Settlement) => {
					const idx = store.settlements[groupId]!.findIndex(x => x.id === s.id);
					if (idx === -1) store.settlements[groupId]!.push(s);
					else store.settlements[groupId]![idx] = s;
				});
			});
		}
		
		// Return updates since lastSyncedAt
		const updatedGroups = Object.values(store.groups).filter(g => 
			!lastSyncedAt || (g.lastSyncedAt && g.lastSyncedAt > lastSyncedAt)
		);
		
		res.json({
			groups: updatedGroups,
			expenses: store.expenses,
			settlements: store.settlements,
			lastSyncedAt: now
		});
	} catch (e) {
		next(e);
	}
});

// Export group summary as PDF
r.get("/groups/:id/export", async (req, res, next) => {
	try {
		const g = assertGroupExists(req.params.id);
		const expenses = store.expenses[g.id] ?? [];
		const balances: Record<string, number> = Object.fromEntries(g.members.map((m) => [m.id, 0]));
		for (const e of expenses) {
			const total = e.currency === g.currency || !e.fxRate ? e.amount : e.amount * (e.fxRate || 1);
			balances[e.paidBy] = (balances[e.paidBy] || 0) + total;
			const sumW = e.split.shares.reduce((acc, s) => acc + s.weight, 0) || 1;
			for (const s of e.split.shares)
				balances[s.memberId] = (balances[s.memberId] || 0) - round2((total * s.weight) / sumW);
		}
		const buf = await generateGroupPdf(g, expenses, balances);
		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `attachment; filename=group-${g.id}.pdf`);
		res.send(buf);
	} catch (e) {
		next(e);
	}
});

// 404 for unknown API routes
r.use((req, res) => {
	res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
});

// Error translator
r.use(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	(err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
		if (err && typeof err.status === "number") return res.status(err.status).json({ error: err.message });
		console.error("Route error:", err);
		res.status(500).json({ error: "Internal server error" });
	}
);

export default r;
