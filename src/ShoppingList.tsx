import {
  Apple,
  Baby,
  Check,
  CheckCircle2,
  Clipboard,
  Coffee,
  Cookie,
  Croissant,
  Drumstick,
  HeartPulse,
  Home,
  IceCreamBowl,
  Minus,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  Settings,
  ShoppingBasket,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import type { User } from 'firebase/auth'
import EditItemDialog from './EditItemDialog'
import ProfileDialog from './ProfileDialog'
import {
  addShoppingItem,
  changeShoppingItemQuantity,
  removeShoppingItem,
  toggleShoppingItem,
  watchItems,
  type Category,
  type Household,
  type ShoppingItem,
} from './lib/household'

type ShoppingListProps = {
  user: User
  household: Household
  alias: string
  onSignOut: () => Promise<void>
}

type ListTab = 'to-buy' | 'purchased'

type SortOption =
  | 'newest'
  | 'oldest'
  | 'a-z'
  | 'z-a'
  | 'category'

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

const categoryDetails: Record<
  Category,
  {
    icon: typeof Apple
    colour: string
    surface: string
  }
> = {
  'Fruit & Veg': {
    icon: Apple,
    colour: '#4e7c52',
    surface: '#edf5ed',
  },
  'Meat & Fish': {
    icon: Drumstick,
    colour: '#a04f49',
    surface: '#faecea',
  },
  Bakery: {
    icon: Croissant,
    colour: '#9a6b31',
    surface: '#fbf1df',
  },
  Chilled: {
    icon: IceCreamBowl,
    colour: '#397084',
    surface: '#e7f3f6',
  },
  Frozen: {
    icon: Snowflake,
    colour: '#3973a8',
    surface: '#eaf3fb',
  },
  'Food Cupboard': {
    icon: Package,
    colour: '#8b6637',
    surface: '#f7efe4',
  },
  Snacks: {
    icon: Cookie,
    colour: '#a15e3f',
    surface: '#faeee8',
  },
  Drinks: {
    icon: Coffee,
    colour: '#517489',
    surface: '#eaf2f6',
  },
  Baby: {
    icon: Baby,
    colour: '#926820',
    surface: '#fbf2dd',
  },
  Household: {
    icon: Home,
    colour: '#755a8a',
    surface: '#f2edf6',
  },
  'Health & Beauty': {
    icon: HeartPulse,
    colour: '#a34f72',
    surface: '#f9eaf1',
  },
  Other: {
    icon: MoreHorizontal,
    colour: '#68616c',
    surface: '#f1eff2',
  },
}

const quickAdds: Array<{
  name: string
  category: Category
}> = [
  {
    name: 'Bread',
    category: 'Bakery',
  },
  {
    name: 'Eggs',
    category: 'Chilled',
  },
  {
    name: 'Milk',
    category: 'Chilled',
  },
  {
    name: 'Nappies',
    category: 'Baby',
  },
]

function createdAtMilliseconds(item: ShoppingItem) {
  return item.createdAt?.toMillis() ?? 0
}

function contributorName(item: ShoppingItem) {
  const name = item.createdByAlias?.trim()
  return name || 'Household member'
}

export default function ShoppingList({
  user,
  household,
  alias,
  onSignOut,
}: ShoppingListProps) {
  const [items, setItems] =
    useState<ShoppingItem[]>([])

  const [loadingItems, setLoadingItems] =
    useState(true)

  const [newItem, setNewItem] = useState('')
  const [newDetail, setNewDetail] =
    useState('')

  const [newCategory, setNewCategory] =
    useState<Category>('Food Cupboard')

  const [newQuantity, setNewQuantity] =
    useState(1)

  const [search, setSearch] = useState('')

  const [activeTab, setActiveTab] =
    useState<ListTab>('to-buy')

  const [filtersOpen, setFiltersOpen] =
    useState(false)

  const [
    contributorFilter,
    setContributorFilter,
  ] = useState('all')

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState<Category | 'all'>('all')

  const [sortBy, setSortBy] =
    useState<SortOption>('newest')

  const [spreeMode, setSpreeMode] =
    useState(false)

  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const [editingItem, setEditingItem] =
    useState<ShoppingItem | null>(null)

  const [profileOpen, setProfileOpen] =
    useState(false)

  useEffect(() => {
    setLoadingItems(true)

    return watchItems(
      household.id,
      (nextItems) => {
        setItems(nextItems)
        setLoadingItems(false)
      },
      (cause) => {
        setError(cause.message)
        setLoadingItems(false)
      },
    )
  }, [household.id])

  const toBuyCount = items.filter(
    (item) => !item.completed,
  ).length

  const purchasedCount = items.filter(
    (item) => item.completed,
  ).length

  const progress = items.length
    ? Math.round(
        (purchasedCount / items.length) * 100,
      )
    : 0

  const contributors = useMemo(() => {
    const names = items.map(contributorName)

    return Array.from(new Set(names)).sort(
      (first, second) =>
        first.localeCompare(second, 'en-GB', {
          sensitivity: 'base',
        }),
    )
  }, [items])

  const activeFilterCount =
    (contributorFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (sortBy !== 'newest' ? 1 : 0)

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase()

    const filteredItems = items.filter((item) => {
      const matchesTab =
        activeTab === 'purchased'
          ? item.completed
          : !item.completed

      const contributor =
        contributorName(item)

      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.detail.toLowerCase().includes(query) ||
        contributor.toLowerCase().includes(query)

      const matchesContributor =
        contributorFilter === 'all' ||
        contributor === contributorFilter

      const matchesCategory =
        categoryFilter === 'all' ||
        item.category === categoryFilter

      return (
        matchesTab &&
        matchesSearch &&
        matchesContributor &&
        matchesCategory
      )
    })

    return [...filteredItems].sort(
      (first, second) => {
        if (sortBy === 'oldest') {
          return (
            createdAtMilliseconds(first) -
            createdAtMilliseconds(second)
          )
        }

        if (sortBy === 'a-z') {
          return first.name.localeCompare(
            second.name,
            'en-GB',
            {
              sensitivity: 'base',
            },
          )
        }

        if (sortBy === 'z-a') {
          return second.name.localeCompare(
            first.name,
            'en-GB',
            {
              sensitivity: 'base',
            },
          )
        }

        if (sortBy === 'category') {
          const categoryDifference =
            categories.indexOf(first.category) -
            categories.indexOf(second.category)

          if (categoryDifference !== 0) {
            return categoryDifference
          }

          return first.name.localeCompare(
            second.name,
            'en-GB',
            {
              sensitivity: 'base',
            },
          )
        }

        return (
          createdAtMilliseconds(second) -
          createdAtMilliseconds(first)
        )
      },
    )
  }, [
    items,
    activeTab,
    search,
    contributorFilter,
    categoryFilter,
    sortBy,
  ])

  const groupedItems = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          items: visibleItems.filter(
            (item) =>
              item.category === category,
          ),
        }))
        .filter(
          (group) => group.items.length > 0,
        ),
    [visibleItems],
  )

  const weekday = new Intl.DateTimeFormat(
    'en-GB',
    {
      weekday: 'long',
    },
  ).format(new Date())

  const possessiveAlias = alias
    .toLowerCase()
    .endsWith('s')
    ? `${alias}'`
    : `${alias}'s`

  const filtersAreRestrictingResults =
    search.trim().length > 0 ||
    contributorFilter !== 'all' ||
    categoryFilter !== 'all'

  const itemCountLabel =
    filtersAreRestrictingResults
      ? visibleItems.length === 1
        ? '1 matching item'
        : `${visibleItems.length} matching items`
      : activeTab === 'purchased'
        ? purchasedCount === 1
          ? '1 purchased item'
          : `${purchasedCount} purchased items`
        : toBuyCount === 1
          ? '1 item to find'
          : `${toBuyCount} items to find`

  async function addItem(
    name: string,
    detail = '',
    category: Category = 'Food Cupboard',
    quantity = 1,
  ) {
    const trimmedName = name.trim()
    const trimmedDetail = detail.trim()

    if (!trimmedName) {
      setError('Enter an item name first.')
      return
    }

    setAdding(true)
    setError('')

    try {
      await addShoppingItem(
        user,
        household.id,
        alias,
        trimmedName,
        trimmedDetail,
        category,
        quantity,
      )

      setNewItem('')
      setNewDetail('')
      setNewCategory('Food Cupboard')
      setNewQuantity(1)
      setActiveTab('to-buy')
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Couldn’t add the item. Please try again.',
      )
    } finally {
      setAdding(false)
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    await addItem(
      newItem,
      newDetail,
      newCategory,
      newQuantity,
    )
  }

  async function handleQuickAdd(
    name: string,
    category: Category,
  ) {
    await addItem(name, '', category, 1)
  }

  async function handleToggle(
    item: ShoppingItem,
  ) {
    setError('')

    try {
      await toggleShoppingItem(
        household.id,
        item,
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Couldn’t update the item.',
      )
    }
  }

  async function handleQuantityChange(
    item: ShoppingItem,
    amount: number,
  ) {
    if (item.quantity + amount < 1) {
      return
    }

    setError('')

    try {
      await changeShoppingItemQuantity(
        household.id,
        item,
        amount,
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Couldn’t update the quantity.',
      )
    }
  }

  async function handleRemoveItem(
    itemId: string,
  ) {
    setError('')

    try {
      await removeShoppingItem(
        household.id,
        itemId,
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Couldn’t remove the item.',
      )
    }
  }

  async function copyHouseholdCode() {
    try {
      await navigator.clipboard.writeText(
        household.id,
      )

      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      setError(
        'Couldn’t copy the household code. Please copy it manually.',
      )
    }
  }

  function clearFilters() {
    setContributorFilter('all')
    setCategoryFilter('all')
    setSortBy('newest')
  }

  function toggleSpreeMode() {
    if (spreeMode) {
      setSpreeMode(false)
      return
    }

    setActiveTab('to-buy')
    setSpreeMode(true)
  }

  function enterSpreeMode() {
    setActiveTab('to-buy')
    setSpreeMode(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <main
      className={
        spreeMode
          ? 'app-shell spree-active'
          : 'app-shell'
      }
    >
      <header className="topbar">
        <a
          className="brand"
          href="#top"
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
          className="household-pill household-copy-button"
          type="button"
          onClick={() =>
            void copyHouseholdCode()
          }
          aria-label={`Copy household code ${household.id}`}
          title={`Household code: ${household.id}`}
        >
          <Home size={16} />

          <span className="household-name">
            {household.name}
          </span>

          <span className="household-copy-text">
            {copied ? (
              <>
                <CheckCircle2 size={14} />
                Copied
              </>
            ) : (
              <>
                <Clipboard size={14} />
                Copy code
              </>
            )}
          </span>
        </button>

        <div className="topbar-actions">
          <button
            className="mobile-household-share"
            type="button"
            onClick={() =>
              void copyHouseholdCode()
            }
            aria-label={
              copied
                ? 'Household code copied'
                : `Copy household code for ${household.name}`
            }
            title={`Household code: ${household.id}`}
          >
            {copied ? (
              <CheckCircle2 size={18} />
            ) : (
              <Clipboard size={18} />
            )}
          </button>

          <button
            className="profile-button"
            type="button"
            onClick={() =>
              setProfileOpen(true)
            }
          >
            <Settings size={17} />
            <span>Profile</span>
          </button>

          <button
            className="signout-button"
            type="button"
            onClick={() => void onSignOut()}
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="content" id="top">
        <div className="welcome-row">
          <div>
            <p className="eyebrow">
              {weekday} shop
            </p>

            <h1>
              {spreeMode
                ? 'Spree Mode'
                : `${possessiveAlias} Spree`}
            </h1>

            <p className="intro">
              {spreeMode
                ? 'One tap to tick things off as you go.'
                : 'Shop together. Forget nothing.'}
            </p>
          </div>

          <button
            className={
              spreeMode
                ? 'mode-button active'
                : 'mode-button'
            }
            type="button"
            onClick={toggleSpreeMode}
          >
            {spreeMode ? (
              <X size={18} />
            ) : (
              <Sparkles size={18} />
            )}

            {spreeMode
              ? 'Exit mode'
              : 'Start Spree'}
          </button>
        </div>

        <section
          className="progress-card"
          aria-label={`${progress}% of shopping completed`}
        >
          <div className="progress-copy">
            <div>
              <span className="progress-number">
                {purchasedCount}
              </span>

              <span className="progress-label">
                {' '}
                of {items.length} picked up
              </span>
            </div>

            <span className="progress-percentage">
              {progress}%
            </span>
          </div>

          <div
            className="progress-track"
            aria-hidden="true"
          >
            <span
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="people-row">
            <span>
              Everyone in {household.name} sees
              changes instantly.
            </span>
          </div>
        </section>

        {!spreeMode && (
          <section
            className="add-card"
            aria-labelledby="add-heading"
          >
            <div className="section-heading">
              <p className="eyebrow">
                Add something
              </p>

              <h2 id="add-heading">
                What do you need?
              </h2>
            </div>

            <form
              className="add-form"
              onSubmit={(event) =>
                void handleSubmit(event)
              }
            >
              <div className="add-primary-row">
                <label
                  className="sr-only"
                  htmlFor="new-item"
                >
                  Item name
                </label>

                <input
                  id="new-item"
                  value={newItem}
                  maxLength={120}
                  onChange={(event) =>
                    setNewItem(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Bread, eggs or nappies"
                  autoComplete="off"
                  required
                />

                <button
                  type="submit"
                  disabled={adding}
                  aria-label="Add item"
                >
                  <Plus size={22} />

                  <span>
                    {adding
                      ? 'Adding…'
                      : 'Add item'}
                  </span>
                </button>
              </div>

              <div className="add-options">
                <label>
                  Details

                  <input
                    value={newDetail}
                    maxLength={120}
                    onChange={(event) =>
                      setNewDetail(
                        event.target.value,
                      )
                    }
                    placeholder="Optional, e.g. 500g"
                  />
                </label>

                <label>
                  Category

                  <select
                    value={newCategory}
                    onChange={(event) =>
                      setNewCategory(
                        event.target
                          .value as Category,
                      )
                    }
                  >
                    {categories.map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  Quantity

                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={newQuantity}
                    onChange={(event) => {
                      const value = Number(
                        event.target.value,
                      )

                      setNewQuantity(
                        Number.isFinite(value)
                          ? Math.max(
                              1,
                              Math.min(
                                999,
                                value,
                              ),
                            )
                          : 1,
                      )
                    }}
                  />
                </label>
              </div>
            </form>

            <div
              className="quick-adds"
              aria-label="Quick add suggestions"
            >
              <span>Quick add</span>

              {quickAdds.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  disabled={adding}
                  onClick={() =>
                    void handleQuickAdd(
                      item.name,
                      item.category,
                    )
                  }
                >
                  <Plus size={14} />
                  {item.name}
                </button>
              ))}
            </div>

            {error && (
              <p
                className="auth-feedback auth-error"
                role="alert"
              >
                {error}
              </p>
            )}
          </section>
        )}

        <section
          className="list-section"
          aria-labelledby="list-heading"
        >
          <div className="list-toolbar">
            <div>
              <p className="eyebrow">
                Your list
              </p>

              <h2 id="list-heading">
                {itemCountLabel}
              </h2>
            </div>

            <div className="list-actions">
              <label className="search-box">
                <Search size={17} />

                <span className="sr-only">
                  Search by item, details, or
                  contributor
                </span>

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search"
                />
              </label>

              <button
                className={
                  filtersOpen ||
                  activeFilterCount > 0
                    ? 'filter-trigger active'
                    : 'filter-trigger'
                }
                type="button"
                onClick={() =>
                  setFiltersOpen(
                    (open) => !open,
                  )
                }
                aria-expanded={filtersOpen}
                aria-controls="shopping-filters"
              >
                <SlidersHorizontal size={17} />
                <span>Filters</span>

                {activeFilterCount > 0 && (
                  <small>
                    {activeFilterCount}
                  </small>
                )}
              </button>
            </div>
          </div>

          <div
            className="list-tabs"
            role="tablist"
            aria-label="Shopping list sections"
          >
            <button
              className={
                activeTab === 'to-buy'
                  ? 'active'
                  : ''
              }
              type="button"
              role="tab"
              aria-selected={
                activeTab === 'to-buy'
              }
              onClick={() =>
                setActiveTab('to-buy')
              }
            >
              <ShoppingBasket size={17} />
              <span>To buy</span>
              <small>{toBuyCount}</small>
            </button>

            <button
              className={
                activeTab === 'purchased'
                  ? 'active'
                  : ''
              }
              type="button"
              role="tab"
              aria-selected={
                activeTab === 'purchased'
              }
              onClick={() =>
                setActiveTab('purchased')
              }
            >
              <CheckCircle2 size={17} />
              <span>Purchased</span>
              <small>{purchasedCount}</small>
            </button>
          </div>

          {filtersOpen && (
            <div
              className="filter-panel"
              id="shopping-filters"
            >
              <label>
                Added by

                <select
                  value={contributorFilter}
                  onChange={(event) =>
                    setContributorFilter(
                      event.target.value,
                    )
                  }
                >
                  <option value="all">
                    Everyone
                  </option>

                  {contributors.map(
                    (contributor) => (
                      <option
                        key={contributor}
                        value={contributor}
                      >
                        {contributor}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                Category

                <select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value as
                        | Category
                        | 'all',
                    )
                  }
                >
                  <option value="all">
                    All categories
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                Arrange by

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target
                        .value as SortOption,
                    )
                  }
                >
                  <option value="newest">
                    Recently added
                  </option>

                  <option value="oldest">
                    Oldest added
                  </option>

                  <option value="a-z">
                    Name: A–Z
                  </option>

                  <option value="z-a">
                    Name: Z–A
                  </option>

                  <option value="category">
                    Category
                  </option>
                </select>
              </label>

              <button
                className="clear-filters"
                type="button"
                disabled={
                  activeFilterCount === 0
                }
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          )}

          <div className="groups">
            {loadingItems && (
              <div className="empty-state">
                <ShoppingBasket size={30} />
                <h3>Loading your list…</h3>
              </div>
            )}

            {!loadingItems &&
              groupedItems.map(
                ({
                  category,
                  items: categoryItems,
                }) => {
                  const categoryDetail =
                    categoryDetails[category]

                  const Icon =
                    categoryDetail.icon

                  return (
                    <section
                      className="category-group"
                      key={category}
                    >
                      <div className="category-title">
                        <span
                          style={{
                            color:
                              categoryDetail.colour,
                            background:
                              categoryDetail.surface,
                          }}
                        >
                          <Icon size={17} />
                        </span>

                        <h3>{category}</h3>

                        <small>
                          {categoryItems.length}
                        </small>
                      </div>

                      <div className="item-list">
                        {categoryItems.map(
                          (item) => (
                            <article
                              className={
                                item.completed
                                  ? 'item completed'
                                  : 'item'
                              }
                              key={item.id}
                            >
                              <button
                                className="check-button"
                                type="button"
                                onClick={() =>
                                  void handleToggle(
                                    item,
                                  )
                                }
                                aria-label={`${
                                  item.completed
                                    ? 'Return'
                                    : 'Tick off'
                                } ${item.name}`}
                                aria-pressed={
                                  item.completed
                                }
                              >
                                {item.completed && (
                                  <Check
                                    size={17}
                                    strokeWidth={3}
                                  />
                                )}
                              </button>

                              <button
                                className="item-copy"
                                type="button"
                                onClick={() =>
                                  void handleToggle(
                                    item,
                                  )
                                }
                              >
                                <strong>
                                  {item.name}
                                </strong>

                                {item.detail && (
                                  <span>
                                    {item.detail}
                                  </span>
                                )}

                                <small>
                                  Added by{' '}
                                  {contributorName(
                                    item,
                                  )}
                                </small>
                              </button>

                              <div
                                className="quantity"
                                aria-label={`Quantity ${item.quantity}`}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleQuantityChange(
                                      item,
                                      -1,
                                    )
                                  }
                                  aria-label={`Reduce ${item.name} quantity`}
                                >
                                  <Minus
                                    size={14}
                                  />
                                </button>

                                <span>
                                  {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleQuantityChange(
                                      item,
                                      1,
                                    )
                                  }
                                  aria-label={`Increase ${item.name} quantity`}
                                >
                                  <Plus
                                    size={14}
                                  />
                                </button>
                              </div>

                              <button
                                className="edit-button"
                                type="button"
                                onClick={() =>
                                  setEditingItem(
                                    item,
                                  )
                                }
                                aria-label={`Edit ${item.name}`}
                              >
                                <Pencil size={17} />
                              </button>

                              <button
                                className="delete-button"
                                type="button"
                                onClick={() =>
                                  void handleRemoveItem(
                                    item.id,
                                  )
                                }
                                aria-label={`Remove ${item.name}`}
                              >
                                <Trash2 size={17} />
                              </button>
                            </article>
                          ),
                        )}
                      </div>
                    </section>
                  )
                },
              )}

            {!loadingItems &&
              groupedItems.length === 0 && (
                <div className="empty-state">
                  {activeTab === 'purchased' ? (
                    <CheckCircle2 size={30} />
                  ) : (
                    <ShoppingBasket size={30} />
                  )}

                  <h3>
                    {filtersAreRestrictingResults
                      ? 'No matching items'
                      : activeTab === 'purchased'
                        ? 'Nothing purchased yet'
                        : 'Your list is empty'}
                  </h3>

                  <p>
                    {filtersAreRestrictingResults
                      ? 'Try another search or clear your filters.'
                      : activeTab === 'purchased'
                        ? 'Items appear here after you tick them off.'
                        : 'Add your first shopping item above.'}
                  </p>

                  {filtersAreRestrictingResults && (
                    <button
                      className="empty-clear-button"
                      type="button"
                      onClick={() => {
                        setSearch('')
                        clearFilters()
                      }}
                    >
                      Clear search and filters
                    </button>
                  )}
                </div>
              )}
          </div>
        </section>
      </section>

      {editingItem && (
        <EditItemDialog
          householdId={household.id}
          item={editingItem}
          onClose={() =>
            setEditingItem(null)
          }
        />
      )}

      {profileOpen && (
        <ProfileDialog
          user={user}
          currentAlias={alias}
          onClose={() =>
            setProfileOpen(false)
          }
        />
      )}

      <nav
        className="mobile-nav"
        aria-label="Main navigation"
      >
        <button
          className={
            !spreeMode &&
            activeTab === 'to-buy'
              ? 'selected'
              : ''
          }
          type="button"
          onClick={() => {
            setSpreeMode(false)
            setActiveTab('to-buy')
          }}
        >
          <ShoppingBasket size={20} />
          <span>To buy</span>
        </button>

        <button
          className={
            !spreeMode &&
            activeTab === 'purchased'
              ? 'selected'
              : ''
          }
          type="button"
          onClick={() => {
            setSpreeMode(false)
            setActiveTab('purchased')
          }}
        >
          <CheckCircle2 size={20} />
          <span>Purchased</span>
        </button>

        <button
          className={
            spreeMode ? 'selected' : ''
          }
          type="button"
          onClick={enterSpreeMode}
        >
          <Sparkles size={20} />
          <span>Spree</span>
        </button>
      </nav>
    </main>
  )
}