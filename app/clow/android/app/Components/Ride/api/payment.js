import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay'; // This needs to be installed

const authServicePort = `https://backend-ride-service.easecruit.com`;

export const FetchIncompleteRide = async (userId) => {
    let response = await fetch(`${authServicePort}/ride/rides/incomplete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
    });
    return await response.json();
}

export const FetchAllRide = async (userId) => {
    let response = await fetch(`${authServicePort}/ride/rides/all`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
    });
    return await response.json();
}

export const CreateRide = async (userId, placeTo) => {
    let response = await fetch(`${authServicePort}/ride/ride`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, placeTo })
    });
    return await response.json();
}

export const CancelRide = async (rideId) => {
    let response = await fetch(`${authServicePort}/ride/ride/${rideId}`, {
        method: 'DELETE'
    });
    return await response.json();
}

export const CompleteRide = async (rideId) => {
    let response = await fetch(`${authServicePort}/ride/complete/${rideId}`, {
        method: 'POST'
    });
    return await response.json();
};

export const MakePayment = async (rideId, amount) => {
    try {
        // First create a payment order
        const orderResponse = await CreatePaymentOrder(rideId, amount);
        
        if (!orderResponse || !orderResponse.orderId) {
            throw new Error('Failed to create payment order');
        }
        
        // Get user details from AsyncStorage
        const name = 'User';
        const email = '';
        const phone =  '';
        
        // Configure Razorpay options for React Native
        const options = {
            description: 'Payment for your ride',
            image: 'https://your-app-logo-url.png', // Your app logo URL
            currency: orderResponse.currency || 'INR',
            key: orderResponse.key,
            amount: (orderResponse.amount * 100).toString(), // Razorpay expects amount in paisa as string
            name: 'Ride Service',
            order_id: orderResponse.orderId,
            prefill: {
                email,
                contact: phone,
                name
            },
            theme: { color: '#3399cc' },
            notes: {
                rideId: rideId.toString()
            }
        };
        
        // Open Razorpay checkout
        const data = await RazorpayCheckout.open(options);
        
        // Handle success - data contains payment_id, order_id, signature
        const verifyData = {
            order_id: data.razorpay_order_id,
            payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature,
            rideId: rideId
        };
        
        // Verify payment on server
        const verifyResponse = await VerifyPayment(verifyData);
        
        return verifyResponse;
    } catch (error) {
        console.error("Error processing payment:", error);
        
        // Handle specific Razorpay errors
        if (error.code === 'PAYMENT_CANCELLED') {
            throw new Error('Payment canceled by user');
        } else if (error.code) {
            throw new Error(`Payment failed: ${error.description || error.code}`);
        }
        
        throw error;
    }
}

// Create payment order for a ride
export const CreatePaymentOrder = async (rideId, amount) => {
    let response = await fetch(`${authServicePort}/payment/create-order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            rideId,
            amount
        })
    });
    return await response.json();
}

// Verify payment
export const VerifyPayment = async (paymentData) => {
    let response = await fetch(`${authServicePort}/payment/verify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
    });
    return await response.json();
}

// Get payment details by ride ID
export const GetPaymentDetails = async (rideId) => {
    let response = await fetch(`${authServicePort}/payment/ride/${rideId}`);
    return await response.json();
}