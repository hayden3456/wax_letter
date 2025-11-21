# Wax Letter - Bulk Mailing with Custom Wax Seals

A modern web application for creating elegant bulk mailing campaigns with custom wax-sealed letters. Built with SvelteKit and Firebase.

## Features

- 📝 Multi-step campaign creation workflow
- 🎨 Custom wax seal design upload (SVG, PNG, JPG)
- 📊 CSV address import with smart parsing
- ✍️ Letter composition with personalization
- 💾 Auto-save to Firebase Firestore
- 💳 Stripe payment integration ($3 per letter)
- 📱 Responsive design
- 🔄 Real-time state synchronization

## Prerequisites

- Node.js 18+ 
- npm or pnpm
- A Firebase account (free tier works fine)

## Getting Started

### 1. Install Dependencies

```sh
npm install
```

### 2. Set Up Firebase

This application uses Firebase Firestore for data storage and Firebase Storage for image uploads. Follow the detailed setup guide:

**👉 See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for complete Firebase configuration instructions.**

Quick summary:
1. Create a Firebase project named `wax-letter`
2. Enable Firestore and Storage
3. Create `.env.local` with your Firebase credentials
4. Deploy Firestore and Storage rules

### 3. Set Up Stripe Payments

This application uses Stripe for payment processing. Follow the detailed setup guide:

**👉 See [STRIPE_SETUP.md](./STRIPE_SETUP.md) for complete Stripe configuration instructions.**

Quick summary:
1. Create a Stripe account at https://stripe.com
2. Get your test API keys from https://dashboard.stripe.com/test/apikeys
3. Add Stripe keys to your `.env.local` file:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
   STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
   ```
4. Use test card `4242 4242 4242 4242` for testing

### 4. Start Development Server

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

The app will be available at `http://localhost:5173`

## Project Structure

```
wax_letter/
├── src/
│   ├── lib/
│   │   ├── components/       # Svelte components
│   │   ├── firebase.js       # Firebase initialization
│   │   ├── firestoreService.js  # Firestore CRUD operations
│   │   └── stores.js         # Svelte stores with Firebase sync
│   └── routes/               # SvelteKit routes
├── firebase.json             # Firebase configuration
├── firestore.rules           # Firestore security rules
├── storage.rules             # Storage security rules
└── FIREBASE_SETUP.md         # Detailed Firebase setup guide
```

## Building for Production

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

## Deploying

### Deploy to Firebase Hosting

```sh
npm run build
npx firebase deploy
```

Your app will be live at `https://wax-letter.web.app`

### Deploy to Other Platforms

To deploy to other platforms, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## How It Works

### Campaign Workflow

1. **Step 1: Upload Stamp** - Upload your logo or design for the wax seal
2. **Step 2: Add Addresses** - Import recipients via CSV or manual entry
3. **Step 3: Compose Letter** - Write your personalized message
4. **Step 4: Review** - Preview your campaign details
5. **Payment** - Pay $3 per letter via Stripe Checkout
6. **Success** - Campaign submitted for processing

### Data Persistence

- **Local Storage**: Instant save for immediate persistence
- **Firestore**: Cloud sync for cross-device access and backup
- **Auto-save**: Changes are automatically saved after 2 seconds of inactivity
- **Campaign ID**: Each campaign gets a unique ID for easy retrieval

### Personalization

Letters support template variables:
- `{{FirstName}}` - Recipient's first name
- `{{LastName}}` - Recipient's last name
- `{{FullName}}` - Recipient's full name

## Development

### Tech Stack

- **Frontend**: SvelteKit 2.x, Svelte 5.x
- **Backend**: Firebase Firestore, Firebase Storage
- **Styling**: Custom CSS
- **Build Tool**: Vite

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run Svelte type checking

## Security Notes

⚠️ **Important**: The default Firestore and Storage rules allow open access for development. For production:

1. Implement Firebase Authentication
2. Update security rules to require authentication
3. Add user-based access control
4. Deploy updated rules: `npx firebase deploy --only firestore:rules,storage:rules`

## Troubleshooting

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md#troubleshooting) for common issues and solutions.

## License

MIT
