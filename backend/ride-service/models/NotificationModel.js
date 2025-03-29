// models/notification.model.js
const { query } = require('../db/index');

/**
 * Database-backed storage for device tokens using PostgreSQL
 */
class DeviceStore {
    constructor() {
        this.initializeTable();
    }
    /**
     * Ensure the Notification table exists
     */
    async initializeTable() {
        try {
            await query(`
                CREATE TABLE IF NOT EXISTS Notification(
                    id TEXT PRIMARY KEY,
                    fcmToken TEXT NOT NULL,
                    deviceType TEXT DEFAULT 'unknown',
                    active BOOLEAN DEFAULT TRUE,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    lastNotified TIMESTAMP
                );
            `);
            console.log('Notification table initialized successfully');
        } catch (error) {
            console.error('Error initializing notification table:', error);
        }
    }

    /**
     * Save a device to the database
     * @param {string} id - Device ID
     * @param {string} token - FCM token
     * @param {string} deviceType - Device type (ios, android, web)
     * @returns {Object} Saved device
     */
    async saveDevice(id, token, deviceType = 'unknown') {
        try {
            // Check if device already exists
            const existingDevice = await this.getDevice(id);
            
            if (existingDevice) {
                // Update existing device
                const result = await query(
                    `UPDATE Notification 
                     SET fcmToken = $1, deviceType = $2, active = TRUE, lastUpdated = CURRENT_TIMESTAMP 
                     WHERE id = $3 
                     RETURNING *`,
                    [token, deviceType, id]
                );
                return result.rows[0];
            } else {
                // Insert new device
                const result = await query(
                    `INSERT INTO Notification(id, fcmToken, deviceType, active, createdAt, lastUpdated) 
                     VALUES($1, $2, $3, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
                     RETURNING *`,
                    [id, token, deviceType]
                );
                return result.rows[0];
            }
        } catch (error) {
            console.error('Error saving device:', error);
            throw error;
        }
    }

    /**
     * Get a device by ID
     * @param {string} id - Device ID
     * @returns {Object|null} Device object or null if not found
     */
    async getDevice(id) {
        try {
            const result = await query(
                'SELECT * FROM Notification WHERE id = $1',
                [id]
            );
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            console.error('Error getting device:', error);
            throw error;
        }
    }

    /**
     * Get devices by multiple IDs
     * @param {Array<string>} ids - Array of device IDs
     * @returns {Array<Object>} Array of device objects
     */
    async getDevicesByIds(ids) {
        if (!ids || ids.length === 0) {
            return [];
        }
        
        try {
            // Create parameter placeholders ($1, $2, etc.)
            const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
            
            const result = await query(
                `SELECT * FROM Notification WHERE id IN (${placeholders})`,
                ids
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting devices by IDs:', error);
            throw error;
        }
    }

    /**
     * Get all active devices
     * @returns {Array<Object>} Array of device objects
     */
    async getAllActiveDevices() {
        try {
            const result = await query(
                'SELECT * FROM Notification WHERE active = TRUE'
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting all active devices:', error);
            throw error;
        }
    }

    /**
     * Delete a device by ID
     * @param {string} id - Device ID
     * @returns {boolean} True if device was found and deleted, false otherwise
     */
    async deleteDevice(id) {
        try {
            const result = await query(
                'DELETE FROM Notification WHERE id = $1 RETURNING id',
                [id]
            );
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error deleting device:', error);
            throw error;
        }
    }

    /**
     * Update last notified time for devices
     * @param {Array<string>} ids - Array of device IDs
     */
    async updateLastNotifiedTime(ids) {
        if (!ids || ids.length === 0) {
            return;
        }
        
        try {
            // Create parameter placeholders ($1, $2, etc.)
            const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
            
            await query(
                `UPDATE Notification 
                 SET lastNotified = CURRENT_TIMESTAMP 
                 WHERE id IN (${placeholders})`,
                ids
            );
        } catch (error) {
            console.error('Error updating last notified time:', error);
            throw error;
        }
    }

    /**
     * Update last notified time for all active devices
     */
    async updateAllLastNotifiedTime() {
        try {
            await query(
                `UPDATE Notification 
                 SET lastNotified = CURRENT_TIMESTAMP 
                 WHERE active = TRUE`
            );
        } catch (error) {
            console.error('Error updating all last notified times:', error);
            throw error;
        }
    }
}

// Create and export a singleton instance
const deviceStore = new DeviceStore();
module.exports = deviceStore;