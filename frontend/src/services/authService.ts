
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
  type UserCredential,
} from 'firebase/auth'

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'

import { auth, db } from '../lib/firebase'
import type { UserRole } from '../context/AuthContext'

const googleProvider = new GoogleAuthProvider()

function getAccountStatus(role: UserRole) {
  return role === 'doctor' ? 'pending' : 'active'
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
  role: UserRole,
): Promise<UserCredential> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  )

  try {
    await updateProfile(credential.user, {
      displayName: name,
    })

    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      name,
      email,
      role,
      accountStatus: getAccountStatus(role),
      authProvider: 'password',
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    // Avoid leaving an authenticated account without its HealP profile.
    await credential.user.delete()
    throw error
  }

  return credential
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signInWithGoogle(
  selectedRole: UserRole,
): Promise<UserCredential> {
  const credential = await signInWithPopup(auth, googleProvider)

  const userRef = doc(db, 'users', credential.user.uid)
  const userSnapshot = await getDoc(userRef)

  if (!userSnapshot.exists()) {
    await setDoc(userRef, {
      uid: credential.user.uid,
      name: credential.user.displayName || '',
      email: credential.user.email || '',
      role: selectedRole,
      accountStatus: getAccountStatus(selectedRole),
      authProvider: 'google',
      createdAt: serverTimestamp(),
    })
  }

  return credential
}

export async function logoutUser(): Promise<void> {
  await signOut(auth)
}
