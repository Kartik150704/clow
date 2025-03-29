// routes/ride.routes.js
const express = require('express');
const rideController = require('../controllers/rideController');

const router = express.Router();

// 1. Create a ride
router.post('/', rideController.createRide);

// 2. Cancel a ride
router.put('/:rideId/cancel', rideController.cancelRide);

// 3. Accept a ride
router.put('/:rideId/accept', rideController.acceptRide);
router.put('/:rideId/end', rideController.endRide);

// 4. Reject a ride
router.put('/:rideId/reject', rideController.rejectRide);

// 6. Fetch rides by status
router.get('/status/:status', rideController.getRidesByStatus);

// 7. Fetch rides by customerId with optional status filter
router.get('/customer/:customerId', rideController.getRidesByCustomerId);

// 8. Fetch available ride requests for a driver
router.get('/driver/:driverId/requests', rideController.getRideRequestsForDriver);

// 9. Fetch rides assigned to a driver with optional status filter
router.get('/driver/:driverId/rides', rideController.getRidesByDriverId);

// 5. Fetch a ride by ID
router.get('/:rideId', rideController.getRide);

module.exports = router;