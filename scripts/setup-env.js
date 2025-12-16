/**
 * Environment Setup Script
 * Run with: node scripts/setup-env.js
 * 
 * This script helps create .env.local file for Vite
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const envTemplate = `# Firebase Configuration
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# Currency Converter API (optional)
VITE_CURRENCY_API_KEY=
VITE_CURRENCY_API_BASE_URL=https://v6.exchangerate-api.com/v6/
VITE_CRYPTO_API_KEY=
VITE_CRYPTO_API_BASE_URL=https://rest.coinapi.io/v1/exchangerate
`;

const envPath = path.join(__dirname, '..', '.env.local');

// Check if file exists
if (fs.existsSync(envPath)) {
    console.log('.env.local already exists!');
    rl.question('Do you want to overwrite it? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
            createEnvFile();
        } else {
            console.log('Skipped.');
            rl.close();
        }
    });
} else {
    createEnvFile();
}

function createEnvFile() {
    fs.writeFileSync(envPath, envTemplate);
    console.log('\n✅ Created .env.local file!');
    console.log('\n📝 Please edit .env.local and add your Firebase configuration:');
    console.log('   - Go to Firebase Console > Project Settings > General');
    console.log('   - Copy your Firebase config values');
    console.log('   - Paste them into .env.local\n');
    rl.close();
}

