// File: routes/otpRoutes.js
const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');

// Route to generate OTP and send via email
router.post('/generate', otpController.generateOtp);

module.exports = router;