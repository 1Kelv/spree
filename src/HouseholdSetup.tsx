import { useState, type FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { ShoppingBasket } from 'lucide-react'
import {
  createHousehold,
  joinHousehold,
} from './lib/household'

type HouseholdSetupProps = {
  user: User
  onSignOut: () => Promise<void>
}

export default function HouseholdSetup({
  user,
  onSignOut,
}: HouseholdSetupProps) {
  const [name, setName] = useState('Our household')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(
    event: FormEvent<HTMLFormElement>,
    action: 'create' | 'join',
  ) {
    event.preventDefault()
    setBusy(true)
    setError('')

    try {
      if (action === 'create') {
        await createHousehold(user, name)
      } else {
        await joinHousehold(user, code)
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card setup-card">
        <span className="brand-mark">
          <ShoppingBasket size={24} />
        </span>

        <h1>Set up your household</h1>

        <p>
          Start a new shared list, or enter the code from
          someone in your household.
        </p>

        <form
          className="auth-form"
          onSubmit={(event) => void submit(event, 'create')}
        >
          <label>
            Household name
            <input
              value={name}
              maxLength={60}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

          <button
            className="auth-submit"
            type="submit"
            disabled={busy}
          >
            Create household
          </button>
        </form>

        <p className="form-divider">
          Already have a code?
        </p>

        <form
          className="auth-form"
          onSubmit={(event) => void submit(event, 'join')}
        >
          <label>
            Household code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="20-character code"
              autoComplete="off"
              required
            />
          </label>

          <button
            className="auth-submit"
            type="submit"
            disabled={busy}
          >
            Join household
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