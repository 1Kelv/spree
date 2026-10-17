import {
  Save,
  X,
} from 'lucide-react'
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  editShoppingItem,
  type Category,
  type ShoppingItem,
} from './lib/household'

type EditItemDialogProps = {
  householdId: string
  item: ShoppingItem
  onClose: () => void
}

const categories: Category[] = [
  'Fruit & Veg',
  'Meat & Fish',
  'Bakery',
  'Chilled',
  'Frozen',
  'Food Cupboard',
  'Snacks',
  'Drinks',
  'Baby',
  'Household',
  'Health & Beauty',
  'Other',
]

export default function EditItemDialog({
  householdId,
  item,
  onClose,
}: EditItemDialogProps) {
  const [name, setName] = useState(item.name)
  const [detail, setDetail] = useState(
    item.detail,
  )
  const [category, setCategory] =
    useState<Category>(item.category)

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

    setSaving(true)
    setError('')

    try {
      await editShoppingItem(
        householdId,
        item.id,
        name,
        detail,
        category,
      )

      onClose()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Couldn’t update the item. Please try again.',
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
        className="edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-item-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">
              Update item
            </p>

            <h2 id="edit-item-title">
              Edit shopping item
            </h2>
          </div>

          <button
            className="dialog-close"
            type="button"
            onClick={onClose}
            aria-label="Close edit window"
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="edit-item-form"
          onSubmit={(event) =>
            void handleSubmit(event)
          }
        >
          <label>
            Item name

            <input
              value={name}
              maxLength={120}
              onChange={(event) =>
                setName(event.target.value)
              }
              required
              autoFocus
            />
          </label>

          <label>
            Details

            <input
              value={detail}
              maxLength={120}
              onChange={(event) =>
                setDetail(event.target.value)
              }
              placeholder="Optional"
            />
          </label>

          <label>
            Category

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value as Category,
                )
              }
            >
              {categories.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>
          </label>

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
              disabled={saving}
            >
              <Save size={18} />

              {saving
                ? 'Saving…'
                : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}