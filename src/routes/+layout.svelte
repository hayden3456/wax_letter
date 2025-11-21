<script>
	import '../app.css';
    import { authStore } from '$lib/stores/authStore';
    import { appState } from '$lib/stores';
    import { auth } from '$lib/firebase';
    import { signOut } from 'firebase/auth';
    import { goto } from '$app/navigation';

	let { children } = $props();

    async function handleLogout() {
        try {
            await signOut(auth);
            goto('/');
        } catch (e) {
            console.error('Logout failed:', e);
        }
    }

    function startNewCampaign() {
        // Reset the store to clear any existing campaign data
        appState.reset();
        goto('/campaign/step/1');
    }
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="/waxletterlogo.png" />
</svelte:head>

<div class="navbar-wrapper">
    <nav class="navbar">
        <div class="nav-brand">
            <a href="/">
                <img src="/waxletterlogo.png" alt="Wax Letter Logo" class="logo-img" />
                <span>Wax Letter</span>
            </a>
        </div>
        <div class="nav-links">
            <a href="/pricing">Pricing</a>
            <a href="/faq">FAQ</a>
            {#if $authStore.loading}
                <!-- Show nothing or a small spinner -->
            {:else if $authStore.user}
                <a href="/dashboard">Dashboard</a>
                <button class="btn-link" onclick={handleLogout}>Logout</button>
            {:else}
                <a href="/login">Login</a>
            {/if}
            <button onclick={startNewCampaign} class="btn-primary-small" style="color: white;">Start Campaign</button>
        </div>
    </nav>
</div>

{@render children()}

<footer class="footer">
    <p>&copy; 2025 Wax Letter All rights reserved.</p>
</footer>
