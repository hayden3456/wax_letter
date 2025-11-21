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

