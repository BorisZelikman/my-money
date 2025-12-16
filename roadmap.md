# Migration Roadmap: My Money App to Vite + TypeScript + CI/CD

## Overview
This roadmap outlines the migration from Create React App (CRA) to a modern Vite + TypeScript stack with CI/CD pipeline, ensuring data portability and modern best practices.

The roadmap is divided into **short MVPs** (Minimum Viable Products) to allow early testing and validation at each stage.

**Branch**: `feature/vite-typescript-migration`

---

# MVP 1: Foundation & Basic App Running ✅ COMPLETED
**Goal**: Get the existing app running on Vite with minimal changes

## 1.1 Repository & Version Control
- [x] Create new branch: `feature/vite-typescript-migration`
- [x] Set up `.gitignore` for Vite (update existing if needed)
- [x] Document current Firebase configuration structure (via .env.example)
- [ ] Create backup of current working application
- [ ] Set up branch protection rules (optional)
- [ ] Create PR template for migration work

## 1.2 Vite Project Initialization
- [x] Initialize new Vite project with React template
- [x] Configure Vite with React plugin
- [x] Set up base project structure (src/, public/, etc.)
- [x] Configure path aliases (@/ for src/)
- [x] Set up environment variables (.env files)
- [x] Configure Vite build options (output, assets, etc.)

## 1.3 Dependency Migration (Core)
- [x] Migrate React and React DOM
- [x] Install React Router v6
- [x] Install Material-UI (MUI) v5
- [x] Install Firebase SDK
- [x] Install MobX and mobx-react
- [x] Install Chart.js
- [x] Install remaining dependencies (date-fns, framer-motion, flag-icons, js-cookie)
- [x] Remove react-scripts dependency

## 1.4 Copy Existing Code (JS)
- [x] Copy all source files from current project
- [x] Update `index.html` for Vite (move to root, add script module)
- [x] Update import paths if needed
- [x] Fix any immediate breaking changes (renamed .js to .jsx)
- [x] Configure Firebase with environment variables

### 🧪 MVP 1 Testing Checklist
- [x] App starts with `npm run dev`
- [x] No console errors on startup (only Firebase config warning when not configured)
- [x] Login page renders correctly
- [ ] Firebase connection works (requires .env.local configuration)
- [ ] User can log in successfully (requires .env.local configuration)
- [ ] User can view their existing data (requires .env.local configuration)
- [x] Navigation between pages works
- [x] All MUI components render correctly
- [ ] Charts display properly (requires Firebase data)
- [x] Build completes without errors (`npm run build`)
- [x] Preview build works (`npm run preview`)

---

# MVP 2: CI/CD Pipeline & Remote Deployment
**Goal**: Set up automated deployment to test from remote early

## 2.1 Choose Hosting Platform
- [x] Evaluate options (Vercel/Netlify/Firebase Hosting/GitHub Pages)
- [x] Create account and project on chosen platform → **Firebase Hosting**
- [ ] Configure custom domain (optional)

## 2.2 GitHub Actions - CI
- [x] Create `.github/workflows/ci.yml`
- [x] Set up job for linting (basic ESLint)
- [x] Set up job for build verification
- [x] Configure caching for dependencies
- [x] Configure to run on PR and push to feature branch

## 2.3 GitHub Actions - CD (Staging)
- [x] Create `.github/workflows/deploy-staging.yml`
- [x] Configure staging deployment to Firebase Hosting
- [ ] Set up GitHub Secrets for Firebase config ⚠️ **USER ACTION REQUIRED**
- [ ] Set up deployment platform secrets (FIREBASE_SERVICE_ACCOUNT) ⚠️ **USER ACTION REQUIRED**
- [x] Configure deployment triggers (on push to feature branch)

## 2.4 Environment Management
- [x] Create `.env.example` template (already done)
- [ ] Set up GitHub Secrets for all VITE_* variables ⚠️ **USER ACTION REQUIRED**
- [x] Document environment setup in README
- [ ] Test environment variables in deployed build

### 🧪 MVP 2 Testing Checklist
- [ ] CI pipeline runs on push to branch
- [ ] Build job passes
- [ ] Staging deployment triggers correctly
- [ ] Staging site is accessible via URL: `https://my-money-v2-staging.web.app`
- [ ] Staging site loads without errors
- [ ] Firebase connection works on staging (with secrets configured)
- [ ] User can log in on staging site
- [ ] User can view their existing data on staging
- [ ] Environment variables load correctly

---

# MVP 3: TypeScript Foundation
**Goal**: Add TypeScript support and migrate core files

## 3.1 TypeScript Configuration
- [ ] Install TypeScript and type definitions (@types/react, @types/node, etc.)
- [ ] Create `tsconfig.json` with strict mode
- [ ] Configure path mapping in tsconfig
- [ ] Add type checking to build process
- [ ] Update CI to include type checking

## 3.2 Type Definitions
- [ ] Create `src/types/index.ts` with core interfaces
- [ ] Define User interface
- [ ] Define Asset interface
- [ ] Define Operation interface
- [ ] Define Category interface
- [ ] Define Currency interface
- [ ] Define Firebase config types

## 3.3 Core Files Migration
- [ ] Convert `src/config/firebase.js` → `firebase.ts`
- [ ] Convert `src/Stores/AuthStore.js` → `AuthStore.ts`
- [ ] Convert `src/index.jsx` → `index.tsx`
- [ ] Convert `src/App.jsx` → `App.tsx`

### 🧪 MVP 3 Testing Checklist
- [ ] TypeScript compilation succeeds
- [ ] No type errors in migrated files
- [ ] App starts with `npm run dev`
- [ ] Login/logout flow works
- [ ] Auth state persists (cookies/session)
- [ ] Firebase operations work correctly
- [ ] Build completes without errors
- [ ] CI pipeline passes with type checking
- [ ] Staging deployment works with TypeScript
- [ ] IDE shows proper type hints for migrated files

---

# MVP 4: Hooks Migration
**Goal**: Migrate all custom hooks to TypeScript

## 4.1 Data Hooks Migration
- [ ] Convert `useAssets.js` → `useAssets.ts`
- [ ] Convert `useOperations.js` → `useOperations.ts`
- [ ] Convert `useUsers.js` → `useUsers.ts`
- [ ] Convert `useUserPreference.js` → `useUserPreference.ts`
- [ ] Convert `useCurrencies.js` → `useCurrencies.ts`

## 4.2 Auth Hooks Migration
- [ ] Convert `useAuthorizationAndRegistration.js` → `useAuthorizationAndRegistration.ts`

## 4.3 Data Layer Types
- [ ] Type all Firebase Firestore document structures
- [ ] Add return types for all hook functions
- [ ] Type async function responses
- [ ] Add error handling types

### 🧪 MVP 4 Testing Checklist
- [ ] All hooks compile without errors
- [ ] CRUD operations for Assets work (create, read, update, delete)
- [ ] CRUD operations for Operations work
- [ ] User preferences save and load correctly
- [ ] Currency data loads correctly
- [ ] Registration creates new user correctly
- [ ] Data from existing users still accessible
- [ ] No runtime type errors in console
- [ ] Staging deployment works
- [ ] IDE provides autocomplete for hook return values

---

# MVP 5: Components Migration (Routes)
**Goal**: Migrate route components to TypeScript

## 5.1 Route Components
- [ ] Convert `routes/Authorization.jsx` → `Authorization.tsx`
- [ ] Convert `routes/Registration.jsx` → `Registration.tsx`
- [ ] Convert `routes/UserProfile.jsx` → `UserProfile.tsx`
- [ ] Convert `routes/Operations.jsx` → `Operations.tsx`

## 5.2 Route Types
- [ ] Type route parameters (useParams)
- [ ] Type navigation (useNavigate)
- [ ] Add prop interfaces where needed

### 🧪 MVP 5 Testing Checklist
- [ ] Authorization page works (login form, Google sign-in)
- [ ] Registration page works (form validation, user creation)
- [ ] User profile page displays correctly
- [ ] Operations page shows operations list
- [ ] URL parameters work correctly (:userId)
- [ ] Navigation between routes works
- [ ] Protected routes redirect properly
- [ ] Form validation displays errors correctly
- [ ] Staging deployment works

---

# MVP 6: Components Migration (Features)
**Goal**: Migrate all feature components to TypeScript

## 6.1 Item Components
- [ ] Convert `components/Items/Balance.jsx` → `Balance.tsx`
- [ ] Convert `components/Items/History.jsx` → `History.tsx`
- [ ] Convert `components/Items/Graph.jsx` → `Graph.tsx`
- [ ] Convert `components/Items/Categories.jsx` → `Categories.tsx`
- [ ] Convert `components/Items/CategoryEditor.jsx` → `CategoryEditor.tsx`
- [ ] Convert `components/Items/CurrencyConverter.jsx` → `CurrencyConverter.tsx`
- [ ] Convert `components/Items/CurrencySelector.jsx` → `CurrencySelector.tsx`
- [ ] Convert `components/Items/NavigationBar.jsx` → `NavigationBar.tsx`
- [ ] Convert `components/Items/OperationsTable.jsx` → `OperationsTable.tsx`
- [ ] Convert `components/Items/ShowObject.jsx` → `ShowObject.tsx`

## 6.2 Asset Components
- [ ] Convert `components/Items/Asset/Asset.jsx` → `Asset.tsx`
- [ ] Convert `components/Items/Asset/AddAsset.jsx` → `AddAsset.tsx`

## 6.3 Diagram Components
- [ ] Convert `components/Diagrams/BarChart.jsx` → `BarChart.tsx`
- [ ] Convert `components/Diagrams/PieChart.jsx` → `PieChart.tsx`

## 6.4 UI Components
- [ ] Convert `components/UI/AddButton.jsx` → `AddButton.tsx`
- [ ] Convert `components/UI/AssetSelect.jsx` → `AssetSelect.tsx`
- [ ] Convert `components/UI/InputFields.jsx` → `InputFields.tsx`
- [ ] Convert `components/UI/ToggleButtons.jsx` → `ToggleButtons.tsx`
- [ ] Convert `components/UI/TransferFields.jsx` → `TransferFields.tsx`

## 6.5 Other Components
- [ ] Convert `components/Error/ErrorDialog.jsx` → `ErrorDialog.tsx`
- [ ] Convert `components/Error/ErrorMesseges.jsx` → `ErrorMessages.tsx`
- [ ] Convert `components/Error/SuccessRegistrationDialog.jsx` → `SuccessRegistrationDialog.tsx`
- [ ] Convert `components/Logo/Logo.jsx` → `Logo.tsx`

### 🧪 MVP 6 Testing Checklist
- [ ] Balance page calculates and displays correctly
- [ ] History shows all operations with filters
- [ ] Graphs render with correct data
- [ ] Categories display and can be edited
- [ ] Currency converter works
- [ ] Currency selector changes currency
- [ ] Navigation bar shows all menu items
- [ ] Operations table displays data correctly
- [ ] Asset CRUD operations work
- [ ] Add Asset form works
- [ ] Charts (Bar, Pie) render correctly
- [ ] All UI components render properly
- [ ] Error dialogs display correctly
- [ ] Success messages appear when expected
- [ ] Logo displays correctly
- [ ] Responsive design works (mobile/desktop)
- [ ] Staging deployment works

---

# MVP 7: Code Quality & Testing Setup
**Goal**: Add linting, formatting, and testing infrastructure

## 7.1 Linting & Formatting
- [ ] Configure ESLint with TypeScript rules
- [ ] Set up Prettier configuration
- [ ] Add import sorting (eslint-plugin-import)
- [ ] Configure unused imports detection
- [ ] Add accessibility linting (eslint-plugin-jsx-a11y)
- [ ] Fix all linting errors

## 7.2 Pre-commit Hooks
- [ ] Install and configure Husky
- [ ] Set up lint-staged
- [ ] Add pre-commit hook for linting
- [ ] Add pre-commit hook for type checking

## 7.3 Testing Infrastructure
- [ ] Set up Vitest (Vite's test runner)
- [ ] Configure React Testing Library
- [ ] Configure test coverage reporting
- [ ] Add test scripts to package.json
- [ ] Create test utilities and mocks
- [ ] Add tests to CI pipeline

## 7.4 Initial Tests
- [ ] Add unit tests for utility functions
- [ ] Add tests for custom hooks
- [ ] Add component tests for critical UI
- [ ] Add integration tests for auth flow

### 🧪 MVP 7 Testing Checklist
- [ ] ESLint passes with no errors
- [ ] Prettier formats code correctly
- [ ] Pre-commit hooks run and block bad commits
- [ ] All existing tests pass (if any)
- [ ] New unit tests pass
- [ ] Test coverage report generates
- [ ] Type checking passes in CI
- [ ] Tests pass in CI pipeline
- [ ] No regression in app functionality

---

# MVP 8: Security & Performance
**Goal**: Harden security and optimize performance

## 8.1 Security Hardening
- [ ] Review and secure environment variables
- [ ] Audit Firebase security rules
- [ ] Add Content Security Policy (CSP) headers
- [ ] Configure HTTPS only
- [ ] Run npm audit and fix vulnerabilities
- [ ] Set up Dependabot for dependency updates

## 8.2 Performance Optimization
- [ ] Implement route-based code splitting (React.lazy)
- [ ] Analyze bundle size
- [ ] Optimize images and assets
- [ ] Configure proper caching headers
- [ ] Add loading states for lazy components

## 8.3 Monitoring Setup
- [ ] Set up error tracking (Sentry or similar)
- [ ] Configure performance monitoring
- [ ] Set up alerts for critical errors

### 🧪 MVP 8 Testing Checklist
- [ ] No security vulnerabilities in npm audit
- [ ] CSP headers present in responses
- [ ] HTTPS enforced
- [ ] Firebase security rules tested
- [ ] Bundle size is acceptable (< target MB)
- [ ] Lazy loading works (check network tab)
- [ ] Initial page load time acceptable
- [ ] Error tracking captures test errors
- [ ] No performance regressions

---

# MVP 9: Production Deployment & Documentation
**Goal**: Complete documentation and deploy to production

## 9.1 Production Deployment
- [ ] Create `.github/workflows/deploy-production.yml`
- [ ] Configure production environment variables
- [ ] Add deployment approval gates (optional)
- [ ] Configure deployment triggers (on push to main)
- [ ] Set up custom domain for production
- [ ] Update Firebase authorized domains

## 9.2 Documentation
- [ ] Update README.md with new setup instructions
- [ ] Document all environment variables
- [ ] Create CONTRIBUTING.md guide
- [ ] Document deployment process
- [ ] Add architecture documentation
- [ ] Create troubleshooting guide

## 9.3 Data Portability Documentation
- [ ] Document Firebase project configuration
- [ ] Document CORS settings for cross-domain access
- [ ] Create data backup/restore guide
- [ ] Document how users access data from new domain

## 9.4 Migration Completion
- [ ] Merge feature branch to main
- [ ] Tag release version (v2.0.0)
- [ ] Deploy to production
- [ ] Verify production deployment
- [ ] Monitor for issues

### 🧪 MVP 9 Testing Checklist
- [ ] README is clear and complete
- [ ] New developer can set up project using docs
- [ ] All environment variables documented
- [ ] Deployment docs are accurate
- [ ] Production deployment successful
- [ ] All user data accessible from new domain
- [ ] Firebase authentication works on new domain
- [ ] No data loss during migration
- [ ] Old app can be decommissioned (or kept as fallback)

---

# MVP 10: Post-Launch & Polish
**Goal**: Monitor, fix issues, and improve

## 10.1 Post-Launch Monitoring
- [ ] Monitor error logs for 1 week
- [ ] Monitor performance metrics
- [ ] Gather user feedback
- [ ] Track any data access issues

## 10.2 Bug Fixes & Improvements
- [ ] Fix critical bugs (if any)
- [ ] Address user feedback
- [ ] Optimize based on real usage data
- [ ] Update dependencies if needed

## 10.3 Future Improvements (Optional)
- [ ] Add PWA support (service worker)
- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Implement data export feature for users
- [ ] Add offline support
- [ ] Consider Zustand/Jotai as MobX alternative

### 🧪 MVP 10 Testing Checklist
- [ ] Error rate is acceptable (< X% of requests)
- [ ] No critical bugs reported
- [ ] User feedback is positive
- [ ] Performance metrics meet targets
- [ ] All planned features working
- [ ] Documentation is up to date

---

## Quick Reference: MVP Summary

| MVP | Goal | Duration Est. | Key Deliverable |
|-----|------|---------------|-----------------|
| MVP 1 ✅ | Foundation | 3-5 days | App runs on Vite |
| **MVP 2** | **CI/CD Pipeline** | **2-3 days** | **Remote deployment** |
| MVP 3 | TypeScript Foundation | 2-3 days | Core files in TS |
| MVP 4 | Hooks Migration | 2-3 days | All hooks in TS |
| MVP 5 | Route Components | 2-3 days | Routes in TS |
| MVP 6 | Feature Components | 4-5 days | All components in TS |
| MVP 7 | Code Quality | 2-3 days | Linting + Tests |
| MVP 8 | Security & Performance | 2-3 days | Production-ready |
| MVP 9 | Production & Docs | 2-3 days | Complete docs + prod deploy |
| MVP 10 | Post-Launch | 1 week | Stable production |

**Total Estimated Time**: 4-6 weeks

---

## Data Portability Notes

Since the app uses **Firebase** for backend:
- ✅ User data is stored in Firebase Firestore (cloud)
- ✅ Authentication via Firebase Auth works across domains
- ✅ Same Firebase project can be used with new domain
- ✅ No data migration needed - just configure new app to use same Firebase project
- ⚠️ Update Firebase authorized domains in Firebase Console
- ⚠️ Update CORS settings if using Firebase Storage

**Users will automatically have access to their data** on the new domain once they log in with the same credentials.

---

## Rollback Plan

If critical issues arise:
1. Keep old CRA version deployed and accessible (master branch)
2. Point DNS back to old deployment
3. Communicate with users about rollback
4. Fix issues in new version
5. Re-deploy when ready

---

## Notes
- Each MVP is independently testable
- Don't proceed to next MVP until current MVP tests pass
- CI/CD moved early to enable remote testing from MVP 2
- Adjust timeline based on actual progress
- Consider feature freeze on old app during migration
- Regular code reviews recommended at each MVP completion
