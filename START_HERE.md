# 🎉 START HERE - Stripe Payment Setup

## ✅ What's Already Done

I've completed the full Stripe payment integration for your wax letter campaign! Here's what's been set up:

### New Pages Created:
- **Payment Page**: `/campaign/payment` - Shows pricing and checkout button
- **Success Page**: `/campaign/success` - Confirms payment and shows next steps
- **API Endpoint**: `/api/create-checkout` - Creates Stripe checkout sessions

### Flow Updated:
```
Upload Stamp → Add Addresses → Compose Letter → Review 
    → 💳 PAYMENT ($3/letter) → ✅ Success → Processing
```

### Packages Installed:
- ✅ stripe (v20.0.0)
- ✅ @stripe/stripe-js (v8.5.2)

## 🚀 What YOU Need to Do (5 Minutes)

### Step 1: Get Your Stripe Test Keys

1. **Sign up/Login**: Go to https://stripe.com
2. **Get Keys**: Go to https://dashboard.stripe.com/test/apikeys
3. **Copy Both Keys**:
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...` (click "Reveal test key")

### Step 2: Add Keys to .env.local

Open your existing `.env.local` file and **add these 2 lines**:

```bash
# Add to the end of .env.local file:
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_PASTE_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_PASTE_YOUR_SECRET_KEY_HERE
```

**IMPORTANT**: Replace `PASTE_YOUR_KEY_HERE` with your actual keys!

### Step 3: Restart Your Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 4: Test the Payment

1. Open http://localhost:5173
2. Create a test campaign:
   - Upload any image for wax seal
   - Add 2-3 test addresses (fake data is fine)
   - Write a short letter
   - Click through to "Review"
3. Click "Continue to Payment"
4. Verify price shows correctly (e.g., 2 letters = $6.00)
5. Click "Proceed to Payment"
6. On Stripe checkout, enter:
   - **Card**: `4242 4242 4242 4242`
   - **Expiry**: `12/25`
   - **CVC**: `123`
   - **ZIP**: `12345`
7. Click "Pay"
8. You should see the success page! 🎉

### Step 5: Verify in Stripe

Go to https://dashboard.stripe.com/test/payments - you'll see your test payment!

## 💰 Pricing Details

- **$3.00 per letter** (automatically calculated)
- Includes: Personalized content + Custom wax seal + Printing + Postage
- Examples:
  - 1 letter = $3.00
  - 5 letters = $15.00
  - 10 letters = $30.00

## 🧪 Test Cards for Different Scenarios

| Card Number | What Happens |
|-------------|--------------|
| 4242 4242 4242 4242 | ✅ Payment succeeds |
| 4000 0000 0000 0002 | ❌ Payment declined |
| 4000 0025 0000 3155 | 🔐 Requires 3D Secure auth |
| 4000 0000 0000 9995 | 💸 Insufficient funds |

All test cards:
- Expiry: Any future date
- CVC: Any 3 digits  
- ZIP: Any 5 digits

More: https://stripe.com/docs/testing

## 📚 Additional Guides

If you need more details:

1. **QUICKSTART_STRIPE.md** - Detailed 5-minute setup guide
2. **STRIPE_SETUP.md** - Complete documentation with troubleshooting
3. **STRIPE_INTEGRATION_COMPLETE.md** - Technical details of what was built
4. **TODO_STRIPE_SETUP.md** - Checklist format

## 🐛 Common Issues

### "Invalid API key" error
→ Check that you copied the keys correctly (no spaces)
→ Make sure you restarted the dev server

### Payment page shows "pk_test_YOUR_KEY_HERE"
→ You need to create/edit `.env.local` and add the keys
→ Restart dev server after adding keys

### Can't find API keys in Stripe
→ Make sure you're in "Test Mode" (toggle in top-right of Stripe dashboard)
→ Go directly to: https://dashboard.stripe.com/test/apikeys

## 🔒 Security Notes

- ✅ Test keys are safe for development
- ✅ `.env.local` is already in `.gitignore`
- ✅ Secret key never exposed to browser
- ✅ All payments in test mode are FREE

## 🎯 Quick Checklist

- [ ] Got Stripe account
- [ ] Copied both API keys
- [ ] Added keys to `.env.local`
- [ ] Restarted dev server
- [ ] Tested payment with 4242 card
- [ ] Saw success page
- [ ] Verified payment in Stripe dashboard

## ✨ That's It!

Once you complete the steps above, your payment system is **fully functional**!

Test mode is completely free, so test as much as you want. When you're ready for production, just swap in your live API keys.

---

**Questions?** Check the detailed guides or Stripe's documentation at https://stripe.com/docs

