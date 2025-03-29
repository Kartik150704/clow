import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default class NotificationService {
    constructor() {
        this.createDefaultChannels();

        // Configure how notifications appear when the app is in foreground
        PushNotification.configure({
            // (optional) Called when Token is generated
            onRegister: async function (token) {
                console.log('TOKEN:', token);
                // Save token to AsyncStorage for sending to your server
                await AsyncStorage.setItem('pushToken', token.token);
            },

            // (required) Called when a remote notification is received
            onNotification: function (notification) {
                console.log('NOTIFICATION:', notification);

                // Process notification

                // Required on iOS (see https://github.com/react-native-push-notification/ios)
                notification.finish();
            },

            // Should the initial notification be popped automatically
            popInitialNotification: true,

            /**
             * iOS only
             * - (optional) default: all - Permissions to register.
             */
            permissions: {
                alert: true,
                badge: true,
                sound: true,
            },

            // Android only
            senderID: "YOUR_FIREBASE_SENDER_ID",
        });

        // Clear badge number at start
        PushNotification.getApplicationIconBadgeNumber(function (number) {
            if (number > 0) {
                PushNotification.setApplicationIconBadgeNumber(0);
            }
        });

        // Configure Firebase Messaging
        messaging().setBackgroundMessageHandler(async remoteMessage => {
            console.log('Message handled in the background!', remoteMessage);
            // You can process the message here if needed
        });
    }

    createDefaultChannels() {
        // Android requires notification channels
        PushNotification.createChannel(
            {
                channelId: "default-channel", // (required)
                channelName: "Default channel", // (required)
                channelDescription: "Default notifications channel", // (optional) default: undefined.
                soundName: "default", // (optional) default: 'default'
                importance: 4, // (optional) default: 4. Int value of the Android notification importance
                vibrate: true, // (optional) default: true.
            },
            (created) => console.log(`Channel created: ${created}`)
        );
    }

    // Register FCM token with your server
    async registerDeviceForPN() {
        try {
            // Check if permission is granted
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('Authorization status:', authStatus);

                // Get the FCM token
                const token = await messaging().getToken();
                console.log('FCM Token:', token);

                // Save to AsyncStorage
                await AsyncStorage.setItem('pushToken', token);

                // Here you would send this token to your Node.js server
                return token;
            } else {
                console.log('Permission declined');
                return null;
            }
        } catch (error) {
            console.error('Failed to get token:', error);
            return null;
        }
    }

    // Local notification function
    localNotification(title, message) {
        PushNotification.localNotification({
            title: title,
            message: message,
            playSound: true,
            soundName: 'default',
            channelId: 'default-channel',
        });
    }
}
