import { db } from './firebase';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    orderBy
} from 'firebase/firestore';

/**
 * User profile service for managing user data in Firestore
 */

/**
 * Get user profile by user ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} - The user profile or null if not found
 */
export async function getUserProfile(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return {
                id: userSnap.id,
                ...userSnap.data()
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
}

/**
 * Create or update user profile
 * @param {string} userId - The user ID
 * @param {Object} profileData - The profile data
 * @returns {Promise<void>}
 */
export async function saveUserProfile(userId, profileData) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            // Update existing profile
            await updateDoc(userRef, {
                ...profileData,
                updatedAt: serverTimestamp()
            });
        } else {
            // Create new profile
            await setDoc(userRef, {
                ...profileData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error saving user profile:', error);
        throw error;
    }
}

/**
 * Update specific fields in user profile
 * @param {string} userId - The user ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<void>}
 */
export async function updateUserProfile(userId, updates) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

/**
 * Initialize user profile with default values
 * @param {string} userId - The user ID
 * @param {string} email - The user's email
 * @returns {Promise<Object>} - The created profile
 */
export async function initializeUserProfile(userId, email) {
    try {
        const defaultProfile = {
            email: email,
            firstName: '',
            lastName: '',
            displayName: '',
            phoneNumber: '',
            defaultReturnAddress: {
                name: '',
                street: '',
                city: '',
                state: '',
                zip: '',
                country: 'USA'
            },
            preferences: {
                emailNotifications: true,
                orderUpdates: true
            }
        };

        await saveUserProfile(userId, defaultProfile);
        return { id: userId, ...defaultProfile };
    } catch (error) {
        console.error('Error initializing user profile:', error);
        throw error;
    }
}

/**
 * Get user's order history from campaigns
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of orders/campaigns
 */
export async function getUserOrders(userId) {
    try {
        const campaignsRef = collection(db, 'campaigns');
        const q = query(
            campaignsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const orders = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            orders.push({
                id: doc.id,
                name: data.name || 'Untitled Campaign',
                status: data.status || 'draft',
                recipientCount: data.recipientCount || data.addresses?.length || 0,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                // Add any payment/order specific fields
                totalCost: data.totalCost || null,
                paymentStatus: data.paymentStatus || null
            });
        });

        return orders;
    } catch (error) {
        console.error('Error getting user orders:', error);
        throw error;
    }
}

/**
 * Get a specific order by ID
 * @param {string} orderId - The order/campaign ID
 * @returns {Promise<Object|null>} - The order or null if not found
 */
export async function getOrder(orderId) {
    try {
        const orderRef = doc(db, 'campaigns', orderId);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
            return {
                id: orderSnap.id,
                ...orderSnap.data()
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting order:', error);
        throw error;
    }
}
