// server.js
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients with their ID as the key
const clients = new Map();

// Basic API route to check server status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        connectedClients: clients.size,
        clientIds: Array.from(clients.keys())
    });
});

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('Client connected');
    let userId = null;

    // Handle messages from clients
    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message);

            // Handle client identification
            if (parsedMessage.type === 'identity') {
                userId = parsedMessage.id;
                clients.set(userId, ws);
                console.log(`Client identified with ID: ${userId}`);

                // Send confirmation to the client
                ws.send(JSON.stringify({
                    type: 'system',
                    message: `Connected with ID: ${userId}`
                }));
                return;
            }

            // Handle notification messages
            if (parsedMessage.type === 'notification') {
                const { to, from, data } = parsedMessage;

                // Find the recipient's WebSocket connection
                const recipient = clients.get(to);

                if (recipient && recipient.readyState === WebSocket.OPEN) {
                    // Send the message to the recipient
                    recipient.send(JSON.stringify({
                        type: 'notification',
                        from,
                        data,
                        timestamp: new Date().toISOString()
                    }));

                    console.log(`Message sent from ${from} to ${to}`);
                } else {
                    console.log(`Recipient ${to} not found or not connected`);

                    // Send failure notification back to sender
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: `User ${to} is not connected`
                    }));
                }
            }
        } catch (error) {
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process message',
                error: error.message
            }));
        }
    });

    // Handle client disconnection
    ws.on('close', () => {
        if (userId) {
            console.log(`Client disconnected: ${userId}`);
            clients.delete(userId);
        } else {
            console.log('Unidentified client disconnected');
        }
    });

    // Handle connection errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        if (userId) {
            clients.delete(userId);
        }
    });
});

// Start the server
const PORT = process.env.PORT || 8085;
server.listen(PORT, () => {
    console.log(`WebSocket server is running on port ${PORT}`);
});