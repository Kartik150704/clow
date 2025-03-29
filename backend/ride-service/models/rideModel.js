// models/ride.model.js
const { query } = require('../db/index');
const { v4: uuidv4 } = require('uuid');
const { sendNotificationToIds } = require('../utils/notificationUtils');

class RideModel {
  // 1. Create a new ride with available drivers
  async createRide(customerId, placeTo, placeFrom, price) {
    const rideId = uuidv4();

    // Get all driver IDs from the driver table
    const allDriversResult = await query('SELECT id FROM driver');
    const allDriverIds = allDriversResult.rows.map(row => row.id);

    // Get driver IDs who are currently in a ride (status = 'started')
    const busyDriversResult = await query(
      'SELECT driverid FROM ride WHERE status = $1 AND driverid IS NOT NULL',
      ['started']
    );
    const busyDriverIds = busyDriversResult.rows
      .map(row => row.driverid)
      .filter(id => id); // Filter out null values

    // Filter out busy drivers to get available drivers
    const availableDriverIds = allDriverIds.filter(id => !busyDriverIds.includes(id));

    // Use available drivers for requestedTo array
    const requestedTo = availableDriverIds.length > 0 ? availableDriverIds : [];
    const status = 'created';

    const result = await query(
      `INSERT INTO ride (rideid, customerid, requestedto, placeto ,placeFrom, status, rejectedby,price) 
       VALUES ($1, $2, $3, $4, $5, $6,$7,$8) 
       RETURNING *`,
      [rideId, customerId, requestedTo, placeTo, placeFrom, status, [], price]
    );
    try {
      let notificationData = {
        title: "New Ride Request",
        body: "New Ride Request"
      }
      await sendNotificationToIds(requestedTo, notificationData)
    }
    catch (err) {
      console.log(err)
    }
    return result.rows[0];
  }

  // 2. Cancel a ride
  async cancelRide(rideId, status) {
    const result = await query(
      `UPDATE ride SET status = $1 WHERE rideid = $2 RETURNING *`,
      [status, rideId]
    );

    return result.rows[0];
  }

  // 3. Accept a ride with validation checks
  async acceptRide(rideId, driverId) {
    // Check if the ride exists and is not already started
    const currentRide = await this.getRideById(rideId);
    if (!currentRide) {
      return { error: 'Ride not found', success: false };
    }

    if (currentRide.status === 'started' || currentRide.status == "cancel") {
      return {
        error: 'Ride already started by another driver',
        success: false,
        ride: currentRide
      };
    }

    // Check if the driver is already assigned to another active ride
    const driverActiveRides = await query(
      'SELECT * FROM ride WHERE driverid = $1 AND status = $2',
      [driverId, 'started']
    );

    if (driverActiveRides.rows.length > 0) {
      return {
        error: 'Driver already has an active ride',
        success: false,
        activeRide: driverActiveRides.rows[0]
      };
    }

    // All checks passed, proceed with accepting the ride
    const result = await query(
      `UPDATE ride 
       SET driverid = $1, acceptedby = $1, status = $2 
       WHERE rideid = $3 RETURNING *`,
      [driverId, 'started', rideId]
    );

    return {
      success: true,
      ride: result.rows[0]
    };
  }

  // 4. Reject a ride
  async rejectRide(rideId, driverId) {
    // First get the current ride to access its arrays
    const currentRide = await this.getRideById(rideId);

    if (!currentRide) {
      return null;
    }

    // Add driverId to rejectedBy array if not already present
    let rejectedBy = currentRide.rejectedby || [];
    if (!rejectedBy.includes(driverId)) {
      rejectedBy.push(driverId);
    }

    // Remove driverId from requestedTo array if present
    let requestedTo = currentRide.requestedto || [];
    requestedTo = requestedTo.filter(id => id !== driverId);

    const result = await query(
      `UPDATE ride 
       SET rejectedby = $1, requestedto = $2
       WHERE rideid = $3 RETURNING *`,
      [rejectedBy, requestedTo, rideId]
    );

    return result.rows[0];
  }

  // 5. Fetch a ride by ID
  async getRideById(rideId) {
    const result = await query(
      `SELECT * FROM ride WHERE rideid = $1`,
      [rideId]
    );

    return result.rows[0];
  }

  // 6. Fetch rides by status
  async getRidesByStatus(status) {
    const result = await query(
      `SELECT * FROM ride WHERE status = $1`,
      [status]
    );

    return result.rows;
  }

  // 7. Fetch rides by customerId with optional status filter
  async getRidesByCustomerId(customerId, status = null) {
    let queryText;
    let queryParams;

    if (status) {
      queryText = `SELECT * FROM ride WHERE customerid = $1 AND status = $2`;
      queryParams = [customerId, status];
    } else {
      queryText = `SELECT * FROM ride WHERE customerid = $1 AND status!='ended' AND status!='cancel'`;
      queryParams = [customerId];
    }

    const result = await query(queryText, queryParams);
    return result.rows;
  }
  async getRideRequestsForDriver(driverId) {
    // Find rides where the driver is in requestedTo but not in rejectedBy
    const result = await query(
      `SELECT * FROM ride 
       WHERE $1 = ANY(requestedto) 

       AND status = 'created'`,
      [driverId]
    );

    return result.rows;
  }
  async getRidesByDriverId(driverId, status = null) {
    let queryText;
    let queryParams;

    if (status) {
      queryText = `SELECT * FROM ride WHERE driverid = $1 AND status = $2`;
      queryParams = [driverId, status];
    } else {
      queryText = `SELECT * FROM ride WHERE driverid = $1`;
      queryParams = [driverId];
    }

    const result = await query(queryText, queryParams);
    return result.rows;
  }
  async endRideByDriver(rideId, driverId) {
    // 1. End the specific ride
    try {
      const currentRide = await this.getRideById(rideId);
      if (!currentRide) {
        return { error: 'Ride not found', success: false };
      }

      // Update the ride status to 'ended'
      let endedRide = await query(
        `UPDATE ride SET status = $1 WHERE rideid = $2 RETURNING *`,
        ['ended', rideId]
      );

      // 2. Find all 'created' rides
      const createdRides = await this.getRidesByStatus('created');
      console.log(createdRides);

      // Track how many rides need to be updated
      let updatedRidesCount = 0;
      let notificationsSent = 0;

      // Array to store ride IDs and their updated requestedTo arrays
      const ridesToUpdate = [];

      // Process each created ride
      for (const ride of createdRides) {
        // Check if driver is already in rejectedBy or requestedTo arrays
        let rejectedBy = ride.rejectedby || [];
        let requestedTo = ride.requestedto || [];

        if (!rejectedBy.includes(driverId) && !requestedTo.includes(driverId)) {
          // Add driver to requestedTo array
          requestedTo.push(driverId);

          // Add to our batch update array
          ridesToUpdate.push({
            rideid: ride.rideid,
            requestedto: requestedTo
          });

          updatedRidesCount++;
        }
      }

      // Perform a batch update if there are rides to update
      if (ridesToUpdate.length > 0) {
        // Build a parameterized query for updating multiple rows
        const updateValues = ridesToUpdate.map((ride, index) => {
          return `($${index * 2 + 1}::text, $${index * 2 + 2}::text[])`;
        }).join(', ');

        // Flatten parameters for the query
        const updateParams = ridesToUpdate.flatMap(ride => [
          ride.rideid,
          ride.requestedto
        ]);

        // Execute a single query to update all rides
        await query(`
          UPDATE ride
          SET requestedto = v.requestedto
          FROM (VALUES ${updateValues}) AS v(rideid, requestedto)
          WHERE ride.rideid = v.rideid
        `, updateParams);
      }

      // Send notification to the driver (only once regardless of ride count)
      try {
        let notificationData = {
          title: "New Ride Request",
          body: "New Ride Request"
        };
        let result = await sendNotificationToIds([driverId], notificationData);
        console.log(result);
        notificationsSent++;
      } catch (err) {
        // Notification sending failed, but we'll continue
        console.log(err);
      }

      return {
        success: true,
        message: `Ride ended successfully. Driver added to ${updatedRidesCount} new ride requests.`,
        ride: endedRide.rows[0],
        updatedRidesCount,
        notificationsSent
      };
    } catch (err) {
      console.error('Error ending ride:', err);
      return { error: 'Failed to end ride', success: false };
    }
  }
}

module.exports = new RideModel();