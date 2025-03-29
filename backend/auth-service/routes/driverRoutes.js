const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');

/**
 * @route GET /api/drivers/:id
 * @desc Get driver profile by ID
 * @access Public
 */
router.get('/:id', driverController.getDriverProfile);

/**
 * @route POST /api/drivers
 * @desc Create a new driver profile or return existing one
 * @access Public
 */
router.post('/', driverController.createDriverProfile);

/**
 * @route PUT /api/drivers/:id
 * @desc Update driver profile
 * @access Public
 */
router.put('/:id', driverController.updateDriverProfile);

/**
 * @route DELETE /api/drivers/:id
 * @desc Delete driver profile
 * @access Public
 */
router.delete('/:id', driverController.deleteDriverProfile);

module.exports = router;