<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { appState } from '$lib/stores';

    let loading = false;
    let error = null;

    $: letterCount = $appState.addresses.length;
    $: totalPrice = (letterCount * 3).toFixed(2);

    onMount(() => {
        // Check if we have campaign data
        if (letterCount === 0) {
            goto('/campaign/step/1');
            return;
        }
    });

    async function sendPaymentNotification() {
        // Send email notification using web3forms (same as contact form)
        const message = `Someone clicked the "PROCEED TO PAYMENT" button!

Campaign Details:
- Campaign ID: ${$appState.campaignId || 'N/A'}
- Campaign Name: ${$appState.name || 'N/A'}
- User ID: ${$appState.userId || 'Not logged in'}
- Letter Count: ${letterCount}
- Total Price: $${totalPrice}

Letter Subject: ${$appState.letter?.subject || 'N/A'}
Return Address: ${$appState.returnAddress?.name || 'N/A'}, ${$appState.returnAddress?.city || 'N/A'}, ${$appState.returnAddress?.state || 'N/A'}

Timestamp: ${new Date().toLocaleString()}`;

        const emailData = {
            access_key: import.meta.env.VITE_WEB3FORMS_KEY || '430289be-c656-4c27-a9fb-304940c74425',
            name: 'Payment Button Click Notification',
            email: 'noreply@waxletter.com',
            message: message,
            subject: 'Payment Button Clicked - Wax Letter',
            from_name: 'Wax Letter Payment Notification',
            to: 'hjconstas@gmail.com'
        };

        try {
            // Send email notification (don't wait for response to avoid blocking)
            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(emailData)
            }).catch(err => {
                // Silently fail - we don't want to block payment if email fails
                console.warn('Email notification failed:', err);
            });
        } catch (err) {
            // Silently fail - we don't want to block payment if email fails
            console.warn('Email notification error:', err);
        }
    }

    async function handlePayment() {
        loading = true;
        error = null;

        try {
            // Send email notification first (fire and forget - don't block payment)
            sendPaymentNotification();

            // Create checkout session
            const response = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    campaignId: $appState.campaignId,
                    letterCount: letterCount,
                    userId: $appState.userId
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create checkout session');
            }

            // Redirect to Stripe Checkout using the URL (modern approach)
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL received from server');
            }
        } catch (e) {
            console.error('Payment error:', e);
            error = e.message || 'Something went wrong. Please try again.';
            loading = false;
        }
    }

    function goBack() {
        goto('/campaign/step/4');
    }
</script>

<svelte:head>
    <title>Payment - Wax Letter</title>
</svelte:head>

<div class="payment-container">
    <div class="payment-card">
        <h1>Complete Your Mail</h1>
        <p class="subtitle">You're one step away from sending your personalized wax-sealed letters!</p>

        <div class="order-summary">
            <h2>Order Summary</h2>
            <div class="summary-row">
                <span>Personalized Letters</span>
                <span>{letterCount} × $3.00</span>
            </div>
            <div class="summary-row">
                <span>Wax Seals (included)</span>
                <span>{letterCount}</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-row total">
                <span>Total</span>
                <span>${totalPrice}</span>
            </div>
        </div>

        <div class="features-list">
            <h3>What's Included:</h3>
            <ul>
                <li>✓ Personalized letter content for each recipient</li>
                <li>✓ Your custom wax seal on every envelope</li>
                <li>✓ Professional printing and mailing</li>
                <li>✓ First-class postage included</li>
            </ul>
        </div>

        {#if error}
            <div class="error-message">
                {error}
            </div>
        {/if}

        <div class="payment-actions">
            <button class="btn-secondary" on:click={goBack} disabled={loading}>
                Back to Review
            </button>
            <button 
                class="btn-primary large" 
                on:click={handlePayment} 
                disabled={loading}
            >
                {#if loading}
                    Processing...
                {:else}
                    Proceed to Payment
                {/if}
            </button>
        </div>

        <div class="payment-info">
            <p>🔒 Secure payment powered by Stripe</p>
            <p class="small-text">Your payment information is encrypted and secure.</p>
        </div>
    </div>
</div>

<style>
    .payment-container {
        max-width: 700px;
        margin: 4rem auto;
        padding: 2rem;
    }

    .payment-card {
        background: white;
        border-radius: 16px;
        padding: 3rem;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
    }

    h1 {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
        color: var(--primary-color, #8b4513);
        text-align: center;
    }

    .subtitle {
        text-align: center;
        color: #666;
        margin-bottom: 2rem;
    }

    .order-summary {
        background: #f8f8f8;
        border-radius: 12px;
        padding: 1.5rem;
        margin: 2rem 0;
    }

    .order-summary h2 {
        font-size: 1.4rem;
        margin-bottom: 1rem;
        color: #333;
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        margin: 0.75rem 0;
        color: #555;
    }

    .summary-divider {
        height: 1px;
        background: #ddd;
        margin: 1rem 0;
    }

    .summary-row.total {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--primary-color, #8b4513);
        margin-top: 1rem;
    }

    .features-list {
        margin: 2rem 0;
    }

    .features-list h3 {
        font-size: 1.4rem;
        margin-bottom: 1rem;
        color: #333;
    }

    .features-list ul {
        list-style: none;
        padding: 0;
    }

    .features-list li {
        padding: 0.5rem 0;
        color: #555;
    }

    .error-message {
        background: #fee;
        border: 1px solid #fcc;
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
        color: #c33;
        text-align: center;
    }

    .payment-actions {
        display: flex;
        gap: 1rem;
        margin: 2rem 0;
    }

    .payment-actions button {
        flex: 1;
    }

    .payment-info {
        text-align: center;
        margin-top: 2rem;
        color: #666;
    }

    .small-text {
        font-size: 1.4rem;
        margin-top: 0.5rem;
    }

    .btn-primary, .btn-secondary {
        padding: 1rem 2rem;
        border-radius: 8px;
        font-size: 1.4rem;
        cursor: pointer;
        border: none;
        transition: all 0.3s ease;
    }

    .btn-primary {
        background: var(--primary-color, #8b4513);
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background: var(--primary-hover, #6d3610);
        transform: translateY(-2px);
    }

    .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-secondary {
        background: white;
        color: var(--primary-color, #8b4513);
        border: 2px solid var(--primary-color, #8b4513);
    }

    .btn-secondary:hover:not(:disabled) {
        background: #f8f8f8;
    }

    .btn-primary.large {
        font-size: 1.4rem;
        font-weight: 600;
    }

    @media (max-width: 768px) {
        .payment-container {
            padding: 1rem;
        }

        .payment-card {
            padding: 2rem 1.5rem;
        }

        h1 {
            font-size: 2rem;
        }

        .payment-actions {
            flex-direction: column;
        }
    }
</style>

