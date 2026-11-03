
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  writeBatch,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'

import { auth, db } from '../lib/firebase'

export type NotificationType =
  | 'prescription'
  | 'medical_record'
  | 'appointment'
  | 'document'
  | 'general'

export interface HealPNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  route?: string
  isRead: boolean
  createdAt: Timestamp | null
}

export interface CreateNotificationInput {
  title: string
  message: string
  type: NotificationType
  route?: string
}

const getNotificationsCollection = () => {
  const user = auth.currentUser

  if (!user) {
    throw new Error('You must be logged in to access notifications.')
  }

  return collection(db, 'patients', user.uid, 'notifications')
}

export const createNotification = async (
  notification: CreateNotificationInput,
): Promise<void> => {
  await addDoc(getNotificationsCollection(), {
    title: notification.title,
    message: notification.message,
    type: notification.type,
    ...(notification.route ? { route: notification.route } : {}),
    isRead: false,
    createdAt: serverTimestamp(),
  })
}

export const subscribeToNotifications = (
  callback: (notifications: HealPNotification[]) => void,
  onError?: (error: Error) => void,
) => {
  const notificationsQuery = query(
    getNotificationsCollection(),
    orderBy('createdAt', 'desc'),
    limit(30),
  )

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications: HealPNotification[] = snapshot.docs.map(
        (notificationDoc) => {
          const data = notificationDoc.data()

          return {
            id: notificationDoc.id,
            title: data.title ?? '',
            message: data.message ?? '',
            type: data.type ?? 'general',
            route: data.route,
            isRead: data.isRead ?? false,
            createdAt: data.createdAt ?? null,
          }
        },
      )

      callback(notifications)
    },
    (error) => {
      console.error('Notification listener failed:', error)
      onError?.(error)
    },
  )
}

export const subscribeToUnreadNotificationCount = (
  callback: (count: number) => void,
  onError?: (error: Error) => void,
) => {
  const unreadQuery = query(
    getNotificationsCollection(),
    where('isRead', '==', false),
  )

  return onSnapshot(
    unreadQuery,
    (snapshot) => callback(snapshot.size),
    (error) => {
      console.error('Unread notification listener failed:', error)
      onError?.(error)
    },
  )
}

/**
 * Delete one notification when the patient clicks its tick.
 */
export const markNotificationAsRead = async (
  notificationId: string,
): Promise<void> => {
  const notificationsCollection = getNotificationsCollection()

  await deleteDoc(
    doc(notificationsCollection, notificationId),
  )
}

/**
 * Delete all notifications when the patient clicks Mark all as read.
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  const notificationsCollection = getNotificationsCollection()
  const snapshot = await getDocs(notificationsCollection)

  const batchSize = 450

  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const batch = writeBatch(db)

    snapshot.docs.slice(i, i + batchSize).forEach((notificationDoc) => {
      batch.delete(notificationDoc.ref)
    })

    await batch.commit()
  }
}
