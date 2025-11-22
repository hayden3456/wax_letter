import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, url }) {
    // Get the secret key from environment
    const secretKey = env.STRIPE_SECRET_KEY;
    
    if (!secretKey || secretKey === 'sk_test_YOUR_KEY_HERE') {
        console.error('❌ Stripe secret key not found in environment variables');
        return json(
            { error: 'Payment system configuration error. Please contact support.' },
            { status: 500 }
        );
    }
    
    // Initialize Stripe with your secret key
    const stripe = new Stripe(secretKey, {
        apiVersion: '2024-11-20.acacia'
    });

    try {
        const { campaignId, letterCount, userId } = await request.json();

        if (!letterCount || letterCount < 1) {
            return json({ error: 'Invalid letter count' }, { status: 400 });
        }

        // Calculate the price ($3 per letter)
        const pricePerLetter = 300; // $3.00 in cents
        const totalAmount = pricePerLetter * letterCount;

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Custom Wax Seal Letter Service',
                            description: `${letterCount} personalized wax-sealed letter${letterCount > 1 ? 's' : ''}`,
                            images: ['https://waxletter.com/waxletterlogo.png?w=400'], // Placeholder
                        },
                        unit_amount: pricePerLetter,
                    },
                    quantity: letterCount,
                },
            ],
            mode: 'payment',
            success_url: `${url.origin}/campaign/success?session_id={CHECKOUT_SESSION_ID}&campaign_id=${campaignId}`,
            cancel_url: `${url.origin}/campaign/payment?campaign_id=${campaignId}`,
            metadata: {
                campaignId: campaignId || '',
                userId: userId || '',
                letterCount: letterCount.toString()
            },
            // Optional: Prefill customer email if you have it
            // customer_email: userEmail,
        });

        return json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        return json(
            { error: error.message || 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}

