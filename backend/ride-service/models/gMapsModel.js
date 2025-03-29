// models/Route.js
const axios = require('axios');

class Route {
  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';
  }

  /**
   * Calculate distance and time between two coordinates
   * @param {Object} origin - Origin coordinates {lat, lng}
   * @param {Object} destination - Destination coordinates {lat, lng}
   * @param {String} vehicleType - Type of vehicle (driving, walking, bicycling, transit)
   * @returns {Promise} - Promise with distance and duration information
   */
  async calculateRoute(origin, destination, vehicleType = 'driving') {
    try {
      // Map vehicle type to Google Maps API travel mode
      const travelMode = this.mapVehicleTypeToTravelMode(vehicleType);
      
      // Format coordinates
      const originStr = `${origin.lat},${origin.lng}`;
      const destinationStr = `${destination.lat},${destination.lng}`;
      
      // Make API request
      const response = await axios.get(this.baseUrl, {
        params: {
          origins: originStr,
          destinations: destinationStr,
          mode: travelMode,
          key: this.apiKey
        }
      });
      
      // Check for valid response
      if (response.data.status !== 'OK') {
        throw new Error(`API Error: ${response.data.status}`);
      }
      
      // Extract relevant data
      const routeData = response.data.rows[0].elements[0];
      
      if (routeData.status !== 'OK') {
        throw new Error(`Route Error: ${routeData.status}`);
      }
      
      // Return formatted result
      return {
        distance: {
          value: routeData.distance.value, // Distance in meters
          text: routeData.distance.text    // Formatted distance (e.g., "5.2 km")
        },
        duration: {
          value: routeData.duration.value, // Duration in seconds
          text: routeData.duration.text    // Formatted duration (e.g., "12 mins")
        },
        origin: originStr,
        destination: destinationStr,
        vehicle_type: vehicleType
      };
    } catch (error) {
      throw new Error(`Failed to calculate route: ${error.message}`);
    }
  }

  /**
   * Map custom vehicle types to Google Maps API travel modes
   * @param {String} vehicleType - Custom vehicle type
   * @returns {String} - Google Maps API travel mode
   */
  mapVehicleTypeToTravelMode(vehicleType) {
    const vehicleMap = {
      'car': 'driving',
      'driving': 'driving',
      'walk': 'walking',
      'walking': 'walking',
      'bicycle': 'bicycling',
      'bicycling': 'bicycling',
      'bike': 'bicycling',
      'transit': 'transit',
      'bus': 'transit',
      'train': 'transit'
    };

    return vehicleMap[vehicleType.toLowerCase()] || 'driving';
  }
}

module.exports = Route;