import {
  useState,
  type FormEvent,
} from 'react'
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import {
  Eye,
  EyeOff,
  ShoppingBasket,
} from 'lucide-react'
import { auth } from './lib/firebase'

type Mode = 'sign-in' | 'register' | 'reset'

function friendlyError(error: unknown) {
  const code = (error as { code?: string }).code

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already uses this email. Please sign in.'

    case 'auth/invalid-email':
      return 'Please check your email address.'

    case 'auth/weak-password':
      return 'Choose a password with at least six characters.'

    case 'auth/invalid-credential':
      return 'The email or password did not match. Please try again.'

    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a little and try again.'

    case 'auth/operation-not-allowed':
      return 'Enable Email/Password in Firebase Authentication first.'

    default:
      return 'Something went wrong. Please try again.'
  }
}

export default function AuthPage() {
  const [mode, setMode] =
    useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] =
    useState(false)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  function switchMode(next: Mode) {
    setMode(next)
    setPassword('')
    setShowPassword(false)
    setFeedback('')
    setError('')
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!auth) return

    setBusy(true)
    setError('')
    setFeedback('')

    try {
      if (mode === 'register') {
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        )
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(
          auth,
          email.trim(),
        )

        setFeedback(
          'If the address has an account, check your inbox for a reset link.',
        )
      } else {
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        )
      }
    } catch (caught) {
      setError(friendlyError(caught))
    } finally {
      setBusy(false)
    }
  }

  const title =
    mode === 'register'
      ? 'Create your account'
      : mode === 'reset'
        ? 'Reset your password'
        : 'Welcome to Spree'

  return (
    <main className="auth-page">
      <section
        className="auth-card"
        aria-labelledby="auth-title"
      >
        <span className="brand">
          <span className="brand-mark">
            <ShoppingBasket size={24} />
          </span>

          spree
        </span>

        <h1 id="auth-title">{title}</h1>

        <p>Shop together. Forget nothing.</p>

        <form
          className="auth-form"
          onSubmit={(event) =>
            void handleSubmit(event)
          }
        >
          <label>
            Email address

            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />
          </label>

          {mode !== 'reset' && (
            <label>
              Password

              <div className="password-field">
                <input
                  type={
                    showPassword ? 'text' : 'password'
                  }
                  autoComplete={
                    mode === 'register'
                      ? 'new-password'
                      : 'current-password'
                  }
                  minLength={
                    mode === 'register'
                      ? 6
                      : undefined
                  }
                  required
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                />

                <button
                  className="password-toggle"
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (visible) => !visible,
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </label>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={busy}
          >
            {busy
              ? 'Please wait…'
              : mode === 'register'
                ? 'Create account'
                : mode === 'reset'
                  ? 'Send reset link'
                  : 'Sign in'}
          </button>
        </form>

        {error && (
          <p
            className="auth-feedback auth-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {feedback && (
          <p
            className="auth-feedback"
            role="status"
          >
            {feedback}
          </p>
        )}

        {mode === 'sign-in' ? (
          <>
            <button
              className="auth-link"
              type="button"
              onClick={() =>
                switchMode('register')
              }
            >
              New here? Create an account
            </button>

            <button
              className="auth-link"
              type="button"
              onClick={() => switchMode('reset')}
            >
              Forgot your password?
            </button>
          </>
        ) : (
          <button
            className="auth-link"
            type="button"
            onClick={() => switchMode('sign-in')}
          >
            Back to sign in
          </button>
        )}
      </section>
    </main>
  )
}