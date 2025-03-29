// File: src/firebase/GoogleSignIn.js

import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Initialize Google Sign-In
export const initializeGoogleSignIn = () => {
    GoogleSignin.configure({
        webClientId: '282552188535-jdcjtcg12ff042i8cq2ak4rhqc5jc91k.apps.googleusercontent.com', // Add your web client ID from Firebase
        offlineAccess: true,
    });
};

// Sign in with Google
export const signInWithGoogle = async () => {
    try {
        // Check if your device supports Google Play
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

        // Get the user ID token
        const res = await GoogleSignin.signIn();
        console.log(res);
        if (res.type == "success") {
            return res.data.user
        }
        return null;
        // Create a Google credential with the token
        const googleCredential = auth.GoogleAuthProvider.credential(res.idToken);
        return googleCredential;
        // Sign-in the user with the credential
        // return auth().signInWithCredential(googleCredential);
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
        return auth().signOut();
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
};

// Check if user is currently signed in
export const isSignedIn = async () => {
    return await GoogleSignin.isSignedIn();
};

// Get current user info
export const getCurrentUser = async () => {
    return await GoogleSignin.getCurrentUser();
};