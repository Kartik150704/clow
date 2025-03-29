// db/index.js
const path = require('path');
require('dotenv').config();
const { Pool } = require('pg');


const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false,
    },
});

// Function to run database migrations
const runMigrations = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`
            CREATE TABLE IF NOT EXISTS customer(
                    id text,
                    name text,
                    email text,
                    phone_number text

            )
            `)
        await client.query(`
                CREATE TABLE IF NOT EXISTS driver(
                    id  text,
                    name text,
                    mobileNumber text,
                    profileData jsonb,
                    vehicleData jsonb
                )
            
            `)

        await client.query('COMMIT');
        console.log('Database migrations ran successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error running migrations:', err);
        throw err; // Re-throw the error to be handled by the caller
    } finally {
        client.release();
    }
};



runMigrations()
module.exports = {
    query: (text, params) => pool.query(text, params),
    runMigrations,
    pool, // Exported for test cleanup or external usage
};
