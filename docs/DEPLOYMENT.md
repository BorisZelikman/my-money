# Deployment Guide

This guide explains how to set up CI/CD for the My Money app using GitHub Actions and Firebase Hosting.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Firebase Project                          │
│  (Same project - users have access to their data everywhere)    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  Old Version    │    │  New Version    │                     │
│  │  (CRA)          │    │  (Vite + TS)    │                     │
│  │                 │    │                 │                     │
│  │  master branch  │    │  feature branch │                     │
│  │                 │    │                 │                     │
│  │  Current URL    │    │  Staging URL    │                     │
│  └─────────────────┘    └─────────────────┘                     │
│                                                                  │
│  Both versions connect to the same Firestore & Auth             │
│  Users can log in with same credentials on both                 │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. A Firebase project (you should already have one)
2. GitHub repository with the code
3. Firebase CLI installed locally (optional, for testing)

## Step 1: Create Firebase Hosting Sites

You need to create a new hosting site for the v2 staging environment.

### Option A: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Hosting** in the left sidebar
4. Click **Add another site**
5. Enter site name: `my-money-v2-staging`
6. Click **Add site**

The staging URL will be: `https://my-money-v2-staging.web.app`

### Option B: Using Firebase CLI

```bash
# Install Firebase CLI if not installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Add a new hosting site
firebase hosting:sites:create my-money-v2-staging
```

## Step 2: Generate Firebase Service Account Key

This is required for GitHub Actions to deploy to Firebase.

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the gear icon ⚙️ → **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Save the JSON file securely (you'll need its contents)

## Step 3: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add the following secrets:

### Firebase Configuration (Required)

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VITE_FIREBASE_API_KEY` | Your API key | From Firebase project settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | `your-project-id` | Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Your app ID | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-XXXXXXXXXX` | Google Analytics ID |

### Firebase Deployment (Required)

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | Contents of service account JSON | The entire JSON file content |

### Optional

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VITE_CURRENCY_API_KEY` | Your API key | For currency converter feature |

### How to add the service account:

1. Open the downloaded JSON file
2. Copy the **entire contents**
3. In GitHub, create secret `FIREBASE_SERVICE_ACCOUNT`
4. Paste the entire JSON as the value

## Step 4: Update Firebase Configuration

Edit `.firebaserc` in your project root and replace `YOUR_FIREBASE_PROJECT_ID` with your actual project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  },
  "targets": {
    "your-actual-project-id": {
      "hosting": {
        "staging": ["my-money-v2-staging"],
        "production": ["my-money-v2"]
      }
    }
  }
}
```

## Step 5: Update Firebase Authorized Domains

Add the new staging domain to Firebase Auth:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add: `my-money-v2-staging.web.app`
6. (Later) Add production domain: `my-money-v2.web.app`

## Step 6: Push and Deploy

```bash
# Commit your changes
git add .
git commit -m "Add CI/CD configuration"

# Push to trigger deployment
git push origin feature/vite-typescript-migration
```

The staging deployment will automatically trigger when you push to the `feature/vite-typescript-migration` branch.

## Deployment URLs

| Environment | Branch | URL | Trigger |
|-------------|--------|-----|---------|
| Staging | `feature/vite-typescript-migration` | `https://my-money-v2-staging.web.app` | Auto on push |
| Production | `main` | `https://my-money-v2.web.app` | Auto on push to main |
| Old Version | `master` | Your current URL | N/A |

## CI/CD Workflows

### CI (`.github/workflows/ci.yml`)
- Runs on every push and PR
- Tests with Node.js 18.x and 20.x
- Runs linter and builds the project
- Uploads build artifacts

### Staging Deploy (`.github/workflows/deploy-staging.yml`)
- Runs on push to `feature/vite-typescript-migration`
- Builds with production settings
- Deploys to Firebase staging channel

### Production Deploy (`.github/workflows/deploy-production.yml`)
- Runs on push to `main`
- Requires `production` environment approval (optional)
- Deploys to Firebase live channel

## Troubleshooting

### Build fails with "Firebase config undefined"
- Ensure all `VITE_FIREBASE_*` secrets are set in GitHub
- Check that secret names match exactly (case-sensitive)

### Deployment fails with "Permission denied"
- Regenerate the Firebase service account key
- Ensure the service account has "Firebase Hosting Admin" role
- Verify the entire JSON content is copied to the secret

### "Domain not authorized" error after login
- Add the new domain to Firebase Auth authorized domains
- Wait a few minutes for changes to propagate

### Users can't see their data on new site
- Verify Firebase project ID is the same as the old app
- Check Firestore security rules allow access from new domain
- Ensure user is logged in with the same credentials

## Manual Deployment (Optional)

If you need to deploy manually:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Build the project
npm run build

# Deploy to staging
firebase hosting:channel:deploy staging

# Deploy to production (be careful!)
firebase deploy --only hosting
```

