import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, Platform, PermissionsAndroid, Alert, Linking, ToastAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import BackgroundService from 'react-native-background-actions';

const LocationTracker = () => {
  const [location, setLocation] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [logCount, setLogCount] = useState(0);
  const [isBackgroundRunning, setIsBackgroundRunning] = useState(false);
  const intervalRef = useRef(null);

  // Background task options
  const backgroundOptions = {
    taskName: 'LocationTracking',
    taskTitle: 'Location Tracking',
    taskDesc: 'Tracking your location in the background',
    taskIcon: {
      name: 'ic_launcher',
      type: 'mipmap',
    },
    color: '#4CAF50',
    linkingURI: 'yourapp://location', // Deep linking URI
    parameters: {
      delay: 3000, // 3 seconds between updates
    },
  };

  // The background task that will run when app is in background
  const backgroundLocationTask = async (taskDataArguments) => {
    const { delay } = taskDataArguments;
    
    // Run the task in a loop until stopped
    await new Promise(async (resolve) => {
      const backgroundWatchId = Geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const timestamp = new Date().toISOString();
          const logData = {
            latitude,
            longitude,
            accuracy,
            timestamp,
            isBackground: true
          };
          
          // Log to console
          console.log('BACKGROUND LOCATION UPDATE', JSON.stringify(logData));
          
          // Here you would typically send the data to your server
          // sendLocationToServer(logData);
        },
        (error) => {
          console.warn('Background watch error:', error.code, error.message);
        },
        { 
          enableHighAccuracy: true,
          distanceFilter: 10, // update when moved 10 meters (more battery efficient)
          interval: delay,
          fastestInterval: delay,
          forceRequestLocation: true
        }
      );
      
      // This keeps the background task alive
      // The resolve function will only be called when BackgroundService.stop() is called
    });
  };

  // Request location permissions including background permission
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'ios') {
        // For iOS, we need to request "always" permission for background
        const status = await Geolocation.requestAuthorization('always');
        if (status === 'granted') {
          setPermissionStatus('granted');
          return true;
        } else {
          setPermissionStatus('denied');
          return false;
        }
      } else {
        // For Android, we need both FINE_LOCATION and BACKGROUND_LOCATION
        const fineLocationGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to track it.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (fineLocationGranted === PermissionsAndroid.RESULTS.GRANTED) {
          // On Android 10+ we need to explicitly ask for background permission
          if (parseInt(Platform.Version, 10) >= 29) {
            const backgroundGranted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
              {
                title: 'Background Location Permission',
                message: 'We need access to your location in the background.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              }
            );
            
            if (backgroundGranted === PermissionsAndroid.RESULTS.GRANTED) {
              setPermissionStatus('granted_with_background');
              return true;
            } else {
              setPermissionStatus('foreground_only');
              Alert.alert(
                'Limited Permission',
                'Background location access denied. Location will only be tracked when app is open.',
                [{ text: 'OK' }]
              );
              return true; // Still allow foreground tracking
            }
          } else {
            setPermissionStatus('granted');
            return true;
          }
        } else {
          setPermissionStatus('denied');
          return false;
        }
      }
    } catch (err) {
      console.warn('Error requesting permissions:', err);
      setPermissionStatus('error');
      return false;
    }
  };

  // Log current location to console with visible feedback
  const logLocationToConsole = () => {
    if (location) {
      const { latitude, longitude, accuracy } = location;
      const timestamp = new Date().toISOString();
      const logData = {
        latitude,
        longitude,
        accuracy,
        timestamp,
        isBackground: false
      };
      
      // Log to console
      console.log('FOREGROUND LOCATION UPDATE', JSON.stringify(logData));
      
      // Show toast on Android for visibility
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          `Location logged: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          ToastAndroid.SHORT
        );
      }
      
      // Update log count
      setLogCount(prevCount => prevCount + 1);
      
      // Here you would typically send the data to your server
      // sendLocationToServer(logData);
    } else {
      console.warn('No location data available to log');
      if (Platform.OS === 'android') {
        ToastAndroid.show('Waiting for location data...', ToastAndroid.SHORT);
      }
    }
  };

  // Force a log event for testing
  const testLogging = () => {
    if (location) {
      console.log('TEST LOG - LOCATION DATA:');
      console.log(JSON.stringify({...location, isBackground: isBackgroundRunning}, null, 2));
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('Test log sent to console', ToastAndroid.SHORT);
      }
    } else {
      console.log('TEST LOG - NO LOCATION DATA AVAILABLE');
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('No location data to test log', ToastAndroid.SHORT);
      }
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    console.log('Getting current location...');
    
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Initial location received:', latitude, longitude);
        setLocation(position.coords);
        
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            `Initial location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            ToastAndroid.SHORT
          );
        }
      },
      (error) => {
        console.warn('Location error:', error.code, error.message);
        
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            `Location error: ${error.message}`,
            ToastAndroid.LONG
          );
        }
        
        if (error.code === 1) { // PERMISSION_DENIED
          setPermissionStatus('denied');
          Alert.alert(
            'Permission Denied',
            'Location permission was denied. Please enable it in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 10000,
        showLocationDialog: true,
        forceRequestLocation: true
      }
    );
  };

  // Start tracking location continuously with watchPosition API
  const startLocationTracking = () => {
    console.log('Starting location tracking...');
    
    // First clear any existing watchers
    if (watchId !== null) {
      Geolocation.clearWatch(watchId);
    }
    
    const watchID = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Watch update received:', latitude, longitude);
        setLocation(position.coords);
      },
      (error) => {
        console.warn('Watch error:', error.code, error.message);
        
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            `Watch error: ${error.message}`,
            ToastAndroid.LONG
          );
        }
        
        if (error.code === 1) { // PERMISSION_DENIED
          setPermissionStatus('denied');
          stopTracking();
        }
      },
      { 
        enableHighAccuracy: true,
        distanceFilter: 0, // update on any movement
        interval: 3000, // 3 seconds (minimum time between updates)
        fastestInterval: 3000, // 3 seconds (fastest interval)
        forceRequestLocation: true
      }
    );

    setWatchId(watchID);
    console.log('Started watch with ID:', watchID);
    
    // Set up a timer to log location every 3 seconds
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    console.log('Setting up 3-second interval for logging...');
    intervalRef.current = setInterval(() => {
      console.log('Interval triggered');
      logLocationToConsole();
    }, 3000);
    
    setTracking(true);
  };

  // Start background service for location tracking
  const startBackgroundTracking = async () => {
    if (!BackgroundService.isRunning()) {
      try {
        console.log('Starting background service...');
        await BackgroundService.start(backgroundLocationTask, backgroundOptions);
        setIsBackgroundRunning(true);
        console.log('Background service started');
      } catch (e) {
        console.error('Failed to start background service:', e);
      }
    } else {
      console.log('Background service is already running');
    }
  };

  // Stop background service
  const stopBackgroundTracking = async () => {
    try {
      if (BackgroundService.isRunning()) {
        console.log('Stopping background service...');
        await BackgroundService.stop();
        console.log('Background service stopped');
      }
      setIsBackgroundRunning(false);
    } catch (e) {
      console.error('Failed to stop background service:', e);
    }
  };

  // Start tracking handler
  const handleStartTracking = async () => {
    console.log('Button pressed: Start tracking');
    
    const permissionGranted = await requestLocationPermission();
    if (permissionGranted) {
      getCurrentLocation(); // Get initial location
      startLocationTracking(); // Start foreground tracking
      startBackgroundTracking(); // Start background tracking
    } else {
      console.warn('Failed to get location permission');
    }
  };

  // Stop tracking
  const stopTracking = async () => {
    console.log('Stopping location tracking...');
    
    if (watchId !== null) {
      Geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    await stopBackgroundTracking();
    
    setTracking(false);
    console.log('Location tracking stopped');
    
    if (Platform.OS === 'android') {
      ToastAndroid.show('Location tracking stopped', ToastAndroid.SHORT);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    console.log('Component mounted or updated');
    
    return () => {
      console.log('Component unmounting - cleanup');
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Make sure to stop background service when component unmounts
      if (BackgroundService.isRunning()) {
        BackgroundService.stop();
      }
    };
  }, [watchId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Console Logger</Text>
      
      {permissionStatus === 'denied' && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Location permission denied</Text>
          <Button
            title="Open Settings"
            onPress={() => Linking.openSettings()}
            color="#4285F4"
          />
        </View>
      )}
      
      {permissionStatus === 'foreground_only' && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            Background location access denied. Location will only be tracked when app is open.
          </Text>
          <Button
            title="Enable Background Location"
            onPress={() => Linking.openSettings()}
            color="#FFA000"
          />
        </View>
      )}
      
      {location && (
        <View style={styles.locationContainer}>
          <Text style={styles.locationText}>
            Latitude: {location.latitude.toFixed(6)}
          </Text>
          <Text style={styles.locationText}>
            Longitude: {location.longitude.toFixed(6)}
          </Text>
          <Text style={styles.locationText}>
            Accuracy: {location.accuracy ? `${location.accuracy.toFixed(2)} meters` : 'Unknown'}
          </Text>
          <Text style={styles.locationText}>
            Last Updated: {new Date().toLocaleTimeString()}
          </Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        {!tracking ? (
          <Button
            title="START TRACKING LOCATION"
            onPress={handleStartTracking}
            color="#4CAF50"
          />
        ) : (
          <Button
            title="STOP TRACKING LOCATION"
            onPress={stopTracking}
            color="#F44336"
          />
        )}
      </View>
      
      {tracking && (
        <Button
          title="TEST LOG TO CONSOLE"
          onPress={testLogging}
          color="#2196F3"
        />
      )}
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Status: {tracking ? 'Logging every 3 seconds' : 'Not tracking'}
        </Text>
        <Text style={styles.infoText}>
          Permission: {permissionStatus}
        </Text>
        <Text style={styles.infoText}>
          Background mode: {isBackgroundRunning ? 'Active' : 'Inactive'}
        </Text>
        <Text style={styles.infoText}>
          Check your console for location updates
        </Text>
        {tracking && (
          <Text style={styles.infoText}>
            Logs sent: {logCount}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  locationContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  buttonContainer: {
    width: '100%',
    marginVertical: 15,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 5,
    padding: 15,
    width: '100%',
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 10,
  },
  warningContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: 5,
    padding: 15,
    width: '100%',
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA000',
  },
  warningText: {
    color: '#F57C00',
    marginBottom: 10,
  },
  infoContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#E8EAF6',
    borderRadius: 5,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#3F51B5',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 5,
  }
});

export default LocationTracker;