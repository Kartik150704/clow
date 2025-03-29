// File: src/components/GoogleAuthButton.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Animated,
    Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Navigation import removed as requested
import Icon from 'react-native-vector-icons/Feather';
import {
    initializeGoogleSignIn,
    signInWithGoogle,
    signOut,
    getCurrentUser
} from '../firebase/GoogleSignIn';
import { Login } from './api/login';

// Custom Toast component for React Native
const Toast = ({ message, onClose }) => {
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(Dimensions.get('window').width));

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.toastContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ translateX: slideAnim }],
                },
            ]}
        >
            <View style={styles.toastContent}>
                <Icon name="alert-circle" size={20} color="#FFFFFF" style={styles.toastIcon} />
                <Text style={styles.toastMessage}>{message}</Text>
                <TouchableOpacity onPress={onClose} style={styles.toastCloseButton}>
                    <Text style={styles.toastCloseText}>×</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const GoogleAuthButton = ({setIsLoggedIn}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    // Navigation hook removed as requested

    useEffect(() => {
        // Initialize Google Sign-In
        initializeGoogleSignIn();

        // Check if user is already signed in
        async function checkUser() {
            try {
                // const userInfo = await getCurrentUser();
                // setUser(userInfo?.user || null);

                // Check if we have stored user data
                const userEmail = await AsyncStorage.getItem('userEmail');
                const userId = await AsyncStorage.getItem('userId');

                if (userEmail && userId) {
                    // User is already authenticated, log ID to console
                    console.log('User already authenticated with ID:', userId);
                }
            } catch (error) {
                console.log('Error checking user:', error);
            } finally {
                setInitializing(false);
            }
        }

        checkUser();
    }, []);

    const handleSignIn = async () => {
        try {
            setLoading(true);
            const result = await signInWithGoogle();
            console.log(result)
            if (result && result.email) {
                const email = result.email;

                // Validate email domain
                if (!email.endsWith('@iitrpr.ac.in')) {
                    setToastMessage('Please use your college email (@iitrpr.ac.in) to sign in');
                    setShowToast(true);
                    
                    setUser(null);
                    return;
                }

                // Call the Login API
                try {
                    const response = await Login(email);
                    console.log(response)
                    // Store user data
                    await AsyncStorage.setItem('userEmail', email);
                    await AsyncStorage.setItem('userId', response.id.toString());

                    setUser(result.user);
                    setIsLoggedIn(true);
                    // Log user ID to console instead of navigating
                    console.log('User successfully authenticated with ID:', response.id);
                    console.log('Login successful:', { email, id: response.id });
                } catch (apiError) {
                    console.log('API error:', apiError);
                    setToastMessage('Login failed. Please try again.');
                    setShowToast(true);
                }
            }
        } catch (error) {
            console.log('Sign in error:', error);
            setToastMessage('Sign in failed. Please try again.');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            setLoading(true);
            
            setUser(null);

            // Clear stored user data
            await AsyncStorage.removeItem('userEmail');
            await AsyncStorage.removeItem('userId');

        } catch (error) {
            console.log('Sign out error:', error);
            setToastMessage('Sign out failed. Please try again.');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#4285F4" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.contentContainer}>
                {/* Title Section */}
                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>Welcome</Text>
                    <Text style={styles.subtitleText}>Sign in to continue</Text>
                </View>

                {/* Google Sign In Button */}
                {!user ? (
                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={handleSignIn}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <View style={styles.buttonContent}>
                                <GoogleIcon />
                                <Text style={styles.buttonText}>Sign in with Google</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={styles.userContainer}>
                        <Text style={styles.welcomeText}>Welcome, {user.displayName}</Text>
                        <Text style={styles.emailText}>{user.email}</Text>

                        <TouchableOpacity
                            style={styles.signOutButton}
                            onPress={handleSignOut}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Sign Out</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Info Text */}
                <Text style={styles.infoText}>
                    Please use your college email (@iitrpr.ac.in)
                </Text>
            </View>

            {/* Toast Notification */}
            {showToast && (
                <Toast
                    message={toastMessage}
                    onClose={() => setShowToast(false)}
                />
            )}
        </View>
    );
};

// Google Icon Component
const GoogleIcon = () => (
    <View style={styles.iconContainer}>
        <View style={styles.googleIconBackground}>
            <Text style={styles.googleIconText}>G</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    contentContainer: {
        width: '100%',
        maxWidth: 300,
        alignItems: 'center',
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    titleText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 8,
    },
    subtitleText: {
        fontSize: 18,
        color: '#666666',
    },
    googleButton: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: '#DDDDDD',
        elevation: 2,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#666666',
        fontSize: 16,
        fontWeight: '500',
    },
    iconContainer: {
        marginRight: 12,
    },
    googleIconBackground: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#4285F4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleIconText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    signOutButton: {
        backgroundColor: '#EA4335',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        width: '100%',
    },
    userContainer: {
        alignItems: 'center',
        width: '100%',
    },
    welcomeText: {
        color: '#333333',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emailText: {
        color: '#666666',
        fontSize: 14,
    },
    infoText: {
        textAlign: 'center',
        color: '#888888',
        marginTop: 24,
        fontSize: 14,
    },
    toastContainer: {
        position: 'absolute',
        top: 40,
        right: 16,
        zIndex: 1000,
    },
    toastContent: {
        backgroundColor: '#6366F1',  // indigo-600 equivalent
        padding: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        maxWidth: 300,
    },
    toastIcon: {
        marginRight: 8,
    },
    toastMessage: {
        color: '#FFFFFF',
        flex: 1,
        fontSize: 14,
    },
    toastCloseButton: {
        marginLeft: 8,
        padding: 4,
    },
    toastCloseText: {
        color: '#FFFFFF',
        fontSize: 20,
    },
});

export default GoogleAuthButton;