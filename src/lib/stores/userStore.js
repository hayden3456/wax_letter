import { writable, derived } from 'svelte/store';
import { authStore } from './authStore';
import {
    getUserProfile,
    saveUserProfile,
    updateUserProfile,
    initializeUserProfile,
    getUserOrders
} from '../userService';

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} name
 * @property {string} status
 * @property {number} recipientCount
 * @property {any} createdAt
 * @property {any} updatedAt
 * @property {number|null} totalCost
 * @property {string|null} paymentStatus
 */

/**
 * @typedef {Object} UserStoreState
 * @property {Object|null} profile
 * @property {Order[]} orders
 * @property {boolean} loading
 * @property {string|null} error
 */

function createUserStore() {
    /** @type {import('svelte/store').Writable<UserStoreState>} */
    const { subscribe, set, update } = writable({
        profile: null,
        orders: [],
        loading: false,
        error: null
    });

    let currentUserId = null;

    return {
        subscribe,

        /**
         * Load user profile from Firestore
         * @param {string} userId - The user ID
         * @param {string} email - The user's email (for initialization)
         */
        loadProfile: async (userId, email) => {
            if (!userId) return;

            currentUserId = userId;
            update(state => ({ ...state, loading: true, error: null }));

            try {
                let profile = await getUserProfile(userId);

                // Initialize profile if it doesn't exist
                if (!profile) {
                    profile = await initializeUserProfile(userId, email);
                }

                update(state => ({
                    ...state,
                    profile,
                    loading: false
                }));

                return profile;
            } catch (error) {
                console.error('Error loading profile:', error);
                update(state => ({
                    ...state,
                    error: error.message,
                    loading: false
                }));
                throw error;
            }
        },

        /**
         * Update user profile
         * @param {Object} updates - The fields to update
         */
        updateProfile: async (updates) => {
            if (!currentUserId) return;

            update(state => ({ ...state, loading: true, error: null }));

            try {
                await updateUserProfile(currentUserId, updates);

                // Update local state
                update(state => ({
                    ...state,
                    profile: { ...state.profile, ...updates },
                    loading: false
                }));
            } catch (error) {
                console.error('Error updating profile:', error);
                update(state => ({
                    ...state,
                    error: error.message,
                    loading: false
                }));
                throw error;
            }
        },

        /**
         * Save complete profile
         * @param {Object} profileData - The complete profile data
         */
        saveProfile: async (profileData) => {
            if (!currentUserId) return;

            update(state => ({ ...state, loading: true, error: null }));

            try {
                await saveUserProfile(currentUserId, profileData);

                update(state => ({
                    ...state,
                    profile: { id: currentUserId, ...profileData },
                    loading: false
                }));
            } catch (error) {
                console.error('Error saving profile:', error);
                update(state => ({
                    ...state,
                    error: error.message,
                    loading: false
                }));
                throw error;
            }
        },

        /**
         * Load user orders
         */
        loadOrders: async () => {
            if (!currentUserId) return;

            update(state => ({ ...state, loading: true, error: null }));

            try {
                const orders = await getUserOrders(currentUserId);

                update(state => ({
                    ...state,
                    orders,
                    loading: false
                }));

                return orders;
            } catch (error) {
                console.error('Error loading orders:', error);
                update(state => ({
                    ...state,
                    error: error.message,
                    loading: false
                }));
                throw error;
            }
        },

        /**
         * Clear user data (on logout)
         */
        clear: () => {
            currentUserId = null;
            set({
                profile: null,
                orders: [],
                loading: false,
                error: null
            });
        },

        /**
         * Clear any errors
         */
        clearError: () => {
            update(state => ({ ...state, error: null }));
        }
    };
}

export const userStore = createUserStore();

// Derived store for checking if profile is loaded
export const isProfileLoaded = derived(
    userStore,
    $userStore => $userStore.profile !== null && !$userStore.loading
);

// Derived store for user's display name
export const userDisplayName = derived(
    userStore,
    $userStore => {
        if (!$userStore.profile) return '';
        const { firstName, lastName, displayName } = $userStore.profile;
        if (displayName) return displayName;
        if (firstName || lastName) return `${firstName} ${lastName}`.trim();
        return '';
    }
);
