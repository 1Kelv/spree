import {
  useRef,
  useState,
  type FormEvent,
} from 'react'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'
import {
  Check,
  Eye,
  EyeOff,
  Home,
  LogIn,
  ShoppingBasket,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import { auth } from './lib/firebase'

type Mode =
  | 'sign-in'
  | 'register'
  | 'reset'

function friendlyError(error: unknown) {
  const code = (
    error as { code?: string }
  ).code

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
      return 'This sign-in method has not been enabled in Firebase yet.'

    case 'auth/popup-closed-by-user':
      return 'The Google sign-in window was closed before sign-in finished.'

    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in window. Allow pop-ups and try again.'

    case 'auth/account-exists-with-different-credential':
      return 'An account already exists for this email. Sign in using the original method.'

    default:
      return 'Something went wrong. Please try again.'
  }
}

export default function AuthPage() {
  const [mode, setMode] =
    useState<Mode>('sign-in')

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [
    showPassword,
    setShowPassword,
  ] = useState(false)

  const [busy, setBusy] =
    useState(false)

  const [feedback, setFeedback] =
    useState('')

  const [error, setError] =
    useState('')

  const authCard =
    useRef<HTMLElement>(null)

  function switchMode(next: Mode) {
    setMode(next)
    setPassword('')
    setShowPassword(false)
    setFeedback('')
    setError('')
  }

  function scrollToAuth() {
    authCard.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  function openSignIn() {
    switchMode('sign-in')
    scrollToAuth()
  }

  function openRegister() {
    switchMode('register')
    scrollToAuth()
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

  async function handleGoogleSignIn() {
    if (!auth) return

    setBusy(true)
    setError('')
    setFeedback('')

    try {
      const provider =
        new GoogleAuthProvider()

      provider.setCustomParameters({
        prompt: 'select_account',
      })

      await signInWithPopup(
        auth,
        provider,
      )
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
        : 'Welcome back'

  const submitLabel =
    mode === 'register'
      ? 'Create account'
      : mode === 'reset'
        ? 'Send reset link'
        : 'Sign in'

  return (
    <main className="landing-page">
      <header className="landing-header">
        <a
          className="brand"
          href="#welcome"
          aria-label="Spree home"
        >
          <span
            className="brand-mark"
            aria-hidden="true"
          >
            <ShoppingBasket
              size={24}
              strokeWidth={2.25}
            />
          </span>

          <span>spree</span>
        </a>

        <button
          className="landing-signin-link"
          type="button"
          onClick={openSignIn}
        >
          Sign in
        </button>
      </header>

      <section
        className="landing-hero"
        id="welcome"
      >
        <div className="landing-copy">
          <p className="landing-kicker">
            <Sparkles size={16} />

            The list that keeps everyone
            in sync
          </p>

          <h1>
            Shop together.
            <span> Forget nothing.</span>
          </h1>

          <p className="landing-intro">
            One shared shopping list for
            your household. Add something
            at home and it appears
            instantly for whoever is at
            the shop.
          </p>

          <div className="landing-actions">
            <button
              className="landing-primary"
              type="button"
              onClick={openRegister}
            >
              Start your Spree

              <Sparkles size={18} />
            </button>

            <span>
              Free to use · No card required
            </span>
          </div>

          <ul
            className="landing-benefits"
            aria-label="Spree benefits"
          >
            <li>
              <Check size={17} />
              Live updates for every member
            </li>

            <li>
              <Check size={17} />
              See who added each item
            </li>

            <li>
              <Check size={17} />
              Install it on your phone
            </li>
          </ul>
        </div>

        <div className="landing-auth-wrap">
          <div
            className="landing-preview"
            aria-hidden="true"
          >
            <div className="preview-heading">
              <span>
                <Home size={15} />
                The family shop
              </span>

              <small>Live</small>
            </div>

            <div className="preview-progress">
              <span />
            </div>

            <div className="preview-item">
              <span className="preview-check" />

              <div>
                <strong>Fresh fruit</strong>
                <small>
                  Added by Kelvin
                </small>
              </div>

              <b>3</b>
            </div>

            <div className="preview-item">
              <span className="preview-check checked">
                <Check size={12} />
              </span>

              <div>
                <strong>Milk</strong>
                <small>Picked up</small>
              </div>

              <b>1</b>
            </div>
          </div>

          <section
            className="auth-card landing-auth-card"
            aria-labelledby="auth-title"
            ref={authCard}
          >
            <p className="eyebrow">
              {mode === 'register'
                ? 'Join Spree'
                : mode === 'reset'
                  ? 'Account help'
                  : 'Your household awaits'}
            </p>

            <h2 id="auth-title">
              {title}
            </h2>

            <p className="auth-lead">
              {mode === 'reset'
                ? 'Enter your email and we’ll send you a reset link.'
                : 'Use email or continue securely with Google.'}
            </p>

            {mode !== 'reset' && (
              <>
                <button
                  className="google-button"
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void handleGoogleSignIn()
                  }
                >
                  <LogIn size={18} />

                  Continue with Google
                </button>

                <div className="auth-divider">
                  <span>or</span>
                </div>
              </>
            )}

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
                    setEmail(
                      event.target.value,
                    )
                  }
                />
              </label>

              {mode !== 'reset' && (
                <label>
                  Password

                  <span className="password-field">
                    <input
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
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
                        setPassword(
                          event.target.value,
                        )
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (visible) =>
                            !visible,
                        )
                      }
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                      aria-pressed={
                        showPassword
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </span>
                </label>
              )}

              <button
                className="auth-submit"
                type="submit"
                disabled={busy}
              >
                {busy
                  ? 'Please wait…'
                  : submitLabel}
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

            <div className="auth-links">
              {mode === 'sign-in' ? (
                <>
                  <button
                    className="auth-link"
                    type="button"
                    onClick={() =>
                      switchMode(
                        'register',
                      )
                    }
                  >
                    New here? Create an
                    account
                  </button>

                  <button
                    className="auth-link"
                    type="button"
                    onClick={() =>
                      switchMode('reset')
                    }
                  >
                    Forgot your password?
                  </button>
                </>
              ) : (
                <button
                  className="auth-link"
                  type="button"
                  onClick={() =>
                    switchMode('sign-in')
                  }
                >
                  Back to sign in
                </button>
              )}
            </div>

            <p className="auth-privacy">
              Your list is only available
              to members of your household.
            </p>
          </section>
        </div>
      </section>

      <section
        className="landing-features"
        aria-labelledby="features-title"
      >
        <div className="landing-section-heading">
          <p className="eyebrow">
            Made for real households
          </p>

          <h2 id="features-title">
            Less messaging. Smoother
            shopping.
          </h2>
        </div>

        <div className="feature-grid">
          <article>
            <span>
              <Zap size={22} />
            </span>

            <h3>Instantly shared</h3>

            <p>
              Every change reaches the
              household in real time.
            </p>
          </article>

          <article>
            <span>
              <Users size={22} />
            </span>

            <h3>Clearly attributed</h3>

            <p>
              Aliases show who added the
              latest item to the list.
            </p>
          </article>

          <article>
            <span>
              <ShoppingBasket size={22} />
            </span>

            <h3>Built for the shop</h3>

            <p>
              Tick off items, adjust
              quantities and stay focused
              in Spree Mode.
            </p>
          </article>
        </div>
      </section>

      <footer className="landing-footer">
        <span className="brand brand-small">
          <span className="brand-mark">
            <ShoppingBasket size={18} />
          </span>

          spree
        </span>

        <p>
          Shop together. Forget nothing.
        </p>
      </footer>
    </main>
  )
}