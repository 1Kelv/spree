import type { User } from 'firebase/auth'
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'

export type Category =
  | 'Fruit & Veg'
  | 'Meat & Fish'
  | 'Bakery'
  | 'Chilled'
  | 'Frozen'
  | 'Food Cupboard'
  | 'Snacks'
  | 'Drinks'
  | 'Baby'
  | 'Household'
  | 'Health & Beauty'
  | 'Other'

export type ShoppingItem = {
  id: string
  name: string
  detail: string
  category: Category
  quantity: number
  completed: boolean
  createdBy: string
  createdByAlias?: string
}

export type Household = {
  id: string
  name: string
  members: string[]
}

function database() {
  if (!db) {
    throw new Error(
      'Add your Firebase configuration to .env.local first.',
    )
  }

  return db
}

export function watchProfile(
  user: User,
  onChange: (householdId: string | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const profileReference = doc(
    database(),
    'profiles',
    user.uid,
  )

  return onSnapshot(
    profileReference,
    {
      includeMetadataChanges: true,
    },
    (snapshot) => {
      if (snapshot.metadata.hasPendingWrites) {
        return
      }

      if (!snapshot.exists()) {
        onChange(null)
        return
      }

      const householdId =
        snapshot.data().householdId

      onChange(
        typeof householdId === 'string'
          ? householdId
          : null,
      )
    },
    onError,
  )
}

export function watchAlias(
  user: User,
  onChange: (alias: string | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const profileReference = doc(
    database(),
    'profiles',
    user.uid,
  )

  return onSnapshot(
    profileReference,
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange(null)
        return
      }

      const alias = snapshot.data().alias

      onChange(
        typeof alias === 'string' ? alias : null,
      )
    },
    onError,
  )
}

export async function saveAlias(
  user: User,
  alias: string,
) {
  const trimmedAlias = alias.trim()

  if (
    !trimmedAlias ||
    trimmedAlias.length > 40
  ) {
    throw new Error(
      'Enter an alias under 40 characters.',
    )
  }

  const profileReference = doc(
    database(),
    'profiles',
    user.uid,
  )

  await updateDoc(profileReference, {
    alias: trimmedAlias,
  })
}

export function watchHousehold(
  householdId: string,
  onChange: (
    household: Household | null,
  ) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const householdReference = doc(
    database(),
    'households',
    householdId,
  )

  return onSnapshot(
    householdReference,
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange(null)
        return
      }

      onChange({
        id: snapshot.id,
        name: snapshot.data().name as string,
        members: snapshot.data()
          .members as string[],
      })
    },
    onError,
  )
}

export function watchItems(
  householdId: string,
  onChange: (items: ShoppingItem[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const itemsReference = collection(
    database(),
    'households',
    householdId,
    'items',
  )

  return onSnapshot(
    itemsReference,
    (snapshot) => {
      const items = snapshot.docs.map(
        (itemSnapshot) => ({
          id: itemSnapshot.id,
          ...itemSnapshot.data(),
        }),
      ) as ShoppingItem[]

      onChange(items)
    },
    onError,
  )
}

export async function createHousehold(
  user: User,
  name: string,
) {
  const trimmedName = name.trim()

  if (
    !trimmedName ||
    trimmedName.length > 60
  ) {
    throw new Error(
      'Enter a household name under 60 characters.',
    )
  }

  const store = database()

  const householdReference = doc(
    collection(store, 'households'),
  )

  const profileReference = doc(
    store,
    'profiles',
    user.uid,
  )

  const batch = writeBatch(store)

  batch.set(householdReference, {
    name: trimmedName,
    ownerId: user.uid,
    members: [user.uid],
    createdAt: serverTimestamp(),
  })

  batch.set(
    profileReference,
    {
      householdId: householdReference.id,
    },
    {
      merge: true,
    },
  )

  await batch.commit()
}

export async function joinHousehold(
  user: User,
  code: string,
) {
  const householdId = code.trim()

  if (!/^[A-Za-z0-9]{20}$/.test(householdId)) {
    throw new Error(
      'Enter the 20-character household code.',
    )
  }

  const store = database()

  const householdReference = doc(
    store,
    'households',
    householdId,
  )

  const householdSnapshot = await getDoc(
    householdReference,
  )

  if (!householdSnapshot.exists()) {
    throw new Error(
      'No household matches that code.',
    )
  }

  const profileReference = doc(
    store,
    'profiles',
    user.uid,
  )

  const batch = writeBatch(store)

  batch.update(householdReference, {
    members: arrayUnion(user.uid),
  })

  batch.set(
    profileReference,
    {
      householdId,
    },
    {
      merge: true,
    },
  )

  await batch.commit()
}

export async function addShoppingItem(
  user: User,
  householdId: string,
  alias: string,
  name: string,
  detail = '',
  category: Category = 'Household',
  quantity = 1,
) {
  const trimmedName = name.trim()
  const trimmedDetail = detail.trim()
  const trimmedAlias = alias.trim()

  if (
    !trimmedName ||
    trimmedName.length > 120
  ) {
    throw new Error(
      'Enter an item name under 120 characters.',
    )
  }

  if (trimmedDetail.length > 120) {
    throw new Error(
      'Keep the item details under 120 characters.',
    )
  }

  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 999
  ) {
    throw new Error(
      'Enter a quantity between 1 and 999.',
    )
  }

  const itemsReference = collection(
    database(),
    'households',
    householdId,
    'items',
  )

  await addDoc(itemsReference, {
    name: trimmedName,
    detail: trimmedDetail,
    category,
    quantity,
    completed: false,
    createdBy: user.uid,
    createdByAlias:
      trimmedAlias || 'Household member',
    createdAt: serverTimestamp(),
  })
}

export async function toggleShoppingItem(
  householdId: string,
  item: ShoppingItem,
) {
  const itemReference = doc(
    database(),
    'households',
    householdId,
    'items',
    item.id,
  )

  await updateDoc(itemReference, {
    completed: !item.completed,
  })
}

export async function changeShoppingItemQuantity(
  householdId: string,
  item: ShoppingItem,
  amount: number,
) {
  const nextQuantity = Math.max(
    1,
    Math.min(999, item.quantity + amount),
  )

  if (nextQuantity === item.quantity) {
    return
  }

  const itemReference = doc(
    database(),
    'households',
    householdId,
    'items',
    item.id,
  )

  await updateDoc(itemReference, {
    quantity: nextQuantity,
  })
}

export async function removeShoppingItem(
  householdId: string,
  itemId: string,
) {
  const itemReference = doc(
    database(),
    'households',
    householdId,
    'items',
    itemId,
  )

  await deleteDoc(itemReference)
}

export async function editShoppingItem(
  householdId: string,
  itemId: string,
  name: string,
  detail: string,
  category: Category,
) {
  const trimmedName = name.trim()
  const trimmedDetail = detail.trim()

  if (
    !trimmedName ||
    trimmedName.length > 120
  ) {
    throw new Error(
      'Enter an item name under 120 characters.',
    )
  }

  if (trimmedDetail.length > 120) {
    throw new Error(
      'Keep the item details under 120 characters.',
    )
  }

  const itemReference = doc(
    database(),
    'households',
    householdId,
    'items',
    itemId,
  )

  await updateDoc(itemReference, {
    name: trimmedName,
    detail: trimmedDetail,
    category,
  })
}