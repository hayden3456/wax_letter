<script>
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { appState } from '$lib/stores';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import ProgressBar from '$lib/components/ProgressBar.svelte';
    import Step1Upload from '$lib/components/Step1Upload.svelte';
    import Step2Addresses from '$lib/components/Step2Addresses.svelte';
    import WipScreen from '$lib/components/WipScreen.svelte';

    let Step3Compose;
    let Step4Review;
    
    $: currentStep = parseInt($page.params.id) || 1;

    // Load Step3 and Step4 dynamically on client-side only
    onMount(async () => {
        if (browser) {
            try {
                const [step3Module, step4Module] = await Promise.all([
                    import('$lib/components/Step3Compose.svelte'),
                    import('$lib/components/Step4Review.svelte')
                ]);
                Step3Compose = step3Module.default;
                Step4Review = step4Module.default;
                console.log('Step components loaded:', { Step3Compose, Step4Review });
            } catch (error) {
                console.error('Failed to load step components:', error);
            }

            // Check if we need to load a specific campaign
            const params = new URLSearchParams(window.location.search);
            const editCampaignId = params.get('edit');
            
            if (editCampaignId) {
                if (editCampaignId !== $appState.campaignId) {
                    console.log('Loading campaign for editing:', editCampaignId);
                    // Clear localStorage first to prevent auto-save of stale data
                    localStorage.removeItem('waxseal_state');
                    localStorage.removeItem('waxseal_campaignId');
                    // Then load the new campaign
                    await appState.loadFromFirestore(editCampaignId);
                } else {
                    console.log('Already viewing this campaign:', editCampaignId);
                }
            } else if (!editCampaignId && $appState.campaignId) {
                // No edit parameter but we have a campaignId means we're starting a NEW campaign
                // Reset the state to start fresh
                console.log('Starting new campaign - resetting state');
                appState.reset();
            }
        }
        
        // Sync currentStep with appState (only if it's different to avoid unnecessary updates)
        if ($appState.currentStep !== currentStep) {
            $appState.currentStep = currentStep;
        }
    });

    // Update appState when step changes
    $: if (browser) {
        $appState.currentStep = currentStep;
    }

    function nextStep() {
        const next = currentStep + 1;
        if (next <= 4) {
            goto(`/campaign/step/${next}`);
        }
    }

    function prevStep() {
        const prev = currentStep - 1;
        if (prev >= 1) {
            goto(`/campaign/step/${prev}`);
        } else {
            goto('/');
        }
    }

    function goToStep(step) {
        goto(`/campaign/step/${step}`);
    }

    function startCampaign() {
        goto('/campaign/payment');
    }
</script>

<svelte:head>
    <title>Step {currentStep} - Start Campaign - WaxSeal Mail</title>
</svelte:head>

<ProgressBar {currentStep} />

{#if currentStep === 1}
    <section class="screen active" id="step1">
        <Step1Upload on:next={nextStep} />
    </section>
{:else if currentStep === 2}
    <section class="screen active" id="step2">
        <Step2Addresses on:next={nextStep} on:back={prevStep} />
    </section>
{:else if currentStep === 3}
    {#if Step3Compose}
        <section class="screen active" id="step3">
            <svelte:component this={Step3Compose} on:next={nextStep} on:back={prevStep} />
        </section>
    {:else}
        <div class="loading-container">
            <p>Loading...</p>
        </div>
    {/if}
{:else if currentStep === 4}
    {#if Step4Review}
        <section class="screen active" id="step4">
            <svelte:component this={Step4Review}
                on:start={startCampaign} 
                on:back={prevStep} 
                on:edit={(e) => goToStep(e.detail)} 
            />
        </section>
    {:else}
        <div class="loading-container">
            <p>Loading...</p>
        </div>
    {/if}
{:else}
    <div class="error-container">
        <h2>Invalid Step</h2>
        <p>Please select a valid step (1-4).</p>
        <a href="/campaign/step/1" class="btn-primary">Go to Step 1</a>
    </div>
{/if}

<style>
    .loading-container, .error-container {
        max-width: 800px;
        margin: 4rem auto;
        padding: 2rem;
        text-align: center;
    }

    .error-container h2 {
        color: var(--error-color);
        margin-bottom: 1rem;
    }
</style>

