import { create } from 'zustand'
import type { ToastType, ToastData } from '@/components/ui/Toast'

interface ToastStore {
  toasts: ToastData[]
  addToast: (type: ToastType, message: string, duration?: number) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

let toastId = 0

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  addToast: (type, message, duration = 4000) => {
    const id = `toast-${++toastId}`
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }],
    }))
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
  
  clearToasts: () => {
    set({ toasts: [] })
  },
}))

// Convenience functions for use throughout the app
export const toast = {
  success: (message: string, duration?: number) => 
    useToastStore.getState().addToast('success', message, duration),
  error: (message: string, duration?: number) => 
    useToastStore.getState().addToast('error', message, duration),
  warning: (message: string, duration?: number) => 
    useToastStore.getState().addToast('warning', message, duration),
  info: (message: string, duration?: number) => 
    useToastStore.getState().addToast('info', message, duration),
}

