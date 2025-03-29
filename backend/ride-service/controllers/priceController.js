// controllers/PriceController.js
const PriceCalculator = require('../models/priceCalculator');

const priceController = {
  /**
   * Calculate price between origin and destination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  calculatePrice: async (req, res) => {
    try {
      const { origin, destination } = req.body;

      // Validate input
      if (!origin || !destination) {
        return res.status(400).json({
          success: false,
          message: 'Both origin and destination are required'
        });
      }

      // Check if we have required location data
      if (!origin.geometry?.location || !destination.geometry?.location) {
        return res.status(400).json({
          success: false,
          message: 'Invalid place objects. Missing geometry.location data.'
        });
      }

      // Create calculator instance
      const calculator = new PriceCalculator();
      
      // Calculate distance and price
      let result;
      
      // Check if places already have distance information
      
    result = await calculator.getDistanceAndPrice(origin, destination);
      
      // Check for calculation success
      if (!result.success) {
        return res.status(500).json(result);
      }
      
      // Return the result
      return res.status(200).json(result);
      
    } catch (error) {
      console.error('Price calculation error:', error);
      return res.status(500).json({
        success: false,
        message: `Failed to calculate price: ${error.message}`
      });
    }
  }
};

module.exports = priceController;