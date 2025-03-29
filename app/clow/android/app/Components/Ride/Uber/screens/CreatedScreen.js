import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    Animated,
    Easing,
    SafeAreaView,
    PermissionsAndroid,
    Platform
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const GOOGLE_MAPS_APIKEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with your actual API key

const SearchDriverScreen = ({ ride }) => {
    // State variables
    const [currentLocation, setCurrentLocation] = useState(null);
    const [hasLocationPermission, setHasLocationPermission] = useState(false);
    const [destination, setDestination] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [distanceText, setDistanceText] = useState('');
    const [durationText, setDurationText] = useState('');

    // Animation references
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0.3)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    
    // Map reference
    const mapRef = useRef(null);

    // Parse the destination from ride object
    useEffect(() => {
        if (ride && ride.placeto) {
            try {
                const placeData = JSON.parse(ride.placeto);
                setDestination({
                    latitude: placeData.geometry.location.lat,
                    longitude: placeData.geometry.location.lng,
                    name: placeData.name,
                    address: placeData.formatted_address,
                    duration: placeData.duration || 0,
                    distance: placeData.distance || 0
                });
                
                // Set duration text if available
                if (placeData.duration) {
                    const minutes = Math.round(placeData.duration / 60);
                    setDurationText(`${minutes} min`);
                }
                
                // Set distance text if available
                if (placeData.distance) {
                    const kilometers = (placeData.distance / 1000).toFixed(1);
                    setDistanceText(`${kilometers} km`);
                }
            } catch (error) {
                console.error('Error parsing destination:', error);
            }
        }
    }, [ride]);

    // Request location permission and get current location
    useEffect(() => {
        const requestLocationPermission = async () => {
            try {
                let granted = false;

                if (Platform.OS === 'ios') {
                    const status = await Geolocation.requestAuthorization('whenInUse');
                    granted = status === 'granted';
                } else {
                    const status = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                        {
                            title: "Location Permission",
                            message: "This app needs access to your location to show nearby drivers.",
                            buttonNeutral: "Ask Me Later",
                            buttonNegative: "Cancel",
                            buttonPositive: "OK"
                        }
                    );
                    granted = status === PermissionsAndroid.RESULTS.GRANTED;
                }

                setHasLocationPermission(granted);

                if (granted) {
                    const watchId = Geolocation.watchPosition(
                        (position) => {
                            const location = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                            };
                            setCurrentLocation(location);
                            setIsLoading(false);
                            Geolocation.clearWatch(watchId);
                        },
                        (error) => {
                            console.error('Error getting location:', error);
                            setIsLoading(false);
                        },
                        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                    );
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error requesting location permission:', error);
                setHasLocationPermission(false);
                setIsLoading(false);
            }
        };

        requestLocationPermission();
    }, []);

    // Fetch route when both locations are available
    useEffect(() => {
        if (currentLocation && destination) {
            fetchRouteDirections();
        }
    }, [currentLocation, destination]);

    // Fetch route directions from Google Directions API
    const fetchRouteDirections = async () => {
        try {
            const origin = `${currentLocation.latitude},${currentLocation.longitude}`;
            const dest = `${destination.latitude},${destination.longitude}`;
            
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&key=${GOOGLE_MAPS_APIKEY}`
            );
            
            const result = await response.json();
            
            if (result.routes.length) {
                const route = result.routes[0];
                
                // Decode polyline from the API response
                const points = route.overview_polyline.points;
                const decodedCoords = decodePolyline(points);
                
                setRouteCoordinates(decodedCoords);
                
                // Update duration and distance if not already set
                if (!durationText && route.legs[0]?.duration) {
                    setDurationText(route.legs[0].duration.text);
                }
                
                if (!distanceText && route.legs[0]?.distance) {
                    setDistanceText(route.legs[0].distance.text);
                }
                
                // Fit map to show the entire route
                if (mapRef.current) {
                    mapRef.current.fitToCoordinates(decodedCoords, {
                        edgePadding: { top: 50, right: 50, bottom: 250, left: 50 },
                        animated: true,
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching directions:', error);
        }
    };

    // Function to decode Google's encoded polyline
    const decodePolyline = (encoded) => {
        const poly = [];
        let index = 0, len = encoded.length;
        let lat = 0, lng = 0;
        
        while (index < len) {
            let b, shift = 0, result = 0;
            
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            
            const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += dlat;
            
            shift = 0;
            result = 0;
            
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            
            const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;
            
            const point = {
                latitude: lat / 1e5,
                longitude: lng / 1e5,
            };
            
            poly.push(point);
        }
        
        return poly;
    };

    // Start animations
    useEffect(() => {
        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Opacity animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacityAnim, {
                    toValue: 0.7,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0.3,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Rotation animation
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    // Calculate rotation interpolation
    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    // Define the map region
    const getMapRegion = () => {
        if (!destination) return null;

        if (currentLocation) {
            // Show region that includes both current location and destination
            const minLat = Math.min(currentLocation.latitude, destination.latitude);
            const maxLat = Math.max(currentLocation.latitude, destination.latitude);
            const minLng = Math.min(currentLocation.longitude, destination.longitude);
            const maxLng = Math.max(currentLocation.longitude, destination.longitude);

            // Add padding
            const latDelta = (maxLat - minLat) * 1.5;
            const lngDelta = (maxLng - minLng) * 1.5;

            return {
                latitude: (minLat + maxLat) / 2,
                longitude: (minLng + maxLng) / 2,
                latitudeDelta: Math.max(latDelta, LATITUDE_DELTA),
                longitudeDelta: Math.max(lngDelta, LONGITUDE_DELTA),
            };
        } else {
            // Only show destination
            return {
                latitude: destination.latitude,
                longitude: destination.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
            };
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {destination && (
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    region={getMapRegion()}
                    showsUserLocation={hasLocationPermission}
                    showsMyLocationButton={hasLocationPermission}
                    customMapStyle={mapStyle}
                >
                    {/* Route polyline */}
                    {routeCoordinates.length > 0 && (
                        <Polyline
                            coordinates={routeCoordinates}
                            strokeWidth={4}
                            strokeColor="#3F6FFF"
                            lineCap="round"
                            lineJoin="round"
                        />
                    )}
                    
                    {/* Current location custom marker */}
                    {currentLocation && (
                        <Marker
                            coordinate={{
                                latitude: currentLocation.latitude,
                                longitude: currentLocation.longitude,
                            }}
                        >
                            <View style={styles.currentLocationMarker}>
                                <View style={styles.currentLocationDot} />
                            </View>
                        </Marker>
                    )}
                    
                    {/* Destination marker */}
                    <Marker
                        coordinate={{
                            latitude: destination.latitude,
                            longitude: destination.longitude,
                        }}
                        title={destination.name}
                        description={destination.address}
                    >
                        <View style={styles.destinationMarker}>
                            <View style={styles.destinationPin} />
                            <View style={styles.destinationDot} />
                        </View>
                    </Marker>
                </MapView>
            )}

            {/* Overlay with searching animation */}
            <View style={styles.overlay}>
                <View style={styles.searchingContainer}>
                    <View style={styles.animationContainer}>
                        <Animated.View
                            style={[
                                styles.pulseCircle,
                                {
                                    transform: [{ scale: pulseAnim }],
                                    opacity: opacityAnim
                                }
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.spinnerContainer,
                                {
                                    transform: [{ rotate: spin }]
                                }
                            ]}
                        >
                            <View style={styles.spinnerDot} />
                        </Animated.View>
                    </View>

                    <Text style={styles.searchingText}>Connecting to nearby drivers</Text>
                    <Text style={styles.subtitleText}>Please wait while we find a driver for you</Text>

                    <View style={styles.divider} />

                    <View style={styles.destinationContainer}>
                        <Text style={styles.destinationLabel}>DESTINATION</Text>
                        <Text style={styles.destinationText} numberOfLines={1}>
                            {destination?.name || 'Loading...'}
                        </Text>
                        <Text style={styles.addressText} numberOfLines={2}>
                            {destination?.address || ''}
                        </Text>

                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>DISTANCE</Text>
                                <Text style={styles.infoValue}>
                                    {distanceText || '--'}
                                </Text>
                            </View>
                            
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>ETA</Text>
                                <Text style={styles.infoValue}>
                                    {durationText || '--'}
                                </Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>DRIVERS NOTIFIED</Text>
                                <Text style={styles.infoValue}>
                                    {ride?.requestedto?.length || 0}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

// Dark mode map style
const mapStyle = [
    {
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#212121"
            }
        ]
    },
    {
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#757575"
            }
        ]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "color": "#212121"
            }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#757575"
            }
        ]
    },
    {
        "featureType": "administrative.country",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#9e9e9e"
            }
        ]
    },
    {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#bdbdbd"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#757575"
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#181818"
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#616161"
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "color": "#1b1b1b"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#2c2c2c"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#8a8a8a"
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#373737"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#3c3c3c"
            }
        ]
    },
    {
        "featureType": "road.highway.controlled_access",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#4e4e4e"
            }
        ]
    },
    {
        "featureType": "road.local",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#616161"
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#757575"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#000000"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#3d3d3d"
            }
        ]
    }
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
    },
    loadingText: {
        color: 'white',
        marginTop: 16,
        fontSize: 16,
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
    },
    searchingContainer: {
        backgroundColor: '#000000',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        // Add shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        // Add elevation for Android
        elevation: 8,
    },
    animationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 100,
        marginBottom: 16,
    },
    pulseCircle: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    spinnerContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderTopColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinnerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'white',
        position: 'absolute',
        top: 0,
    },
    searchingText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitleText: {
        color: '#999',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginBottom: 24,
    },
    destinationContainer: {
        marginBottom: 16,
    },
    destinationLabel: {
        color: '#888',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        letterSpacing: 1,
    },
    destinationText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    addressText: {
        color: '#999',
        fontSize: 14,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    infoItem: {
        flex: 1,
    },
    infoLabel: {
        color: '#888',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    infoValue: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Custom marker styles
    currentLocationMarker: {
        height: 24,
        width: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(63, 111, 255, 0.3)',
        borderWidth: 1,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentLocationDot: {
        height: 12,
        width: 12,
        borderRadius: 6,
        backgroundColor: '#3F6FFF',
    },
    destinationMarker: {
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    destinationPin: {
        height: 30,
        width: 20,
        backgroundColor: 'black',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    destinationDot: {
        height: 8,
        width: 8,
        borderRadius: 4,
        backgroundColor: 'white',
    },
});

export default SearchDriverScreen;