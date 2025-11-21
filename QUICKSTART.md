# Quick Start Guide

Get your Wax Letter app up and running in minutes!

## 🚀 Fast Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it **`wax-letter`**
4. Follow the wizard (Analytics optional)
5. Click the **Web icon (</>)** to add a web app
6. Copy the configuration values

### Step 3: Configure Environment

1. Copy the template file:
   ```bash
   cp .env.local.template .env.local
   ```
   
2. Edit `.env.local` and paste your Firebase config values

### Step 4: Enable Firebase Services

In the Firebase Console:

1. **Firestore Database**
   - Click "Create database"
   - Choose "Start in test mode"
   - Select a location
   - Click "Enable"

2. **Storage**
   - Click "Get started"
   - Use test mode
   - Same location as Firestore
   - Click "Done"

### Step 5: Login and Initialize

```bash
npm run firebase:login
npm run firebase:init
```

When prompted:
- Select: **Firestore, Storage** (and optionally Hosting)
- Choose: **Use an existing project** → wax-letter
- Use default file names (just press Enter)

### Step 6: Deploy Rules

```bash
npm run firebase:deploy:rules
```

### Step 7: Start Development!

```bash
npm run dev
```

Open http://localhost:5173 and start creating campaigns! 🎉

---

## 📝 What You Get

- ✅ Firebase Firestore for data storage
- ✅ Firebase Storage for image uploads
- ✅ Auto-save functionality
- ✅ Cross-device sync
- ✅ Secure default rules

## 🛠️ Useful Commands

```bash
# Development
npm run dev                    # Start dev server

# Firebase
npm run firebase:login        # Login to Firebase
npm run firebase:init         # Initialize Firebase project
npm run firebase:deploy       # Build and deploy everything
npm run firebase:deploy:rules # Deploy only security rules
npm run firebase:emulators    # Run local Firebase emulators

# Production
npm run build                 # Build for production
npm run preview              # Preview production build
```

## 🆘 Need Help?

- **Full Setup Guide**: See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- **Troubleshooting**: Check the [troubleshooting section](./FIREBASE_SETUP.md#troubleshooting)
- **Firebase Docs**: https://firebase.google.com/docs

## 🔒 Security Note

⚠️ The default rules allow open access for development. For production, add Firebase Authentication and update the security rules!

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md#step-10-update-security-rules-production) for details.

