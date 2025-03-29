// controllers/RouteController.js
const Route = require('../models/gMapsModel');

class RouteController {
  constructor() {
    this.routeModel = new Route();
  }

  /**
   * Calculate route between two coordinates
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async calculateRoute(req, res) {
    try {
      // Validate request body
      const { origin, destination, vehicleType } = req.body;
      console.log('Request body:', req.body);
      if (!this.isValidCoordinates(origin) || !this.isValidCoordinates(destination)) {
        return res.status(400).json({
          error: 'Invalid coordinates. Please provide valid latitude and longitude values.'
        });
      }
      
      // Default to 'driving' if no vehicle type provided
      const vehicle = vehicleType || 'driving';
      
      // Calculate route using model
      const routeData = await this.routeModel.calculateRoute(origin, destination, vehicle);
      
      // Return success response
      return res.status(200).json({
        success: true,
        data: routeData
      });
    } catch (error) {
      // Handle errors
      console.error('Route calculation failed:', error);
      return res.status(500).json({
        error: 'Failed to calculate route',
        message: error.message
      });
    }
  }

  /**
   * Validate coordinates object
   * @param {Object} coords - Coordinates object {lat, lng}
   * @returns {Boolean} - True if valid coordinates
   */
  isValidCoordinates(coords) {
    if (!coords || typeof coords !== 'object') return false;
    
    const { lat, lng } = coords;
    
    // Check if lat and lng are numbers and within valid ranges
    return (
      typeof lat === 'number' && !isNaN(lat) &&
      typeof lng === 'number' && !isNaN(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  }
}

module.exports = RouteController;