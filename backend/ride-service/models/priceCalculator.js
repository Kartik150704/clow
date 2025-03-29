// models/PriceCalculator.js
const axios = require('axios');

class PriceCalculator {
    constructor() {
        this.apiKey = process.env.GOOGLE_API_KEY;
        this.baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';
    }

    /**
     * Calculate price based on distance
     * @param {Number} distanceInMeters - Distance in meters
     * @returns {Number} - Price in INR
     */
    calculatePrice(distanceInMeters) {
        // Price tiers based on distance
        if (distanceInMeters <= 8000) {
            return 129;
        } else if (distanceInMeters <= 12000) {
            return 137;
        } else {
            return 150;
        }
    }

    /**
     * Get distance and price between two places
     * @param {Object} origin - Origin place object with geometry.location
     * @param {Object} destination - Destination place object with geometry.location
     * @returns {Promise} - Promise with distance and price information
     */
    async getDistanceAndPrice(origin, destination) {
        try {
            // Get coordinates from place objects
            const originCoords = origin.geometry.location;
            const destinationCoords = destination.geometry.location;

            // Calculate distance using Google Distance Matrix API
            const originStr = `${originCoords.lat},${originCoords.lng}`;
            const destinationStr = `${destinationCoords.lat},${destinationCoords.lng}`;
            console.log('Origin:', originStr);
            console.log('Destination:', destinationStr);
            const response = await axios.get(this.baseUrl, {
                params: {
                    origins: originStr,
                    destinations: destinationStr,
                    mode: 'driving',
                    key: this.apiKey
                }
            });

            // Check for valid response
            if (response.data.status !== 'OK') {
                throw new Error(`API Error: ${response.data.status}`);
            }

            // Extract distance data
            const routeData = response.data.rows[0].elements[0];

            if (routeData.status !== 'OK') {
                throw new Error(`Route Error: ${routeData.status}`);
            }

            // Extract distance in meters
            const distanceInMeters = routeData.distance.value;

            // Calculate price
            const price = this.calculatePrice(distanceInMeters);

            // Return result
            return {
                success: true,
                distance: {
                    value: distanceInMeters,
                    text: routeData.distance.text
                },
                duration: {
                    value: routeData.duration.value,
                    text: routeData.duration.text
                },
                price: price,
                currency: 'INR',
                origin_name: origin.name || 'Origin',
                destination_name: destination.name || 'Destination'
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to calculate distance and price: ${error.message}`
            };
        }
    }

    /**
     * Alternative method if places already have distance information
     * @param {Object} origin - Origin place object
     * @param {Object} destination - Destination place object with distance property
     * @returns {Object} - Distance and price information
     */
    getDirectPrice(origin, destination) {
        try {
            // Check if destination has distance property
            if (destination.distance) {
                // Calculate price based on existing distance
                const price = this.calculatePrice(destination.distance);

                return {
                    success: true,
                    distance: {
                        value: destination.distance,
                        text: `${(destination.distance / 1000).toFixed(1)} km`
                    },
                    duration: {
                        value: destination.duration || 0,
                        text: destination.duration ? `${Math.round(destination.duration / 60)} mins` : 'Unknown'
                    },
                    price: price,
                    currency: 'INR',
                    origin_name: origin.name || 'Origin',
                    destination_name: destination.name || 'Destination'
                };
            } else {
                throw new Error('Distance information not found in place objects');
            }
        } catch (error) {
            return {
                success: false,
                error: `Failed to calculate price: ${error.message}`
            };
        }
    }
}

module.exports = PriceCalculator;