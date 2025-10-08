# 🚀 Quick Start Guide

## 1. Start the Backend API

```bash
cd apps/api
npm install
npm run dev
```

The API will run on `http://localhost:4000`

✅ Health check: `http://localhost:4000/health`

## 2. Start the Mobile App

In a new terminal:

```bash
cd apps/mobile
npm install
npm start
```

This opens Expo Dev Tools. Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Or scan QR code with Expo Go app

## 3. Test the App

### Create Your First Group
1. Tap "Create Group" on the Groups screen
2. Enter group name (e.g., "Bali Trip")
3. Select currency (USD, AUD, or VND)
4. Add members:
   - Name: "Alice"
   - Name: "Bob"
   - etc.
5. Tap "Create Group"

### Add an Expense
1. Tap on your group
2. Tap "Add Expense"
3. Fill in:
   - Title: "Dinner at restaurant"
   - Amount: 150
   - Currency: USD
   - Category: food
   - Paid By: Select who paid
   - Split Among: Select who participated
   - (Optional) Add receipt photo
   - (Optional) Add note
4. Tap "Add Expense"

### View Balances & Settle Up
1. From group detail, tap "Settle Up"
2. View current balances (green = owed, red = owes)
3. See minimized settlement suggestions
4. Tap "Mark Paid" to record a payment
5. Or "Mark All as Settled" to settle everything

### Invite Members
1. From group detail, tap "Invite Members"
2. Share the invite code/link
3. New member enters code to join

### Export PDF
1. From group detail, tap "Export PDF"
2. Opens in browser/downloads
3. Contains full expense summary

## 4. Test Offline Mode

1. Turn OFF WiFi/Data on your device
2. Create a group → Still works! ✓
3. Add expenses → Still works! ✓
4. Turn WiFi/Data back ON
5. App automatically syncs in background ✓

## 🎯 Key Features to Try

### Multi-Currency
- Create group in USD
- Add expense in VND
- App auto-fetches exchange rate
- Converts to group currency

### Smart Debt Minimization
- Add multiple expenses with different payers
- Go to Settle Up
- See minimized payments (fewer transactions!)

### Beautiful Animations
- Loading states: Lottie spinner
- Success: Checkmark animation
- Empty states: Friendly messages

## 📱 App Structure

```
Groups Screen → Group Detail → Add Expense
                            → Settle Up
                            → Invite Members
                            → Export PDF
```

## 🔧 Troubleshooting

### API not connecting?
- Check `EXPO_PUBLIC_API_URL` in `apps/mobile/.env`
- For iOS Simulator: `http://localhost:4000/api`
- For Android Emulator: `http://10.0.2.2:4000/api`
- For physical device: Use your computer's IP

### Metro bundler issues?
```bash
cd apps/mobile
rm -rf node_modules
npm install
npm start --clear
```

### TypeScript errors in IDE?
- These are known issues with React Native + React 19 types
- App runs fine, just ignore IDE warnings
- Or use `// @ts-ignore` if needed

## 📊 Example Flow

**Scenario**: 3 friends on a trip

1. **Alice creates group** "Weekend Trip"
   - Currency: USD
   - Members: Alice, Bob, Charlie

2. **Add expenses**:
   - Hotel: $300 (paid by Alice, split 3 ways)
   - Dinner: $90 (paid by Bob, split 3 ways)
   - Taxi: $30 (paid by Charlie, split 3 ways)

3. **Settle Up shows**:
   - Alice: +$200 (paid $300, owes $100)
   - Bob: +$30 (paid $90, owes $60)
   - Charlie: -$170 (paid $30, owes $200)
   
   **Minimized**:
   - Charlie pays Alice $170
   - Done! (instead of 6 transactions)

4. **Mark as settled** → All balances = $0 ✓

## 🎨 Customization

### Add New Currency
1. Edit `apps/api/src/types.ts` → Add to Currency enum
2. Edit `apps/api/src/routes.ts` → Add exchange rates
3. Update mobile screens

### Add New Category
1. Edit `apps/mobile/app/groups/add.tsx` → Update CATEGORIES
2. Edit `apps/api/src/routes.ts` → Update schema
3. Done!

### Change Colors/Theme
- Edit `apps/mobile/constants/theme.ts`
- Components auto-adapt to dark/light mode

## 📈 Next Steps

- Deploy API to cloud (Heroku, Railway, etc.)
- Add authentication (Firebase, Auth0)
- Set up database (PostgreSQL, MongoDB)
- Add push notifications
- Integrate payment providers

## 💡 Tips

- **Pull to refresh**: Swipe down on Groups screen
- **Tap group card**: Quick view details
- **Tap "+ Expense"**: Add without opening detail
- **Long press**: Future feature for bulk actions

---

Enjoy tracking and splitting expenses! 🎉

