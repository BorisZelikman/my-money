# MyMoneyMeter 💰

A modern web application for managing complex family budgets with support for multiple subfamily accounts, shared expenses (mutuals), and multi-currency operations.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Zustand
- **Backend**: Firebase (Firestore, Auth, Hosting)
- **CI/CD**: GitHub Actions
- **Styling**: CSS Variables + Modern CSS

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Firebase CLI (`npm install -g firebase-tools`)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/my-money.git
   cd my-money
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   Edit `.env.local` with your Firebase project credentials.

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview  # Preview production build locally
```

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Firestore Database**
4. Enable **Authentication** (Email/Password + Google)
5. Enable **Hosting**

### 2. Get Firebase Config

1. In Firebase Console, go to Project Settings
2. Under "Your apps", click the web icon (</>)
3. Register your app and copy the config values
4. Add them to your `.env.local` file

### 3. Configure Firebase CLI

```bash
firebase login
firebase use --add  # Select your project
```

### 4. Deploy Manually

```bash
npm run build
firebase deploy --only hosting
```

## CI/CD Setup

### GitHub Secrets Required

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

| Secret Name | Description |
|-------------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON (from Firebase Console → Project Settings → Service Accounts) |
| `VITE_FIREBASE_API_KEY` | Your Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Your Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Your Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Your Firebase measurement ID |

### Deployment Workflows

- **Production**: Automatically deploys when pushing to `main` branch
- **Preview**: Creates preview deployment for each PR

## Project Structure

```
my-money/
├── .github/workflows/     # CI/CD workflows
├── public/                # Static assets
├── src/
│   ├── app/              # App root, router, providers
│   ├── components/       # Reusable components
│   │   ├── ui/          # UI primitives
│   │   ├── layout/      # Layout components
│   │   └── shared/      # Shared business components
│   ├── features/        # Feature modules
│   │   ├── auth/
│   │   ├── accounts/
│   │   ├── assets/
│   │   ├── operations/
│   │   ├── mutuals/
│   │   └── profile/
│   ├── hooks/           # Global hooks
│   ├── lib/             # External service configs
│   ├── stores/          # Global state (Zustand)
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── styles/          # Global styles
├── firebase.json        # Firebase hosting config
└── vite.config.ts       # Vite configuration
```

## Development Roadmap

See [docs/roadmap.md](docs/roadmap.md) for the complete development plan.

### Current MVP: 0 - Infrastructure ✅

- [x] Vite + React + TypeScript setup
- [x] GitHub Actions CI/CD
- [x] Firebase Hosting configuration
- [x] PWA manifest

### Next MVP: 1 - Authentication

- [ ] Firebase Auth integration
- [ ] Google sign-in
- [ ] Protected routes

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## License

MIT

---

Built with ❤️ using React + Vite + Firebase
