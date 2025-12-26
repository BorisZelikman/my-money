# MyMoneyMeter - Development Roadmap

## Project Overview
MyMoneyMeter is a web application for managing complex family budgets with support for multiple subfamily accounts, shared expenses (mutuals), and multi-currency operations.

**Approach**: Build from scratch with small MVPs, each deployable and testable independently.

---

## Technology Decision: TypeScript vs JavaScript

### Recommendation: **TypeScript**

| Criteria | TypeScript | JavaScript |
|----------|-----------|------------|
| Type Safety | ✅ Compile-time errors | ❌ Runtime errors |
| IDE Support | ✅ Better autocomplete | ⚠️ Limited |
| Refactoring | ✅ Safe refactoring | ❌ Error-prone |
| Documentation | ✅ Types are docs | ❌ Requires JSDoc |
| Learning Curve | ⚠️ Slightly higher | ✅ Easier start |
| Firebase SDK | ✅ Full support | ✅ Full support |
| Bundle Size | ✅ Same (compiled to JS) | ✅ Same |

**Decision**: Use **TypeScript** for better maintainability and fewer runtime bugs.

---

## Modern Project Structure

```
my-money/
├── .github/
│   └── workflows/
│       ├── deploy-preview.yml    # PR preview deployments
│       └── deploy-prod.yml       # Production deployment
├── public/
│   ├── favicon.ico
│   ├── icons/                    # PWA icons
│   └── manifest.json
├── src/
│   ├── app/
│   │   ├── App.tsx              # Root component
│   │   ├── Router.tsx           # Route definitions
│   │   └── providers.tsx        # Context providers wrapper
│   ├── components/
│   │   ├── ui/                  # Reusable UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Dialog.tsx
│   │   │   └── index.ts
│   │   ├── layout/              # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── NavBar.tsx
│   │   │   └── PageContainer.tsx
│   │   └── shared/              # Shared business components
│   │       ├── AssetCard.tsx
│   │       ├── OperationRow.tsx
│   │       └── AmountDisplay.tsx
│   ├── features/                # Feature modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── index.ts
│   │   ├── accounts/
│   │   ├── assets/
│   │   ├── operations/
│   │   ├── mutuals/
│   │   └── profile/
│   ├── hooks/                   # Global hooks
│   │   ├── useAuth.ts
│   │   └── useMediaQuery.ts
│   ├── lib/                     # External service configs
│   │   └── firebase.ts
│   ├── stores/                  # Global state (Zustand)
│   │   ├── authStore.ts
│   │   └── userStore.ts
│   ├── types/                   # TypeScript types
│   │   ├── account.ts
│   │   ├── asset.ts
│   │   ├── operation.ts
│   │   ├── mutual.ts
│   │   └── user.ts
│   ├── utils/                   # Utility functions
│   │   ├── currency.ts
│   │   ├── date.ts
│   │   └── format.ts
│   ├── styles/
│   │   └── globals.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env.example
├── .gitignore
├── firebase.json
├── .firebaserc
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Data Structure Reference

### Firestore Collections

```typescript
// types/account.ts
interface Account {
  id: string;
  title: string;
  users: string[];
}

// types/asset.ts
interface Asset {
  id: string;
  accountId: string;
  title: string;
  currency: string;
  amount: number;
  comment: string;
}

// types/operation.ts
type OperationType = 'payment' | 'income' | 'transfer';

interface Operation {
  id: string;
  assetId: string;
  accountId: string;
  type: OperationType;
  userId: string;
  title: string;
  amount: number;
  category: string;
  comment: string;
  datetime: Timestamp;
  purposeId?: string;
  rate?: number;
  transferTo?: {
    assetId: string;
    operationId: string;
  };
}

// types/currency.ts
interface Currency {
  id: string;
  title: string;
  short: string;
  symbol: string;
}

// types/user.ts
interface UserPreferences {
  id: string;
  name: string;
  mainCurrency: string;
  accounts: { id: string; switched: boolean }[];
  assets: { id: string; hide: boolean; index: number }[];
  mutuals: string[];
  currentAccountId?: string;
  currentAssetId?: string;
  operationType: OperationType;
  viewMode: 'Accounts' | 'Assets';
  lastViewedPage: string;
}

// types/mutual.ts
interface Mutual {
  id: string;
  title: string;
}

interface Participant {
  id: string;
  accountId: string;
  rate: number;
}

interface Purpose {
  id: string;
  icon: string;
  title: string;
  isSettlement?: boolean;
}
```

---

## MVP Roadmap

---

### MVP 0: Infrastructure Setup ✅
> **Goal**: Empty app deploys automatically on every push
> **Deliverable**: Working CI/CD pipeline with preview deployments

- [x] **0.1** Create GitHub Repository
  - [x] Initialize new repository
  - [x] Add .gitignore for Node.js/Vite
  - [ ] Create develop and main branches
  - [ ] Set branch protection rules

- [x] **0.2** Create Vite + React + TypeScript Project
  - [x] `npm create vite@latest my-money -- --template react-ts`
  - [x] Install base dependencies
  - [x] Create minimal App.tsx with "Hello World"
  - [x] Verify local development works

- [x] **0.3** Firebase Project Setup
  - [ ] Create Firebase project in console
  - [ ] Enable Firestore Database
  - [ ] Enable Authentication (Email + Google)
  - [ ] Enable Hosting
  - [x] Download firebase config (template created)

- [x] **0.4** GitHub Actions - Production Deployment
  - [x] Create `.github/workflows/deploy-prod.yml`
  - [ ] Add Firebase service account secret
  - [ ] Deploy to Firebase Hosting on push to main
  - [ ] Verify automatic deployment works

- [x] **0.5** GitHub Actions - Preview Deployments
  - [x] Create `.github/workflows/deploy-preview.yml`
  - [ ] Deploy preview channel on PR
  - [ ] Comment preview URL on PR
  - [ ] Delete preview on PR close

**✅ MVP 0 Complete when**: Push to main auto-deploys, PRs get preview URLs

> **Status**: Code infrastructure ready. Firebase console setup and GitHub secrets required for deployment.

---

### MVP 1: Authentication ✅
> **Goal**: Users can sign in and see their name
> **Deliverable**: Login page with Google sign-in

- [x] **1.1** Firebase Configuration
  - [x] Create `src/lib/firebase.ts`
  - [x] Set up environment variables
  - [x] Export auth and db instances

- [x] **1.2** Auth Store
  - [x] Install Zustand
  - [x] Create `src/stores/authStore.ts`
  - [x] Store: user, isLoading, isAuthenticated

- [x] **1.3** Auth Hook
  - [x] Create `src/features/auth/hooks/useAuth.ts`
  - [x] Implement signInWithGoogle
  - [x] Implement signOut
  - [x] Listen to auth state changes

- [x] **1.4** Login Page
  - [x] Create `src/features/auth/components/LoginPage.tsx`
  - [x] Add Google sign-in button
  - [x] Show loading state
  - [x] Handle errors

- [x] **1.5** Protected Routes
  - [x] Create `src/app/Router.tsx`
  - [x] Add route guard for authenticated routes
  - [x] Redirect to login if not authenticated

- [x] **1.6** Welcome Screen
  - [x] Create simple welcome page
  - [x] Display "Welcome, {user.displayName}"
  - [x] Add sign out button

**✅ MVP 1 Complete when**: User can sign in with Google and see their name

> **Status**: ✅ Complete! Login page and authentication flow implemented.

---

### MVP 2: User Profile & Accounts Display ✅
> **Goal**: Show user's accounts from Firestore
> **Deliverable**: Profile page with accounts list

- [x] **2.1** Type Definitions
  - [x] Create `src/types/account.ts`
  - [x] Create `src/types/user.ts`
  - [x] Create `src/types/index.ts` barrel export

- [x] **2.2** User Service
  - [x] Create `src/features/profile/services/userService.ts`
  - [x] getUserPreferences(userId)
  - [x] createUserPreferences(userId, name)
  - [x] updateUserPreference(userId, field, value)

- [x] **2.3** Accounts Service
  - [x] Create `src/features/accounts/services/accountService.ts`
  - [x] getAccountsByIds(accountIds)
  - [x] getAccountById(accountId)

- [x] **2.4** User Profile Page
  - [x] Create `src/features/profile/components/ProfilePage.tsx`
  - [x] Load user preferences on mount
  - [x] Create user doc if not exists (first login)
  - [x] Display "Welcome, {name}"

- [x] **2.5** Accounts List Component
  - [x] Create `src/features/accounts/components/AccountsList.tsx`
  - [x] Display accounts as cards/list
  - [x] Show account title
  - [x] Show users in account (names)

**✅ MVP 2 Complete when**: User sees their accounts list after login

> **Status**: ✅ Complete! Profile page loads user data from Firestore and displays accounts.

---

### MVP 3: Assets Display ✅
> **Goal**: Show assets within accounts
> **Deliverable**: Expandable accounts with assets inside

- [x] **3.1** Types & Services
  - [x] Create `src/types/asset.ts`
  - [x] Create `src/features/assets/services/assetService.ts`
  - [x] getAssetsByAccountId(accountId)

- [x] **3.2** Currency Service
  - [x] Create `src/types/currency.ts`
  - [x] Create `src/utils/currency.ts`
  - [x] Format amount with currency symbol

- [x] **3.3** Accordion Account Component
  - [x] Create `src/features/accounts/components/AccountAccordion.tsx`
  - [x] Collapsed: title + total amount
  - [x] Expanded: list of assets

- [x] **3.4** Asset Card Component
  - [x] Create `src/features/assets/components/AssetCard.tsx`
  - [x] Display: title, amount, currency symbol
  - [x] Show comment if exists

- [x] **3.5** Assets Flat View
  - [x] Create `src/features/assets/components/AssetsList.tsx`
  - [x] Toggle between Accounts/Assets view
  - [x] Display flat list of all user's assets

**✅ MVP 3 Complete when**: User can see all their assets in accounts or flat list

> **Status**: ✅ Complete! Accounts are expandable with assets inside, and users can toggle between Accounts and Assets views.

---

### MVP 4: View Operations History ✅
> **Goal**: Display operations for selected asset
> **Deliverable**: Operations table for an asset

- [x] **4.1** Types & Services
  - [x] Create `src/types/operation.ts`
  - [x] Create `src/features/operations/services/operationService.ts`
  - [x] getOperationsByAssetId(accountId, assetId)

- [x] **4.2** Operations Table Component
  - [x] Create `src/features/operations/components/OperationsTable.tsx`
  - [x] Columns: Date, Title, Category, Amount
  - [x] Red for payments, green for income
  - [x] Sort by date descending

- [x] **4.3** Operations Page
  - [x] Create `src/features/operations/components/OperationsPage.tsx`
  - [x] Asset selector dropdown
  - [x] Load operations when asset selected
  - [x] Display table

- [x] **4.4** Navigation Bar
  - [x] Create `src/components/layout/NavBar.tsx`
  - [x] Links: Profile, Operations
  - [x] Show on all authenticated pages
  - [x] Highlight active page

**✅ MVP 4 Complete when**: User can select asset and see its operations history

> **Status**: ✅ Complete! Operations page with asset selector and history table.

---

### MVP 5: Add Operations ✅
> **Goal**: Add new payment/income operations
> **Deliverable**: Form to add operations that updates asset amount

- [x] **5.1** Operation Form Component
  - [x] Create `src/features/operations/components/OperationForm.tsx`
  - [x] Type toggle: Payment / Income
  - [x] Fields: Title, Amount, Category, Comment, Date
  - [x] Add button (disabled if invalid)

- [x] **5.2** Add Operation Service
  - [x] addOperation(accountId, assetId, operation)
  - [x] updateAssetAmount(accountId, assetId, delta)
  - [x] Use Firestore batch for atomic update

- [x] **5.3** Category Autocomplete
  - [x] Extract categories from existing operations
  - [x] Create autocomplete input
  - [x] Allow custom categories

- [x] **5.4** Integration
  - [x] Connect form to service
  - [x] Refresh operations table after add
  - [x] Show success feedback

**✅ MVP 5 Complete when**: User can add payment/income and see updated balance

> **Status**: ✅ Complete! Users can add payments and income with category autocomplete.

---

### MVP 6: Edit & Delete Operations ✅
> **Goal**: Modify or remove existing operations
> **Deliverable**: Edit/delete functionality for operations

- [x] **6.1** Operation Selection
  - [x] Make table rows selectable
  - [x] Load selected operation into form
  - [x] Switch form to "Edit mode"

- [x] **6.2** Update Operation
  - [x] updateOperation(accountId, assetId, operationId, data)
  - [x] Recalculate asset amount if amount changed
  - [x] Apply button in edit mode

- [x] **6.3** Delete Operation
  - [x] deleteOperation(accountId, assetId, operationId)
  - [x] Restore asset amount
  - [x] Confirmation dialog
  - [x] Delete button

- [x] **6.4** Cancel Editing
  - [x] Cancel button to exit edit mode
  - [x] Clear form and deselect row

**✅ MVP 6 Complete when**: User can edit and delete operations

> **Status**: ✅ Complete! Users can select, edit, and delete operations with confirmation dialog.

---

### MVP 7: Transfers
> **Goal**: Transfer money between assets
> **Deliverable**: Transfer operation with dual-side tracking

- [ ] **7.1** Transfer Form Mode
  - [ ] Add Transfer to type toggle
  - [ ] "To" asset selector
  - [ ] Exchange rate input (for different currencies)

- [ ] **7.2** Transfer Service
  - [ ] createTransfer(fromAsset, toAsset, amount, rate)
  - [ ] Create operation on source (negative)
  - [ ] Create operation on target (positive * rate)
  - [ ] Link operations via transferTo field

- [ ] **7.3** Display Transfers
  - [ ] Show transfers in table
  - [ ] Display linked asset name
  - [ ] Different styling for transfers

- [ ] **7.4** Currency Rate Helper
  - [ ] Auto-fetch rate for different currencies
  - [ ] Allow manual rate override
  - [ ] Show rate in display

**✅ MVP 7 Complete when**: User can transfer between assets with different currencies

---

### MVP 8: Date Filtering & Period Selection
> **Goal**: Filter operations by date range
> **Deliverable**: Date picker and filtered views

- [ ] **8.1** Date Range Picker
  - [ ] Create date range selector component
  - [ ] From/To date inputs
  - [ ] Quick filters: Today, Week, Month, Year

- [ ] **8.2** Filtered Operations Query
  - [ ] Filter operations by datetime range
  - [ ] Update table on filter change
  - [ ] Show filter summary

- [ ] **8.3** Operations Totals
  - [ ] Calculate total income for period
  - [ ] Calculate total expenses for period
  - [ ] Display summary above table

**✅ MVP 8 Complete when**: User can filter operations by date range

---

### MVP 9: Mutuals - Setup & Display
> **Goal**: Show mutual (shared) expenses
> **Deliverable**: Display operations marked as shared

- [ ] **9.1** Mutual Types & Service
  - [ ] Create `src/types/mutual.ts`
  - [ ] Create `src/features/mutuals/services/mutualService.ts`
  - [ ] getMutual(mutualId)
  - [ ] getParticipants(mutualId)
  - [ ] getPurposes(mutualId)

- [ ] **9.2** Purpose Selector
  - [ ] Add purpose dropdown to payment form
  - [ ] Show only when asset is in mutual
  - [ ] Allow "No purpose" (private expense)

- [ ] **9.3** Mutual Operations View
  - [ ] Create `src/features/mutuals/components/MutualOperations.tsx`
  - [ ] Load operations with purposeId from all mutual accounts
  - [ ] Group by purpose
  - [ ] Highlight mutual operations in table

**✅ MVP 9 Complete when**: User can mark expenses as shared and see mutual operations

---

### MVP 10: Mutuals - Settlement Calculation
> **Goal**: Calculate who owes whom
> **Deliverable**: Settlement summary and transfer creation

- [ ] **10.1** Settlement Calculator
  - [ ] Sum expenses per account per purpose
  - [ ] Calculate expected share by rate
  - [ ] Calculate difference (owes/owed)

- [ ] **10.2** Settlement Summary Component
  - [ ] Display totals per subfamily
  - [ ] Show expected vs actual payments
  - [ ] Display settlement amount needed

- [ ] **10.3** Create Settlement Transfer
  - [ ] Button to create settlement transfer
  - [ ] Use special isSettlement purpose
  - [ ] Create transfer between accounts

**✅ MVP 10 Complete when**: User can see settlement calculation and create settlement transfer

---

### MVP 11: Drag & Drop Reordering
> **Goal**: Customize order of accounts and assets
> **Deliverable**: Drag-to-reorder with persistence

- [ ] **11.1** Install DnD Library
  - [ ] Install @dnd-kit/core and @dnd-kit/sortable
  - [ ] Create reusable SortableList component

- [ ] **11.2** Accounts Reordering
  - [ ] Enable drag-drop on accounts list
  - [ ] Save order to user preferences
  - [ ] Visual feedback during drag

- [ ] **11.3** Assets Reordering
  - [ ] Enable drag-drop on assets list
  - [ ] Save order to user preferences
  - [ ] Visibility toggle per asset

**✅ MVP 11 Complete when**: User can reorder accounts and assets by dragging

---

### MVP 12: Mobile Optimization & PWA
> **Goal**: Full mobile support with installable app
> **Deliverable**: Responsive UI + PWA features

- [ ] **12.1** Responsive Layout
  - [ ] Mobile-first navigation (bottom nav)
  - [ ] Touch-friendly buttons and inputs
  - [ ] Optimize table for mobile (horizontal scroll or cards)

- [ ] **12.2** PWA Configuration
  - [ ] Configure manifest.json with icons
  - [ ] Add service worker for offline caching
  - [ ] iOS meta tags for full-screen mode

- [ ] **12.3** Mobile Testing
  - [ ] Test on iOS Safari
  - [ ] Test on Android Chrome
  - [ ] Test install flow on both platforms

**✅ MVP 12 Complete when**: App is installable and works well on mobile devices

---

### MVP 13: Polish & Production Ready
> **Goal**: Production-quality application
> **Deliverable**: Polished, secure, monitored application

- [ ] **13.1** Error Handling
  - [ ] Error boundaries for components
  - [ ] Toast notifications for errors
  - [ ] Graceful offline handling

- [ ] **13.2** Loading States
  - [ ] Skeleton loaders for lists
  - [ ] Button loading states
  - [ ] Page transition animations

- [ ] **13.3** Security Review
  - [ ] Review Firestore security rules
  - [ ] Ensure data isolation per user
  - [ ] Remove console.logs

- [ ] **13.4** Analytics & Monitoring
  - [ ] Add Firebase Analytics
  - [ ] Add error tracking
  - [ ] Performance monitoring

**✅ MVP 13 Complete when**: App is polished, secure, and monitored

---

## Appendix: Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "firebase": "^11.0.0",
    "zustand": "^5.0.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "date-fns": "^4.1.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "typescript": "~5.6.2",
    "vite": "^6.0.0",
    "firebase-tools": "^13.0.0"
  }
}
```

---

## Quick Start Commands

```bash
# Create project
npm create vite@latest my-money -- --template react-ts

# Install dependencies
npm install react-router-dom firebase zustand date-fns clsx
npm install -D firebase-tools

# Firebase setup
npx firebase login
npx firebase init

# Development
npm run dev

# Build & Deploy
npm run build
npx firebase deploy
```

---

*Last Updated: December 25, 2024*
