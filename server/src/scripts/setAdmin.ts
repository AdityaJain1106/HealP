import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '../config/firebaseAdmin.js'

async function main() {
  const args = process.argv.slice(2)
  const email = args[0]?.trim()
  const password = args[1]?.trim() || 'Admin@123456'
  const name = args[2]?.trim() || 'HealP Administrator'

  if (!email) {
    console.error('Usage: npm run set-admin <email> [password] [name]')
    console.error('Example: npm run set-admin admin@healp.com Admin@123456 "Super Admin"')
    process.exit(1)
  }

  console.log(`Setting up Admin account for: ${email}`)

  let uid: string

  try {
    const existingUser = await adminAuth.getUserByEmail(email)
    uid = existingUser.uid
    console.log(`Found existing Firebase Auth user: ${uid}`)
  } catch (err: unknown) {
    const firebaseErr = err as { code?: string }
    if (firebaseErr.code === 'auth/user-not-found') {
      console.log(`User not found in Firebase Auth. Creating new user with email: ${email}...`)
      const newUser = await adminAuth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: true,
      })
      uid = newUser.uid
      console.log(`Created new Firebase Auth user with UID: ${uid}`)
      console.log(`Default password set to: ${password}`)
    } else {
      throw err
    }
  }

  // Set or update Firestore user document to role: 'admin' and accountStatus: 'active'
  const userRef = adminDb.collection('users').doc(uid)
  const snapshot = await userRef.get()

  if (snapshot.exists) {
    await userRef.update({
      role: 'admin',
      accountStatus: 'active',
      updatedAt: FieldValue.serverTimestamp(),
    })
    console.log(`Updated existing Firestore user profile to role: 'admin' (active).`)
  } else {
    await userRef.set({
      uid,
      name,
      email,
      role: 'admin',
      accountStatus: 'active',
      authProvider: 'password',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    console.log(`Created new Firestore user profile with role: 'admin' (active).`)
  }

  console.log('\n======================================================')
  console.log('🎉 Admin Account Ready!')
  console.log(`Email:    ${email}`)
  if (args[1]) {
    console.log(`Password: ${password}`)
  } else {
    console.log(`Password: (Existing account password, or '${password}' if newly created)`)
  }
  console.log('Role:     admin')
  console.log('Status:   active')
  console.log('======================================================\n')
  console.log('You can now log in at: http://localhost:5173/login')
  console.log('You will be automatically redirected to: /admin\n')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to set admin:', err)
    process.exit(1)
  })

