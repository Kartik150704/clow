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
      CREATE TABLE IF NOT EXISTS ride (
    rideId TEXT PRIMARY KEY,
    customerId TEXT NOT NULL,
    driverId TEXT,
    price NUMERIC,
    requestedTo TEXT[], -- Array of driver IDs who received the ride request
    rejectedBy TEXT[], -- Array of driver IDs who rejected the ride
    placeTo TEXT NOT NULL,
    placeFrom TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acceptedBy TEXT,
    status TEXT
);

            `)

        await client.query(`
        CREATE TABLE IF NOT EXISTS Notification(
            id text,
            fcmToken text
        );
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

// Example main function (you can modify or remove this as needed)
const main = async () => {
    try {
        let query = `SELECT 
    ride.id AS ride_id,
    ride.userId,
    ride.placeTo,
    ride.startTime,
    ride.endTime,
    ride.initialMeterPhoto,
    ride.initialMeterReading,
    ride.finalMeterReading,
    ride.finalMeterPhoto,
    ride.paymentdata,
    ride.status AS ride_status,
    riderProfile.id AS profile_id,
    riderProfile.name,
    riderProfile.email,
    riderProfile.phone_number,
    riderProfile.person_photo

FROM ride
JOIN riderProfile ON ride.userId = riderProfile.id
WHERE ride.userId != '2021csb1101@iitrpr.ac.in' 
AND ride.userId != '2021csb1099@iitrpr.ac.in'
and ride.status='started';
`;
        let query2 = `delete from ride;`
        let result = await pool.query(query2);
        console.dir(result.rows, { depth: null });
    } catch (error) {
        console.error('Error in main execution:', error);
    } finally {
        await pool.end(); // Close the pool when done
    }
};

// Uncomment the following line to run the main function when executing this file directly
main();    
runMigrations()
module.exports = {
    query: (text, params) => pool.query(text, params),
    runMigrations,
    pool, // Exported for test cleanup or external usage
};
