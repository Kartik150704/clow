// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate user with Google
 * @access  Public
 */
router.post('/login', customerController.googleAuth);
router.get('/profile/:id', customerController.getProfile);
router.post('/update/:id', customerController.updateProfile);   

module.exports = router;