# Firebase Setup Guide for Wax Letter

This guide will walk you through setting up Firebase Firestore for the Wax Letter application.

## Prerequisites

- A Google account
- Node.js and npm installed
- Firebase CLI installed (already done via `npm install -D firebase-tools`)

## Step 1: Create Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: **`wax-letter`** (or `wax_letter` if dashes aren't allowed)
4. Click "Continue"
5. Choose whether to enable Google Analytics (optional)
6. Click "Create project"
7. Wait for the project to be created, then click "Continue"

## Step 2: Register Your Web App

1. In your Firebase project, click the **Web icon** (</>) to add a web app
2. Enter an app nickname: **`Wax Letter Web App`**
3. Check "Also set up Firebase Hosting" (optional but recommended)
4. Click "Register app"
5. You'll see your Firebase configuration - **keep this page open!**

## Step 3: Configure Environment Variables

1. In your project root, create a file called **`.env.local`**
2. Copy the following template and fill in the values from the Firebase Console:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=wax-letter.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=wax-letter
VITE_FIREBASE_STORAGE_BUCKET=wax-letter.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

3. Replace the placeholder values with the actual values from your Firebase config:
   - Find these in Firebase Console > Project Settings > General > Your apps > SDK setup and configuration

## Step 4: Enable Firestore Database

1. In Firebase Console, go to **"Build" > "Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in test mode"** (we'll use custom rules later)
4. Choose a Firestore location (e.g., `us-central1`)
5. Click "Enable"

## Step 5: Enable Firebase Storage

1. In Firebase Console, go to **"Build" > "Storage"**
2. Click **"Get started"**
3. Click **"Next"** (use test mode for now)
4. Choose a location (same as Firestore is recommended)
5. Click "Done"

## Step 6: Initialize Firebase CLI (Login)

Run the following command in your terminal and follow the login prompts:

```bash
npx firebase login
```

This will open a browser window for you to authenticate with your Google account.

## Step 7: Initialize Firebase in Your Project

Run the following command:

```bash
npx firebase init
```

When prompted:
- **"Which Firebase features do you want to set up?"**
  - Select: `Firestore`, `Storage`, and optionally `Hosting`
  - Use arrow keys and spacebar to select, then press Enter
  
- **"Please select an option:"**
  - Choose: **"Use an existing project"**
  - Select your `wax-letter` project
  
- **"What file should be used for Firestore Rules?"**
  - Press Enter to use `firestore.rules` (already created)
  
- **"What file should be used for Firestore indexes?"**
  - Press Enter to use `firestore.indexes.json` (already created)
  
- **"What file should be used for Storage Rules?"**
  - Press Enter to use `storage.rules` (already created)

- **If you selected Hosting:**
  - "What do you want to use as your public directory?" → Enter `build`
  - "Configure as a single-page app?" → `Yes`
  - "Set up automatic builds and deploys with GitHub?" → `No` (optional)

## Step 8: Deploy Firestore Rules and Storage Rules

Deploy the security rules to Firebase:

```bash
npx firebase deploy --only firestore:rules
npx firebase deploy --only storage:rules
```

## Step 9: Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:5173` (or the port shown)

3. Go through the campaign creation flow:
   - Upload a stamp image
   - Add some addresses
   - Compose a letter

4. Check the Firebase Console:
   - Go to **Firestore Database** → You should see a `campaigns` collection
   - Go to **Storage** → You should see uploaded stamp images

## Step 10: Update Security Rules (Production)

⚠️ **Important:** The current rules allow anyone to read/write data. For production, you should:

1. Add Firebase Authentication
2. Update `firestore.rules` and `storage.rules` to require authentication
3. Redeploy rules:
   ```bash
   npx firebase deploy --only firestore:rules,storage:rules
   ```

## Troubleshooting

### Error: "Firebase config is missing"
- Make sure you created `.env.local` with all the required variables
- Restart your dev server after creating `.env.local`

### Error: "Missing or insufficient permissions"
- Check your Firestore rules in the Firebase Console
- Make sure they're deployed: `npx firebase deploy --only firestore:rules`

### Images not uploading
- Check Storage rules in the Firebase Console
- Make sure Storage is enabled for your project
- Deploy storage rules: `npx firebase deploy --only storage:rules`

### Can't login with Firebase CLI
- Make sure you're not behind a restrictive firewall
- Try: `npx firebase login --no-localhost`

## How the Integration Works

### Data Storage
- **Campaigns** are stored as documents in the `campaigns` collection
- Each campaign includes:
  - `stampImage`: Base64 data URL for local preview
  - `stampImageUrl`: Firebase Storage URL for the uploaded image
  - `addresses`: Array of recipient addresses
  - `letter`: Letter content and personalization
  - `currentStep`: Current progress in the workflow
  - `status`: Campaign status (draft, ready, sent)
  - `createdAt` / `updatedAt`: Timestamps

### Auto-Save
- Changes are saved to `localStorage` immediately (fast)
- Changes are synced to Firestore after 2 seconds of inactivity (debounced)
- When you reload the page, data loads from localStorage first (instant), then syncs from Firestore (background)

### Campaign ID
- When you start a campaign, a unique ID is generated
- This ID is stored in localStorage as `waxseal_campaignId`
- The same campaign will resume even if you close and reopen the browser

## Optional: Deploy to Firebase Hosting

To deploy your app to Firebase Hosting:

```bash
npm run build
npx firebase deploy --only hosting
```

Your app will be live at: `https://wax-letter.web.app`

---

## Need Help?

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Get Started](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Storage](https://firebase.google.com/docs/storage)

