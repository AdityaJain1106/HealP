
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
} from 'firebase/firestore'

import { auth, db } from '../lib/firebase'

export type UserRole = 'patient' | 'doctor'
export type AccountStatus = 'active' | 'pending'

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

          if (
            userData.role === 'patient' ||
            userData.role === 'doctor'
          ) {
            setRole(userData.role)

            // Existing patient accounts remain active.
            // Doctors without an approval status remain pending.
            const status =
              userData.accountStatus ??
              (userData.role === 'patient' ? 'active' : 'pending')

            if (status === 'active' || status === 'pending') {
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
