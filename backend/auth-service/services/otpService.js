// File: services/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();
class EmailService {
  constructor() {
    // Create a transport for nodemailer using Brevo SMTP
    this.transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.BREVO_EMAIL_USER, // Your Brevo SMTP username/login
        pass: process.env.BREVO_EMAIL_PASS, // Your Brevo SMTP key
      },
    });
  }

  // Generate a 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP via email
  async sendOTPEmail(email, otp) {
    try {
      // Email template
      const mailOptions = {
        from: 'noreply@clow.in', // Use the email associated with your Brevo account
        to: email,
        subject: 'Your Verification Code for CLOW App',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6A5ACD;">CLOW App Verification</h2>
            <p>Hello,</p>
            <p>Your verification code for CLOW App is:</p>
            <h1 style="font-size: 32px; letter-spacing: 8px; background-color: #f7f7f7; padding: 16px; text-align: center;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <p>Thank you,<br>Team CLOW</p>
          </div>
        `
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();