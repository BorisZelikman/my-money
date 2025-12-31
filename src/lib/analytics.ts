import { logEvent as firebaseLogEvent, setUserId, setUserProperties } from 'firebase/analytics'
import { getAnalyticsInstance } from './firebase'

/**
 * Log a custom event to Firebase Analytics
 */
export function logEvent(eventName: string, params?: Record<string, unknown>) {
  const analytics = getAnalyticsInstance()
  if (analytics) {
    firebaseLogEvent(analytics, eventName, params)
  }
}

/**
 * Set the current user ID for analytics
 */
export function setAnalyticsUserId(userId: string | null) {
  const analytics = getAnalyticsInstance()
  if (analytics) {
    setUserId(analytics, userId)
  }
}

/**
 * Set user properties for analytics
 */
export function setAnalyticsUserProperties(properties: Record<string, string>) {
  const analytics = getAnalyticsInstance()
  if (analytics) {
    setUserProperties(analytics, properties)
  }
}

// Pre-defined event helpers
export const analytics = {
  // Auth events
  login: (method: string) => logEvent('login', { method }),
  logout: () => logEvent('logout'),
  
  // Operation events
  addOperation: (type: string, category?: string) => 
    logEvent('add_operation', { type, category }),
  editOperation: (type: string) => 
    logEvent('edit_operation', { type }),
  deleteOperation: (type: string) => 
    logEvent('delete_operation', { type }),
  
  // Navigation events
  pageView: (pageName: string) => 
    logEvent('page_view', { page_name: pageName }),
  
  // Feature usage
  useFilter: (filterType: string) => 
    logEvent('use_filter', { filter_type: filterType }),
  useDateRange: () => 
    logEvent('use_date_range'),
  viewMutuals: () => 
    logEvent('view_mutuals'),
  reorderAssets: () => 
    logEvent('reorder_assets'),
  
  // Errors
  error: (errorMessage: string, errorCode?: string) => 
    logEvent('app_error', { error_message: errorMessage, error_code: errorCode }),
}

