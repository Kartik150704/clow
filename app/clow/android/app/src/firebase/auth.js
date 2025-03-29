import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize Google Sign-In
export const initializeGoogleSignIn = () => {
    GoogleSignin.configure({
        webClientId: '545191502437-5jsrvpp38k3pahcq6g94ov6719vlanfr.apps.googleusercontent.com', // Get this from your Firebase project settings
    });
};

// Sign in with Google
export const signInWithGoogle = async () => {
    try {
        // Check if your device supports Google Play
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

        // Get the user ID token
        const { idToken } = await GoogleSignin.signIn();

        // Create a Google credential with the token
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);

        // Sign-in the user with the credential
        const userCredential = await auth().signInWithCredential(googleCredential);

        // Save user info to AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(userCredential.user));

        return userCredential.user;
    } catch (error) {
        console.error('Google sign-in error:', error);
        throw error;
    }
};

// Sign out
export const signOut = async () => {
    try {
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
        await auth().signOut();
        await AsyncStorage.removeItem('user');
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
};

// Check if user is authenticated
export const getCurrentUser = async () => {
    try {
        const userJson = await AsyncStorage.getItem('user');
        return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

// Auth state listener
export const onAuthStateChanged = (callback) => {
    return auth().onAuthStateChanged(callback);
};