<script>
    import { authStore } from '$lib/stores/authStore';
    export let currentStep = 1;
</script>

<div class="progress-container visible">
    <div class="progress-bar-wrapper">
        {#if $authStore.user}
            <a href="/dashboard" class="dashboard-back-btn">← Back to Dashboard</a>
        {/if}
        <div class="progress-bar {$authStore.user ? 'with-back-button' : ''}">
            <a href="/campaign/step/1" class="progress-step {currentStep >= 1 ? 'active' : ''} {currentStep > 1 ? 'completed' : ''}" data-step="1">
                <div class="step-circle">1</div>
                <span>Upload Stamp</span>
            </a>
            <div class="progress-line"></div>
            <a href="/campaign/step/2" class="progress-step {currentStep >= 2 ? 'active' : ''} {currentStep > 2 ? 'completed' : ''}" data-step="2">
                <div class="step-circle">2</div>
                <span>Addresses</span>
            </a>
            <div class="progress-line"></div>
            <a href="/campaign/step/3" class="progress-step {currentStep >= 3 ? 'active' : ''} {currentStep > 3 ? 'completed' : ''}" data-step="3">
                <div class="step-circle">3</div>
                <span>Write Letter</span>
            </a>
            <div class="progress-line"></div>
            <a href="/campaign/step/4" class="progress-step {currentStep >= 4 ? 'active' : ''} {currentStep > 4 ? 'completed' : ''}" data-step="4">
                <div class="step-circle">4</div>
                <span>Review</span>
            </a>
        </div>
    </div>
</div>

<style>
    :global(.progress-container) {
        position: relative;
    }

    .progress-bar-wrapper {
        display: flex;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;
        gap: 2rem;
    }

    .dashboard-back-btn {
        flex-shrink: 0;
        padding: 0.5rem 1rem;
        background-color: var(--card-background);
        color: var(--text-color);
        text-decoration: none;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        font-size: 1.4rem;
        font-weight: 600;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        white-space: nowrap;
    }

    .dashboard-back-btn:hover {
        background-color: var(--primary-color);
        color: white;
        border-color: var(--primary-dark);
        transform: translateX(-2px);
    }

    :global(.progress-bar) {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    :global(.progress-bar.with-back-button) {
        margin-left: 0;
    }

    @media (max-width: 768px) {
        .progress-bar-wrapper {
            flex-direction: column;
            gap: 0.8rem;
        }

        .dashboard-back-btn {
            padding: 0.4rem 0.8rem;
            font-size: 1rem;
        }
    }

    @media (max-width: 480px) {
        .dashboard-back-btn {
            padding: 0.3rem 0.6rem;
            font-size: 0.9rem;
        }
    }
</style>
