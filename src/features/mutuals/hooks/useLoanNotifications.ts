import { useEffect } from 'react'
import {
  collection,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from '@/stores/toastStore'
import { logger } from '@/utils/logger'

export function useLoanNotifications(userId?: string) {
  useEffect(() => {
    if (!userId) return

    const notificationsRef = collection(db, 'users', userId, 'notifications')
    const unsubscribe = onSnapshot(
      notificationsRef,
      async (snapshot) => {
        const unread = snapshot.docs.filter((notification) =>
          notification.data().type === 'loan-entry' &&
          notification.data().read !== true
        )
        if (unread.length === 0) return

        const batch = writeBatch(db)
        for (const notification of unread) {
          const data = notification.data()
          toast.info(data.message || 'A loan entry was recorded.')
          batch.update(notification.ref, { read: true })
        }

        try {
          await batch.commit()
        } catch (error) {
          logger.error('Failed to mark loan notifications as read:', error)
        }
      },
      (error) => logger.error('Failed to subscribe to loan notifications:', error)
    )

    return unsubscribe
  }, [userId])
}
