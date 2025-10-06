# Split Bill & Tracking (RN + Expo + Node/Express)

## Goal
- Group expense splitting, auto settle, export summaries.

## User stories
- [ ] US1: Create group, invite via link/code.
- [ ] US2: Add expense: title, amount, paidBy, splitAmong, category, date, note, receipt.
- [ ] US3: Auto debts graph (minimize transfers).
- [ ] US4: Mark "Settle up" -> update status.
- [ ] US5: Multi-currency with rate at expense time.
- [ ] US6: Export PDF/image summary.
- [ ] US7: Offline-first, sync on reconnect.
- [ ] US8: Lottie animations for loading/success/empty-state.

## Acceptance criteria (US2)
- Amount > 0, valid currency.
- Split by "equal", "ratio", or "custom shares".
- Store receipt image (base64/file).

## Scripts
- `npm run dev:api` – Start API on port 4000
- `npm run dev:mobile` – Start Expo dev server
- `npm run typecheck` – TypeScript project refs (if configured)

