<script>
    import { auth } from '$lib/firebase';
    import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { authStore } from '$lib/stores/authStore';
    import { appState } from '$lib/stores';
    import { associateCampaignWithUser, associateCampaignsBySessionId } from '$lib/firestoreService';
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';

    let email = '';
    let password = '';
    let isSignUp = false;
    let error = '';
    let loading = false;
    let redirectPath = '/dashboard';
    let fromCampaign = false;
    let showPassword = false;

    onMount(() => {
        // Check URL params for signup mode
        if (browser) {
            const params = new URLSearchParams(window.location.search);
            if (params.get('signup') === 'true') {
                isSignUp = true;
            }
            const redirect = params.get('redirect');
            if (redirect) {
                redirectPath = redirect;
            }
            // Check if coming from campaign flow
            fromCampaign = localStorage.getItem('pendingCampaignAssociation') === 'true';
        }
    });

    // Redirect if already logged in
    $: if ($authStore.user && !loading) {
        goto(redirectPath);
    }

    async function handleSubmit() {
        loading = true;
        error = '';

        try {
            let userCredential;
            if (isSignUp) {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            }
            
            // Associate anonymous campaigns with user (works for both signup and signin)
            if (browser && userCredential) {
                try {
                    // Get session ID from sessionStorage (cloud-based tracking)
                    const sessionId = sessionStorage.getItem('anonymous_session_id');
                    
                    // Also check for specific campaign ID in localStorage (backward compatibility)
                    const campaignId = localStorage.getItem('waxseal_campaignId');
                    const pendingAssociation = localStorage.getItem('pendingCampaignAssociation');
                    
                    // Associate campaigns by session ID (primary method - cloud-based)
                    if (sessionId) {
                        const count = await associateCampaignsBySessionId(sessionId, userCredential.user.uid);
                        if (count > 0) {
                            console.log(`✅ Associated ${count} draft campaign(s) with ${isSignUp ? 'new' : 'existing'} user account`);
                        }
                        // Clear session ID after association
                        sessionStorage.removeItem('anonymous_session_id');
                    }
                    
                    // Also handle specific campaign association (backward compatibility)
                    if (pendingAssociation === 'true' && campaignId && campaignId !== 'draft') {
                        await associateCampaignWithUser(campaignId, userCredential.user.uid);
                        // Update the appState with userId
                        appState.update(s => ({ ...s, userId: userCredential.user.uid }));
                        console.log(`✅ Campaign ${campaignId} associated with user account`);
                        // Clear the pending flag
                        localStorage.removeItem('pendingCampaignAssociation');
                    } else {
                        // Update appState with userId even if no specific campaign
                        appState.update(s => ({ ...s, userId: userCredential.user.uid }));
                    }
                } catch (error) {
                    console.error('Failed to associate campaigns:', error);
                    // Still update appState with userId
                    appState.update(s => ({ ...s, userId: userCredential.user.uid }));
                }
            }
            // Redirect handled by reactive statement above
        } catch (e) {
            console.error(e);
            switch (e.code) {
                case 'auth/email-already-in-use':
                    error = 'Email already in use.';
                    break;
                case 'auth/invalid-email':
                    error = 'Invalid email address.';
                    break;
                case 'auth/weak-password':
                    error = 'Password should be at least 6 characters.';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    error = 'Invalid email or password.';
                    break;
                default:
                    error = 'An error occurred. Please try again.';
            }
        } finally {
            loading = false;
        }
    }
</script>

<div class="login-container">
    <div class="auth-card">
        <div class="tabs">
            <button class:active={!isSignUp} on:click={() => { isSignUp = false; error = ''; }}>Sign In</button>
            <button class:active={isSignUp} on:click={() => { isSignUp = true; error = ''; }}>Sign Up</button>
        </div>

        <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>

        {#if fromCampaign}
            <div class="info-message">
                💾 Your mail draft will be saved to your account
            </div>
        {/if}

        <form on:submit|preventDefault={handleSubmit}>
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" bind:value={email} required placeholder="you@example.com">
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <div class="password-input-wrapper">
                    <input 
                        type={showPassword ? 'text' : 'password'} 
                        id="password" 
                        bind:value={password} 
                        required 
                        placeholder="••••••••"
                    >
                    <button 
                        type="button" 
                        class="toggle-password" 
                        on:click={() => showPassword = !showPassword}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {#if showPassword}
                            <span style="font-size: 1.8rem;">🙈</span>
                        {:else}
                            <span style="font-size: 1.8rem;">👁️</span>
                        {/if}
                    </button>
                </div>
            </div>

            {#if error}
                <div class="error-message">{error}</div>
            {/if}

            <button type="submit" class="btn-primary full-width" disabled={loading}>
                {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
        </form>
    </div>
</div>

<style>
    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 80vh;
        padding: 3rem;
    }

    .auth-card {
        background: var(--card-background);
        padding: 4rem;
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        box-shadow: var(--shadow-lg);
        border: 2px solid var(--border-color);
        width: 100%;
        max-width: 800px;
    }

    .tabs {
        display: flex;
        margin-bottom: 2rem;
        border-bottom: 2px solid var(--border-color);
    }

    .tabs button {
        flex: 1;
        background: none;
        border: none;
        padding: 1.5rem;
        font-family: 'Patrick Hand', cursive;
        font-size: 2rem;
        cursor: pointer;
        color: var(--text-light);
        transition: all 0.3s;
    }

    .tabs button.active {
        color: var(--primary-color);
        font-weight: bold;
        border-bottom: 3px solid var(--primary-color);
        margin-bottom: -2px;
    }

    h2 {
        text-align: center;
        color: var(--primary-color);
        margin-bottom: 2rem;
        font-size: 2.8rem;
    }

    .form-group {
        margin-bottom: 2rem;
    }

    label {
        display: block;
        margin-bottom: 0.8rem;
        color: var(--text-color);
        font-weight: bold;
        font-size: 1.5rem;
    }

    .password-input-wrapper {
        position: relative;
        width: 100%;
    }

    input {
        width: 100%;
        padding: 1.4rem;
        border: 2px solid var(--border-color);
        border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
        font-family: inherit;
        font-size: 1.5rem;
        background: white;
        box-sizing: border-box;
    }

    .password-input-wrapper input {
        padding-right: 4rem;
    }

    .toggle-password {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        font-size: 2rem;
        padding: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s;
    }

    .toggle-password:hover {
        opacity: 0.7;
    }

    input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(152, 41, 42, 0.1);
    }

    .error-message {
        color: var(--primary-color);
        background: rgba(152, 41, 42, 0.1);
        padding: 1.5rem;
        border-radius: 10px;
        margin-bottom: 1.5rem;
        text-align: center;
        font-size: 1.4rem;
    }

    .info-message {
        color: #0369a1;
        background: rgba(7, 89, 133, 0.1);
        padding: 1.5rem;
        border-radius: 10px;
        margin-bottom: 1.5rem;
        text-align: center;
        font-size: 1.4rem;
        border: 1px solid rgba(7, 89, 133, 0.2);
    }

    .full-width {
        width: 100%;
        margin-top: 1.5rem;
        font-size: 1.7rem;
        padding: 1.4rem;
    }
</style>
