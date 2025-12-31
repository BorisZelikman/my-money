import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics'
import { getPerformance, type FirebasePerformance } from 'firebase/performance'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)

// Analytics - only in production and when supported
let analyticsInstance: ReturnType<typeof getAnalytics> | null = null
export const initAnalytics = async () => {
  if (import.meta.env.PROD && (await isAnalyticsSupported())) {
    analyticsInstance = getAnalytics(app)
    return analyticsInstance
  }
  return null
}

export const getAnalyticsInstance = () => analyticsInstance

// Performance monitoring - only in production
let perfInstance: FirebasePerformance | null = null
export const initPerformance = () => {
  if (import.meta.env.PROD) {
    try {
      perfInstance = getPerformance(app)
      return perfInstance
    } catch {
      // Performance monitoring not available
      return null
    }
  }
  return null
}

export const getPerformanceInstance = () => perfInstance
