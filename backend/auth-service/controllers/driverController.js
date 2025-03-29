const driverModel = require('../models/driverModel');

/**
 * Get driver profile
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getDriverProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Driver ID is required' });
    }
    
    const driver = await driverModel.getDriverById(id);
    
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    res.status(200).json(driver);
  } catch (error) {
    console.error('Error fetching driver profile:', error);
    res.status(500).json({ error: 'Failed to fetch driver profile', details: error.message });
  }
};

/**
 * Create driver profile
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createDriverProfile = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    
    if (!mobileNumber) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }
    
    const result = await driverModel.createDriver(mobileNumber);
    
    res.status(result.isNewDriver ? 201 : 200).json({
      id: result.id,
      mobileNumber,
      isNewDriver: result.isNewDriver
    });
  } catch (error) {
    console.error('Error creating driver profile:', error);
    res.status(500).json({ error: 'Failed to create driver profile', details: error.message });
  }
};

/**
 * Update driver profile
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateDriverProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Driver ID is required' });
    }
    
    // Verify driver exists
    const driver = await driverModel.getDriverById(id);
    
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    // Update driver profile
    const updatedDriver = await driverModel.updateDriver(id, updateData);
    
    res.status(200).json(updatedDriver);
  } catch (error) {
    console.error('Error updating driver profile:', error);
    res.status(500).json({ error: 'Failed to update driver profile', details: error.message });
  }
};

/**
 * Delete driver profile
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteDriverProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Driver ID is required' });
    }
    
    // Verify driver exists
    const driver = await driverModel.getDriverById(id);
    
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    // Delete driver profile
    const deleted = await driverModel.deleteDriver(id);
    
    if (deleted) {
      res.status(200).json({ message: 'Driver profile deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete driver profile' });
    }
  } catch (error) {
    console.error('Error deleting driver profile:', error);
    res.status(500).json({ error: 'Failed to delete driver profile', details: error.message });
  }
};

module.exports = {
  getDriverProfile,
  createDriverProfile,
  updateDriverProfile,
  deleteDriverProfile
};