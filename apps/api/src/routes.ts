import express from "express";
import { z } from "zod";
import { Expense, Group, Member, Settlement, Stores } from "./types";
import { minimizeTransfers, round2 } from "./utils";
import { generateGroupPdf } from "./pdf";

const r = express.Router();

// In-memory store (replace with DB later)
const store: Stores = { groups: {}, expenses: {}, settlements: {} };

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
		const code = `INV-${g.id.slice(-4)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
		res.json({ code, link: `${req.protocol}://${req.get("host")}/join/${code}` });
	} catch (e) {
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

// TODO: implement proper upload; for now echo the provided URL
r.post("/upload", (req, res) => {
	const url = (req.body && (req.body.url as string)) || "";
	if (!url) return res.status(400).json({ error: "url required" });
	res.json({ url });
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
