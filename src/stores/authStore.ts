import { create } from 'zustand'
import type { User } from 'firebase/auth'
import type { AuthStore } from '@/types/auth'

const initialState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
}

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,

  setUser: (user: User | null) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      error: null,
    }),

  setLoading: (isLoading: boolean) =>
    set({ isLoading }),

  setError: (error: string | null) =>
    set({ error, isLoading: false }),

  reset: () =>
    set(initialState),
}))

