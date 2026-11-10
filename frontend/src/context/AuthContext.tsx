
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  onAuthStateChanged,
  type User,
} from 'firebase/auth'

import {
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore'

import { auth, db } from '../lib/firebase'

export type UserRole = 'patient' | 'doctor' | 'admin'
export type AccountStatus = 'active' | 'pending' | 'rejected' | 'suspended'

interface AuthContextType {
  user: User | null
  role: UserRole | null
  accountStatus: AccountStatus | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [accountStatus, setAccountStatus] =
    useState<AccountStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true)
      setUser(firebaseUser)
      setRole(null)
      setAccountStatus(null)

      if (!firebaseUser) {
        setLoading(false)
        return
      }

      try {
        const userRef = doc(db, 'users', firebaseUser.uid)
        const userSnapshot = await getDoc(userRef)

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data()
          const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
            .split(',')
            .map((e: string) => e.trim().toLowerCase())
            .filter(Boolean)

          const userEmail = (firebaseUser.email || userData.email || '').toLowerCase()
          const isDesignatedAdmin = Boolean(userEmail && adminEmails.includes(userEmail))

          const activeRole = (isDesignatedAdmin ? 'admin' : userData.role) as UserRole

          if (isDesignatedAdmin && userData.role !== 'admin') {
            void updateDoc(userRef, { role: 'admin', accountStatus: 'active' }).catch(console.error)
          }

          if (
            activeRole === 'patient' ||
            activeRole === 'doctor' ||
            activeRole === 'admin'
          ) {
            setRole(activeRole)

            const defaultStatus =
              activeRole === 'doctor' ? 'pending' : 'active'
            const status = isDesignatedAdmin ? 'active' : (userData.accountStatus ?? defaultStatus)

            if (
              status === 'active' ||
              status === 'pending' ||
              status === 'rejected' ||
              status === 'suspended'
            ) {
              setAccountStatus(status)
            }
          }
        }
      } catch (error) {
        console.error('Failed to retrieve user profile:', error)
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, role, accountStatus, loading }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside an AuthProvider',
    )
  }

  return context
}
