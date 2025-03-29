// app.js
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

const cutomerRoutes = require('./routes/customerRoutes')
const driverRoutes = require("./routes/driverRoutes")
const otpRoutes = require('./routes/otpRoute');
require('./db/index');
// Define allowed origins for your application
const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    'http://localhost:8081',
    'https://localhost:8081',
    'http://ride.easecruit.com',
    'https://ride.easecruit.com',
    'http://clow.in',
    'https://clow.in',
];

// Configure CORS properly to allow credentials
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, origin);
        } else {
            console.log(`CORS blocked origin: ${origin}`);
            // You can either:
            callback(null, false); // Or block with an error: callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Middleware to parse JSON if needed
app.use(express.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('trust proxy', true);
app.use('/customer', cutomerRoutes)
app.use('/driver', driverRoutes)
app.use('/otp', otpRoutes)
// Mount the places router at /places

// Add a simple CORS test endpoint
app.get('/cors-test', (req, res) => {
    res.json({
        message: 'CORS is working correctly!',
        origin: req.headers.origin || 'No origin',
        headers: {
            'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin') || 'Not set',
            'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials') || 'Not set'
        }
    });
});

module.exports = app;