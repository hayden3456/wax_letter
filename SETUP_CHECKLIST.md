# Firebase Setup Checklist ✓

Use this checklist to complete your Firebase setup step-by-step.

## ☐ Step 1: Create Firebase Project

- [ ] Go to https://console.firebase.google.com/
- [ ] Click "Add project" or "Create a project"
- [ ] Enter project name: **`wax-letter`**
- [ ] Complete the setup wizard
- [ ] Click on the Web icon (</>) to add a web app
- [ ] Register app with nickname: "Wax Letter Web App"

## ☐ Step 2: Get Firebase Configuration

- [ ] Copy the Firebase config object from the console
- [ ] Keep the page open (you'll need these values)

The config looks like this:
```javascript
{
  apiKey: "AIza...",
  authDomain: "wax-letter.firebaseapp.com",
  projectId: "wax-letter",
  storageBucket: "wax-letter.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

## ☐ Step 3: Create Environment File

- [ ] Create a file named `.env.local` in the project root
- [ ] Add the following content (replace with your actual values):

```env
VITE_FIREBASE_API_KEY=your_api_key_from_step_2
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_from_step_2
VITE_FIREBASE_PROJECT_ID=wax-letter
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_from_step_2
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_from_step_2
VITE_FIREBASE_APP_ID=your_app_id_from_step_2
```

- [ ] Save the file

## ☐ Step 4: Enable Firestore

- [ ] In Firebase Console, navigate to **Build > Firestore Database**
- [ ] Click "Create database"
- [ ] Select **"Start in test mode"**
- [ ] Choose a location (e.g., `us-central1`, `europe-west1`, etc.)
- [ ] Click "Enable"
- [ ] Wait for Firestore to initialize

## ☐ Step 5: Enable Storage

- [ ] In Firebase Console, navigate to **Build > Storage**
- [ ] Click "Get started"
- [ ] Click "Next" to use test mode
- [ ] Choose the **same location** as Firestore
- [ ] Click "Done"

## ☐ Step 6: Login to Firebase CLI

- [ ] Open your terminal in the project directory
- [ ] Run: `npm run firebase:login`
- [ ] A browser window will open
- [ ] Sign in with your Google account
- [ ] Allow Firebase CLI access
- [ ] You should see "Success!" in the terminal

## ☐ Step 7: Initialize Firebase Project

- [ ] Run: `npm run firebase:init`
- [ ] When asked "Which Firebase features?": Select **Firestore** and **Storage**
  - Use Space to select, Enter to confirm
- [ ] When asked "Please select an option": Choose **"Use an existing project"**
- [ ] Select **wax-letter** from the list
- [ ] For Firestore Rules: Press Enter (uses `firestore.rules`)
- [ ] For Firestore Indexes: Press Enter (uses `firestore.indexes.json`)
- [ ] For Storage Rules: Press Enter (uses `storage.rules`)
- [ ] If asked about Hosting, you can select it or skip (optional)

## ☐ Step 8: Deploy Security Rules

- [ ] Run: `npm run firebase:deploy:rules`
- [ ] Wait for deployment to complete
- [ ] You should see "Deploy complete!"

## ☐ Step 9: Start Development Server

- [ ] Run: `npm run dev`
- [ ] Open your browser to the URL shown (usually http://localhost:5173)
- [ ] Open browser DevTools (F12)
- [ ] Check the Console tab

## ☐ Step 10: Verify Integration

Look for these messages in the browser console:

- [ ] `✅ Firebase configuration detected`
- [ ] `📊 Project ID: wax-letter`

If you see these, you're all set! If not:
- [ ] Check that `.env.local` exists and has the correct values
- [ ] Restart the dev server (`Ctrl+C` then `npm run dev`)

## ☐ Step 11: Test Campaign Creation

- [ ] Click "Start Your Campaign" on the homepage
- [ ] Upload a stamp image (SVG, PNG, or JPG)
- [ ] Click "Next: Add Addresses"
- [ ] Add at least one address (manually or via CSV)
- [ ] Click "Next: Write Letter"

## ☐ Step 12: Verify Data in Firebase

- [ ] Go back to Firebase Console
- [ ] Navigate to **Firestore Database**
- [ ] You should see a `campaigns` collection
- [ ] Click on it to see your campaign data
- [ ] Navigate to **Storage**
- [ ] You should see uploaded stamp images in `campaigns/[campaign-id]/stamp`

## ✅ All Done!

If you checked all the boxes above, your Firebase integration is complete!

---

## 🆘 Troubleshooting

### ⚠️ "Firebase configuration incomplete"

**Solution**: 
1. Check that `.env.local` exists
2. Verify all values are correct (no "your_" or "_here" placeholders)
3. Restart dev server

### ⚠️ "Missing or insufficient permissions"

**Solution**:
1. Make sure Firestore is enabled in Firebase Console
2. Deploy rules: `npm run firebase:deploy:rules`
3. Check `firestore.rules` file exists

### ⚠️ Images not uploading

**Solution**:
1. Make sure Storage is enabled in Firebase Console
2. Deploy rules: `npm run firebase:deploy:rules`
3. Check `storage.rules` file exists

### ⚠️ "Cannot run login in non-interactive mode"

**Solution**:
- Use a regular terminal (not integrated in some IDEs)
- Try: `npx firebase login --no-localhost`
- Or login via browser: https://firebase.google.com/

---

## 📚 Additional Resources

- [Quick Start Guide](./QUICKSTART.md) - Fast setup guide
- [Firebase Setup Guide](./FIREBASE_SETUP.md) - Detailed instructions
- [Integration Summary](./FIREBASE_INTEGRATION.md) - What was done
- [Firebase Documentation](https://firebase.google.com/docs)

## 🎉 What's Next?

Once setup is complete, you can:
- Create unlimited campaigns
- Data syncs across devices automatically
- Deploy to Firebase Hosting: `npm run firebase:deploy`
- Add authentication for production security
- Customize Firestore rules for your needs

Happy mailing! ✉️

