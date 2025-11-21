<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { appState } from '$lib/stores';

    let loading = false;
    let error = null;

    onMount(() => {
        // Check if we have campaign data
        if ($appState.addresses.length === 0) {
            goto('/sample/step/1');
            return;
        }
    });

    async function handlePayment() {
        loading = true;
        error = null;

        try {
            // Create checkout session for sample letter
            const response = await fetch('/api/create-sample-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    campaignId: $appState.campaignId,
                    userId: $appState.userId
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create checkout session');
            }

            // Redirect to Stripe Checkout using the URL
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
        goto('/sample/step/4');
    }
</script>

<svelte:head>
    <title>Sample Letter Payment - WaxSeal Mail</title>
</svelte:head>

<div class="payment-container">
    <div class="payment-card">
        <div class="sample-badge">Sample Letter</div>
        <h1>Complete Your Sample Order</h1>
        <p class="subtitle">Try our service with a single personalized wax-sealed letter!</p>

        <div class="order-summary">
            <h2>Order Summary</h2>
            <div class="summary-row">
                <span>Sample Letter</span>
                <span>1 letter</span>
            </div>
            <div class="summary-row">
                <span>Custom Wax Seal</span>
                <span>Included</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-row total">
                <span>Total</span>
                <span>$15.00</span>
            </div>
        </div>

        <div class="pricing-explanation">
            <h3>Why $15 for a sample?</h3>
            <p>
                Sample letters require significant manual effort because we custom-design your unique wax seal stamp from scratch. This one-time setup includes:
            </p>
            <ul>
                <li>Custom stamp design and engraving from your logo</li>
                <li>Hand-crafted wax seal application</li>
                <li>Premium paper and envelope</li>
                <li>Personalized letter printing</li>
                <li>First-class postage</li>
            </ul>
            <p class="savings-note">
                <strong>Good news:</strong> Once your stamp is made, bulk orders cost only $3 per letter!
            </p>
        </div>

        <div class="features-list">
            <h3>What You'll Receive:</h3>
            <ul>
                <li>A beautifully sealed letter with your custom wax design</li>
                <li>The exact quality you'll get in bulk orders</li>
                <li>Your stamp saved for future orders at $3/letter</li>
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
                    Pay $15.00
                {/if}
            </button>
        </div>

        <div class="payment-info">
            <p>Secure payment powered by Stripe</p>
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
        position: relative;
    }

    .sample-badge {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 0.5rem 1.5rem;
        border-radius: 20px;
        font-weight: bold;
        font-size: 0.9rem;
    }

    h1 {
        font-size: 2.2rem;
        margin-bottom: 0.5rem;
        margin-top: 1rem;
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
        font-size: 1.3rem;
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

    .pricing-explanation {
        background: linear-gradient(135deg, #fef9f3 0%, #fff5eb 100%);
        border: 2px solid var(--primary-color, #8b4513);
        border-radius: 12px;
        padding: 1.5rem;
        margin: 2rem 0;
    }

    .pricing-explanation h3 {
        font-size: 1.1rem;
        margin-bottom: 0.75rem;
        color: var(--primary-color, #8b4513);
    }

    .pricing-explanation p {
        color: #555;
        margin-bottom: 0.75rem;
        line-height: 1.5;
    }

    .pricing-explanation ul {
        list-style: none;
        padding: 0;
        margin: 0.75rem 0;
    }

    .pricing-explanation li {
        padding: 0.4rem 0;
        color: #555;
        padding-left: 1.5rem;
        position: relative;
    }

    .pricing-explanation li::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 8px;
        height: 8px;
        background: var(--primary-color, #8b4513);
        border-radius: 50%;
    }

    .savings-note {
        background: #e8f5e9;
        padding: 0.75rem;
        border-radius: 8px;
        margin-top: 1rem;
        color: #2e7d32;
    }

    .features-list {
        margin: 2rem 0;
    }

    .features-list h3 {
        font-size: 1.1rem;
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
        padding-left: 1.5rem;
        position: relative;
    }

    .features-list li::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
        background: #4caf50;
        border-radius: 50%;
    }

    .features-list li::after {
        content: '';
        position: absolute;
        left: 5px;
        top: 50%;
        transform: translateY(-50%) rotate(45deg);
        width: 4px;
        height: 8px;
        border: solid white;
        border-width: 0 2px 2px 0;
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
        font-size: 0.875rem;
        margin-top: 0.5rem;
    }

    .btn-primary, .btn-secondary {
        padding: 1rem 2rem;
        border-radius: 8px;
        font-size: 1rem;
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
        font-size: 1.1rem;
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
            font-size: 1.8rem;
        }

        .payment-actions {
            flex-direction: column;
        }
    }
</style>
