<script>
    import { appState } from '$lib/stores';
    import { authStore } from '$lib/stores/authStore';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';

    let showSignupPrompt = false;

    // Check if user is authenticated
    $: if (browser && !$authStore.loading) {
        showSignupPrompt = !$authStore.user;
    }

    function resetCampaign() {
        appState.reset();
        localStorage.removeItem('waxseal_state');
        goto('/');
    }

    function goToAuth() {
        // Store a flag to indicate this is from campaign completion
        if (browser) {
            localStorage.setItem('pendingCampaignAssociation', 'true');
        }
        goto('/login?signup=true&redirect=/dashboard');
    }
</script>

<div class="wip-container">
    <div class="wip-icon">🚧</div>
    <h1>Work in Progress</h1>
    <p>Your campaign is being processed. This feature is currently under development.</p>
    <div class="wip-details">
        <p>Campaign Details:</p>
        <ul>
            <li><strong>{$appState.addresses.length}</strong> letters queued</li>
            <li>Custom wax seal design uploaded</li>
            <li>Personalized content ready</li>
        </ul>
    </div>
    
    {#if showSignupPrompt}
        <div class="signup-prompt">
            <h3>💾 Save Your Campaign</h3>
            <p>Sign in or create an account to save your campaign and access it later!</p>
            <button class="btn-primary large" on:click={goToAuth}>Sign In / Create Account</button>
            <p class="small-text">Your draft will be automatically saved to your account.</p>
        </div>
    {/if}

    <div class="action-buttons">
        <a href="/" class="btn-secondary" style="text-decoration: none; display: inline-block;">Return to Home</a>
        <button class="btn-secondary" on:click={resetCampaign}>Start New Campaign</button>
    </div>
</div>

<style>
    .signup-prompt {
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border: 3px solid var(--primary-color);
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        padding: 2rem;
        margin: 2rem 0;
        text-align: center;
        animation: fadeIn 0.5s ease-in;
    }

    .signup-prompt h3 {
        color: var(--primary-color);
        margin-bottom: 1rem;
        font-size: 1.5rem;
    }

    .signup-prompt p {
        margin-bottom: 1.5rem;
        color: var(--text-color);
    }

    .signup-prompt .small-text {
        font-size: 1.4rem;
        color: var(--text-light);
        margin-top: 1rem;
        margin-bottom: 0;
    }

    .action-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 2rem;
        flex-wrap: wrap;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
