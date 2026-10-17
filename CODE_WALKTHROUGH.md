# Read the Spree code

## The small picture

`index.html` provides the empty `<div id="root">`. `src/main.tsx` asks React to render `App` inside it. `App` chooses which screen to show based on Firebase's sign-in state.

## Where to look

| File | What it does |
| --- | --- |
| `package.json` | Lists installed packages and the `dev` and `build` commands. |
| `.env.example` | Lists the Firebase Web app values you need to copy into `.env.local`. |
| `src/lib/firebase.ts` | Reads those values, creates the Firebase app and gets its Authentication service. |
| `src/App.tsx` | Listens for sign-in changes and chooses the auth screen or shopping screen. |
| `src/AuthPage.tsx` | Sends registration, sign-in and reset requests to Firebase; shows friendly errors. |
| `src/ShoppingList.tsx` | Holds and edits the current sample items in React state. |
| `src/index.css` | Styles both the shopping screen and account screens. |

## Three key ideas

1. **React state:** `useState(startingItems)` gives the shopping screen an `items` value and a `setItems` function. Calling `setItems` with a new array causes React to redraw the list. This value disappears on refresh for now.
2. **TypeScript types:** `ShoppingItem` describes the fields each item must have. The editor flags an item that lacks a `name`, `quantity` or other required field before you run the app.
3. **Authentication observer:** `onAuthStateChanged` tells `App` which user is signed in, including after a refresh. Its returned unsubscribe function stops the listener when the component unmounts.

## A safe exercise

In `src/ShoppingList.tsx`, find `quickAdds`. Change `"Bread"` to a product you buy often. Save the file and watch Vite update the browser. Next, try adding an object to `startingItems` and use the TypeScript error messages to learn which fields it requires.

## What comes next

Firestore will hold households and items. The shopping screen's `setItems` calls will become database writes, and a live listener will update both household members' screens. We will write security rules before allowing household data into the database.
