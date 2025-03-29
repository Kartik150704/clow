// File: controllers/otpController.js
const emailService = require('../services/otpService');

class OtpController {
  // Generate OTP and send via email
  async generateOtp(req, res) {
    try {
      const { email } = req.body;
      
      // Validate request
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email is required' 
        });
      }
      
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid email format' 
        });
      }
      
      // Generate OTP
      const otp = emailService.generateOTP();
      
      // Send OTP via email
      await emailService.sendOTPEmail(email, otp);
      
      // Return success response with OTP
      res.status(200).json({
        success: true,
        message: 'OTP generated successfully',
        otp: otp,
        email: email
      });
    } catch (error) {
      console.error('Error generating OTP:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate and send OTP. Please try again later.'
      });
    }
  }
}

module.exports = new OtpController();