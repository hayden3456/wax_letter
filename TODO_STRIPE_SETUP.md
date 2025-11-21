# ✅ YOUR TO-DO LIST: Stripe Setup

## What I Need to Do (5 Minutes Total)

### ☐ Task 1: Get Stripe Account & Keys (2 minutes)

1. Go to: **https://stripe.com** and sign up (if you don't have account)
2. Go to: **https://dashboard.stripe.com/test/apikeys**
3. Copy these two keys:
   - Publishable key (starts with `pk_test_...`)
   - Secret key (starts with `sk_test_...`) - click "Reveal test key"

### ☐ Task 2: Add Keys to .env.local (1 minute)

Open your `.env.local` file and **add these 2 lines at the end**:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_PASTE_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_PASTE_YOUR_SECRET_KEY_HERE
```

Save the file.

### ☐ Task 3: Restart Dev Server (1 minute)

In your terminal:
- Press `Ctrl+C` to stop the current server
- Run: `npm run dev`
- Wait for it to start

### ☐ Task 4: Test It! (1 minute)

1. Open: **http://localhost:5173**
2. Create a test campaign (use dummy data)
3. Get to the payment page
4. Click "Proceed to Payment"
5. Enter test card: **4242 4242 4242 4242**
   - Expiry: **12/25**
   - CVC: **123**
   - ZIP: **12345**
6. Click Pay
7. Should see success page! 🎉

### ☐ Task 5: Verify Payment (30 seconds)

Go to: **https://dashboard.stripe.com/test/payments**

You should see your test payment listed!

---

## 📋 That's It!

Once you complete these 5 tasks, your payment system is fully functional!

## 🆘 Need More Help?

- **Quick Guide**: See `QUICKSTART_STRIPE.md`
- **Detailed Guide**: See `STRIPE_SETUP.md`
- **Complete Info**: See `STRIPE_INTEGRATION_COMPLETE.md`

