import { db, storage } from './firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc,
    query,
    where,
    getDocs,
    serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Campaign service for managing campaigns in Firestore
 */

/**
 * Create a new campaign
 * @param {Object} campaignData - The campaign data
 * @returns {Promise<string>} - The campaign ID
 */
export async function createCampaign(campaignData) {
    try {
        const campaignRef = doc(collection(db, 'campaigns'));
        const campaign = {
            ...campaignData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: 'draft',
            // Include userId if present in campaignData
            userId: campaignData.userId || null,
            // Add recipient count for easier querying
            recipientCount: campaignData.addresses?.length || 0,
            // Add a campaign name if not provided
            name: campaignData.name || 'Untitled Campaign'
        };

        // Upload stamp image to Storage if it exists
        if (campaignData.stampImage) {
            const stampUrl = await uploadStampImage(campaignRef.id, campaignData.stampImage);
            campaign.stampImageUrl = stampUrl;
            // Keep the data URL for local preview
            campaign.stampImage = campaignData.stampImage;
        }

        await setDoc(campaignRef, campaign);
        return campaignRef.id;
    } catch (error) {
        console.error('Error creating campaign:', error);
        throw error;
    }
}

/**
 * Get a campaign by ID
 * @param {string} campaignId - The campaign ID
 * @returns {Promise<Object|null>} - The campaign data or null if not found
 */
export async function getCampaign(campaignId) {
    try {
        const campaignRef = doc(db, 'campaigns', campaignId);
        const campaignSnap = await getDoc(campaignRef);
        
        if (campaignSnap.exists()) {
            return {
                id: campaignSnap.id,
                ...campaignSnap.data()
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting campaign:', error);
        throw error;
    }
}

/**
 * Update a campaign
 * @param {string} campaignId - The campaign ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<void>}
 */
export async function updateCampaign(campaignId, updates) {
    try {
        const campaignRef = doc(db, 'campaigns', campaignId);
        
        // Handle stamp image upload if updated
        if (updates.stampImage && updates.stampImage.startsWith('data:')) {
            const stampUrl = await uploadStampImage(campaignId, updates.stampImage);
            updates.stampImageUrl = stampUrl;
        }

        await updateDoc(campaignRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating campaign:', error);
        throw error;
    }
}

/**
 * Delete a campaign
 * @param {string} campaignId - The campaign ID
 * @returns {Promise<void>}
 */
export async function deleteCampaign(campaignId) {
    try {
        // Delete stamp image from Storage
        try {
            const stampRef = ref(storage, `campaigns/${campaignId}/stamp`);
            await deleteObject(stampRef);
        } catch (error) {
            // Image might not exist, that's okay
            console.log('No stamp image to delete');
        }

        // Delete campaign document
        const campaignRef = doc(db, 'campaigns', campaignId);
        await deleteDoc(campaignRef);
    } catch (error) {
        console.error('Error deleting campaign:', error);
        throw error;
    }
}

/**
 * Get all campaigns (optional: with filters)
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - Array of campaigns
 */
export async function getCampaigns(filters = {}) {
    try {
        let q = collection(db, 'campaigns');
        
        if (filters.status) {
            q = query(q, where('status', '==', filters.status));
        }

        const querySnapshot = await getDocs(q);
        const campaigns = [];
        querySnapshot.forEach((doc) => {
            campaigns.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return campaigns;
    } catch (error) {
        console.error('Error getting campaigns:', error);
        throw error;
    }
}

/**
 * Upload stamp image to Firebase Storage
 * @param {string} campaignId - The campaign ID
 * @param {string} dataUrl - The data URL of the image
 * @returns {Promise<string>} - The download URL
 */
async function uploadStampImage(campaignId, dataUrl) {
    try {
        const stampRef = ref(storage, `campaigns/${campaignId}/stamp`);
        await uploadString(stampRef, dataUrl, 'data_url');
        const downloadUrl = await getDownloadURL(stampRef);
        return downloadUrl;
    } catch (error) {
        console.error('Error uploading stamp image:', error);
        throw error;
    }
}

/**
 * Save campaign state (for auto-save functionality)
 * @param {string} campaignId - The campaign ID (or 'draft' for new campaigns)
 * @param {Object} state - The current state
 * @returns {Promise<string>} - The campaign ID
 */
export async function saveCampaignState(campaignId, state) {
    try {
        if (campaignId === 'draft' || !campaignId) {
            // Create new campaign
            return await createCampaign(state);
        } else {
            // Update existing campaign
            await updateCampaign(campaignId, state);
            return campaignId;
        }
    } catch (error) {
        console.error('Error saving campaign state:', error);
        throw error;
    }
}

/**
 * Associate an existing campaign with a user ID
 * @param {string} campaignId - The campaign ID
 * @param {string} userId - The user ID to associate with
 * @returns {Promise<void>}
 */
export async function associateCampaignWithUser(campaignId, userId) {
    try {
        if (!campaignId || campaignId === 'draft') {
            console.warn('Cannot associate campaign without valid ID');
            return;
        }
        
        const campaignRef = doc(db, 'campaigns', campaignId);
        await updateDoc(campaignRef, {
            userId: userId,
            updatedAt: serverTimestamp()
        });
        
        console.log('✅ Campaign associated with user:', campaignId, userId);
    } catch (error) {
        console.error('Error associating campaign with user:', error);
        throw error;
    }
}

/**
 * Get or create a session ID for homepage preview storage
 * Uses userId if authenticated, otherwise creates a device session ID
 * @param {string | null} userId - Optional user ID
 * @returns {string} - Session identifier
 */
function getHomepageSessionId(userId) {
    if (typeof window === 'undefined') return 'anonymous';
    
    if (userId) {
        return `user_${userId}`;
    }
    
    // Use device session ID stored in localStorage
    let sessionId = localStorage.getItem('homepage_session_id');
    if (!sessionId) {
        // Generate a unique session ID
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('homepage_session_id', sessionId);
    }
    return sessionId;
}

/**
 * Upload homepage generated preview image to Firebase Storage
 * This will overwrite any existing preview for the same session/user
 * @param {string} dataUrl - The data URL of the generated image
 * @param {string | null} userId - Optional user ID
 * @returns {Promise<string>} - The download URL
 */
export async function saveHomepagePreviewImage(dataUrl, userId = null) {
    try {
        const sessionId = getHomepageSessionId(userId);
        const previewRef = ref(storage, `homepage/preview/${sessionId}`);
        
        // Upload will automatically overwrite if it exists
        await uploadString(previewRef, dataUrl, 'data_url');
        const downloadUrl = await getDownloadURL(previewRef);
        
        console.log('✅ Homepage preview image saved to cloud:', downloadUrl);
        return downloadUrl;
    } catch (error) {
        console.error('Error saving homepage preview image:', error);
        throw error;
    }
}

/**
 * Load homepage generated preview image from Firebase Storage
 * @param {string | null} userId - Optional user ID
 * @returns {Promise<string | null>} - The download URL or null if not found
 */
export async function loadHomepagePreviewImage(userId = null) {
    try {
        const sessionId = getHomepageSessionId(userId);
        const previewRef = ref(storage, `homepage/preview/${sessionId}`);
        
        const downloadUrl = await getDownloadURL(previewRef);
        console.log('✅ Homepage preview image loaded from cloud:', downloadUrl);
        return downloadUrl;
    } catch (error) {
        // Image might not exist, that's okay
        if (error.code === 'storage/object-not-found') {
            return null;
        }
        console.error('Error loading homepage preview image:', error);
        return null;
    }
}

/**
 * Delete homepage preview image from Firebase Storage
 * @param {string | null} userId - Optional user ID
 * @returns {Promise<void>}
 */
export async function deleteHomepagePreviewImage(userId = null) {
    try {
        const sessionId = getHomepageSessionId(userId);
        const previewRef = ref(storage, `homepage/preview/${sessionId}`);
        await deleteObject(previewRef);
        console.log('✅ Homepage preview image deleted from cloud');
    } catch (error) {
        // Image might not exist, that's okay
        if (error.code === 'storage/object-not-found') {
            return;
        }
        console.error('Error deleting homepage preview image:', error);
        throw error;
    }
}

/**
 * Get or create a session ID for step1 preview storage
 * Uses userId if authenticated, otherwise creates a device session ID
 * @param {string | null} userId - Optional user ID
 * @returns {string} - Session identifier
 */
function getStep1SessionId(userId) {
    if (typeof window === 'undefined') return 'anonymous';
    
    if (userId) {
        return `user_${userId}`;
    }
    
    // Use device session ID stored in localStorage
    let sessionId = localStorage.getItem('step1_session_id');
    if (!sessionId) {
        // Generate a unique session ID
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('step1_session_id', sessionId);
    }
    return sessionId;
}

/**
 * Upload step1 generated preview image to Firebase Storage
 * This will overwrite any existing preview for the same session/user
 * @param {string} dataUrl - The data URL of the generated image
 * @param {string | null} userId - Optional user ID
 * @returns {Promise<string>} - The download URL
 */
export async function saveStep1PreviewImage(dataUrl, userId = null) {
    try {
        const sessionId = getStep1SessionId(userId);
        const previewRef = ref(storage, `step1/preview/${sessionId}`);
        
        // Upload will automatically overwrite if it exists
        await uploadString(previewRef, dataUrl, 'data_url');
        const downloadUrl = await getDownloadURL(previewRef);
        
        console.log('✅ Step1 preview image saved to cloud:', downloadUrl);
        return downloadUrl;
    } catch (error) {
        console.error('Error saving step1 preview image:', error);
        throw error;
    }
}

/**
 * Load step1 generated preview image from Firebase Storage
 * @param {string | null} userId - Optional user ID
 * @returns {Promise<string | null>} - The download URL or null if not found
 */
export async function loadStep1PreviewImage(userId = null) {
    try {
        const sessionId = getStep1SessionId(userId);
        const previewRef = ref(storage, `step1/preview/${sessionId}`);
        
        const downloadUrl = await getDownloadURL(previewRef);
        console.log('✅ Step1 preview image loaded from cloud:', downloadUrl);
        return downloadUrl;
    } catch (error) {
        // Image might not exist, that's okay
        if (error.code === 'storage/object-not-found') {
            return null;
        }
        console.error('Error loading step1 preview image:', error);
        return null;
    }
}

/**
 * Delete step1 preview image from Firebase Storage
 * @param {string | null} userId - Optional user ID
 * @returns {Promise<void>}
 */
export async function deleteStep1PreviewImage(userId = null) {
    try {
        const sessionId = getStep1SessionId(userId);
        const previewRef = ref(storage, `step1/preview/${sessionId}`);
        await deleteObject(previewRef);
        console.log('✅ Step1 preview image deleted from cloud');
    } catch (error) {
        // Image might not exist, that's okay
        if (error.code === 'storage/object-not-found') {
            return;
        }
        console.error('Error deleting step1 preview image:', error);
        throw error;
    }
}

