import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, url }) {
    // Get the secret key from environment
    const secretKey = env.STRIPE_SECRET_KEY;

    if (!secretKey || secretKey === 'sk_test_YOUR_KEY_HERE') {
        console.error('Stripe secret key not found in environment variables');
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
        const { campaignId, userId } = await request.json();

        // Fixed price for sample letter: $15.00
        const samplePrice = 1500; // $15.00 in cents

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Sample Wax-Sealed Letter',
                            description: 'Custom wax seal stamp creation + 1 personalized letter',
                            images: ['https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400'],
                        },
                        unit_amount: samplePrice,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${url.origin}/sample/success?session_id={CHECKOUT_SESSION_ID}&campaign_id=${campaignId}`,
            cancel_url: `${url.origin}/sample/payment?campaign_id=${campaignId}`,
            metadata: {
                campaignId: campaignId || '',
                userId: userId || '',
                letterCount: '1',
                isSample: 'true'
            },
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
