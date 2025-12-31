import { analytics } from '@/lib/analytics'

/**
 * Logger utility that only logs in development
 * In production, errors are sent to analytics instead
 */

const isDev = import.meta.env.DEV

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args)
    }
  },
  
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args)
    }
  },
  
  error: (message: string, error?: unknown) => {
    if (isDev) {
      console.error(message, error)
    } else {
      // In production, log to analytics
      const errorMessage = error instanceof Error ? error.message : String(error)
      analytics.error(`${message}: ${errorMessage}`)
    }
  },
  
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(...args)
    }
  },
}

