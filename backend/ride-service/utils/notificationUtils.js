// utils/notificationUtils.js
const admin = require('firebase-admin');
const deviceStore = require('../models/NotificationModel');
const path = require('path');
const fs = require('fs');

/**
 * Initialize Firebase Admin SDK
 */
const initializeFirebase = () => {
    // Check if Firebase is already initialized
    if (admin.apps.length === 0) {
        try {
            // Try to load service account from env path or use default path
            const serviceAccountPath =
                path.resolve('../config/google-services.json');

            if (!fs.existsSync(serviceAccountPath)) {
                console.error('Firebase service account file not found at:', serviceAccountPath);
                return false;
            }

            admin.initializeApp({
                credential: admin.credential.cert(require(serviceAccountPath)),
            });
            console.log('Firebase Admin SDK initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
            return false;
        }
    }
    return true;
};

// Initialize Firebase when this module is loaded
const isFirebaseInitialized = initializeFirebase();

/**
 * Build notification message payload
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data to send with notification
 * @returns {Object} Notification message object
 */
const buildNotificationMessage = (title, body, data = {}) => {
    return {
        notification: {
            title,
            body,
        },
        data: Object.keys(data).reduce((acc, key) => {
            // Firebase requires all values to be strings
            acc[key] = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
            return acc;
        }, {}),
        apns: {
            payload: {
                aps: {
                    sound: 'default',
                    badge: 1,
                    contentAvailable: true,
                },
            },
            headers: {
                'apns-priority': '10',
            },
        },
        android: {
            priority: 'high',
            notification: {
                sound: 'default',
                priority: 'high',
                channelId: 'default-channel',
            },
        },
    };
};

/**
 * Send notifications to multiple devices by their tokens
 * @param {Array<string>} tokens - Array of FCM tokens
 * @param {Object} message - Notification message object
 * @returns {Object} Result of the send operation
 */
const sendToMultipleDevices = async (tokens, message) => {
    if (!isFirebaseInitialized) {
        return { 
            successCount: 0, 
            failureCount: tokens.length, 
            responses: [],
            error: 'Firebase not initialized'
        };
    }

    const messaging = admin.messaging();
   
    try {
        const results = await Promise.all(
            tokens.map(async (token) => {
                try {
                    const result = await messaging.send({
                        ...message,
                        token: token
                    });
                    return { success: true, messageId: result, token };
                } catch (err) {
                    console.log(`Failed to send to token ${token}:`, err.message);
                    return { success: false, error: err.message, token };
                }
            })
        );
      
        // Format response
        const successCount = results.filter(r => r.success).length;
        
        return {
            successCount: successCount,
            failureCount: results.length - successCount,
            responses: results
        };
    } catch (error) {
        console.error('Error sending notifications:', error);
        return { 
            successCount: 0, 
            failureCount: tokens.length, 
            responses: [],
            error: error.message
        };
    }
};

/**
 * Send notification to specific user IDs
 * @param {Array<string>} userIds - Array of user IDs to send notifications to
 * @param {Object} notificationData - Object containing title, body, and optional data
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.body - Notification body 
 * @param {Object} notificationData.data - Additional data to send with notification
 * @returns {Object} Result of the send operation
 */
const sendNotificationToIds = async (userIds, notificationData) => {
    try {
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return {
                success: false,
                message: 'User IDs array is required and must not be empty',
                result: {
                    totalDevices: 0,
                    successCount: 0,
                    failureCount: 0
                }
            };
        }

        const { title, body, data } = notificationData;

        if (!title || !body) {
            return {
                success: false,
                message: 'Notification title and body are required',
                result: {
                    totalDevices: 0,
                    successCount: 0,
                    failureCount: 0
                }
            };
        }

        // Get devices for these IDs
        const devices = await deviceStore.getDevicesByIds(userIds);

        if (devices.length === 0) {
            return {
                success: false,
                message: 'No registered devices found with the provided ID(s)',
                result: {
                    totalDevices: 0,
                    successCount: 0,
                    failureCount: 0
                }
            };
        }
        
        const tokens = devices.map(device => device.fcmtoken || device.token);
        const validTokens = tokens.filter(token => token);
        
        if (validTokens.length === 0) {
            return {
                success: false,
                message: 'No valid FCM tokens found for the provided ID(s)',
                result: {
                    totalDevices: devices.length,
                    successCount: 0,
                    failureCount: 0
                }
            };
        }

        // Build and send notification
        const message = buildNotificationMessage(title, body, data || {});
        const response = await sendToMultipleDevices(validTokens, message);

        // Update devices' last notification time
        deviceStore.updateLastNotifiedTime(devices.map(device => device.id));

        return {
            success: response.successCount > 0,
            message: response.successCount > 0 
                ? `Successfully sent ${response.successCount} notifications` 
                : 'Failed to send any notifications',
            result: {
                totalDevices: devices.length,
                validTokens: validTokens.length,
                successCount: response.successCount,
                failureCount: response.failureCount,
                responses: response.responses,
                userIds
            }
        };
    } catch (error) {
        console.error('Error in sendNotificationToIds:', error);
        return {
            success: false,
            message: 'Failed to send notifications',
            error: error.message,
            result: {
                totalDevices: 0,
                successCount: 0,
                failureCount: 0
            }
        };
    }
};

module.exports = {
    sendNotificationToIds,
    buildNotificationMessage,
    sendToMultipleDevices
};