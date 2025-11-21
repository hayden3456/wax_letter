<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { appState } from '$lib/stores';

    onMount(() => {
        // Redirect to step 1
        const currentStep = $appState.currentStep || 1;
        goto(`/campaign/step/${currentStep}`, { replaceState: true });
    });
</script>

<svelte:head>
    <title>Start Campaign - Wax Letter</title>
</svelte:head>

<div class="loading-container">
    <p>Loading campaign...</p>
</div>

<style>
    .loading-container {
        max-width: 800px;
        margin: 4rem auto;
        padding: 2rem;
        text-align: center;
    }
</style>
