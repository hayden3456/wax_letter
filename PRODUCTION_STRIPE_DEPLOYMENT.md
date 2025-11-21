# 🚀 Production Stripe Deployment Guide

## ⚠️ Critical Issue: Firebase Hosting Limitation

**Firebase Hosting is static-only** - it cannot run server-side code. Your `/api/create-checkout` endpoint needs a server to execute, so you have **two options**:

### Option 1: Firebase Functions (Recommended)
Deploy your API routes as Firebase Functions while hosting the frontend on Firebase Hosting.

### Option 2: Different Hosting Platform
Use a platform that supports server-side rendering (Vercel, Netlify, Cloudflare Pages, etc.)

---

## 📋 Step-by-Step: Production Stripe Setup

### Step 1: Get Your Production Stripe Keys

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com
2. **Toggle to Live Mode**: Click the toggle in the top right (switch from "Test mode" to "Live mode")
3. **Get Live Keys**: Go to https://dashboard.stripe.com/apikeys
4. **Copy Both Keys**:
   - **Publishable key** (starts with `pk_live_...`)
   - **Secret key** (starts with `sk_live_...`) - Click "Reveal live key"

⚠️ **IMPORTANT**: Live keys process REAL payments. Test thoroughly first!

---

### Step 2: Update Your Code for Production

You'll need to update your environment variables. However, **`.env.local` files are NOT deployed to Firebase**. You need to configure environment variables in Firebase.

---

## 🔧 Option 1: Firebase Functions Setup (Recommended)

### A. Install Firebase Functions Adapter

```bash
npm install @sveltejs/adapter-node
# OR for Firebase Functions specifically:
npm install firebase-functions firebase-admin
```

### B. Update `svelte.config.js`

For Firebase Functions, you'll need to use `adapter-node` or create a custom setup. However, the easiest approach is to:

1. **Keep your SvelteKit app as-is** for the frontend
2. **Create a separate Firebase Function** for your API endpoint

### C. Create Firebase Function for Stripe

Create a `functions` directory:

```bash
firebase init functions
```

Then create `functions/src/index.js`:

```javascript
const functions = require('firebase-functions');
const stripe = require('stripe')(functions.config().stripe.secret_key);

exports.createCheckout = functions.https.onRequest(async (req, res) => {
  // Handle CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { campaignId, letterCount, userId } = req.body;
    const pricePerLetter = 300; // $3.00 in cents
    const totalAmount = pricePerLetter * letterCount;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Wax Letter Campaign',
            description: `${letterCount} personalized wax-sealed letter${letterCount > 1 ? 's' : ''}`,
          },
          unit_amount: pricePerLetter,
        },
        quantity: letterCount,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin || 'https://your-domain.web.app'}/campaign/success?session_id={CHECKOUT_SESSION_ID}&campaign_id=${campaignId}`,
      cancel_url: `${req.headers.origin || 'https://your-domain.web.app'}/campaign/payment?campaign_id=${campaignId}`,
      metadata: {
        campaignId: campaignId || '',
        userId: userId || '',
        letterCount: letterCount.toString()
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### D. Set Environment Variables in Firebase

```bash
# Set Stripe secret key
firebase functions:config:set stripe.secret_key="sk_live_YOUR_LIVE_SECRET_KEY"

# Set other environment variables if needed
firebase functions:config:set stripe.publishable_key="pk_live_YOUR_LIVE_PUBLISHABLE_KEY"
```

### E. Update Frontend to Use Firebase Function

Update `src/routes/campaign/payment/+page.svelte`:

```javascript
// Change from:
const response = await fetch('/api/create-checkout', {

// To:
const response = await fetch('https://us-central1-wax-letter.cloudfunctions.net/createCheckout', {
```

### F. Deploy

```bash
# Build frontend
npm run build

# Deploy functions
firebase deploy --only functions

# Deploy hosting
firebase deploy --only hosting
```

---

## 🔧 Option 2: Use Vercel/Netlify (Easier Alternative)

These platforms support SvelteKit API routes natively and handle environment variables easily.

### For Vercel:

1. **Install Vercel CLI**: `npm i -g vercel`
2. **Deploy**: `vercel --prod`
3. **Set Environment Variables** in Vercel Dashboard:
   - Go to your project → Settings → Environment Variables
   - Add:
     - `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
     - `STRIPE_SECRET_KEY` = `sk_live_...`
4. **Redeploy** after adding env vars

### For Netlify:

1. **Install Netlify CLI**: `npm i -g netlify-cli`
2. **Update `svelte.config.js`** to use `@sveltejs/adapter-netlify`
3. **Deploy**: `netlify deploy --prod`
4. **Set Environment Variables** in Netlify Dashboard:
   - Site settings → Environment variables
   - Add your Stripe keys

---

## 🔧 Option 3: Keep Current Setup (If Using Cloud Run/App Engine)

If `adapter-auto` detects a platform that supports server-side rendering, you can:

1. **Set environment variables** in your hosting platform's dashboard
2. **Update keys** from test to live
3. **Deploy normally**

---

## ✅ Environment Variables Summary

### What Gets Deployed Automatically?
- ❌ **`.env.local`** - NEVER deployed (local only)
- ❌ **`.env`** - Usually not deployed (check your `.gitignore`)

### What You Need to Do:
- ✅ **Set environment variables in your hosting platform**
- ✅ **Use production keys** (`pk_live_` and `sk_live_`)
- ✅ **Update frontend code** to use the correct API endpoint

---

## 🔐 Security Checklist

- [ ] Use **live Stripe keys** (`pk_live_` and `sk_live_`)
- [ ] **Never commit** `.env.local` or `.env` files
- [ ] Set environment variables in your hosting platform
- [ ] Test with a small real transaction first
- [ ] Enable Stripe webhooks for payment confirmation
- [ ] Set up proper error handling and logging

---

## 🧪 Testing Production

Before going fully live:

1. **Test with a real card** (your own) for a small amount
2. **Verify payment appears** in Stripe Dashboard (Live mode)
3. **Check webhooks** are working (if configured)
4. **Monitor logs** for any errors

---

## 📝 Quick Reference

### Current Setup Issues:
- ❌ Firebase Hosting = Static only (no server-side code)
- ❌ `.env.local` = Not deployed
- ✅ API route needs server = Must use Functions or different platform

### Recommended Solution:
1. **Firebase Functions** for API routes
2. **Firebase Hosting** for frontend
3. **Environment variables** set via `firebase functions:config:set`

### Alternative Solution:
1. **Vercel/Netlify** (supports SvelteKit API routes natively)
2. **Environment variables** set in platform dashboard
3. **Simpler deployment** process

---

## 🆘 Need Help?

If you're unsure which approach to take:
- **Firebase Functions**: More complex but keeps everything in Firebase
- **Vercel/Netlify**: Easier setup, better SvelteKit support

Let me know which option you prefer and I can help you implement it!

