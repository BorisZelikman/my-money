# GitHub Secrets Setup

## Quick Setup Guide

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

## Required Secrets

Copy and paste these values:

### Firebase Configuration

| Secret Name | Value |
|-------------|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyAER4YlW1J9DiTXEATr9aTnkQdK4TGFf68` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `my-money-1d617.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `my-money-1d617` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `my-money-1d617.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `989105357376` |
| `VITE_FIREBASE_APP_ID` | `1:989105357376:web:01df465df3875f857d55a5` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-2PX2F7JL3T` |

### Firebase Service Account (Required for Deployment)

| Secret Name | Value |
|-------------|-------|
| `FIREBASE_SERVICE_ACCOUNT` | *See instructions below* |

## How to get FIREBASE_SERVICE_ACCOUNT

1. Go to [Firebase Console](https://console.firebase.google.com/u/0/project/my-money-1d617/settings/serviceaccounts/adminsdk)
2. Click **Generate new private key**
3. Download the JSON file
4. **Copy the ENTIRE contents** of the JSON file
5. Create secret `FIREBASE_SERVICE_ACCOUNT` and paste the JSON

The JSON looks like this (but with your actual values):
```json
{
  "type": "service_account",
  "project_id": "my-money-1d617",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@my-money-1d617.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

## Optional Secrets

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VITE_CURRENCY_API_KEY` | Your API key | For currency converter (get from exchangerate-api.com) |

## After Adding Secrets

1. Push your code to trigger the CI/CD pipeline:
   ```bash
   git push origin feature/vite-typescript-migration
   ```

2. Go to **Actions** tab in GitHub to see the workflow run

3. After successful deployment, your app will be live at:
   **https://mymoneymeter.web.app**

## Don't Forget!

Add `mymoneymeter.web.app` to Firebase Auth authorized domains:
1. Go to [Firebase Console → Authentication → Settings](https://console.firebase.google.com/u/0/project/my-money-1d617/authentication/settings)
2. Click **Authorized domains**
3. Click **Add domain**
4. Enter: `mymoneymeter.web.app`

