
import dotenv from 'dotenv'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

dotenv.config()

const serviceAccountPath = resolve(
  process.cwd(),
  'firebase-service-account.json'
)

const serviceAccount = JSON.parse(
  readFileSync(serviceAccountPath, 'utf8')
)

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      })

export const adminAuth = getAuth(firebaseApp)
export const adminDb = getFirestore(firebaseApp)

console.log('Firebase Admin initialized successfully')
