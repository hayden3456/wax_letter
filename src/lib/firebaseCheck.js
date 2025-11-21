/**
 * Simple utility to check if Firebase is properly configured
 */

/**
 * Check if all required Firebase environment variables are set
 * @returns {Object} Status object with isConfigured flag and missing variables
 */
export function checkFirebaseConfig() {
    const requiredVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_STORAGE_BUCKET',
        'VITE_FIREBASE_MESSAGING_SENDER_ID',
        'VITE_FIREBASE_APP_ID'
    ];

    const missing = requiredVars.filter(varName => {
        const value = import.meta.env[varName];
        return !value || value.includes('your_') || value.includes('_here');
    });

    return {
        isConfigured: missing.length === 0,
        missing: missing,
        message: missing.length === 0 
            ? 'Firebase is properly configured!' 
            : `Missing or invalid Firebase config: ${missing.join(', ')}`
    };
}

/**
 * Log Firebase configuration status to console
 */
export function logFirebaseStatus() {
    const status = checkFirebaseConfig();
    
    if (status.isConfigured) {
        console.log('✅ Firebase configuration detected');
        console.log('📊 Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
    } else {
        console.warn('⚠️ Firebase configuration incomplete');
        console.warn('Missing:', status.missing);
        console.warn('👉 Please create .env.local with your Firebase credentials');
        console.warn('📖 See FIREBASE_SETUP.md for instructions');
    }
}

