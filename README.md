# My Money

A personal finance management application built with React, Material-UI, and Firebase.

## 🚀 Version 2 Migration (In Progress)

This app is being migrated from Create React App to Vite + TypeScript.

| Version | Branch | Technology | Status |
|---------|--------|------------|--------|
| v1 (Current) | `master` | CRA + JavaScript | ✅ Production |
| v2 (New) | `feature/vite-typescript-migration` | Vite + TypeScript | 🚧 In Development |

**Users can continue using v1 while v2 is being developed. Both versions share the same Firebase backend, so all user data is accessible from both.**

## 📋 Prerequisites

- Node.js 18.x or 20.x
- npm 9+
- Firebase project (for backend)

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd my-money-1

# Switch to v2 branch (for new development)
git checkout feature/vite-typescript-migration

# Install dependencies
npm install

# Set up environment variables
node scripts/setup-env.js
# Then edit .env.local with your Firebase credentials

# Start development server
npm run dev
```

## ⚙️ Environment Variables

Create a `.env.local` file with the following variables:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_CURRENCY_API_KEY=your_currency_api_key (optional)
```

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start dev server (port 3000)

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
```

## 🚀 Deployment

The app uses GitHub Actions for CI/CD with Firebase Hosting.

| Environment | URL | Branch |
|-------------|-----|--------|
| Staging | `https://my-money-v2-staging.web.app` | `feature/vite-typescript-migration` |
| Production | `https://my-money-v2.web.app` | `main` |

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed setup instructions.

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── Diagrams/       # Chart components
│   ├── Error/          # Error dialogs
│   ├── Items/          # Feature components
│   ├── Logo/           # Logo component
│   └── UI/             # Reusable UI components
├── config/             # Firebase configuration
├── data/               # Static data and utilities
├── hooks/              # Custom React hooks
├── routes/             # Page components
└── Stores/             # MobX stores
```

## 🔥 Firebase Integration

The app uses Firebase for:
- **Authentication**: Email/Password and Google Sign-In
- **Firestore**: User data, assets, operations storage
- **Hosting**: Static file hosting

## 📱 Features

- 💰 Track multiple assets (accounts, wallets)
- 📊 Visualize spending with charts
- 💱 Currency conversion
- 📜 Operation history
- 🔐 Secure authentication
- 📱 Responsive design

## 🗺️ Roadmap

See [roadmap.md](roadmap.md) for the complete migration plan.

## 📄 License

This project is private.
