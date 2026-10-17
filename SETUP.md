# Spree setup — phase 2

These steps set up the project on your computer and connect your own Firebase project. You only need to do the Firebase Console steps once.

## 1. Open the project in VS Code

1. Extract the `spree-vite.zip` download.
2. Open VS Code → **File → Open Folder…** → choose the extracted `spree-vite` folder (the folder containing `package.json`).
3. Open **Terminal → New Terminal**. All commands below run in this terminal, in that folder.
4. Check Node.js: `node --version`. Vite needs Node.js 20.19+ or 22.12+; if your version is older, install a current LTS release from [nodejs.org](https://nodejs.org/en/download) and reopen VS Code.
5. Run `npm install`. This reads `package.json` and installs React, Vite, TypeScript and Firebase into `node_modules`. Allow it to finish.
6. Run `npm run dev`. Open the local address that Vite prints (usually `http://localhost:5173/`). You should see Spree and an editable **sample** shopping list.

`npm run dev` keeps running while you work. Press **Ctrl+C** in its terminal to stop it. You can use VS Code's built-in TypeScript support; no extension is required.

## 2. Create the Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) and sign in with the Google account you want to own Spree.
2. Choose **Create a project**, enter a project name such as `Spree`, and follow the prompts. Analytics is optional for this learning project.
3. On the project overview, choose the **Web** app icon (`</>`). Enter `spree-web` as the app nickname and register it. You can leave the Firebase Hosting checkbox off for now.
4. In the **Firebase SDK setup and configuration** section, select **Config**. Keep this browser tab open so you can copy the four values from `firebaseConfig`.

Firebase Console may change its menu wording, but the Web app's configuration also appears in **Project settings → Your apps → SDK setup and configuration → Config**.

## 3. Enable email/password accounts

1. In Firebase Console, open **Build → Authentication → Get started**.
2. Open **Sign-in method**, select **Email/Password**, enable the first **Email/Password** switch and save. You do not need the email-link option.
3. For local development, check **Authentication → Settings → Authorised domains**. Add `localhost` if it is missing. Add your actual deployment domain when we publish this app.

## 4. Connect Spree

1. In VS Code, make a copy of `.env.example` and name it `.env.local` in the project root. Keep the original example file.
2. Paste the corresponding values from Firebase's `firebaseConfig` on the right of each equals sign:

```dotenv
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-app-id
```

These are the Firebase **Web app configuration** values. Do not paste a service account JSON or private key. The web config is visible to browsers by design; Firebase Security Rules will protect household data when we add Firestore.

3. Stop the development server with **Ctrl+C**, then run `npm run dev` again. Vite reads `.env.local` at startup.
4. Spree should now show the **Welcome to Spree** sign-in screen.

`.env.local` stays on your computer and is ignored by Git. If you share code with someone, share `.env.example` and let them use their own config.

## 5. Try the account flow

1. Select **New here? Create an account** and register with an email address and a password of at least six characters.
2. The sample list should appear. Select **Sign out**, then sign back in.
3. Select **Forgot your password?** and check your email for Firebase's reset message. Check spam if needed.
4. Run `npm run build` in a second VS Code terminal. This checks TypeScript and creates the production files in `dist/`.

The sample list is **not saved or shared yet**. Adding an item now only changes React state in that browser tab. The next phase will create households and Firestore rules, then replace the sample list with live data.

## If something does not work

| What you see | Check |
| --- | --- |
| `node` is not recognised | Install Node.js, then close and reopen VS Code. |
| The sample list still appears instead of sign-in | Check the filename `.env.local`, all four values, and restart `npm run dev`. |
| “Enable Email/Password in Firebase Authentication first” | Turn on the Email/Password provider under Authentication → Sign-in method. |
| `auth/unauthorized-domain` | Add `localhost` to Authentication → Settings → Authorised domains. |
| `auth/invalid-api-key` | Compare `VITE_FIREBASE_API_KEY` with the Firebase Web app config. |
| The list resets after refresh | Expected for this phase; Firestore comes next. |
