# Stripe Payment Setup Guide

This guide will help you set up Stripe payments for your Wax Letter campaign.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Node.js and npm installed
3. Your project running locally

## Setup Steps

### 1. Create a Stripe Account

1. Go to https://stripe.com and click "Sign up"
2. Complete the registration process
3. You'll be automatically in **Test Mode** - perfect for testing!

### 2. Get Your API Keys

1. Log in to your Stripe Dashboard
2. Go to: https://dashboard.stripe.com/test/apikeys
3. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`) - This is public and used in the browser
   - **Secret key** (starts with `sk_test_...`) - This is private and used on the server

### 3. Configure Your Environment Variables

1. Create a `.env` file in the root of your project (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Stripe keys:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
   STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY_HERE
   ```

3. **Important**: Never commit your `.env` file to git! It's already in `.gitignore`.

### 4. Restart Your Dev Server

After adding the environment variables, restart your development server:

```bash
npm run dev
```

## Testing the Payment Flow

### Using Test Cards

Stripe provides test card numbers that you can use in Test Mode:

#### Successful Payment
- **Card Number**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

#### Card Declined
- **Card Number**: `4000 0000 0000 0002`
- Use to test declined payments

#### Requires Authentication (3D Secure)
- **Card Number**: `4000 0025 0000 3155`
- Use to test 3D Secure authentication flow

More test cards: https://stripe.com/docs/testing#cards

### Testing Steps

1. Start your application: `npm run dev`
2. Create a campaign:
   - Upload a wax seal design
   - Add recipient addresses
   - Compose your letter
   - Review your campaign
3. Click "Continue to Payment"
4. On the payment page, verify the price is correct ($3 per letter)
5. Click "Proceed to Payment"
6. You'll be redirected to Stripe Checkout
7. Use a test card (4242 4242 4242 4242)
8. Complete the payment
9. You should be redirected to the success page

## Monitoring Payments

### View Test Payments

1. Go to: https://dashboard.stripe.com/test/payments
2. You'll see all test payments made
3. Click on any payment to see details

### Webhooks (Optional - for production)

For production, you'll want to set up webhooks to handle payment events:

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL (e.g., `https://yourdomain.com/api/webhook`)
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

## Going Live (Production)

When you're ready to accept real payments:

1. Complete your Stripe account activation
2. Switch to **Live Mode** in the Stripe Dashboard
3. Get your live API keys from: https://dashboard.stripe.com/apikeys
4. Update your production environment variables:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
   STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
   ```
5. **Important**: Keep your live secret key secure!

## Troubleshooting

### "Invalid API Key" Error
- Make sure you've copied the keys correctly (no extra spaces)
- Make sure you're using test keys for development
- Restart your dev server after updating `.env`

### Payment page shows "pk_test_YOUR_KEY_HERE"
- You haven't set the `VITE_STRIPE_PUBLISHABLE_KEY` in your `.env` file
- Make sure the variable name starts with `VITE_` (required for SvelteKit)

### Checkout session creation fails
- Check that `STRIPE_SECRET_KEY` is set correctly in `.env`
- Check the browser console and terminal for error messages
- Verify your Stripe account is active

### Payment succeeds but doesn't redirect
- Check that your success URL is correctly configured
- Look at the browser console for any errors
- Verify the campaign ID is being passed correctly

## Security Notes

1. **Never expose your secret key** - It should only be used server-side
2. **Use environment variables** - Never hardcode API keys
3. **Keep .env in .gitignore** - Don't commit secrets to version control
4. **Test mode first** - Always test in test mode before going live
5. **HTTPS in production** - Stripe requires HTTPS for live payments

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Test Cards: https://stripe.com/docs/testing

## Pricing Details

- **Price per letter**: $3.00 USD
- **Includes**: Personalized letter, custom wax seal, printing, and first-class postage
- **Minimum**: 1 letter
- **Maximum**: No limit

The total is calculated automatically based on the number of recipients in the campaign.

