// routes/priceRoutes.js
const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');

/**
 * @route POST /api/price
 * @desc Calculate price between origin and destination
 * @access Public
 */
router.post('/price', priceController.calculatePrice);

module.exports = router;