import type { User } from 'firebase/auth'
import { UserRound } from 'lucide-react'
import {
  useState,
  type FormEvent,
} from 'react'
import { saveAlias } from './lib/household'

type AliasSetupProps = {
  user: User
  onSignOut: () => Promise<void>
}

function suggestedAlias(user: User) {
  const source =
    user.displayName?.trim() ||
    user.email?.split('@')[0] ||
    ''

  const firstPart =
    source.split(/[.\s_-]+/)[0] || ''

  return firstPart
    ? firstPart.charAt(0).toUpperCase() +
        firstPart.slice(1)
    : ''
}

export default function AliasSetup({
  user,
  onSignOut,
}: AliasSetupProps) {
  const [alias, setAlias] = useState(
    suggestedAlias(user),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      await saveAlias(user, alias)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Please try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card setup-card">
        <span
          className="brand-mark"
          aria-hidden="true"
        >
          <UserRound size={24} />
        </span>

        <h1>What should we call you?</h1>

        <p>
          Your household will see this name beside the
          items you add.
        </p>

        <form
          className="auth-form"
          onSubmit={(event) =>
            void handleSubmit(event)
          }
        >
          <label>
            Your name or nickname

            <input
              value={alias}
              maxLength={40}
              onChange={(event) =>
                setAlias(event.target.value)
              }
              placeholder="e.g. Kelvin, Dad or K"
              autoComplete="nickname"
              required
            />
          </label>

          <button
            className="auth-submit"
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Saving…'
              : 'Continue to your Spree'}
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

        <button
          className="auth-link"
          type="button"
          onClick={() => void onSignOut()}
        >
          Sign out
        </button>
      </div>
    </main>
  )
}