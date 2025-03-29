const db = require('../db/index');
const { v4: uuidv4 } = require('uuid');

/**
 * Get a driver by ID
 * @param {string} id - Driver ID
 * @returns {Promise<Object>} - Driver data
 */
const getDriverById = async (id) => {
  const query = 'SELECT * FROM driver WHERE id = $1';
  const result = await db.query(query, [id]);
  return result.rows[0];
};

/**
 * Get a driver by mobile number
 * @param {string} mobileNumber - Driver mobile number
 * @returns {Promise<Object>} - Driver data
 */
const getDriverByMobileNumber = async (mobileNumber) => {
  const query = 'SELECT * FROM driver WHERE mobileNumber = $1';
  const result = await db.query(query, [mobileNumber]);
  return result.rows[0];
};

/**
 * Create a new driver profile or return existing one
 * @param {string} mobileNumber - Driver mobile number
 * @returns {Promise<Object>} - Driver ID and creation status
 */
const createDriver = async (mobileNumber) => {
  // Check if driver with this mobile number already exists
  const existingDriver = await getDriverByMobileNumber(mobileNumber);
  
  if (existingDriver) {
    return {
      id: existingDriver.id,
      isNewDriver: false
    };
  }
  
  // Generate new UUID
  const id = uuidv4();
  
  // Create new driver record with minimal info
  const query = 'INSERT INTO driver (id, mobileNumber) VALUES ($1, $2) RETURNING id';
  const result = await db.query(query, [id, mobileNumber]);
  
  return {
    id: result.rows[0].id,
    isNewDriver: true
  };
};

/**
 * Update driver profile
 * @param {string} id - Driver ID
 * @param {Object} data - Driver data to update
 * @returns {Promise<Object>} - Updated driver data
 */
const updateDriver = async (id, data) => {
  // Construct update query based on provided fields
  const updateFields = [];
  const values = [];
  let valueIndex = 1;
  
  // Handle basic fields
  if (data.name !== undefined) {
    updateFields.push(`name = $${valueIndex}`);
    values.push(data.name);
    valueIndex++;
  }
  
  if (data.mobileNumber !== undefined) {
    updateFields.push(`mobileNumber = $${valueIndex}`);
    values.push(data.mobileNumber);
    valueIndex++;
  }
  
  // Handle JSONB fields
  if (data.profileData !== undefined) {
    updateFields.push(`profileData = $${valueIndex}`);
    values.push(data.profileData);
    valueIndex++;
  }
  
  if (data.vehicleData !== undefined) {
    updateFields.push(`vehicleData = $${valueIndex}`);
    values.push(data.vehicleData);
    valueIndex++;
  }
  
  // If no fields to update, return the current record
  if (updateFields.length === 0) {
    return getDriverById(id);
  }
  
  values.push(id);
  const query = `UPDATE driver SET ${updateFields.join(', ')} WHERE id = $${valueIndex} RETURNING *`;
  const result = await db.query(query, values);
  
  return result.rows[0];
};

/**
 * Delete a driver
 * @param {string} id - Driver ID
 * @returns {Promise<boolean>} - Success flag
 */
const deleteDriver = async (id) => {
  const query = 'DELETE FROM driver WHERE id = $1 RETURNING id';
  const result = await db.query(query, [id]);
  
  return result.rowCount > 0;
};

module.exports = {
  getDriverById,
  getDriverByMobileNumber,
  createDriver,
  updateDriver,
  deleteDriver
};