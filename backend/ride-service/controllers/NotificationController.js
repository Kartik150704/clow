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
                path.resolve('./config/google-services.json');

            if (!fs.existsSync(serviceAccountPath)) {
                console.error('Firebase service account file not found at:', serviceAccountPath);
                process.exit(1);
            }

            admin.initializeApp({
                credential: admin.credential.cert(require(serviceAccountPath)),
            });
            console.log('Firebase Admin SDK initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
            process.exit(1);
        }
    }
};

// Initialize Firebase when this module is loaded
initializeFirebase();

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
 * Register a device with ID and token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendToMultipleDevices = async (tokens, message) => {
    // For older versions of firebase-admin that don't have sendMulticast
    const messaging = admin.messaging();
   
    // Method 1: Try using sendAll (alternative to sendMulticast in some versions)
    try {
        const results = await Promise.all(
            tokens.map(async (token) => {
                try {
                    const result = await messaging.send({
                        ...message,
                        token: token
                    });
                    console.log(result)
                    return { success: true, messageId: result };
                } catch (err) {
                    return { success: false, error: err };
                }
            })
        );
      
        // Format response similar to sendMulticast
        const successCount = results.filter(r => r.success).length;
        
        return {
            successCount: successCount,
            failureCount: results.length - successCount,
            responses: results
        };
    } catch (error) {
        console.error('Error using sendAll, falling back to individual sends:', error);
        return { successCount: 0, failureCount: tokens.length, responses: [] };
        // Method 2: If sendAll fails, send individually

    }
};
exports.registerDevice = async (req, res) => {
    try {
        const { id, token, deviceType } = req.body;

        if (!id || !token) {
            return res.status(400).json({
                success: false,
                message: 'ID and token are required'
            });
        }

        // Save device to store
        const device = deviceStore.saveDevice(id, token, deviceType);

        res.status(200).json({
            success: true,
            message: 'Device registered successfully',
            device
        });
    } catch (error) {
        console.error('Error registering device:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register device',
            error: error.message
        });
    }
};

/**
 * Unregister a device by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.unregisterDevice = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Device ID is required'
            });
        }

        const deleted = deviceStore.deleteDevice(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Device unregistered successfully'
        });
    } catch (error) {
        console.error('Error unregistering device:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unregister device',
            error: error.message
        });
    }
};

/**
 * Send notification to one or more devices by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.sendNotificationById = async (req, res) => {
    try {
        const { id, ids, title, body, data } = req.body;

        if ((!id && !ids) || !title || !body) {
            return res.status(400).json({
                success: false,
                message: 'Device ID(s), title, and body are required'
            });
        }

        // Get target IDs
        const targetIds = ids ? (Array.isArray(ids) ? ids : [ids]) : [id];

        // Get devices for these IDs
        const devices = await deviceStore.getDevicesByIds(targetIds);

        if (devices.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No registered devices found with the provided ID(s)'
            });
        }
        
        const tokens = devices.map(device => device.fcmtoken);
       
        // Send notification
        const message = buildNotificationMessage(title, body, data || {});
        const response = await sendToMultipleDevices(tokens, message);

        // Update devices last notification time
        deviceStore.updateLastNotifiedTime(devices.map(device => device.id));

        // Generate detailed response with device IDs

        res.status(200).json({
            success: true,
            message: 'Notifications sent',
            result: {
                totalDevices: tokens.length,
                successCount: response.successCount,
                failureCount: response.failureCount,

            }
        });
    } catch (error) {
        console.error('Error sending notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send notifications',
            error: error.message
        });
    }
};

/**
 * Send notification to all registered devices
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.sendNotificationToAll = async (req, res) => {
    try {
        const { title, body, data } = req.body;

        if (!title || !body) {
            return res.status(400).json({
                success: false,
                message: 'Title and body are required'
            });
        }

        // Get all active devices
        const devices = deviceStore.getAllActiveDevices();

        if (devices.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No registered devices found'
            });
        }
        console.log(devices)
        const tokens = devices.map(device => device.token);

        // Send notifications in batches (FCM has a limit of 500 tokens per request)
        const batchSize = 500;
        const results = [];

        for (let i = 0; i < tokens.length; i += batchSize) {
            const batchTokens = tokens.slice(i, i + batchSize);
            const message = buildNotificationMessage(title, body, data || {});

            const response = await admin.messaging().sendMulticast({
                ...message,
                tokens: batchTokens
            });

            results.push({
                batchIndex: Math.floor(i / batchSize),
                successCount: response.successCount,
                failureCount: response.failureCount
            });
        }

        // Update all devices' last notification time
        deviceStore.updateAllLastNotifiedTime();

        res.status(200).json({
            success: true,
            message: 'Notifications sent to all devices',
            totalDevices: tokens.length,
            batches: results
        });
    } catch (error) {
        console.error('Error sending notifications to all devices:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send notifications to all devices',
            error: error.message
        });
    }
};