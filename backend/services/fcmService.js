const admin = require('firebase-admin');
const logger = require('../config/logger');

let fcmInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON environment variable
 */
function initializeFCM() {
    if (fcmInitialized) return;

    try {
        // Check for service account file
        const path = require('path');
        const fs = require('fs');
        // Look for serviceAccountKey.json in config directory or root
        let serviceAccountPath = path.join(__dirname, '../config/serviceAccountKey.json');

        if (!fs.existsSync(serviceAccountPath)) {
            serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
        }

        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            fcmInitialized = true;
            logger.info('Firebase Admin SDK initialized successfully using serviceAccountKey.json');
            return;
        }

        // Fallback to environment variable if file not found
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

        if (!serviceAccountJson) {
            logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON not set and serviceAccountKey.json not found - FCM disabled');
            return;
        }

        const serviceAccount = JSON.parse(serviceAccountJson);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        fcmInitialized = true;
        logger.info('Firebase Admin SDK initialized successfully from ENV');
    } catch (error) {
        logger.error('Failed to initialize Firebase Admin SDK:', error);
    }
}

/**
 * Send lock command via FCM push notification
 * @param {string} fcmToken - Device FCM token
 * @param {string} customerId - Customer ID for logging
 * @returns {Promise<boolean>} Success status
 */
async function sendLockCommand(fcmToken, customerId) {
    if (!fcmInitialized) {
        logger.warn(`FCM not initialized - cannot send lock command to ${customerId}`);
        return false;
    }

    if (!fcmToken) {
        logger.warn(`No FCM token for customer ${customerId}`);
        return false;
    }

    try {
        const message = {
            token: fcmToken,
            data: {
                action: 'LOCK_NOW',
                customerId: customerId,
                timestamp: Date.now().toString()
            },
            android: {
                priority: 'high',
                ttl: 60000 // 60 seconds
            }
        };

        const response = await admin.messaging().send(message);
        logger.info(`Lock command sent via FCM to ${customerId}: ${response}`);
        return true;
    } catch (error) {
        logger.error(`Failed to send lock command to ${customerId}:`, error);

        // If token is invalid, we should mark it for removal
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
            logger.warn(`Invalid FCM token for ${customerId} - should be cleared`);
        }

        return false;
    }
}

/**
 * Send unlock command via FCM push notification
 * @param {string} fcmToken - Device FCM token
 * @param {string} customerId - Customer ID for logging
 * @returns {Promise<boolean>} Success status
 */
async function sendUnlockCommand(fcmToken, customerId) {
    if (!fcmInitialized) {
        logger.warn(`FCM not initialized - cannot send unlock command to ${customerId}`);
        return false;
    }

    if (!fcmToken) {
        logger.warn(`No FCM token for customer ${customerId}`);
        return false;
    }

    try {
        const message = {
            token: fcmToken,
            data: {
                action: 'UNLOCK_NOW',
                customerId: customerId,
                timestamp: Date.now().toString()
            },
            android: {
                priority: 'high',
                ttl: 60000
            }
        };

        const response = await admin.messaging().send(message);
        logger.info(`Unlock command sent via FCM to ${customerId}: ${response}`);
        return true;
    } catch (error) {
        logger.error(`Failed to send unlock command to ${customerId}:`, error);
        return false;
    }
}

module.exports = {
    initializeFCM,
    sendLockCommand,
    sendUnlockCommand
};
