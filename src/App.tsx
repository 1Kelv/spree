import {
  lazy,
  Suspense,
  useEffect,
  useState,
} from 'react'
import {
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth'
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

const AuthPage = lazy(() => import('./AuthPage'))
const HouseholdSetup = lazy(
  () => import('./HouseholdSetup'),
)
const AliasSetup = lazy(() => import('./AliasSetup'))
const ShoppingList = lazy(
  () => import('./ShoppingList'),
)

function LoadingScreen({
  message,
}: {
  message: string
}) {
  return (
    <main className="auth-page">
      <p>{message}</p>
    </main>
  )
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!auth) return

    return onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser)
        setChecking(false)
      },
    )
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
      <LoadingScreen message="Checking your account…" />
    )
  }

  return (
    <Suspense
      fallback={
        <LoadingScreen message="Opening Spree…" />
      }
    >
      {user ? (
        <HouseholdGate
          key={user.uid}
          user={user}
        />
      ) : (
        <AuthPage />
      )}
    </Suspense>
  )
}

function HouseholdGate({
  user,
}: {
  user: User
}) {
  const [householdId, setHouseholdId] =
    useState<string | null | undefined>(
      undefined,
    )

  const [household, setHousehold] =
    useState<Household | null>(null)

  const [alias, setAlias] =
    useState<string | null | undefined>(
      undefined,
    )

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
    if (!householdId) {
      setHousehold(null)
      return
    }

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
          <h1>
            Couldn’t load your household
          </h1>

          <p>{error}</p>

          <p>
            Check that Firestore is enabled
            and your security rules are saved.
          </p>

          <button
            className="auth-submit"
            type="button"
            onClick={() =>
              void handleSignOut()
            }
          >
            Sign out
          </button>
        </div>
      </main>
    )
  }

  if (
    householdId === undefined ||
    alias === undefined
  ) {
    return (
      <LoadingScreen message="Loading your profile…" />
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

  if (!household) {
    return (
      <LoadingScreen message="Loading your household…" />
    )
  }

  return (
    <ShoppingList
      user={user}
      household={household}
      alias={alias}
      onSignOut={handleSignOut}
    />
  )
}