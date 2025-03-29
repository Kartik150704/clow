import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNEventSource from 'react-native-event-source';

/**
 * An enhanced WebSocket notification hook with ping-pong mechanism
 * @param {Function} onNotification - Callback executed when notification is received
 * @param {string} serverUrl - WebSocket server URL
 * @param {number} pingInterval - Ping interval in milliseconds (default: 30000 ms / 30 seconds)
 * @returns {Object} - Notification methods and connection state
 */
const useNotificationCallback = (onNotification, serverUrl = 'wss://ws-bike.easecruit.com', pingInterval = 30000) => {
    // Track connection status
    const [isConnected, setIsConnected] = useState(false);

    // WebSocket reference
    const wsRef = useRef(null);
    
    // Ping interval reference
    const pingIntervalRef = useRef(null);
    
    // Track last ping time
    const lastPingTimeRef = useRef(null);
    
    // Track last pong time
    const lastPongTimeRef = useRef(null);
    
    // Ping timeout (consider connection dead if no pong received within this time)
    const pingTimeoutMs = 10000; // 10 seconds

    // Track reconnection attempts
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000; // 3 seconds
    
    // Flag to track if component is mounted
    const isMountedRef = useRef(true);

    /**
     * Send a ping message to the server
     */
    const sendPing = useCallback(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }
        
        try {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
            lastPingTimeRef.current = Date.now();
            
            // Set timeout to check if pong was received
            setTimeout(() => {
                // If no pong received within timeout period and the component is still mounted
                if (
                    isMountedRef.current && 
                    lastPingTimeRef.current && 
                    (!lastPongTimeRef.current || lastPongTimeRef.current < lastPingTimeRef.current) &&
                    wsRef.current
                ) {
                    console.log('No pong received within timeout, reconnecting...');
                    // Force close and reconnect
                    wsRef.current.close();
                }
            }, pingTimeoutMs);
        } catch (error) {
            console.log('Error sending ping:', error);
        }
    }, []);

    /**
     * Start ping interval
     */
    const startPingInterval = useCallback(() => {
        // Clear any existing interval
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
        }
        
        // Start new interval
        pingIntervalRef.current = setInterval(sendPing, pingInterval);
    }, [sendPing, pingInterval]);

    /**
     * Stop ping interval
     */
    const stopPingInterval = useCallback(() => {
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }
    }, []);

    /**
     * Connect to the WebSocket server
     */
    const connect = useCallback(async () => {
        try {
            // Get user ID from AsyncStorage
            const userId = await AsyncStorage.getItem('id');

            if (!userId) {
                console.log('User ID not found in AsyncStorage');
                return;
            }

            // Check if already connected - don't reconnect if connection is active
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                console.log('Already connected to WebSocket server');
                return;
            }

            // Close existing connection if in a different state
            if (wsRef.current) {
                console.log('Closing existing WebSocket connection');
                wsRef.current.close();
                stopPingInterval();
            }

            console.log('Connecting to WebSocket server...');

            // Create new WebSocket connection
            wsRef.current = new WebSocket(serverUrl);

            // Handle connection open
            wsRef.current.onopen = () => {
                if (!isMountedRef.current) return;
                
                console.log('Connected to WebSocket server');
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;

                // Start ping interval
                startPingInterval();

                // Send identity message with ID
                if (wsRef.current.readyState === WebSocket.OPEN) {
                    // Send identity message with ID
                    wsRef.current.send(JSON.stringify({
                        type: 'identity',
                        id: userId
                    }));
                } else {
                    console.log('WebSocket not ready yet, state:', wsRef.current.readyState);
                }
            };

            // Handle connection error
            wsRef.current.onerror = (error) => {
                if (!isMountedRef.current) return;
                
                console.log('WebSocket error:', error);
                setIsConnected(false);
                stopPingInterval();
            };

            // Handle connection close
            wsRef.current.onclose = () => {
                if (!isMountedRef.current) return;
                
                console.log('Disconnected from WebSocket server');
                setIsConnected(false);
                stopPingInterval();

                // Attempt to reconnect
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectAttemptsRef.current += 1;
                    console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);

                    setTimeout(() => {
                        if (isMountedRef.current) {
                            connect();
                        }
                    }, reconnectDelay);
                } else {
                    console.log('Max reconnection attempts reached');
                }
            };

            // Handle incoming messages
            wsRef.current.onmessage = (event) => {
                if (!isMountedRef.current) return;
                
                try {
                    const message = JSON.parse(event.data);

                    // Handle ping-pong
                    if (message.type === 'pong') {
                        lastPongTimeRef.current = Date.now();
                        return;
                    }
                    
                    // Handle different message types
                    if (message.type === 'notification') {
                        console.log('Notification received:', message);

                        // Call the callback
                        if (typeof onNotification === 'function') {
                            onNotification({
                                from: message.from,
                                data: message.data,
                                timestamp: new Date().toISOString()
                            });
                        }
                    } else if (message.type === 'error') {
                        // Handle error
                        console.log('Error message from server:', message);
                    } else {
                        console.log('Message received:', message);
                    }
                } catch (error) {
                    console.log('Error parsing message:', error);
                }
            };
        } catch (error) {
            console.log('Error in connect:', error);
        }
    }, [serverUrl, onNotification, startPingInterval, stopPingInterval]);

    /**
     * Send a notification to a specific user
     * @param {string} to - Recipient's ID
     * @param {any} data - Notification data
     * @returns {Promise<boolean>} - Success status
     */
    const sendNotification = useCallback(async (to, data) => {
        if (!isConnected || !wsRef.current) {
            console.log('Not connected to WebSocket server');
            await connect(); // Try to reconnect
            return false;
        }

        try {
            const userId = await AsyncStorage.getItem('id');

            if (!userId) {
                console.log('User ID not found in AsyncStorage');
                return false;
            }

            wsRef.current.send(JSON.stringify({
                type: 'notification',
                from: userId,
                to,
                data
            }));

            return true;
        } catch (error) {
            console.log('Error sending notification:', error);
            return false;
        }
    }, [isConnected, connect]);

    // Manually reconnect - useful for exposing to UI
    const reconnect = useCallback(() => {
        reconnectAttemptsRef.current = 0;
        connect();
    }, [connect]);

    // Connect to the WebSocket server on mount
    useEffect(() => {
        isMountedRef.current = true;
        connect();

        // Clean up WebSocket connection and intervals on unmount
        return () => {
            isMountedRef.current = false;
            stopPingInterval();
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect, stopPingInterval]);

    // Return the hook interface
    return {
        connect,
        reconnect,
        sendNotification,
        isConnected
    };
};

export default useNotificationCallback;