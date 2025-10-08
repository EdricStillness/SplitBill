# Split Bill & Tracking - Implementation Guide

##  Overview

A complete expense tracking and bill splitting application built with React Native (Expo) and Node.js/Express. Features offline-first architecture, multi-currency support, automatic debt minimization, and beautiful Lottie animations.

##  Completed Features

### US1: Group Management ✓
-  Create groups with name, currency, and members
-  Add members with name and optional phone
- Generate unique invite codes
- Share invite links via native share
- Join groups using invite codes
- **Files**: `apps/mobile/app/groups/create.tsx`, `apps/api/src/routes.ts`

### US2: Expense Tracking ✓
-  Add expenses with all required fields:
  - Title, amount, currency
  - Category (food, transport, stay, ticket, other)
  - Paid by (member selection)
  - Split among (multiple member selection)
  - Date (auto-set to current)
  - Note (optional)
  - Receipt upload (image picker with base64)
-  Support for equal, ratio, and custom split modes
-  Amount validation (must be > 0)
-  Currency-specific handling
- **Files**: `apps/mobile/app/groups/add.tsx`

### US3: Debt Calculation ✓
-  Automatic balance calculation per member
- Minimize transfers algorithm (greedy approach)
- Visual settlement suggestions
- Member → Member payment flow display
- **Files**: `apps/api/src/utils.ts`, `apps/mobile/app/groups/settle.tsx`

### US4: Settlement Tracking ✓
- View current balances (positive/negative)
- Suggested minimized settlements
- Mark individual payments as paid
- Mark all settlements at once
- Settlement status tracking
- Success animations on completion
- **Files**: `apps/mobile/app/groups/settle.tsx`

### US5: Multi-Currency Support ✓
- Support for VND, AUD, USD
- Exchange rate API endpoint
- Automatic rate fetching when currency differs
- FX rate storage with each expense
- Conversion to group base currency
- **Files**: `apps/api/src/routes.ts` (exchange-rates endpoint)

### US6: Export Capabilities ✓
- PDF export with group summary
- Expense list with details
- Member balances
- Native share/download functionality
- **Files**: `apps/api/src/pdf.ts`, `apps/mobile/app/groups/[id].tsx`

### US7: Offline-First Architecture ✓
- AsyncStorage for local data persistence
- Groups, expenses, settlements stored locally
- Automatic background sync every 30 seconds
- Sync on app foreground
- Graceful offline operation
- Pending sync tracking
- Conflict-free merge strategy
- **Files**: `apps/mobile/services/storage.ts`, `apps/mobile/services/api.ts`, `apps/mobile/hooks/use-sync.ts`

### US8: Lottie Animations ✓
- Loading animation (all loading states)
- Success animation (create group, add expense, settlements)
- Empty state animations
- Smooth transitions
- **Files**: All screen components with Lottie integration

## Architecture

### Backend (Node.js + Express)

**Location**: `apps/api/src/`

**Key Components**:
- `index.ts` - Express server setup with CORS, error handling
- `routes.ts` - RESTful API endpoints
- `types.ts` - TypeScript interfaces for all entities
- `utils.ts` - Business logic (minimize transfers, rounding)
- `pdf.ts` - PDF generation using @react-pdf/renderer

**Data Storage**:
- In-memory store (easy to replace with database)
- Structure: `{ groups, expenses, settlements, inviteCodes }`

**API Endpoints**:
```
POST   /api/groups                    - Create group
GET    /api/groups                    - List all groups
GET    /api/groups/:id                - Get group details
POST   /api/groups/:id/invite         - Generate invite code
POST   /api/groups/join/:code         - Join with invite code

POST   /api/expenses                  - Create expense
GET    /api/groups/:id/expenses       - List group expenses

GET    /api/groups/:id/balance        - Get member balances
POST   /api/groups/:id/settlements/suggest - Get minimized settlements

POST   /api/settlements               - Record settlement

POST   /api/upload                    - Upload receipt (base64)
GET    /api/exchange-rates            - Get exchange rates
POST   /api/sync                      - Sync offline data

GET    /api/groups/:id/export         - Export PDF
```

### Mobile App (React Native + Expo)

**Location**: `apps/mobile/`

**Key Screens**:
- `app/groups/index.tsx` - Groups list with pull-to-refresh
- `app/groups/create.tsx` - Create new group flow
- `app/groups/[id].tsx` - Group details with charts
- `app/groups/add.tsx` - Full expense creation form
- `app/groups/settle.tsx` - Settlement suggestions and tracking

**Services**:
- `services/storage.ts` - AsyncStorage wrapper with offline persistence
- `services/api.ts` - API client with offline fallbacks and sync

**Hooks**:
- `hooks/use-sync.ts` - Background sync on timer and app state

**Components**:
- `components/Button.tsx` - Themed button with variants
- `components/Input.tsx` - Themed input with validation
- `components/EmptyState.tsx` - Empty state with Lottie
- `components/Lottie.tsx` - Cross-platform Lottie wrapper

## Data Flow

### Creating an Expense (Offline-First)
1. User fills form → validates locally
2. Generate local ID → save to AsyncStorage
3. Mark pending sync
4. Try API call (fails silently if offline)
5. Background sync picks up on next connection
6. Server merge with conflict resolution

### Settlement Flow
1. Fetch expenses for group
2. Calculate net balances (positive = owed, negative = owes)
3. Run minimize transfers algorithm
4. Display suggested payments (minimized)
5. User marks payments as done
6. Create settlement records
7. Sync to server

### Sync Strategy
- **Push**: Send local changes to server
- **Pull**: Fetch server updates since last sync
- **Merge**: Last-write-wins with timestamp comparison
- **Graceful**: Never blocks UI, fails silently

##  UI/UX Highlights

### Design Principles
- **Native feel**: Platform-specific components
- **Themed**: Light/dark mode support
- **Responsive**: Works on all screen sizes
- **Accessible**: Clear labels, good contrast

### Animations
- Loading states prevent perceived lag
- Success animations provide positive feedback
- Empty states guide user actions
- Smooth transitions between screens

### Color Coding
- **Green**: Positive balance (should receive)
- **Red**: Negative balance (should pay)
- **Blue**: Action items
- **Gray**: Neutral/settled

##  Getting Started

### Prerequisites
```bash
Node.js >= 18
npm or yarn
Expo CLI (for mobile)
```

### Setup & Run

**Backend**:
```bash
cd apps/api
npm install
npm run dev    # Runs on http://localhost:4000
```

**Mobile**:
```bash
cd apps/mobile
npm install
npm start      # Opens Expo dev tools

# Then press:
# - 'i' for iOS simulator
# - 'a' for Android emulator
# - Scan QR code with Expo Go app
```

### Environment Variables

Create `apps/mobile/.env`:
```
EXPO_PUBLIC_API_URL=http://localhost:4000/api
```

For production, use your deployed API URL.

## 📝 Testing

### Manual Testing Checklist

**Group Creation**:
- [ ] Create group with valid data
- [ ] Add multiple members
- [ ] Generate and share invite code
- [ ] Join group with invite code

**Expense Management**:
- [ ] Add expense with all fields
- [ ] Upload receipt image
- [ ] Select different currencies
- [ ] Auto-fetch exchange rate
- [ ] Split equally among members
- [ ] View expenses in group detail

**Settlement**:
- [ ] View calculated balances
- [ ] Check minimized suggestions
- [ ] Mark single payment as paid
- [ ] Mark all settlements at once
- [ ] Verify balances update

**Offline Mode**:
- [ ] Turn off network
- [ ] Create group (should work)
- [ ] Add expense (should work)
- [ ] Turn on network
- [ ] Verify sync happens automatically

**Export**:
- [ ] Export PDF from group
- [ ] Verify PDF contains correct data

### Backend Tests

```bash
cd apps/api
npm test
```

Existing test: `utils.minimizeTransfers.test.ts`

##  Security Considerations

**Current Implementation** (Development/Demo):
- In-memory storage (data lost on restart)
- No authentication
- No authorization checks
- Open CORS

**Production Recommendations**:
1. **Database**: Replace in-memory store with PostgreSQL/MongoDB
2. **Auth**: Add JWT authentication
3. **Authorization**: Verify user belongs to group
4. **CORS**: Restrict to specific origins
5. **Rate Limiting**: Prevent API abuse
6. **Input Sanitization**: Prevent XSS/injection
7. **File Upload**: Validate image types, size limits
8. **HTTPS**: Encrypt all traffic

##  Next Steps / Enhancements

### Nice to Have
- [ ] Profile pictures for members
- [ ] Receipt OCR (extract amount/date)
- [ ] Recurring expenses
- [ ] Budget limits per category
- [ ] Notifications for settlements
- [ ] Group chat/comments
- [ ] Multiple photos per expense
- [ ] Export as Excel/CSV
- [ ] Payment integrations (PayPal, Venmo)
- [ ] Analytics dashboard

### Technical Improvements
- [ ] Add comprehensive test coverage
- [ ] Implement proper database
- [ ] Add authentication system
- [ ] Deploy to production
- [ ] Set up CI/CD
- [ ] Add error monitoring (Sentry)
- [ ] Performance monitoring
- [ ] Add E2E tests (Detox)

## Key Acceptance Criteria Met

### US2 Acceptance Criteria
Amount > 0 validation
Currency validation
Split modes: equal, ratio, custom shares
Receipt image storage (base64/URL)
All required fields captured

### General Requirements
Offline-first architecture
Background sync
Multi-currency with FX rates
Minimize transfers algorithm
PDF export
Lottie animations
Clean, intuitive UI

## 🤝 Contributing

To extend this app:

1. **Add new expense category**: Update `CATEGORIES` array in `add.tsx` and `types.ts`
2. **Add new currency**: Update `currency` enum in `types.ts` and exchange rates in `routes.ts`
3. **Add new screen**: Create in `app/` directory, add to `_layout.tsx`
4. **Modify storage**: Update `services/storage.ts` and ensure sync compatibility

## 📄 License

This is a demonstration project for the SplitBill application.

---

**Built with  using React Native, Expo, Node.js, and TypeScript**

