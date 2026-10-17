import type { User } from 'firebase/auth'
import {
  Save,
  UserRound,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import { saveAlias } from './lib/household'

type ProfileDialogProps = {
  user: User
  currentAlias: string
  onClose: () => void
}

export default function ProfileDialog({
  user,
  currentAlias,
  onClose,
}: ProfileDialogProps) {
  const [alias, setAlias] =
    useState(currentAlias)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function closeWithEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener(
      'keydown',
      closeWithEscape,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        closeWithEscape,
      )
    }
  }, [onClose])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const trimmedAlias = alias.trim()

    if (!trimmedAlias) {
      setError('Enter a display name.')
      return
    }

    if (trimmedAlias === currentAlias) {
      onClose()
      return
    }

    setSaving(true)
    setError('')

    try {
      await saveAlias(user, trimmedAlias)
      onClose()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Couldn’t update your display name.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="edit-dialog profile-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">
              Your profile
            </p>

            <h2 id="profile-title">
              Edit display name
            </h2>
          </div>

          <button
            className="dialog-close"
            type="button"
            onClick={onClose}
            aria-label="Close profile window"
          >
            <X size={20} />
          </button>
        </div>

        <div className="profile-icon">
          <UserRound size={26} />
        </div>

        <p className="profile-explanation">
          Your display name appears on your Spree
          homepage and beside new items you add.
        </p>

        <form
          className="edit-item-form"
          onSubmit={(event) =>
            void handleSubmit(event)
          }
        >
          <label>
            Display name

            <input
              value={alias}
              maxLength={40}
              onChange={(event) =>
                setAlias(event.target.value)
              }
              placeholder="e.g. Kelvin"
              autoComplete="nickname"
              required
              autoFocus
            />
          </label>

          <small className="profile-character-count">
            {alias.trim().length}/40 characters
          </small>

          {error && (
            <p
              className="auth-feedback auth-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="dialog-actions">
            <button
              className="dialog-cancel"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              className="dialog-save"
              type="submit"
              disabled={
                saving || !alias.trim()
              }
            >
              <Save size={18} />

              {saving
                ? 'Saving…'
                : 'Save name'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}