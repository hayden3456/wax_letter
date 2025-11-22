import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { saveCampaignState, getCampaign } from './firestoreService';
import { authStore } from './stores/authStore';

// Initial state
const initialState = {
    campaignId: null, // Firestore document ID
    userId: null, // User ID if authenticated
    name: '', // Campaign name
    stampImage: null,
    aiLetterImage: null, // AI-generated letter preview image (data URL)
    aiLetterImageUrl: null, // Cloud URL for AI-generated letter preview
    addresses: [],
    letter: {
        subject: 'Dear {{FirstName}},',
        body: '',
        closing: 'Sincerely,',
        signature: ''
    },
    returnAddress: {
        name: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'USA'
    },
    currentStep: 1,
    isSample: false // Flag to indicate if this is a sample letter order
};

// Debounce timer for auto-save
let saveTimeout;
const SAVE_DELAY = 2000; // 2 seconds

// Flag to prevent auto-save during initial load
let isInitialLoad = true;
let initialLoadTimeout;

// Flag to track if we're on a campaign editing page
let isOnCampaignPage = false;

// Create store
const createWaxSealStore = () => {
    const { subscribe, set, update } = writable(initialState);

    return {
        subscribe,
        set,
        update,
        reset: () => {
            set(initialState);
            if (browser) {
                localStorage.removeItem('waxseal_state');
                localStorage.removeItem('waxseal_campaignId');
            }
        },
        /** @param {Partial<typeof initialState>} data */
        load: (data) => update(s => ({ ...s, ...data })),
        
        /**
         * Save current state to Firestore
         * @param {Object} currentState - Current state to save
         * @param {string} userId - Optional user ID to associate with campaign
         */
        saveToFirestore: async (currentState, userId = null) => {
            if (!browser) return;
            
            try {
                // Add userId to state if provided
                const stateToSave = userId ? { ...currentState, userId } : currentState;
                
                const campaignId = await saveCampaignState(
                    currentState.campaignId || 'draft',
                    stateToSave
                );
                
                // Update the campaignId and userId if they were newly created
                if (!currentState.campaignId) {
                    update(s => ({ ...s, campaignId, userId: userId || s.userId }));
                    localStorage.setItem('waxseal_campaignId', campaignId);
                }
                
                console.log('✅ Campaign saved to Firestore:', campaignId);
            } catch (error) {
                // Silently fail if Firebase is not configured or there's an error
                // Data is still safe in localStorage
                if (import.meta.env.DEV) {
                    console.warn('⚠️ Firestore save failed (using localStorage only):', error.message);
                }
            }
        },
        
        /**
         * Load campaign from Firestore by ID
         * @param {string} campaignId - Campaign ID to load
         */
        loadFromFirestore: async (campaignId) => {
            if (!browser || !campaignId) return;
            
            // Prevent auto-save during load
            isInitialLoad = true;
            clearTimeout(initialLoadTimeout);
            
            try {
                const campaign = await getCampaign(campaignId);
                if (campaign) {
                    update(s => ({ ...s, ...campaign }));
                    localStorage.setItem('waxseal_campaignId', campaignId);
                    console.log('✅ Campaign loaded from Firestore:', campaignId);
                }
            } catch (error) {
                // Silently fail if Firebase is not configured
                if (import.meta.env.DEV) {
                    console.warn('⚠️ Firestore load failed (using localStorage only):', error.message);
                }
            } finally {
                // Re-enable auto-save after a delay
                initialLoadTimeout = setTimeout(() => {
                    isInitialLoad = false;
                }, 3000);
            }
        }
    };
};

export const appState = createWaxSealStore();

// Persistence (Local + Firestore)
if (browser) {
    // Load from localStorage first (immediate)
    const saved = localStorage.getItem('waxseal_state');
    const savedCampaignId = localStorage.getItem('waxseal_campaignId');
    
    if (saved) {
        try {
            const parsedState = JSON.parse(saved);
            if (savedCampaignId) {
                parsedState.campaignId = savedCampaignId;
            }
            appState.load(parsedState);
        } catch (e) {
            console.error('Failed to load state from localStorage:', e);
        }
    }
    
    // Try to load from Firestore if we have a campaignId (background)
    if (savedCampaignId) {
        appState.loadFromFirestore(savedCampaignId).catch(err => {
            console.error('Failed to load from Firestore on init:', err);
        });
    } else {
        // No saved campaign, so allow auto-save immediately
        setTimeout(() => {
            isInitialLoad = false;
        }, 1000);
    }

    // Initialize userId from authStore if user is already signed in
    authStore.subscribe($auth => {
        if ($auth.user && browser) {
            const currentState = get(appState);
            if (!currentState.userId) {
                appState.update(s => ({ ...s, userId: $auth.user.uid }));
                console.log('✅ User ID initialized from auth:', $auth.user.uid);
            }
        }
    });

    // Helper function to check if we're on a campaign editing page
    function isOnCampaignEditingPage() {
        if (!browser) return false;
        const path = window.location.pathname;
        // Only auto-save when actively editing a campaign
        return path.startsWith('/campaign/step/') || path.startsWith('/sample/step/');
    }

    // Subscribe to changes and save to both localStorage and Firestore
    appState.subscribe(value => {
        // Always save to localStorage immediately (fast, synchronous)
        try {
            localStorage.setItem('waxseal_state', JSON.stringify(value));
            if (value.campaignId) {
                localStorage.setItem('waxseal_campaignId', value.campaignId);
            }
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }

        // Debounced save to Firestore (slower, asynchronous)
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            // Don't auto-save during initial load
            if (isInitialLoad) {
                console.log('⏭️ Skipping auto-save: initial load in progress');
                return;
            }
            
            // Only auto-save when on campaign editing pages
            if (!isOnCampaignEditingPage()) {
                console.log('⏭️ Skipping auto-save: not on campaign editing page');
                return;
            }
            
            // Only save to Firestore if there's actual content (not just a campaignId)
            // Don't create campaigns just because there's a campaignId - need real content
            const hasContent = value.stampImage || // Has uploaded stamp
                               value.aiLetterImage || // Has AI-generated letter preview
                               value.addresses?.length > 0 || // Has addresses
                               value.letter?.body?.trim() || // Has letter content
                               value.letter?.signature?.trim() || // Has signature
                               value.name?.trim(); // Has campaign name
            
            if (!hasContent) {
                console.log('⏭️ Skipping auto-save: no content to save yet');
                return;
            }
            
            // Get current user ID from authStore if available
            let currentUserId = value.userId;
            const $auth = get(authStore);
            if ($auth.user && !currentUserId) {
                currentUserId = $auth.user.uid;
            }
            
            appState.saveToFirestore(value, currentUserId).catch(err => {
                console.error('Auto-save to Firestore failed:', err);
            });
        }, SAVE_DELAY);
    });
}

