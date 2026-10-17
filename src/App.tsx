import { useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth'
import AliasSetup from './AliasSetup'
import AuthPage from './AuthPage'
import HouseholdSetup from './HouseholdSetup'
import ShoppingList from './ShoppingList'
import {
  watchAlias,
  watchHousehold,
  watchProfile,
  type Household,
} from './lib/household'
import {
  auth,
  isFirebaseConfigured,
} from './lib/firebase'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!auth) return

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setChecking(false)
    })
  }, [])

  if (!isFirebaseConfigured) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1>Firebase isn’t connected</h1>

          <p>
            Add your Firebase configuration to
            .env.local.
          </p>
        </div>
      </main>
    )
  }

  if (checking) {
    return (
      <main className="auth-page">
        <p>Checking your account…</p>
      </main>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return <HouseholdGate key={user.uid} user={user} />
}

function HouseholdGate({ user }: { user: User }) {
  const [householdId, setHouseholdId] =
    useState<string | null | undefined>(undefined)

  const [household, setHousehold] =
    useState<Household | null>(null)

  const [alias, setAlias] =
    useState<string | null | undefined>(undefined)

  const [error, setError] = useState('')

  useEffect(() => {
    return watchProfile(
      user,
      setHouseholdId,
      (cause) => setError(cause.message),
    )
  }, [user])

  useEffect(() => {
    return watchAlias(
      user,
      setAlias,
      (cause) => setError(cause.message),
    )
  }, [user])

  useEffect(() => {
    if (!householdId) return

    return watchHousehold(
      householdId,
      setHousehold,
      (cause) => setError(cause.message),
    )
  }, [householdId])

  async function handleSignOut() {
    if (auth) {
      await signOut(auth)
    }
  }

  if (error) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1>Couldn’t load your household</h1>

          <p>{error}</p>

          <button
            className="auth-submit"
            type="button"
            onClick={() => void handleSignOut()}
          >
            Sign out
          </button>
        </div>
      </main>
    )
  }

  if (
    householdId === undefined ||
    alias === undefined ||
    (householdId && !household)
  ) {
    return (
      <main className="auth-page">
        <p>Loading your household…</p>
      </main>
    )
  }

  if (!householdId) {
    return (
      <HouseholdSetup
        user={user}
        onSignOut={handleSignOut}
      />
    )
  }

  if (!alias) {
    return (
      <AliasSetup
        user={user}
        onSignOut={handleSignOut}
      />
    )
  }

    return (
    <ShoppingList
      user={user}
      household={household!}
      alias={alias}
      onSignOut={handleSignOut}
    />
  )
}