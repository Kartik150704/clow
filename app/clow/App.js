/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MobileDashBoard from './android/app/Components/DashBoard/DashBoard';
import GoogleAuthButton from './android/app/src/firebase/GoogleAuthButton';
import OTPVerificationScreen from './android/app/Components/Login/Login';
import ClowLoadingScreen from './android/app/Components/Animation/Landing';
import NotificationService from './android/app/Components/Notification/NotificationService';
import messaging from '@react-native-firebase/messaging';
import LocationTracker from './android/app/Components/Location/LocationTracker';
import UberDashboard from './android/app/Components/DashBoard/UberDashboard';
import DriverMapView from './android/app/Components/GoogleMaps/MapView';
// Create the stack navigator
const Stack = createStackNavigator();

// Main App Component with Navigation
global.notificationService = null;

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notify, setNotify] = useState(null);
  useEffect(() => {
    // Initialize notification service
    if (!global.notificationService) {
      global.notificationService = new NotificationService();
    }

    // Request permissions and register device
    const registerDevice = async () => {
      try {
        const token = await global.notificationService.registerDeviceForPN();

        if (token) {
          // Save the token to AsyncStorage instead of sending to server immediately
          await AsyncStorage.setItem('fcmToken', token);
          console.log('FCM token saved to AsyncStorage:', token);

          // Also save device type for later use
          await AsyncStorage.setItem('deviceType', Platform.OS);
        }
      } catch (error) {
        console.error('Error registering for push notifications:', error);
      }
    };

    registerDevice();
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      // This will be called when the app is in the foreground and a notification is received
      console.log('Notification received in foreground:', remoteMessage.data);
      setNotify(remoteMessage.data);
      // You can access remoteMessage.notification.title, remoteMessage.notification.body, etc.
    });
    // Listener for when a notification opens the app from background state
    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage,
      );
      // Navigate to a specific screen if needed
    });

    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'Notification caused app to open from quit state:',
            remoteMessage,
          );
          // Navigate to a specific screen if needed
        }
      });

    // Cleanup
    return () => {
      unsubscribe();
      unsubscribeOnMessage();
    };
  }, []);

  useEffect(() => {
    // Check if user is logged in
    const checkUserLoggedIn = async () => {
      try {
        const userEmail = await AsyncStorage.getItem('userEmail');
        const userId = await AsyncStorage.getItem('id');

        // Simulate a short loading period
        if (userEmail) {
          setIsLoggedIn(true);
        }

      } catch (error) {
        console.error('Error checking authentication state:', error);
        setIsLoggedIn(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  if (isLoading) {
    return <ClowLoadingScreen setLoading={setIsLoading} />;
  }

  return (
    <>
      {isLoggedIn && <DriverMapView setIsLoggedIn={setIsLoggedIn} notify={notify} />}
      {!isLoggedIn && <OTPVerificationScreen setIsLoggedIn={setIsLoggedIn} />}

    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 18,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#aaaaaa',
    marginBottom: 40,
  },
});

export default App;