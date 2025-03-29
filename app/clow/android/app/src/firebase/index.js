import { firebase } from '@react-native-firebase/app';

const firebaseConfig = {
    // Your Firebase config will be automatically read from 
    // google-services.json and GoogleService-Info.plist
};

// Initialize Firebase if it hasn't been initialized yet
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export default firebase;