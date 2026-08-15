import { useEffect } from 'react'
import i18n from '@/i18n'
import { getUserPreferences } from '@/features/profile/services/userService'
import { useAuthStore } from '@/stores/authStore'
import { isAppLanguage } from '@/types'
import { logger } from '@/utils/logger'

export function LanguagePreferenceSync() {
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    void getUserPreferences(user.uid)
      .then((preferences) => {
        if (!cancelled && isAppLanguage(preferences?.language)) {
          return i18n.changeLanguage(preferences.language)
        }
      })
      .catch((error) => logger.error('Failed to load language preference', error))

    return () => {
      cancelled = true
    }
  }, [user])

  return null
}
