// controllers/authController.js

const { findCustomerByEmail, createCustomer, findCustomerById, updateCustomer } = require('../models/customerModel');

// Create a new Google OAuth client


// Controller for Google authentication
const googleAuth = async (req, res) => {
    try {
        const { email } = req.body;



        if (!email) {
            return res.status(400).json({ error: 'Email not found in Google account' });
        }

        // Check if the user already exists in our database
        let customer = await findCustomerByEmail(email);
        let isNewUser = false;

        // If customer doesn't exist, create a new one with UUID
        if (!customer) {
            isNewUser = true;
            customer = await createCustomer(email, null, null);
        }

        // Return customer ID (UUID) and user information
        return res.status(200).json({
            success: true,
            customerId: customer.id,
            isNewUser,
            email: customer.email,

        });

    } catch (error) {
        console.error('Error in Google authentication:', error);
        return res.status(500).json({ error: 'Authentication failed', details: error.message });
    }
};
const getProfile = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Customer ID is required' });
        }

        const customer = await findCustomerById(id);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Return customer profile information
        return res.status(200).json({
            success: true,
            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phoneNumber: customer.phone_number
            }
        });

    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
    }
};

// Controller for updating a customer profile
const updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phoneNumber } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'Customer ID is required' });
        }

        // Check if the customer exists
        const existingCustomer = await findCustomerById(id);

        if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Update the customer profile
        const updatedCustomer = await updateCustomer(
            id,
            name !== undefined ? name : existingCustomer.name,
            phoneNumber !== undefined ? phoneNumber : existingCustomer.phone_number
        );

        // Return the updated customer profile
        return res.status(200).json({
            success: true,
            customer: {
                id: updatedCustomer.id,
                name: updatedCustomer.name,
                email: updatedCustomer.email,
                phoneNumber: updatedCustomer.phone_number
            }
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: 'Failed to update profile', details: error.message });
    }
};

module.exports = {
    googleAuth,
    getProfile,
    updateProfile
};