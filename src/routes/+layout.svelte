<script>
	import '../app.css';
    import { authStore } from '$lib/stores/authStore';
    import { appState } from '$lib/stores';
    import { auth } from '$lib/firebase';
    import { signOut } from 'firebase/auth';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { page } from '$app/stores';

	let { children } = $props();

    // Unregister any existing service workers to prevent 404 errors
    onMount(() => {
        if (browser && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.unregister().then(() => {
                        console.log('Service worker unregistered');
                    }).catch(err => {
                        console.warn('Failed to unregister service worker:', err);
                    });
                });
            });
        }
    });

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
            <a href="/pricing" class:active={$page.url.pathname === '/pricing'}>Pricing</a>
            <a href="/faq" class:active={$page.url.pathname === '/faq'}>FAQ</a>
            {#if $authStore.loading}
                <!-- Show nothing or a small spinner -->
            {:else if $authStore.user}
                <a href="/dashboard" class:active={$page.url.pathname === '/dashboard'}>Dashboard</a>
                <a href="/profile" class:active={$page.url.pathname === '/profile'}>Profile</a>
                <button class="btn-link" onclick={handleLogout}>Logout</button>
            {:else}
                <a href="/login">Login</a>
            {/if}
            <button onclick={startNewCampaign} class="btn-primary-small" class:active={$page.url.pathname.startsWith('/campaign')}>Create Your Mail</button>
        </div>
    </nav>
</div>

{@render children()}

<footer class="footer">
    <div class="footer-content">
        <p>&copy; 2025 Wax Letter. All rights reserved.</p>
        <div class="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <span class="separator">|</span>
            <a href="/terms">Terms of Service</a>
            <span class="separator">|</span>
            <a href="/#contact">Contact</a>
        </div>
    </div>
</footer>

<style>
    .footer-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
    }

    .footer-links {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        justify-content: center;
    }

    .footer-links a {
        color: var(--text-light);
        text-decoration: none;
        font-size: 1.4rem;
        transition: color 0.2s;
    }

    .footer-links a:hover {
        color: var(--primary-color);
        text-decoration: underline;
    }

    .footer-links .separator {
        color: var(--border-color);
        font-size: 1.4rem;
    }

    @media (max-width: 768px) {
        .footer-content p {
            font-size: 1rem;
        }

        .footer-links a {
            font-size: 1.1rem;
        }

        .footer-links .separator {
            font-size: 1.1rem;
        }
    }

    @media (max-width: 480px) {
        .footer-links {
            flex-direction: column;
            gap: 0.5rem;
        }

        .footer-links .separator {
            display: none;
        }

        .footer-content p {
            font-size: 0.95rem;
        }

        .footer-links a {
            font-size: 1rem;
        }
    }
</style>
