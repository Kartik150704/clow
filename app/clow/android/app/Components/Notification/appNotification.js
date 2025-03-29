// hooks/useSimpleNotifications.js
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API endpoint for registering devices
const API_ENDPOINT = 'http://10.0.2.2:5001/notification/register';

/**
 * A simple hook for handling push notifications
 * Fetches userId from AsyncStorage automatically
 * 
 * @returns {Object} Notification state and handlers
 */
const useSimpleNotifications = () => {
  // State for the current notification and FCM token
  const [notification, setNotification] = useState(null);
  const [fcmToken, setFcmToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  // Fetch userId from AsyncStorage
  useEffect(() => {
    const getUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('id');
        if (storedUserId) {
          setUserId(storedUserId);
          console.log('Retrieved userId from AsyncStorage:', storedUserId);
        } else {
          console.warn('No userId found in AsyncStorage');
          setError(new Error('User ID not found in storage'));
        }
      } catch (err) {
        console.error('Error retrieving userId from AsyncStorage:', err);
        setError(err);
      }
    };

    getUserId();
  }, []);

  // Request notification permissions and get token when userId is available
  useEffect(() => {
    // Only proceed if we have a userId
    if (!userId) return;
    
    const setup = async () => {
      try {
        setLoading(true);
        
        // Request permissions
        const authStatus = await messaging().requestPermission();
        const enabled = 
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
          
        if (!enabled) {
          throw new Error('Notification permission denied');
        }
        
        // Get token
        const token = await messaging().getToken();
        setFcmToken(token);
        
        // Register with backend
        await registerWithBackend(userId, token);
        
        setLoading(false);
      } catch (err) {
        console.error('Notification setup error:', err);
        setError(err);
        setLoading(false);
      }
    };
    
    // Call setup function
    setup();
  }, [userId]);

  // Set up notification listeners when userId is available
  useEffect(() => {
    // Only proceed if we have a userId
    if (!userId) return;
    
    // Foreground message handler
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('Notification received in foreground!', remoteMessage);
      setNotification(remoteMessage);
    });
    
    // Background/Quit state handler - when app is opened from a notification
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('Notification caused app to open from quit state:', remoteMessage);
        setNotification(remoteMessage);
      }
    });
    
    // Background message handler - when app is in background but open
    messaging().onNotificationOpenedApp(remoteMessage => {
      if (remoteMessage) {
        console.log('Notification caused app to open from background state:', remoteMessage);
        setNotification(remoteMessage);
      }
    });
    
    // Token refresh handler
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
      console.log('FCM token refreshed:', token);
      setFcmToken(token);
      
      // Re-register with backend
      await registerWithBackend(userId, token);
    });
    
    // Clean up subscribers on unmount
    return () => {
      unsubscribeForeground();
      unsubscribeTokenRefresh();
    };
  }, [userId]);

  /**
   * Register the device with the backend
   */
  const registerWithBackend = async (userId, token) => {
    try {
      console.log('Registering device with backend:', { userId, token });
      
      // Send the registration to your backend
      const response = await axios.post(API_ENDPOINT, {
        id: userId,
        token: token,
        deviceType: Platform.OS
      });
      
      console.log('Device registered successfully:', response.data);
      return true;
    } catch (err) {
      console.error('Error registering device with backend:', err);
      setError(err);
      return false;
    }
  };

  /**
   * Clear the current notification
   */
  const clearNotification = () => {
    setNotification(null);
  };

  /**
   * Get notification content for display
   */
  const getNotificationContent = () => {
    if (!notification) return null;
    
    return {
      title: notification.notification?.title || 'New Notification',
      body: notification.notification?.body || '',
      data: notification.data || {}
    };
  };

  return {
    notification,
    notificationContent: getNotificationContent(),
    fcmToken,
    loading,
    error,
    clearNotification,
    userId
  };
};

export default useSimpleNotifications;