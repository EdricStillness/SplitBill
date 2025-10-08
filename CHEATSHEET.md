# 📋 Split Bill - Quick Reference

## 🚀 Start App (Most Common)

```bash
# Terminal 1: Start Backend
cd apps/api && npm run dev

# Terminal 2: Start Mobile (use iOS or Android, NOT web)
cd apps/mobile && npx expo start
# Then press 'i' (iOS) or 'a' (Android)
```

## ⚠️ Important Notes

- ✅ **Use iOS or Android** - Full support
- ❌ **DON'T use web** - Has React 19 compatibility issues
- 🔄 **Auto-sync** - Works every 30 seconds when online
- 💾 **Offline-first** - All operations work without internet

## 🛠️ Common Commands

### Backend
```bash
cd apps/api
npm run dev          # Start dev server
npm run build        # Build TypeScript
npm test             # Run tests (6 tests)
npm start            # Run built version
```

### Mobile
```bash
cd apps/mobile
npm start            # Start Expo
npx expo start --clear   # Clear cache & start
npx expo start -c    # Same as above (shorthand)
```

### Clear Cache (When Things Break)
```bash
cd apps/mobile
rm -rf .expo node_modules/.cache
npx expo start --clear
```

### Kill Port (If Port 8081 in Use)
```bash
kill -9 $(lsof -t -i:8081)
```

## 📱 Mobile App Controls

When Expo Dev Tools open:
- Press `i` → iOS Simulator
- Press `a` → Android Emulator
- Press `r` → Reload app
- Press `m` → Menu
- Press `?` → Show all commands

## 🔗 API Endpoints

Base URL: `http://localhost:4000/api`

### Groups
- `POST /groups` - Create group
- `GET /groups/:id` - Get group
- `POST /groups/:id/invite` - Generate invite
- `POST /groups/join/:code` - Join group

### Expenses
- `POST /expenses` - Create expense
- `GET /groups/:id/expenses` - List expenses

### Settlements
- `GET /groups/:id/balance` - Get balances
- `POST /groups/:id/settlements/suggest` - Get suggestions
- `POST /settlements` - Record settlement

### Utilities
- `GET /exchange-rates?base=USD` - Get FX rates
- `POST /upload` - Upload receipt
- `POST /sync` - Sync offline data
- `GET /groups/:id/export` - Export PDF

## 💾 Data Storage

### Backend (In-Memory)
```
store = {
  groups: {},
  expenses: {},
  settlements: {},
  inviteCodes: {}
}
```
⚠️ Data is lost on server restart

### Mobile (AsyncStorage)
```
Keys:
- @splitbill:groups
- @splitbill:expenses
- @splitbill:settlements
- @splitbill:lastSync
- @splitbill:pendingSync
```
✅ Persists on device

## 🧪 Testing

```bash
# Backend tests
cd apps/api && npm test

# Expected output:
# ✓ zero balances -> no transfers
# ✓ simple one-to-one
# ✓ one debtor, two creditors
# ✓ two debtors, one creditor
# ✓ floating precision rounding
# ✓ already balanced after ignoring eps
# 
# Test Suites: 1 passed
# Tests: 6 passed
```

## 🐛 Quick Fixes

### React Hooks Error
```bash
cd apps/mobile
rm -rf .expo node_modules/.cache
npx expo start --clear
# Then use iOS/Android, NOT web
```

### API Not Connecting
```bash
# iOS Simulator - use localhost
EXPO_PUBLIC_API_URL=http://localhost:4000/api

# Android Emulator - use special IP
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api

# Physical Device - use computer's IP
EXPO_PUBLIC_API_URL=http://192.168.1.x:4000/api
```

### Port Already in Use
```bash
kill -9 $(lsof -t -i:8081)
# Or use different port:
npx expo start --port 8082
```

## 📂 File Structure

```
SplitBill/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── index.ts       # Express server
│   │   │   ├── routes.ts      # API endpoints
│   │   │   ├── types.ts       # TypeScript types
│   │   │   ├── utils.ts       # Minimize transfers
│   │   │   └── pdf.ts         # PDF generation
│   │   └── package.json
│   └── mobile/
│       ├── app/
│       │   ├── groups/
│       │   │   ├── index.tsx  # Groups list
│       │   │   ├── create.tsx # Create group
│       │   │   ├── [id].tsx   # Group details
│       │   │   ├── add.tsx    # Add expense
│       │   │   └── settle.tsx # Settle up
│       │   └── _layout.tsx
│       ├── services/
│       │   ├── storage.ts     # AsyncStorage
│       │   └── api.ts         # API client
│       └── components/
│           ├── Button.tsx
│           ├── Input.tsx
│           └── EmptyState.tsx
├── README.md
├── QUICKSTART.md
├── IMPLEMENTATION.md
├── TROUBLESHOOTING.md
└── CHEATSHEET.md (this file)
```

## 🎯 Feature Checklist

All 8 User Stories Completed:
- ✅ US1: Group management + invites
- ✅ US2: Complete expense form
- ✅ US3: Debt minimization algorithm
- ✅ US4: Settlement tracking
- ✅ US5: Multi-currency support
- ✅ US6: PDF export
- ✅ US7: Offline-first + sync
- ✅ US8: Lottie animations

## 🔐 Environment Variables

### Mobile (.env)
```bash
EXPO_PUBLIC_API_URL=http://localhost:4000/api
```

### Backend (.env)
```bash
PORT=4000
NODE_ENV=development
```

## 📊 Data Flow Example

1. **Create Expense (Offline)**
   - User submits → Save to AsyncStorage
   - Mark pending sync
   - Try API call (fails if offline)
   - Background sync picks it up later

2. **Settlement Calculation**
   - Fetch all expenses
   - Calculate net balances
   - Run minimize transfers algorithm
   - Display suggestions
   - Mark as paid → Create settlement record

## 🌟 Tips

1. **Always use native platforms** (iOS/Android)
2. **Clear cache** if things break
3. **Check terminal logs** for errors
4. **Test offline mode** by disabling WiFi
5. **Use pull-to-refresh** to manually sync

## 📞 Need Help?

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Check [IMPLEMENTATION.md](./IMPLEMENTATION.md)
3. Check [QUICKSTART.md](./QUICKSTART.md)

---

**Quick Start:** `cd apps/api && npm run dev` + `cd apps/mobile && npx expo start` → Press `i` 🚀

