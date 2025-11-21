# 🚀 Quick Start: Stripe Payment Testing

Get your Stripe payment integration working in **5 minutes**!

## Step 1: Get Stripe Test Keys (2 minutes)

1. **Sign up for Stripe** (if you don't have an account):
   - Go to https://stripe.com
   - Click "Sign up" 
   - Complete the registration
   - You'll automatically be in **Test Mode** ✅

2. **Get your test API keys**:
   - Go to: https://dashboard.stripe.com/test/apikeys
   - You'll see two keys - copy both:
     - **Publishable key** (starts with `pk_test_...`)
     - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key" to see it

## Step 2: Create .env.local File (1 minute)

1. In your project root folder (`wax_letter`), create a file named `.env.local`

2. Copy this template and **replace with your actual keys**:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_PASTE_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_PASTE_YOUR_SECRET_KEY_HERE
```

3. Save the file

## Step 3: Restart Dev Server (1 minute)

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it:
npm run dev
```

## Step 4: Test Payment (1 minute)

1. Open your app: http://localhost:5173
2. Create a campaign:
   - Upload a wax seal design
   - Add 2-3 addresses (use dummy data)
   - Write a letter
   - Review your campaign
3. Click "Continue to Payment"
4. You'll see the payment page showing: **$6.00** (for 2 letters at $3 each)
5. Click "Proceed to Payment"
6. On the Stripe checkout page, use this **test card**:
   ```
   Card number: 4242 4242 4242 4242
   Expiry: 12/25 (any future date)
   CVC: 123 (any 3 digits)
   ZIP: 12345 (any 5 digits)
   ```
7. Click "Pay"
8. You should be redirected to the success page! 🎉

## Verify Payment in Stripe

1. Go to: https://dashboard.stripe.com/test/payments
2. You'll see your test payment listed
3. Click on it to see full details

## ✅ You're Done!

Your Stripe integration is working! 

### Next Steps:
- Try different test cards from the full list below
- View detailed setup guide: [STRIPE_SETUP.md](./STRIPE_SETUP.md)
- When ready for production, get live keys and switch to live mode

## 🧪 More Test Cards

Try these to test different scenarios:

| Scenario | Card Number | Description |
|----------|-------------|-------------|
| Success | 4242 4242 4242 4242 | Payment succeeds |
| Declined | 4000 0000 0000 0002 | Card declined |
| Insufficient funds | 4000 0000 0000 9995 | Insufficient funds |
| 3D Secure | 4000 0025 0000 3155 | Requires authentication |

Full list: https://stripe.com/docs/testing#cards

## ⚠️ Troubleshooting

### "Invalid API Key" error
- Make sure you copied the keys correctly (no extra spaces)
- Make sure you're using **test** keys (starting with `pk_test_` and `sk_test_`)
- Restart your dev server after creating `.env.local`

### Payment page shows "pk_test_YOUR_KEY_HERE"
- You forgot to create `.env.local` or didn't restart the server
- Make sure the variable is named exactly `VITE_STRIPE_PUBLISHABLE_KEY`

### Can't find the keys in Stripe Dashboard
- Make sure you're in **Test Mode** (toggle in top right)
- Go directly to: https://dashboard.stripe.com/test/apikeys

## 💡 Pro Tips

1. **Test Mode is Free**: You can test as many payments as you want - they're all free!
2. **Keep Test Keys Safe**: Even test keys should be kept private (don't commit `.env.local` to git)
3. **Monitor Payments**: Check the Stripe Dashboard to see all test payments
4. **Use Different Cards**: Test various scenarios with different test cards

## 📞 Need Help?

- Full Stripe Guide: [STRIPE_SETUP.md](./STRIPE_SETUP.md)
- Stripe Docs: https://stripe.com/docs
- Stripe Support: https://support.stripe.com

