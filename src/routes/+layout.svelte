<script>
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
    import { authStore } from '$lib/stores/authStore';
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
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="navbar-wrapper">
    <nav class="navbar">
        <div class="nav-brand">
            <a href="/">Wax Letter</a>
        </div>
        <div class="nav-links">
            {#if $authStore.loading}
                <!-- Show nothing or a small spinner -->
            {:else if $authStore.user}
                <a href="/dashboard">Dashboard</a>
                <button class="btn-link" onclick={handleLogout}>Logout</button>
            {:else}
                <a href="/login">Login</a>
            {/if}
            <a href="/campaign/step/1" class="btn-primary-small " style="color: white;">Start Campaign</a>
        </div>
    </nav>
</div>

{@render children()}

<footer class="footer">
    <p>&copy; 2025 Wax Letter All rights reserved.</p>
</footer>
