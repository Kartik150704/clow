import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    SafeAreaView,
    Modal,
    Alert,
    StatusBar,
    Dimensions,
    Image
} from 'react-native';
import PlaceSearchForm from '../Ride/SearchRide';
import RideHistory from '../Ride/RideHistory';
import RiderProfileForm from '../Profile/ProfilePage';
// Import React Native Vector Icons
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';

// We'll create placeholder components instead of importing them
// This avoids dependencies on other project files
const PlaceholderComponent = ({ title }) => (
    <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>{title}</Text>
    </View>
);

const { width, height } = Dimensions.get('window');

// Color palette
const COLORS = {
    background: '#000000',
    card: '#1C1C1C',
    cardLight: '#2A2A2A',
    cardHighlight: '#2C2C2C',
    primary: '#FFFFFF',
    secondary: '#BBBBBB',
    accent: '#FFFFFF',
    inactive: '#777777',
    divider: '#000000',
    success: '#00C853',
    error: '#FF3B30',
    highlight: '#222222',
};

// Replace custom Icons with React Native Vector Icons
const Icons = {
    Car: ({ size = 24, color = COLORS.primary }) => (
        <MaterialCommunityIcons name="car" size={size} color={color} />
    ),
    Clock: ({ size = 24, color = COLORS.primary }) => (
        <Ionicons name="time-outline" size={size} color={color} />
    ),
    User: ({ size = 24, color = COLORS.primary }) => (
        <FontAwesome name="user" size={size} color={color} />
    ),
    Menu: ({ size = 24, color = COLORS.primary }) => (
        <Feather name="menu" size={size} color={color} />
    ),
    DollarSign: ({ size = 24, color = COLORS.primary }) => (
        <FontAwesome name="dollar" size={size} color={color} />
    ),
    Navigation: ({ size = 24, color = COLORS.primary }) => (
        <Feather name="navigation" size={size} color={color} />
    ),
    History: ({ size = 24, color = COLORS.primary }) => (
        <MaterialCommunityIcons name="history" size={size} color={color} />
    ),
    X: ({ size = 24, color = COLORS.primary }) => (
        <Feather name="x" size={size} color={color} />
    ),
    Star: ({ size = 24, color = COLORS.primary, fill = false }) => (
        <FontAwesome name={fill ? "star" : "star-o"} size={size} color={color} />
    ),
    CreditCard: ({ size = 24, color = COLORS.primary }) => (
        <FontAwesome name="credit-card" size={size} color={color} />
    ),
    LogOut: ({ size = 24, color = COLORS.primary }) => (
        <Feather name="log-out" size={size} color={color} />
    )
};

const LoadingComponent = () => {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
    );
};



const StandaloneDashboard = ({ setIsLoggedIn ,notify}) => {
    const [activeTab, setActiveTab] = useState('ride');
    const [loading, setLoading] = useState(true);
    const [activeRide, setActiveRide] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const [finalCost, setFinalCost] = useState(0);
    const [showMenu, setShowMenu] = useState(false);

    // Hardcoded user values as requested
    const userEmail = "2021csb1101@iitrpr.ac.in";
    const userId = "ffe713df-e63e-4f6a-8cd0-fbb33a8f6b3d";

    useEffect(() => {
        // Simulate loading
        setTimeout(() => {
            setLoading(false);
        }, 1500);
    }, []);
    
    const handleStartRide = (rideDetails) => {
        // This would come from your ride confirmation API
        const newRide = {
            id: 'ride-' + Date.now(),
            pickup: rideDetails?.pickup || 'Current Location',
            destination: rideDetails?.destination || 'Selected Destination',
            distance: rideDetails?.distance || '5.2',
            duration: rideDetails?.duration || '15 min',
            eta: rideDetails?.eta || '10:45 AM',
            initialCost: rideDetails?.cost || 12.50,
            ratePerMinute: 0.25, // $0.25 per minute
            ratePerKm: 2.00,     // $2 per km
            status: 'active',
            startTime: new Date().toISOString()
        };

        setActiveRide(newRide);
        Alert.alert('Success', 'Your ride has been confirmed! The driver is on their way.');
    };

    const handleEndRide = () => {
        if (!activeRide) return;

        // Calculate final cost
        const cost = activeRide.initialCost * 1.2; // Simple calculation for demo
        setFinalCost(cost);

        // Show payment modal
        setShowPayment(true);

        // Remove active ride
        setActiveRide(null);
    };

    const handleCompletePayment = () => {
        Alert.alert('Success', 'Payment successful! Thank you for riding with us.');
        setShowPayment(false);
        setActiveTab('activity');
    };

    // Modified to show confirmation dialog
    const handleLogout = async () => {
        // Show confirmation dialog
        Alert.alert(
            "Confirm Logout",
            "Are you sure you want to log out?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Log Out",
                    onPress: async () => {
                        // Only proceed with logout if user confirms
                        await AsyncStorage.removeItem('userEmail');
                        await AsyncStorage.removeItem('id');
                        setIsLoggedIn(false);
                    },
                    style: "destructive"
                }
            ],
            { cancelable: true }
        );
    };

    if (loading) {
        return <LoadingComponent />;
    }

    // Simulated tab content
    const renderTabContent = () => {
        switch (activeTab) {
            case 'ride':
                return <PlaceSearchForm setActiveTab={setActiveTab} notify={notify} />;
            case 'activity':
                return <RideHistory />;
            case 'profile':
                return <RiderProfileForm title="Profile" notify={notify}/>;
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            {/* Modern Header */}
            <View style={styles.header}>
                <View style={styles.headerInner}>
                    <View style={styles.brandContainer}>
                        <Image
                            source={require('./clow.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.brandName}>CLOW</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Icons.LogOut size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Main Content */}
            <ScrollView
                style={styles.mainContent}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Tab Content */}
                {renderTabContent()}
            </ScrollView>

            {/* Payment Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showPayment}
                onRequestClose={() => setShowPayment(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.paymentModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Complete Payment</Text>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setShowPayment(false)}
                            >
                                <Icons.X size={20} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.receiptContainer}>
                            <View style={styles.receiptHeader}>
                                <Text style={styles.receiptTitle}>TRIP DETAILS</Text>
                            </View>

                            <View style={styles.receiptItemGroup}>
                                <View style={styles.receiptItem}>
                                    <Text style={styles.receiptItemLabel}>Base fare</Text>
                                    <Text style={styles.receiptItemValue}>${(finalCost * 0.7).toFixed(2)}</Text>
                                </View>

                                <View style={styles.receiptItem}>
                                    <Text style={styles.receiptItemLabel}>Time & distance</Text>
                                    <Text style={styles.receiptItemValue}>${(finalCost * 0.25).toFixed(2)}</Text>
                                </View>

                                <View style={styles.receiptItem}>
                                    <Text style={styles.receiptItemLabel}>Service fee</Text>
                                    <Text style={styles.receiptItemValue}>${(finalCost * 0.05).toFixed(2)}</Text>
                                </View>
                            </View>

                            <View style={styles.receiptDivider} />

                            <View style={styles.receiptTotal}>
                                <Text style={styles.receiptTotalLabel}>TOTAL</Text>
                                <Text style={styles.receiptTotalValue}>${finalCost.toFixed(2)}</Text>
                            </View>
                        </View>

                        <View style={styles.paymentOptions}>
                            <Text style={styles.paymentSectionTitle}>PAYMENT METHOD</Text>

                            <TouchableOpacity style={styles.paymentMethod}>
                                <View style={styles.paymentMethodIcon}>
                                    <Icons.CreditCard size={24} color={COLORS.primary} />
                                </View>
                                <View style={styles.paymentMethodInfo}>
                                    <Text style={styles.paymentMethodName}>•••• 4582</Text>
                                    <Text style={styles.paymentMethodDetail}>Expires 05/27</Text>
                                </View>
                                <View style={styles.paymentMethodCheck}>
                                    <View style={styles.paymentMethodCheckCircle} />
                                </View>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.paymentButton}
                            onPress={handleCompletePayment}
                        >
                            <Text style={styles.paymentButtonText}>CONFIRM PAYMENT</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Menu Side Sheet */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showMenu}
                onRequestClose={() => setShowMenu(false)}
            >
                <TouchableOpacity
                    style={styles.menuOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMenu(false)}
                >
                    <View style={styles.menuSheet}>
                        <View style={styles.menuHeader}>
                            <View style={styles.userProfile}>
                                <View style={styles.userAvatar}>
                                    <Text style={styles.userAvatarText}>
                                        {userEmail.substring(0, 2).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName}>{userEmail.split('@')[0]}</Text>
                                    <View style={styles.userRating}>
                                        <Icons.Star size={14} color={COLORS.primary} fill={true} />
                                        <Text style={styles.userRatingText}>4.85</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.menuOptions}>
                            <TouchableOpacity
                                style={styles.menuOption}
                                onPress={() => {
                                    setShowMenu(false);
                                    setActiveTab('ride');
                                }}
                            >
                                <Icons.Car size={20} color={COLORS.primary} />
                                <Text style={styles.menuOptionText}>Book a Ride</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuOption}
                                onPress={() => {
                                    setShowMenu(false);
                                    setActiveTab('activity');
                                }}
                            >
                                <Icons.History size={20} color={COLORS.primary} />
                                <Text style={styles.menuOptionText}>Trip History</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuOption}
                                onPress={() => {
                                    setShowMenu(false);
                                    setActiveTab('profile');
                                }}
                            >
                                <Icons.User size={20} color={COLORS.primary} />
                                <Text style={styles.menuOptionText}>Profile</Text>
                            </TouchableOpacity>

                            <View style={styles.menuDivider} />

                            <TouchableOpacity
                                style={styles.menuOption}
                                onPress={() => {
                                    setShowMenu(false);
                                    handleLogout();
                                }}
                            >
                                <Icons.LogOut size={20} color={COLORS.primary} />
                                <Text style={styles.menuOptionText}>Log Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Bottom Tab Bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'ride' && styles.activeTabButton]}
                    onPress={() => setActiveTab('ride')}
                >
                    <View style={[styles.tabIconContainer, activeTab === 'ride' && styles.activeTabIconContainer]}>
                        <Icons.Car size={22} color={activeTab === 'ride' ? COLORS.background : COLORS.primary} />
                    </View>
                    <Text style={[styles.tabLabelText, activeTab === 'ride' && styles.activeTabLabelText]}>
                        Ride
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'activity' && styles.activeTabButton]}
                    onPress={() => setActiveTab('activity')}
                >
                    <View style={[styles.tabIconContainer, activeTab === 'activity' && styles.activeTabIconContainer]}>
                        <Icons.History size={22} color={activeTab === 'activity' ? COLORS.background : COLORS.primary} />
                    </View>
                    <Text style={[styles.tabLabelText, activeTab === 'activity' && styles.activeTabLabelText]}>
                        Activity
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'profile' && styles.activeTabButton]}
                    onPress={() => setActiveTab('profile')}
                >
                    <View style={[styles.tabIconContainer, activeTab === 'profile' && styles.activeTabIconContainer]}>
                        <Icons.User size={22} color={activeTab === 'profile' ? COLORS.background : COLORS.primary} />
                    </View>
                    <Text style={[styles.tabLabelText, activeTab === 'profile' && styles.activeTabLabelText]}>
                        Profile
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: 24,
        paddingBottom: 10,
    },
    placeholderContainer: {
        margin: 16,
        padding: 20,
        backgroundColor: COLORS.card,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
    },
    placeholderText: {
        color: COLORS.secondary,
        fontSize: 16,
    },
    sampleRideButton: {
        backgroundColor: COLORS.primary,
        margin: 16,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    sampleRideButtonText: {
        color: COLORS.background,
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 1,
    },

    // Header Styles
    header: {
        height: 60,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
        backgroundColor: COLORS.background,
    },
    headerInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: '100%',
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoMark: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        color: COLORS.background,
        fontWeight: '900',
        fontSize: 20,
    },
    brandName: {
        fontSize: 18,
        fontWeight: '800',
        marginLeft: 8,
        letterSpacing: 1,
        color: COLORS.primary,
    },
    menuButton: {
        padding: 6,
        borderRadius: 24,
        backgroundColor: COLORS.card,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutButton: {
        padding: 6,
        borderRadius: 24,
        backgroundColor: COLORS.card,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Main Content Styles
    mainContent: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    contentContainer: {
        paddingBottom: 90, // Space for bottom tabs
    },
    tabScreen: {
        padding: 16,
    },

    // Active Ride Card
    activeRideCard: {
        marginHorizontal: 16,
        marginVertical: 16,
        borderRadius: 12,
        backgroundColor: COLORS.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        overflow: 'hidden',
    },
    rideCardHeader: {
        padding: 16,
        backgroundColor: COLORS.cardHighlight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    rideHeaderContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rideTitleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rideTitle: {
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
        color: COLORS.primary,
        marginLeft: 8,
    },
    rideBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: COLORS.primary,
        borderRadius: 16,
    },
    rideBadgeText: {
        color: COLORS.background,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    rideSubtitle: {
        fontSize: 13,
        color: COLORS.secondary,
        marginTop: 4,
    },
    rideCardBody: {
        padding: 16,
    },

    // Route visualization
    rideRouteContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    rideLocationIndicators: {
        width: 24,
        alignItems: 'center',
    },
    originDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        marginTop: 5,
    },
    routeLine: {
        width: 2,
        height: 30,
        backgroundColor: COLORS.divider,
        marginVertical: 3,
    },
    destinationDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.card,
    },
    rideLocations: {
        flex: 1,
        marginLeft: 12,
    },
    rideLocationText: {
        fontSize: 15,
        marginBottom: 16,
        fontWeight: '500',
        color: COLORS.primary,
    },

    // Ride details grid
    rideDetailGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        marginHorizontal: -8,
    },
    rideDetailItem: {
        width: '50%',
        paddingHorizontal: 8,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    rideDetailWide: {
        width: '100%',
    },
    rideDetailContent: {
        flex: 1,
        marginLeft: 12,
    },
    rideDetailLabel: {
        fontSize: 12,
        color: COLORS.secondary,
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    rideDetailValue: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.primary,
    },
    rideFareAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.primary,
    },
    endRideButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    endRideButtonText: {
        color: COLORS.background,
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 1,
    },

    // Payment Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    paymentModal: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 24,
        paddingTop: 16,
        paddingBottom: 36,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.primary,
    },
    modalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    receiptContainer: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    receiptHeader: {
        marginBottom: 16,
    },
    receiptTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.secondary,
        letterSpacing: 0.5,
    },
    receiptItemGroup: {
        marginBottom: 16,
    },
    receiptItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    receiptItemLabel: {
        fontSize: 15,
        color: COLORS.secondary,
    },
    receiptItemValue: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.primary,
    },
    receiptDivider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginBottom: 16,
    },
    receiptTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    receiptTotalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
    },
    receiptTotalValue: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.primary,
    },
    paymentOptions: {
        marginBottom: 24,
    },
    paymentSectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.secondary,
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
    },
    paymentMethodIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.cardLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    paymentMethodInfo: {
        flex: 1,
    },
    paymentMethodName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 2,
    },
    paymentMethodDetail: {
        fontSize: 13,
        color: COLORS.secondary,
    },
    paymentMethodCheck: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    paymentMethodCheckCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
    },
    paymentButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    paymentButtonText: {
        color: COLORS.background,
        fontWeight: '700',
        fontSize: 15,
        letterSpacing: 0.5,
    },

    // Menu Sheet
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    menuSheet: {
        width: '70%',
        height: '100%',
        backgroundColor: COLORS.background,
        marginLeft: 'auto',
    },
    menuHeader: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    userProfile: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    userAvatarText: {
        color: COLORS.background,
        fontSize: 18,
        fontWeight: '700',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
        color: COLORS.primary,
    },
    userRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userRatingText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
        marginLeft: 4,
    },
    menuDivider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginVertical: 8,
        marginHorizontal: 16,
    },
    menuOptions: {
        padding: 16,
    },
    menuOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    menuOptionText: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.primary,
        marginLeft: 16,
    },

    // Bottom Tab Bar
    tabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        flexDirection: 'row',
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        paddingTop: 2,
        borderTopColor: COLORS.divider,
        paddingBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 10,
    },
    tabButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeTabButton: {
        backgroundColor: 'transparent',
    },
    tabIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.cardLight,
        marginBottom: 4,
    },
    activeTabIconContainer: {
        backgroundColor: COLORS.primary,
    },
    tabLabelText: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.secondary,
    },
    activeTabLabelText: {
        color: COLORS.primary,
        fontWeight: '700',
    },

    // Loading Component
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: 16,
        color: COLORS.secondary,
        fontSize: 14,
    },
    logo: {
        width: 35,  // Adjust this value to change width
        height: 35, // Adjust this value to change height
        marginRight: 2,
        marginTop: 1
    },
});

export default StandaloneDashboard;