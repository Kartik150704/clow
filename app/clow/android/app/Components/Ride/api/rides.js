const authServicePort = `https://backend-ride-service.easecruit.com`;

/**
 * Fetches all incomplete rides for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of incomplete rides
 */
export const FetchIncompleteRide = async (userId) => {
  try {
    const response = await fetch(`${authServicePort}/ride/rides/incomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching incomplete rides:', error);
    throw error;
  }
};

/**
 * Fetches all rides for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of all rides
 */
export const FetchAllRide = async (userId) => {
  try {
    const response = await fetch(`${authServicePort}/ride/rides/all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching all rides:', error);
    throw error;
  }
};

/**
 * Creates a new ride
 * @param {string} userId - The user ID
 * @param {string} placeTo - The destination place
 * @returns {Promise<Object>} - The created ride
 */
export const CreateRide = async (userId, placeTo) => {
  try {
    const response = await fetch(`${authServicePort}/ride/ride`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, placeTo })
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating ride:', error);
    throw error;
  }
};

/**
 * Cancels a ride
 * @param {string} rideId - The ride ID
 * @returns {Promise<Object>} - The cancellation response
 */
export const CancelRide = async (rideId) => {
  try {
    const response = await fetch(`${authServicePort}/ride/ride/${rideId}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('Error canceling ride:', error);
    throw error;
  }
};

/**
 * Completes a ride by processing payment
 * @param {string} id - The ride ID
 * @returns {Promise<Object>} - The completion response
 */
export const CompleteRide = async (id) => {
  try {
    const response = await fetch(`${authServicePort}/ride/ride/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id })
    });
    return await response.json();
  } catch (error) {
    console.error('Error completing ride:', error);
    throw error;
  }
};