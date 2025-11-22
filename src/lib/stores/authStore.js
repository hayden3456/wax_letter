import { writable } from 'svelte/store';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { associateCampaignsBySessionId } from '../firestoreService';
import { browser } from '$app/environment';

function createAuthStore() {
    /** @type {import('svelte/store').Writable<{user: import('firebase/auth').User | null, loading: boolean, error: Error | null}>} */
    const { subscribe, set, update } = writable({
        user: null,
        loading: true,
        error: null
    });

    // Track if we've already associated campaigns for this session
    let hasAssociatedCampaigns = false;

    return {
        subscribe,
        init: () => {
            onAuthStateChanged(auth, async (user) => {
                update(state => ({ ...state, user, loading: false }));
                
                // When user signs in, automatically associate their anonymous campaigns
                if (user && browser && !hasAssociatedCampaigns) {
                    hasAssociatedCampaigns = true;
                    try {
                        // Get session ID from sessionStorage
                        const sessionId = sessionStorage.getItem('anonymous_session_id');
                        if (sessionId) {
                            const count = await associateCampaignsBySessionId(sessionId, user.uid);
                            if (count > 0) {
                                console.log(`✅ Automatically associated ${count} draft campaign(s) with your account`);
                            }
                            // Clear session ID after association
                            sessionStorage.removeItem('anonymous_session_id');
                        }
                    } catch (error) {
                        console.error('Failed to associate anonymous campaigns:', error);
                        // Don't block auth flow if this fails
                    }
                } else if (!user) {
                    // Reset flag when user signs out
                    hasAssociatedCampaigns = false;
                }
            }, (error) => {
                update(state => ({ ...state, error, loading: false }));
            });
        }
    };
}

export const authStore = createAuthStore();
// Initialize the listener immediately
authStore.init();
