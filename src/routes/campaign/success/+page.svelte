<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { appState } from '$lib/stores';
    import { updateCampaign } from '$lib/firestoreService';

    let loading = true;
    let sessionId = '';
    let campaignId = '';

    onMount(async () => {
        sessionId = $page.url.searchParams.get('session_id');
        campaignId = $page.url.searchParams.get('campaign_id') || $appState.campaignId;

        if (!sessionId) {
            // No session ID, redirect to campaign start
            setTimeout(() => goto('/campaign/step/1'), 3000);
            return;
        }

        // Update campaign status to 'paid' in Firestore
        if (campaignId) {
            try {
                await updateCampaign(campaignId, {
                    status: 'paid',
                    paymentSessionId: sessionId,
                    paidAt: new Date().toISOString()
                });
                console.log('✅ Campaign marked as paid');
            } catch (error) {
                console.error('Failed to update campaign:', error);
            }
        }

        loading = false;
    });

    function goToDashboard() {
        goto('/dashboard');
    }

    function startNewCampaign() {
        appState.reset();
        goto('/campaign/step/1');
    }
</script>

<svelte:head>
    <title>Payment Successful - Wax Letter</title>
</svelte:head>

<div class="success-container">
    <div class="success-card">
        {#if loading}
            <div class="loading">
                <div class="spinner"></div>
                <p>Processing your payment...</p>
            </div>
        {:else}
            <div class="success-icon">✓</div>
            <h1>Payment Successful!</h1>
            <p class="success-message">
                Thank you for your payment. Your mail has been submitted and we'll start processing your wax-sealed letters shortly.
            </p>

            <div class="order-details">
                <h2>What Happens Next?</h2>
                <div class="timeline">
                    <div class="timeline-item">
                        <div class="timeline-number">1</div>
                        <div class="timeline-content">
                            <h3>Processing</h3>
                            <p>We'll review the details and email you to make sure the wax seal design is correct</p>
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-number">2</div>
                        <div class="timeline-content">
                            <h3>Printing & Sealing</h3>
                            <p>Your personalized letters will be printed and sealed with your custom wax seal</p>
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-number">3</div>
                        <div class="timeline-content">
                            <h3>Mailing</h3>
                            <p>Your letters will be sent via first-class mail to all recipients</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="campaign-info">
                <p><strong>Mail ID:</strong> {campaignId || 'N/A'}</p>
                <p class="small-text">You'll receive updates via email as your mail progresses.</p>
            </div>

            <div class="success-actions">
                <button class="btn-secondary" on:click={startNewCampaign}>
                    Create More Mail
                </button>
                <button class="btn-primary" on:click={goToDashboard}>
                    Go to Dashboard
                </button>
            </div>

            <div class="support-info">
                <p>Questions? <a href="/#contact">Contact us</a></p>
            </div>
        {/if}
    </div>
</div>

<style>
    .success-container {
        max-width: 800px;
        margin: 4rem auto;
        padding: 2rem;
    }

    .success-card {
        background: white;
        border-radius: 16px;
        padding: 3rem;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
        text-align: center;
    }

    .loading {
        padding: 2rem;
    }

    .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid var(--primary-color, #8b4513);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .success-icon {
        width: 80px;
        height: 80px;
        background: #4caf50;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        margin: 0 auto 2rem;
        animation: scaleIn 0.5s ease-out;
    }

    @keyframes scaleIn {
        0% {
            transform: scale(0);
        }
        50% {
            transform: scale(1.1);
        }
        100% {
            transform: scale(1);
        }
    }

    h1 {
        font-size: 2.5rem;
        color: #333;
        margin-bottom: 1rem;
    }

    .success-message {
        font-size: 1.4rem;
        color: #666;
        margin-bottom: 3rem;
        line-height: 1.6;
    }

    .order-details {
        text-align: left;
        margin: 3rem 0;
    }

    .order-details h2 {
        font-size: 1.5rem;
        margin-bottom: 2rem;
        text-align: center;
        color: var(--primary-color, #8b4513);
    }

    .timeline {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .timeline-item {
        display: flex;
        gap: 1.5rem;
        align-items: flex-start;
    }

    .timeline-number {
        width: 40px;
        height: 40px;
        background: var(--primary-color, #8b4513);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        flex-shrink: 0;
    }

    .timeline-content h3 {
        font-size: 1.4rem;
        margin-bottom: 0.5rem;
        color: #333;
    }

    .timeline-content p {
        color: #666;
        line-height: 1.5;
    }

    .campaign-info {
        background: #f8f8f8;
        border-radius: 12px;
        padding: 1.5rem;
        margin: 2rem 0;
    }

    .campaign-info p {
        margin: 0.5rem 0;
        color: #555;
    }

    .small-text {
        font-size: 1.4rem;
        color: #999;
        margin-top: 1rem;
    }

    .success-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin: 2rem 0;
    }

    .support-info {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 1px solid #eee;
        color: #999;
        font-size: 1.4rem;
    }

    .support-info a {
        color: var(--primary-color, #8b4513);
        text-decoration: underline;
        transition: color 0.3s ease;
    }

    .support-info a:hover {
        color: var(--primary-hover, #6d3610);
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

    .btn-primary:hover {
        background: var(--primary-hover, #6d3610);
        transform: translateY(-2px);
    }

    .btn-secondary {
        background: white;
        color: var(--primary-color, #8b4513);
        border: 2px solid var(--primary-color, #8b4513);
    }

    .btn-secondary:hover {
        background: #f8f8f8;
    }

    @media (max-width: 768px) {
        .success-container {
            padding: 1rem;
        }

        .success-card {
            padding: 2rem 1.5rem;
        }

        h1 {
            font-size: 2rem;
        }

        .success-actions {
            flex-direction: column;
        }

        .success-actions button {
            width: 100%;
        }
    }
</style>

