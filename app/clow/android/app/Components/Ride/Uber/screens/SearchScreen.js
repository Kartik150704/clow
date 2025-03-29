import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    Dimensions,
    StatusBar
} from 'react-native';
import { debounce } from 'lodash';
import { CreateRide } from '../api/ride';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const PlaceSearchScreen = ({ fetchRide }) => {
    // State variables
    const [searchQuery, setSearchQuery] = useState('');
    const [places, setPlaces] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [isRideStarted, setIsRideStarted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(async (keyword) => {
            if (keyword.length < 2) {
                setPlaces([]);
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(`https://backend-ride-service.easecruit.com/places/?keyword='${keyword}'`);
                const data = await response.json();
                setPlaces(data.places || []);
            } catch (error) {
                console.error('Error fetching places:', error);
                setPlaces([]);
            } finally {
                setLoading(false);
            }
        }, 500), // 500ms debounce time
        []
    );

    // Call fetchPlaces when searchQuery changes
    useEffect(() => {
        debouncedSearch(searchQuery);
    }, [searchQuery, debouncedSearch]);

    // Handle place selection
    const handleSelectPlace = (place) => {
        setSelectedPlace(place);
        setSearchQuery(place.name || place.structured_formatting?.main_text || place.description.split(',')[0]);
        setPlaces([]);
    };

    // Handle ride start
    const handleStartRide = () => {
        setIsRideStarted(true);
    };

    // Handle booking auto
    const handleBookAuto = async () => {
        setLoading(true)
        let id = await AsyncStorage.getItem("id")
        let response = await CreateRide(id, selectedPlace)
        await fetchRide();
        setLoading(false);
        console.log(response);
        // let response=await CreateRide()
        console.log('Booking Auto for:', {
            destination: selectedPlace,
            fare: 125,
            vehicleType: 'Auto'
        });
    };

    // Render place item for the FlatList
    const renderPlaceItem = ({ item }) => (
        <TouchableOpacity
            style={styles.placeItem}
            onPress={() => handleSelectPlace(item)}
        >
            <Text style={styles.placeName} numberOfLines={1}>
                {item.name || item.structured_formatting?.main_text}
            </Text>
            <Text style={styles.placeAddress} numberOfLines={2}>
                {item.formatted_address || item.structured_formatting?.secondary_text || item.description}
            </Text>
            {(item.distance || item.duration) && (
                <Text style={styles.placeDistance}>
                    {item.distance ? `${(item.distance / 1000).toFixed(1)} km` : ''}
                    {item.duration ? ` · ${Math.round(item.duration / 60)} min` : ''}
                </Text>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Where to?</Text>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Enter destination"
                    placeholderTextColor="#666"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                />
                {loading && <ActivityIndicator style={styles.loader} color="#ffffff" />}
            </View>

            {!selectedPlace && places.length > 0 && (
                <FlatList
                    data={places}
                    renderItem={renderPlaceItem}
                    keyExtractor={(item) => item.place_id}
                    style={styles.placesList}
                    contentContainerStyle={styles.placesListContent}
                />
            )}

            {selectedPlace && !isRideStarted && (
                <View style={styles.selectedPlaceContainer}>
                    <Text style={styles.selectedPlaceTitle}>YOUR DESTINATION</Text>
                    <View style={styles.destinationCard}>
                        <Text style={styles.selectedPlaceName} numberOfLines={1}>
                            {selectedPlace.name || selectedPlace.structured_formatting?.main_text}
                        </Text>
                        <Text style={styles.selectedPlaceAddress} numberOfLines={2}>
                            {selectedPlace.formatted_address || selectedPlace.structured_formatting?.secondary_text}
                        </Text>

                        <View style={styles.divider} />

                        <View style={styles.distanceSection}>
                            {selectedPlace.distance && (
                                <View style={styles.distanceItem}>
                                    <Text style={styles.distanceLabel}>Distance</Text>
                                    <Text style={styles.distanceValue}>{(selectedPlace.distance / 1000).toFixed(1)} km</Text>
                                </View>
                            )}

                            {selectedPlace.duration && (
                                <View style={styles.distanceItem}>
                                    <Text style={styles.distanceLabel}>Est. Time</Text>
                                    <Text style={styles.distanceValue}>{Math.round(selectedPlace.duration / 60)} min</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.startRideButton}
                        onPress={handleStartRide}
                    >
                        <Text style={styles.startRideButtonText}>CONFIRM DESTINATION</Text>
                    </TouchableOpacity>
                </View>
            )}

            {isRideStarted && (
                <View style={styles.rideOptionsContainer}>
                    <Text style={styles.rideOptionsTitle}>CHOOSE A RIDE</Text>

                    <TouchableOpacity
                        style={styles.rideOption}
                        onPress={handleBookAuto}
                        activeOpacity={0.7}
                    >
                        <View style={styles.rideOptionLeft}>
                            <View style={styles.autoIconCircle}>
                                <Text style={styles.autoIcon}>🛺</Text>
                            </View>
                            <View style={styles.rideOptionInfo}>
                                <Text style={styles.rideOptionName}>Auto</Text>
                                <Text style={styles.rideOptionDetails}>Arrives in 3 mins</Text>
                            </View>
                            <Text style={styles.rideOptionPrice}>₹125</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.bookButton}
                        onPress={handleBookAuto}
                    >
                        <Text style={styles.bookButtonText}>BOOK AUTO</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        backgroundColor: '#000000',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: 0.5,
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#000000',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    searchInput: {
        flex: 1,
        height: 48,
        borderWidth: 0,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#1A1A1A',
        color: 'white',
    },
    loader: {
        marginLeft: 12,
    },
    placesList: {
        flex: 1,
        backgroundColor: '#000000',
    },
    placesListContent: {
        paddingBottom: 20,
    },
    placeItem: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        backgroundColor: '#000000',
    },
    placeName: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginBottom: 4,
        width: width - 40, // Account for horizontal padding
    },
    placeAddress: {
        fontSize: 14,
        color: '#999',
        marginBottom: 4,
        width: width - 40, // Account for horizontal padding
    },
    placeDistance: {
        fontSize: 14,
        color: '#888',
        fontWeight: '500',
    },
    selectedPlaceContainer: {
        flex: 1,
        padding: 20,
        backgroundColor: '#000000',
    },
    selectedPlaceTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 12,
        color: '#999',
        letterSpacing: 1,
    },
    destinationCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
    },
    selectedPlaceName: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
        marginBottom: 4,
        width: width - 72, // Account for container padding and card padding
    },
    selectedPlaceAddress: {
        fontSize: 14,
        color: '#999',
        marginBottom: 16,
        width: width - 72, // Account for container padding and card padding
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginBottom: 16,
    },
    distanceSection: {
        flexDirection: 'row',
    },
    distanceItem: {
        flex: 1,
    },
    distanceLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 2,
    },
    distanceValue: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    startRideButton: {
        backgroundColor: 'white',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 'auto',
    },
    startRideButtonText: {
        color: 'black',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    rideOptionsContainer: {
        flex: 1,
        padding: 20,
        backgroundColor: '#000000',
    },
    rideOptionsTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 16,
        color: '#999',
        letterSpacing: 1,
    },
    rideOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#1A1A1A',
        borderRadius: 8,
        marginBottom: 20,
    },
    rideOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    autoIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    autoIcon: {
        fontSize: 24,
    },
    rideOptionInfo: {
        flex: 1,
    },
    rideOptionName: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginBottom: 2,
    },
    rideOptionDetails: {
        fontSize: 14,
        color: '#999',
    },
    rideOptionPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    bookButton: {
        backgroundColor: 'white',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 'auto',
    },
    bookButtonText: {
        color: 'black',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.8,
    }
});


export default PlaceSearchScreen;