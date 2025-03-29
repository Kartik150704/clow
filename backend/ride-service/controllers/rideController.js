// controllers/ride.controller.js
const rideModel = require('../models/rideModel');
const { sendNotificationToIds } = require('../utils/notificationUtils');

class RideController {
  // 1. Create a new ride
  async createRide(req, res) {
    try {
      const { customerId, placeTo, placeFrom, price } = req.body;

      if (!customerId || !placeTo) {
        return res.status(400).json({ message: 'customerId and placeTo are required' });
      }

      const ride = await rideModel.createRide(customerId, placeTo, placeFrom, price);
      return res.status(201).json(ride);
    } catch (error) {
      console.error('Error creating ride:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // 2. Cancel a ride
  async cancelRide(req, res) {
    try {
      const { rideId } = req.params;
      const { status } = req.query;

      if (!rideId) {
        return res.status(400).json({ message: 'rideId is required' });
      }

      const ride = await rideModel.cancelRide(rideId, status);

      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }
      if (status == 'cancel') {
        try {
          let requestedTo = ride.requestedto
          let notificationData = {
            title: "Notification",
            body: `Notification`,
            data: { rideId: rideId }
          }
          await sendNotificationToIds([requestedTo], notificationData);
        }
        catch (err) {

        }
      }
      return res.status(200).json(ride);
    } catch (error) {
      console.error('Error canceling ride:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // 3. Accept a ride
  async acceptRide(req, res) {
    try {
      const { rideId } = req.params;
      const { driverId } = req.body;

      if (!rideId || !driverId) {
        return res.status(400).json({ message: 'rideId and driverId are required' });
      }

      const result = await rideModel.acceptRide(rideId, driverId);

      if (!result.success) {
        return res.status(400).json({
          message: result.error,
          data: result.ride || result.activeRide || null
        });
      }
      let id = result.ride.customerid
      try {
        let notificationData = {
          title: "Ride Accepted",
          body: `Your ride  has been accepted by a driver`,
          data: { rideId: rideId }
        }
        await sendNotificationToIds([id], notificationData);
      }
      catch (err) {

      }
      return res.status(200).json(result.ride);
    } catch (error) {
      console.error('Error accepting ride:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  async endRide(req, res) {
    try {
      const { rideId } = req.params;
      const { driverId } = req.body;
      console.log(rideId, driverId)

      if (!rideId || !driverId) {
        return res.status(400).json({ message: 'rideId and driverId are required' });
      }
      
      const result = await rideModel.endRideByDriver(rideId, driverId);

      if (!result.success) {
        return res.status(400).json({
          message: result,

        });
      }
      try
      {
        let notificationData={
          title: "Ride Ended",
          body: `Your ride has ended`,
          data: { rideId: rideId }
        }
        await sendNotificationToIds([result.ride.customerid], notificationData);
      }
      catch(err)
      {

      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error accepting ride:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  // 4. Reject a ride
  async rejectRide(req, res) {
    try {
      const { rideId } = req.params;
      const { driverId } = req.body;
      console.log(req.body)
      if (!rideId || !driverId) {
        return res.status(400).json({ message: 'rideId and driverId are required' });
      }

      const ride = await rideModel.rejectRide(rideId, driverId);

      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }

      return res.status(200).json(ride);
    } catch (error) {
      console.error('Error rejecting ride:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // 5. Fetch a ride
  async getRide(req, res) {
    try {
      const { rideId } = req.params;

      if (!rideId) {
        return res.status(400).json({ message: 'rideId is required' });
      }

      const ride = await rideModel.getRideById(rideId);

      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }

      return res.status(200).json(ride);
    } catch (error) {
      console.error('Error fetching ride:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // 6. Fetch rides by status
  async getRidesByStatus(req, res) {
    try {
      const { status } = req.params;

      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      const rides = await rideModel.getRidesByStatus(status);
      return res.status(200).json(rides);
    } catch (error) {
      console.error('Error fetching rides by status:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // 7. Fetch rides by customerId with optional status filter
  async getRidesByCustomerId(req, res) {
    try {
      const { customerId } = req.params;
      const { status } = req.query;

      if (!customerId) {
        return res.status(400).json({ message: 'customerId is required' });
      }

      const rides = await rideModel.getRidesByCustomerId(customerId, status || null);
      console.log(rides)
      return res.status(200).json(rides);
    } catch (error) {
      console.error('Error fetching rides by customerId:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // 8. Fetch available ride requests for a driver
  async getRideRequestsForDriver(req, res) {
    try {
      const { driverId } = req.params;

      if (!driverId) {
        return res.status(400).json({ message: 'driverId is required' });
      }

      const rides = await rideModel.getRideRequestsForDriver(driverId);

      return res.status(200).json(rides);
    } catch (error) {
      console.error('Error fetching ride requests for driver:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // 9. Fetch rides assigned to a driver with optional status filter
  async getRidesByDriverId(req, res) {
    try {
      const { driverId } = req.params;
      const { status } = req.query;

      if (!driverId) {
        return res.status(400).json({ message: 'driverId is required' });
      }

      const rides = await rideModel.getRidesByDriverId(driverId, status || null);
      return res.status(200).json(rides);
    } catch (error) {
      console.error('Error fetching rides by driverId:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = new RideController();