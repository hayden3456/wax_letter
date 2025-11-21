import { writable } from 'svelte/store';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

function createAuthStore() {
    /** @type {import('svelte/store').Writable<{user: import('firebase/auth').User | null, loading: boolean, error: Error | null}>} */
    const { subscribe, set, update } = writable({
        user: null,
        loading: true,
        error: null
    });

    return {
        subscribe,
        init: () => {
            onAuthStateChanged(auth, (user) => {
                update(state => ({ ...state, user, loading: false }));
            }, (error) => {
                update(state => ({ ...state, error, loading: false }));
            });
        }
    };
}

export const authStore = createAuthStore();
// Initialize the listener immediately
authStore.init();
