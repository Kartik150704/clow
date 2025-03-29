const express = require('express');
const notificationController = require('../controllers/NotificationController');

const router = express.Router();

/**
 * @route POST /api/register
 * @desc Register a device with ID and token
 * @access Public
 */
router.post('/register', notificationController.registerDevice);

/**
 * @route POST /api/notify
 * @desc Send notification to device(s) by ID
 * @access Public
 */
router.post('/notify', notificationController.sendNotificationById);

/**
 * @route POST /api/notify-all
 * @desc Send notification to all registered devices
 * @access Public
 */
router.post('/notify-all', notificationController.sendNotificationToAll);

/**
 * @route DELETE /api/unregister/:id
 * @desc Unregister a device by ID
 * @access Public
 */
router.delete('/unregister/:id', notificationController.unregisterDevice);

module.exports = router;