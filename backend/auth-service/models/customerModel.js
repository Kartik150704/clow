// models/customerModel.js
const db = require('../db/index');
const { generateUUID } = require('../utils/uuidGenerator');

const findCustomerByEmail = async (email) => {
    try {
        const query = 'SELECT * FROM customer WHERE email = $1';
        const result = await db.query(query, [email]);
        return result.rows[0];
    } catch (error) {
        console.error('Error finding customer by email:', error);
        throw error;
    }
};

const createCustomer = async (email, name = null, phoneNumber = null) => {
    try {
        const uuid = generateUUID();
        const query = 'INSERT INTO customer (id, email, name, phone_number) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await db.query(query, [uuid, email, name, phoneNumber]);
        return result.rows[0];
    } catch (error) {
        console.error('Error creating customer:', error);
        throw error;
    }
};
const findCustomerById = async (id) => {
    try {
        const query = 'SELECT * FROM customer WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    } catch (error) {
        console.error('Error finding customer by id:', error);
        throw error;
    }
};
const updateCustomer = async (id, name, phoneNumber) => {
    try {
        const query = 'UPDATE customer SET name = $2, phone_number = $3 WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id, name, phoneNumber]);
        return result.rows[0];
    } catch (error) {
        console.error('Error updating customer:', error);
        throw error;
    }
};

module.exports = {
    findCustomerByEmail,
    findCustomerById,
    createCustomer,
    updateCustomer
};