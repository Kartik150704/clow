const otpModel = require('../models/otpModel');
const otpGenerator = require('../utils/otpGenerator');
const SibApiV3Sdk = require('sib-api-v3-sdk');

// Configure Brevo (formerly Sendinblue)
const brevoConfig = require('../config/brevoConfig');
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = brevoConfig.apiKey;
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

exports.generateAndSendOtp = async (email) => {
  try {
    // Generate a random 4-digit OTP
    const otp = otpGenerator.generate(4);
    
    // Set expiration time (10 minutes from now)
    const expiresIn = 10 * 60 * 1000; // 10 minutes in milliseconds
    const expiresAt = new Date(Date.now() + expiresIn);
    
    // Save OTP to database
    await otpModel.saveOtp(email, otp, expiresAt);
    
    // Send OTP via Brevo
    // await sendOtpViaBrevo(email, otp);
    
    return {
      email,
      expiresIn,
      otp
    };
  } catch (error) {
    console.error('Error in OTP service:', error);
    throw new Error('Failed to generate and send OTP');
  }
};

exports.verifyOtp = async (email, providedOtp) => {
  try {
    // Get stored OTP from database
    const storedOtpData = await otpModel.getOtp(email);
    
    // If no OTP found or expired
    if (!storedOtpData) {
      return false;
    }
    
    const { otp, expiresAt } = storedOtpData;
    
    // Check if OTP is expired
    if (new Date() > new Date(expiresAt)) {
      await otpModel.deleteOtp(email); // Clean up expired OTP
      return false;
    }
    
    // Check if OTP matches
    if (otp !== providedOtp) {
      return false;
    }
    
    // OTP is valid, clean it up
    await otpModel.deleteOtp(email);
    
    return true;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw new Error('Failed to verify OTP');
  }
};

// Helper function to send OTP via Brevo
async function sendOtpViaBrevo(email, otp) {
  try {
    const sendSmtpEmail = {
      sender: { 
        name: "Clow Team", 
        email: "team@clow.in" 
      },
      to: [
        { email }
      ],
      subject: "Your Clow Verification Code",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #121212; color: #ffffff;">
          <h2 style="color: #6A5ACD; text-align: center;">CLOW</h2>
          <h3>Your Verification Code</h3>
          <div style="font-size: 24px; letter-spacing: 8px; text-align: center; margin: 30px 0; padding: 20px; background-color: #1E1E1E; border-radius: 8px;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
      textContent: `Your verification code is: ${otp}. This code will expire in 10 minutes.`
    };
    
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return response;
  } catch (error) {
    console.error('Error sending email via Brevo:', error);
    throw new Error('Failed to send OTP email');
  }
}