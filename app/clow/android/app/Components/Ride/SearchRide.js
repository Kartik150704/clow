import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import _ from 'lodash';
// Import vector icons - assuming using react-native-vector-icons
// import { MapPin, Clock, User, Menu, DollarSign, Car, Navigation, Home, History, X, ChevronRight, LogOut } from 'react-native-vector-icons/Feather';

// Import API functions
import { FetchIncompleteRide, CreateRide, CancelRide, CompleteRide } from './api/rides';
import { CheckProfileValidity } from './api/rider';
import { MakePayment } from './api/payment';
import useNotificationCallback from '../Notification/useNotificationCallback';
import { SendTokenToBackend } from './api/notification';

const { width, height } = Dimensions.get('window');

// Dark theme color configuration
const COLORS = {
  primary: '#FFFFFF',
  background: '#000000', // Dark background
  card: '#1E1E1E',      // Slightly lighter card background
  text: '#FFFFFF',      // White text
  textSecondary: '#AAAAAA', // Light gray for secondary text
  border: '#333333',    // Dark gray borders
  success: '#4CAF50',   // Adjusted for dark theme
  error: '#F44336',     // Adjusted for dark theme
  warning: '#FF9800',   // Adjusted for dark theme
  info: '#2196F3',      // Adjusted for dark theme
};

// Extract the StatusProgressSteps component from the main component
const StatusProgressSteps = memo(({ activeStep, activeRide, fetchingRides }) => {
  // Get ride status for live update
  let statusText = "";
  if (activeRide) {
    switch (activeRide.status) {
      case 'created': statusText = "Waiting for confirmation..."; break;
      case 'accepted': statusText = "Driver confirmed!"; break;
      case 'started': statusText = "Ride in progress"; break;
      case 'completed':
        statusText = activeRide.paymentConfirmed ? "Payment confirmed!" : "Ready for payment";
        break;
      case 'canceled': statusText = "Ride canceled"; break;
      default: statusText = "";
    }
  } else if (fetchingRides) {
    statusText = "Updating status...";
  }

  const steps = [
    { id: 1, label: "Book", icon: "search" },
    { id: 2, label: "Request", icon: "bell" },
    { id: 3, label: "Confirm", icon: "check-circle" },
    { id: 4, label: "Ride", icon: "car" },
    { id: 5, label: "Payment", icon: "credit-card" }
  ];

  return (
    <View style={styles.progressContainer}>
      {activeRide && <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(activeStep / 5) * 100}%` }
          ]}
        />
      </View>}

      {activeRide && <View style={styles.stepsContainer}>
        {steps.map(step => (
          <View key={step.id} style={styles.stepItem}>
            <View
              style={[
                styles.stepIcon,
                activeStep >= step.id ? styles.activeStepIcon : styles.inactiveStepIcon
              ]}
            >
              <Text style={activeStep >= step.id ? styles.activeStepIconText : styles.inactiveStepIconText}>
                {step.label[0]}
              </Text>
            </View>
            <Text style={[
              styles.stepLabel,
              activeStep >= step.id ? styles.activeStepLabel : styles.inactiveStepLabel
            ]}>
              {step.label}
            </Text>
          </View>
        ))}
      </View>}

      {statusText ? (
        <View style={styles.statusTextContainer}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      ) : null}
    </View>
  );
});

// Extract the StatusBar component
const RideStatusBar = memo(({ activeStep, activeRide, fetchingRides }) => {
  return (
    <View style={styles.statusBarContainer}>
      <StatusProgressSteps
        activeStep={activeStep}
        activeRide={activeRide}
        fetchingRides={fetchingRides}
      />
    </View>
  );
});

// Extract the HowItWorksModal component
const HowItWorksModal = memo(({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>How Our Ride Service Works</Text>
            <Text style={styles.modalSubtitle}>Understanding our process from booking to payment</Text>
          </View>

          <ScrollView 
            style={styles.modalBody}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
          >
            <View style={styles.stepContainer}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>Estimate Cost</Text>
                <Text style={styles.stepDescription}>
                  Enter your destination and estimated duration to calculate the approximate fare.
                  This is just an estimate and the final fare will be based on actual distance and time.
                </Text>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>Book Your Ride</Text>
                <Text style={styles.stepDescription}>
                  Confirm your booking and wait for our operator to accept your request.
                  You will receive a notification when a driver accepts your ride.
                </Text>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>During Your Ride</Text>
                <Text style={styles.stepDescription}>
                  The operator will start your ride and record the initial meter reading.
                  You will only be charged from this point based on actual distance and time.
                </Text>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>4</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>Complete & Pay</Text>
                <Text style={styles.stepDescription}>
                  When you reach your destination, the operator will end the ride and record the final meter.
                  You will see the final fare and can make the payment directly through the app.
                </Text>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.modalButton}
            onPress={onClose}
          >
            <Text style={styles.modalButtonText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

// Main component
const PlaceSearchForm = ({ setActiveTab, notify }) => {
  // State variables
  const [keyword, setKeyword] = useState('');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [fetchingRides, setFetchingRides] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [hours, setHours] = useState('');
  const [calculatedCost, setCalculatedCost] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [activeRide, setActiveRide] = useState(null);
  const [showPlaces, setShowPlaces] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [userId, setUserId] = useState(null);

  // Show toast notification - Memoized to prevent recreation on render
  const showToast = useCallback((type, message) => {
    switch (type) {
      case 'success':
        Alert.alert('Success', message);
        break;
      case 'error':
        Alert.alert('Error', message);
        break;
      case 'info':
        Alert.alert('Information', message);
        break;
      default:
        Alert.alert('Notification', message);
    }
  }, []);

  // Debounced search function - Memoized
  const debouncedSearch = useCallback(
    _.debounce(async (searchTerm) => {
      if (!searchTerm.trim()) {
        setPlaces([]);
        setShowPlaces(false);;
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://backend-ride-service.easecruit.com/places/?keyword=${encodeURIComponent(searchTerm)}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch places');
        }
        const data = await response.json();
        setPlaces(data.places || []);
        setShowPlaces(true);
      } catch (err) {
        setError('Failed to fetch places. Please try again.');
        showToast('error', 'Failed to fetch places. Please try again.');
        setPlaces([]);
        setShowPlaces(false);
      } finally {
        setLoading(false);
      }
    }, 500),
    [showToast]
  );

  // Handler functions - Memoized with useCallback
  const handleInputChange = useCallback((value) => {
    setKeyword(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handlePlaceSelect = useCallback((place) => {
    setSelectedPlace(place);
    setShowPlaces(false);
    setPlaces([]);
    setKeyword(place.structured_formatting.main_text);
  }, []);

  const handleHoursChange = useCallback((value) => {
    // Only allow numbers
    value = value.replace(/[^0-9]/g, '');
    setHours(value);
  }, []);

  const calculateCost = useCallback(() => {
    if (!selectedPlace || !hours) return;

    // Convert hours to a number explicitly
    const hoursNum = parseFloat(hours) || 0;

    let distance = selectedPlace.distance / 1000;
    let expectedTime = hoursNum;

    // Calculate cost based on distance and time
    let calculatedValue = 0;

    if (expectedTime <= 60) {
      calculatedValue = distance * 8;
      if (calculatedValue < 100) {
        calculatedValue = 100;
      }
      if (calculatedValue > 100 && calculatedValue < 120) {
        calculatedValue = 120;
      }
    } else {
      if ((distance * 60) / expectedTime <= 15) {
        calculatedValue = 2 * expectedTime;
      } else {
        calculatedValue = 8 * distance;
      }
    }

    // Round to avoid floating point issues
    setCalculatedCost(Math.round(calculatedValue));
  }, [selectedPlace, hours]);

  // Fetch incomplete rides function - Memoized
  const fetchIncompleteRides = useCallback(async (userId) => {
    setFetchingRides(true);
    try {
      let response = await FetchIncompleteRide(userId);

      if (response && response.length > 0) {
        const currentRide = response[0];

        // Preserve payment confirmation state if it exists
        if (activeRide && activeRide.paymentConfirmed) {
          currentRide.paymentConfirmed = true;
        }

        setActiveRide(currentRide);

        // Set the progress step based on ride status
        switch (currentRide.status) {
          case 'created': setActiveStep(2); break;
          case 'accepted': setActiveStep(3); break;
          case 'started': setActiveStep(4); break;
          case 'completed': setActiveStep(5); break;
          default: setActiveStep(1);
        }

        // If status changed, show a notification
        if (activeRide && activeRide.status !== currentRide.status) {
          const statusMessages = {
            'accepted': 'A driver has accepted your ride! They are on the way.',
            'started': 'Your ride has started. Enjoy your journey!',
            'completed': 'Your ride is complete. Please proceed with payment.',
            'canceled': 'Your ride has been canceled.'
          };

          if (statusMessages[currentRide.status]) {
            showToast('info', statusMessages[currentRide.status]);
          }
        }
      } else {
        setActiveRide(null);
        setActiveStep(1);
      }
    } catch (error) {
      console.error('Error fetching incomplete rides:', error);
      showToast('error', 'Failed to fetch your rides.');
    } finally {
      setFetchingRides(false);
    }
  }, [activeRide, showToast]);

  // Handle payment error - Memoized
  const handlePaymentError = useCallback((error) => {
    if (error.message === 'Payment canceled by user') {
      showToast('info', 'Payment was canceled. You can try again when ready.');
    } else {
      // Format error message
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error occurred';
      setError('Failed to process payment: ' + errorMsg);
      showToast('error', 'Failed to process payment. Please try again or contact support.');
    }
  }, [showToast]);

  // Booking handler - Memoized
  const handleBooking = useCallback(async () => {
    if (!selectedPlace || !hours || !calculatedCost) return;

    setBookingLoading(true);
    try {
      const bookingDetails = {
        location: {
          main: selectedPlace.structured_formatting.main_text,
          secondary: selectedPlace.structured_formatting.secondary_text,
          placeId: selectedPlace.place_id,
        },
        duration: `${hours} minutes`,
        cost: calculatedCost,
        timestamp: new Date().toISOString(),
      };

      let placeTo = selectedPlace.structured_formatting.main_text;

      let response = await CreateRide(userId, placeTo);

      await fetchIncompleteRides(userId);
      setBookingSuccess(true);
      showToast('success', 'Ride booked successfully! Waiting for driver confirmation.');
      console.log('Booking Details:', bookingDetails);
    } catch (error) {
      console.error('Error creating ride:', error);
      setError('Failed to create ride. Please try again.');
      showToast('error', 'Failed to create ride. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  }, [selectedPlace, hours, calculatedCost, userId, fetchIncompleteRides, showToast]);

  // Cancel ride handler - Memoized
  const handleCancelRide = useCallback(() => {
    Alert.alert(
      "Cancel Ride",
      "Are you sure you want to cancel this ride?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: async () => {
            setLoading(true);
            try {
              let response = await CancelRide(activeRide.id);
              showToast('info', 'Your ride has been canceled. You will not be charged.');
              await fetchIncompleteRides(userId);
            } catch (error) {
              console.error('Error canceling ride:', error);
              showToast('error', 'Failed to cancel ride. Please try again or contact support.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }, [activeRide, fetchIncompleteRides, userId, showToast]);

  // Make payment handler - Memoized
  const handleMakePayment = useCallback(async () => {
    setPaymentLoading(true);
    try {
      // Get the amount from the ride data or use the calculated cost
      const amount = activeRide?.paymentdata?.amount || calculatedCost;

      if (!amount) {
        throw new Error('Payment amount is not available');
      }

      // Show payment confirmation dialog before proceeding
      Alert.alert(
        "Confirm Payment",
        `Are you sure you want to pay ₹${amount} for this ride?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              setPaymentLoading(false);
            }
          },
          {
            text: "Pay Now",
            onPress: async () => {
              try {
                // Call the MakePayment function which handles Razorpay integration
                const response = await MakePayment(activeRide.id, amount);
                console.log(response)
                // Check if the response is valid
                if (!response || response.status != "completed") {
                  throw new Error(response?.message || 'Payment verification failed');
                }

                // Show success message
                showToast('success', 'Payment processed successfully! Thank you for riding with us.');

                // Update the ride state with payment confirmation
                setActiveRide((prevRide) => ({ ...prevRide, paymentConfirmed: true }));

                // Complete the ride in the backend
                await CompleteRide(activeRide.id);

                // Reset the ride after 3 seconds to return to search view
                setTimeout(() => {
                  setActiveRide(null);
                  setActiveStep(1);
                  setSelectedPlace(null);
                  setHours('');
                  setCalculatedCost(null);
                  setBookingSuccess(false);

                  // Fetch rides again to update the UI
                  fetchIncompleteRides(userId);
                }, 3000);
              } catch (error) {
                console.error('Error processing payment:', error);
                handlePaymentError(error);
              } finally {
                setPaymentLoading(false);
              }
            }
          }
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error in payment process:', error);
      handlePaymentError(error);
      setPaymentLoading(false);
    }
  }, [activeRide, calculatedCost, showToast, handlePaymentError, fetchIncompleteRides, userId]);

  // Check profile handler - Memoized
  const CheckProfile = useCallback(async (id) => {
    setLoading(true);
    try {
      let response = await CheckProfileValidity(id);
      if (response.verified !== true) {
        setActiveTab('profile');
        showToast('info', 'Please complete your profile before booking a ride');
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      showToast('error', 'Could not verify your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setActiveTab, showToast]);

  // Effects
  useEffect(() => {
    const SendToken = async () => {
      let id = await AsyncStorage.getItem('id');
      let token = await AsyncStorage.getItem('fcmToken');
      let deviceType = await AsyncStorage.getItem('deviceType');
      let response = await SendTokenToBackend(id, token, deviceType);
      console.log(response)
    }
    SendToken();
  }, []);

  useEffect(() => {
    const NotificationHandler = async () => {
      let userId = await AsyncStorage.getItem('id');
      fetchIncompleteRides(userId);
    }
    if (notify && notify.type == "ride") {
      NotificationHandler();
    }
  }, [notify, fetchIncompleteRides]);

  useEffect(() => {
    if (userId != null) {
      fetchIncompleteRides(userId);
    }
  }, [userId, fetchIncompleteRides]);

  useEffect(() => {
    const getUser = async () => {
      let id = await AsyncStorage.getItem('id');
      setUserId(id);
      if (id) {
        await CheckProfile(id);
      }
    }
    getUser();
  }, [CheckProfile]);

  useEffect(() => {
    // Check for existing saved introduction status
    const checkIntroStatus = async () => {
      try {
        const hasSeenIntro = true;
        if (!hasSeenIntro) {
          setShowHowItWorks(true);
          await AsyncStorage.setItem('hasSeenIntro', 'true');
        }
      } catch (err) {
        console.error('Error with AsyncStorage:', err);
        // Default to showing intro if storage fails
        setShowHowItWorks(true);
      }
    };

    checkIntroStatus();
  }, []);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Memoized UI Components to prevent re-renders during scrolling
  const BookingButton = useMemo(() => {
    if (!calculatedCost || bookingSuccess) return null;

    return (
      <TouchableOpacity
        style={[styles.bookButton, bookingLoading && styles.disabledButton]}
        onPress={handleBooking}
        disabled={bookingLoading}
      >
        {bookingLoading ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator size="small" color={COLORS.background} />
            <Text style={styles.buttonText}>Creating Booking...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Confirm Booking</Text>
        )}
      </TouchableOpacity>
    );
  }, [calculatedCost, bookingSuccess, bookingLoading, handleBooking]);

  const CalculateButton = useMemo(() => {
    return (
      <TouchableOpacity
        style={[
          styles.calculateButton,
          (!selectedPlace || !hours) && styles.disabledButton
        ]}
        onPress={calculateCost}
        disabled={!selectedPlace || !hours}
      >
        <Text style={styles.calculateButtonText}>Calculate Estimated Cost</Text>
      </TouchableOpacity>
    );
  }, [selectedPlace, hours, calculateCost]);

  const CancelButton = useMemo(() => {
    if (!activeRide || activeRide.status !== 'created' || activeRide.paymentConfirmed) return null;
    
    return (
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={handleCancelRide}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    );
  }, [activeRide, handleCancelRide]);

  const PaymentButton = useMemo(() => {
    if (!activeRide || 
        activeRide.status !== 'completed' || 
        !activeRide.paymentdata || 
        activeRide.paymentdata.status !== 'pending' || 
        activeRide.paymentConfirmed) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.paymentButton}
        onPress={handleMakePayment}
        disabled={paymentLoading}
      >
        {paymentLoading ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator size="small" color={COLORS.background} />
            <Text style={styles.buttonText}>Processing Payment...</Text>
          </View>
        ) : (
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Make Payment ₹{activeRide.paymentdata.amount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [activeRide, paymentLoading, handleMakePayment]);

  const SupportButton = useMemo(() => {
    return (
      <TouchableOpacity
        style={styles.supportButton}
        onPress={() => showToast('info', 'Contacting support...')}
      >
        <Text style={styles.supportButtonText}>Contact Support</Text>
      </TouchableOpacity>
    );
  }, [showToast]);

  // Loading view
  if (fetchingRides) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your rides...</Text>
          <Text style={styles.loadingSubText}>Your ride status will appear here</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Active ride view
  if (activeRide) {
    const rideStatusColors = {
      created: COLORS.info,
      accepted: COLORS.info,
      started: COLORS.warning,
      completed: COLORS.success,
      canceled: COLORS.error
    };

    const statusExplanation = {
      created: "Your ride request has been created. Waiting for operator confirmation.",
      accepted: "Your ride has been accepted! The driver is on the way.",
      started: "Your ride is in progress. You'll be charged based on the actual distance and time.",
      completed: "Your ride is complete. Please make the payment to finalize.",
      canceled: "This ride has been canceled and you will not be charged."
    };

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

        {/* Only show status bar when there's an active ride */}
        <RideStatusBar
          activeStep={activeStep}
          activeRide={activeRide}
          fetchingRides={fetchingRides}
        />

        <ScrollView 
          style={styles.scrollView}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>ID: {activeRide.id}</Text>
                <Text style={styles.cardDescription}>Your Active Ride</Text>
              </View>
              {CancelButton}
            </View>

            <View style={styles.cardContent}>
              {/* Status explanation */}
              <View style={[styles.alertContainer, { borderColor: rideStatusColors[activeRide.status] }]}>
                <Text style={styles.alertTitle}>
                  Ride Status: {activeRide.status.charAt(0).toUpperCase() + activeRide.status.slice(1)}
                </Text>
                <Text style={styles.alertDescription}>
                  {statusExplanation[activeRide.status]}
                </Text>
              </View>

              <View style={styles.rideInfoContainer}>
                <View style={styles.rideInfoItem}>
                  <Text style={styles.infoLabel}>DESTINATION</Text>
                  <Text style={styles.infoValue}>{activeRide.placeto}</Text>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoGridItem}>
                    <Text style={styles.infoLabel}>STATUS</Text>
                    <View style={[styles.badgeContainer, { backgroundColor: rideStatusColors[activeRide.status] }]}>
                      <Text style={styles.badgeText}>{activeRide.status}</Text>
                    </View>
                  </View>

                  {activeRide.starttime && (
                    <View style={styles.infoGridItem}>
                      <Text style={styles.infoLabel}>STARTED</Text>
                      <Text style={styles.infoValue}>
                        {new Date(activeRide.starttime).toLocaleString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                  )}
                </View>

                {activeRide.endtime && (
                  <View style={styles.rideInfoItem}>
                    <Text style={styles.infoLabel}>END TIME</Text>
                    <Text style={styles.infoValue}>
                      {new Date(activeRide.endtime).toLocaleString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                )}

                <View style={styles.infoGrid}>
                  {activeRide.initialmeterreading && (
                    <View style={styles.infoGridItem}>
                      <Text style={styles.infoLabel}>INITIAL METER</Text>
                      <Text style={styles.infoValue}>{activeRide.initialmeterreading}</Text>
                    </View>
                  )}

                  {activeRide.finalmeterreading && (
                    <View style={styles.infoGridItem}>
                      <Text style={styles.infoLabel}>FINAL METER</Text>
                      <Text style={styles.infoValue}>{activeRide.finalmeterreading}</Text>
                    </View>
                  )}
                </View>

                {/* Final fare explanation if ride is completed */}
                {activeRide.status === 'completed' && activeRide.paymentdata && (
                  <View style={styles.fareInfoContainer}>
                    <Text style={styles.fareInfoTitle}>Final Fare Calculation</Text>
                    <Text style={styles.fareInfoDescription}>
                      Your final fare of ₹{activeRide.paymentdata.amount} is based on the actual distance traveled
                      and time taken during your ride. This is calculated from the initial meter reading
                      to the final meter reading.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.cardFooter}>
              {activeRide.paymentConfirmed ? (
                <View style={styles.paymentConfirmedContainer}>
                  <View style={styles.paymentSuccessAlert}>
                    <Text style={styles.paymentSuccessTitle}>Payment Confirmed</Text>
                    <Text style={styles.paymentSuccessDescription}>
                      Thank you for your payment! You will be redirected to book another ride shortly.
                    </Text>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: COLORS.border }]}>
                      <View style={[styles.progressFill, { width: '100%', backgroundColor: COLORS.success }]} />
                    </View>
                  </View>
                </View>
              ) : (
                PaymentButton
              )}
            </View>
          </View>

          {/* Help Section - Only show if not in payment confirmed state */}
          {!activeRide.paymentConfirmed && (
            <View style={styles.helpCard}>
              <View style={styles.helpCardHeader}>
                <Text style={styles.helpCardTitle}>Need Help?</Text>
              </View>
              <View style={styles.helpCardContent}>
                <Text style={styles.helpCardDescription}>
                  If you have any questions or issues with your ride, please contact our support team.
                </Text>
                {SupportButton}
              </View>
            </View>
          )}
        </ScrollView>

        <HowItWorksModal
          visible={showHowItWorks}
          onClose={() => setShowHowItWorks(false)}
        />
      </SafeAreaView>
    );
  }

  // Booking view (no active ride)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.scrollView}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.bookingContainer}>
            <View style={styles.bookingHeader}>
              <View>
                <Text style={styles.bookingTitle}>Book Your Ride</Text>
                <Text style={styles.bookingDescription}>Estimate costs and request a ride</Text>
              </View>
              <TouchableOpacity
                style={styles.helpButton}
                onPress={() => setShowHowItWorks(true)}
              >
                <Text style={styles.helpButtonText}>?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              {/* Location Search */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Where to?</Text>
                <View style={styles.searchInputContainer}>
                  <TextInput
                    style={styles.searchInput}
                    value={keyword}
                    onChangeText={handleInputChange}
                    placeholder="Enter location..."
                    placeholderTextColor={COLORS.textSecondary}
                  />
                  {/* Search icon would go here */}
                </View>

                {loading && (
                  <View style={styles.searchingContainer}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.searchingText}>Searching locations...</Text>
                  </View>
                )}

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {showPlaces && places.length > 0 && (
                  <View style={styles.placesDropdown}>
                    <ScrollView 
                      style={styles.placesList} 
                      nestedScrollEnabled={true}
                      removeClippedSubviews={true}
                      showsVerticalScrollIndicator={false}
                      scrollEventThrottle={16}
                    >
                      {places.map((place) => (
                        <TouchableOpacity
                          key={place.place_id}
                          style={styles.placeItem}
                          onPress={() => handlePlaceSelect(place)}
                        >
                          <View style={styles.placeContent}>
                            <Text style={styles.placeMainText}>
                              {place.structured_formatting.main_text}
                            </Text>
                            <Text style={styles.placeSecondaryText}>
                              {place.structured_formatting.secondary_text}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Duration Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Estimated Duration (in minutes)</Text>
                <View style={styles.durationInputContainer}>
                  <TextInput
                    style={styles.durationInput}
                    value={hours}
                    onChangeText={handleHoursChange}
                    placeholder="Expected time for ride..."
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="numeric"
                  />
                  {/* Clock icon would go here */}
                </View>
              </View>

              {/* Calculate Cost Button */}
              {CalculateButton}

              {/* Cost Display */}
              {calculatedCost && (
                <View style={styles.costContainer}>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Estimated Cost:</Text>
                    <Text style={styles.costValue}>₹{Math.round(calculatedCost)}</Text>
                  </View>
                  <Text style={styles.costDisclaimer}>
                    This is an estimated cost based on your inputs. The final fare will be calculated based on
                    the actual distance traveled and time taken during your ride.
                  </Text>
                </View>
              )}

              {/* Booking Section - Using memoized button component */}
              {BookingButton}

              {/* Success Message */}
              {bookingSuccess && (
                <View style={styles.successContainer}>
                  <Text style={styles.successTitle}>Success</Text>
                  <Text style={styles.successMessage}>
                    Booking Confirmed! Your ride has been scheduled. Please wait for operator confirmation.
                    You will receive a notification when your ride is accepted.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.footerInfo}>
              <View style={styles.footerDivider} />
              <Text style={styles.footerInfoTitle}>Important Information:</Text>
              <View style={styles.footerInfoList}>
                <Text style={styles.footerInfoItem}>• You will only be charged based on actual distance traveled and time taken</Text>
                <Text style={styles.footerInfoItem}>• Payment is only required after ride completion</Text>
                <Text style={styles.footerInfoItem}>• You can cancel before the ride starts without any charges</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <HowItWorksModal
        visible={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },

  // Status Bar
  statusBarContainer: {
    backgroundColor: COLORS.background,
    paddingTop: 10,
    paddingBottom: 5,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginBottom: 15,
  },
  progressFill: {
    height: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  activeStepIcon: {
    backgroundColor: COLORS.primary,
  },
  inactiveStepIcon: {
    backgroundColor: COLORS.border,
  },
  activeStepIconText: {
    color: COLORS.background,
    fontWeight: 'bold',
  },
  inactiveStepIconText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  activeStepLabel: {
    color: COLORS.primary,
  },
  inactiveStepLabel: {
    color: COLORS.textSecondary,
  },
  statusTextContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },

  // Loading View
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Active Ride View
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  cancelButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },
  cardContent: {
    padding: 16,
  },
  alertContainer: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#1A1A1A', // Slightly lighter than card background
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    color: COLORS.text,
  },
  alertDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  rideInfoContainer: {
    gap: 16,
  },
  rideInfoItem: {
    backgroundColor: '#262626', // Slightly lighter than card
    padding: 12,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoGridItem: {
    flex: 1,
    backgroundColor: '#262626', // Slightly lighter than card
    padding: 12,
    borderRadius: 8,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  badgeText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '500',
  },
  fareInfoContainer: {
    backgroundColor: 'rgba(33, 150, 243, 0.15)', // Semi-transparent info color
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  fareInfoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.info,
    marginBottom: 4,
  },
  fareInfoDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  cardFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  paymentConfirmedContainer: {
    width: '100%',
  },
  paymentSuccessAlert: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)', // Semi-transparent success color
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  paymentSuccessTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 4,
  },
  paymentSuccessDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  paymentButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: COLORS.background,
    fontWeight: '600',
    fontSize: 16,
  },
  helpCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  helpCardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  helpCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  helpCardContent: {
    padding: 16,
    gap: 12,
  },
  helpCardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  supportButton: {
    backgroundColor: '#262626', // Slightly lighter than card
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  supportButtonText: {
    color: COLORS.text,
    fontWeight: '500',
    fontSize: 15,
  },

  // Booking View
  bookingContainer: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bookingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  bookingDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  helpButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#262626', // Slightly lighter than background
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  searchInputContainer: {
    position: 'relative',
  },
  searchInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  searchingText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)', // Semi-transparent error color
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
  },
  placesDropdown: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  placesList: {
    maxHeight: 220,
  },
  placeItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  placeContent: {
    gap: 4,
  },
  placeMainText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  placeSecondaryText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  durationInputContainer: {
    position: 'relative',
  },
  durationInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  calculateButton: {
    backgroundColor: '#262626', // Slightly lighter than background
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabledButton: {
    opacity: 0.5,
  },
  calculateButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 16,
  },
  costContainer: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  costValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  costDisclaimer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  successContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)', // Semi-transparent success color
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  footerInfo: {
    marginTop: 24,
  },
  footerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  footerInfoTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  footerInfoList: {
    gap: 4,
  },
  footerInfoItem: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  modalBody: {
    padding: 16,
    maxHeight: height * 0.5,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  stepNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumber: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  modalButtonText: {
    color: COLORS.background,
    fontWeight: '600',
    fontSize: 16,
  },
};

export default PlaceSearchForm