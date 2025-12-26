import { useEffect } from 'react'
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const { user, isLoading, isAuthenticated, error, setUser, setLoading, setError } =
    useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })

    return () => unsubscribe()
  }, [setUser])

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      setError(null)
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in'
      setError(message)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await firebaseSignOut(auth)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out'
      setError(message)
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    signInWithGoogle,
    signOut,
  }
}

