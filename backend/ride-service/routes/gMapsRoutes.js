// routes/routeRoutes.js
const express = require('express');
const router = express.Router();
const RouteController = require('../controllers/gMapsController');

const routeController = new RouteController();

/**
 * @route POST /api/routes/calculate
 * @desc Calculate distance and time between two coordinates
 * @access Public
 */
router.post('/distance', (req, res) => routeController.calculateRoute(req, res));

module.exports = router;