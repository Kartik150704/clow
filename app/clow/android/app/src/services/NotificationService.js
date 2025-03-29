import messaging from '@react-native-firebase/messaging';
import PushNotification, { Importance } from 'react-native-push-notification';
import { Platform } from 'react-native';

// Store for FCM token
let fcmToken = null;

// Initialize local notifications
const configurePushNotifications = () => {
    // Configure local notifications
    PushNotification.configure({
        // (required) Called when a remote or local notification is opened or received
        onNotification: function (notification) {
            console.log('LOCAL NOTIFICATION:', notification);

            // Process the notification

            // Required on iOS only
            if (Platform.OS === 'ios') {
                notification.finish(PushNotificationIOS.FetchResult.NoData);
            }
        },

        // IOS ONLY
        permissions: {
            alert: true,
            badge: true,
            sound: true,
        },

        // Should the initial notification be popped automatically
        popInitialNotification: true,

        /**
         * (optional) default: true
         * - Specified if permissions (ios) and token (android and ios) will requested or not,
         * - if not, you must call PushNotificationsHandler.requestPermissions() later
         */
        requestPermissions: Platform.OS === 'ios',
    });

    // Create channels for Android
    if (Platform.OS === 'android') {
        PushNotification.createChannel(
            {
                channelId: 'default_channel', // (required)
                channelName: 'Default channel', // (required)
                channelDescription: 'Default notifications channel', // (optional) default: undefined.
                playSound: true, // (optional) default: true
                soundName: 'default', // (optional) Sound to play when the notification is shown. Value of 'default' plays the default sound.
                importance: Importance.HIGH, // (optional) default: Importance.HIGH. Int value of the Android notification importance
                vibrate: true, // (optional) default: true. Creates the default vibration pattern if true.
            },
            (created) => console.log(`Default channel created: ${created}`)
        );

        PushNotification.createChannel(
            {
                channelId: 'progress_channel',
                channelName: 'Progress updates',
                channelDescription: 'Notifications with progress bars',
                playSound: false,
                soundName: 'default',
                importance: Importance.LOW,
                vibrate: false,
            },
            (created) => console.log(`Progress channel created: ${created}`)
        );
    }
};

// Request permission for iOS
const requestUserPermission = async () => {
    if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            console.log('Authorization status:', authStatus);
            return true;
        }
        console.log('User declined permissions');
        return false;
    }
    return true; // Android doesn't need this permission request
};

// Get the FCM token
const getFCMToken = async () => {
    if (!fcmToken) {
        fcmToken = await messaging().getToken();
    }
    return fcmToken;
};

// Register handlers for different notification states
const registerNotificationHandlers = () => {
    // When the application is running in foreground
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
        console.log('Foreground Message received:', remoteMessage);

        // For foreground messages, you can show a local notification
        if (remoteMessage.data) {
            const { title, body, notificationId, updateType, progress } = remoteMessage.data;

            // Check if this is an update to an existing notification
            if (updateType === 'progress' && notificationId) {
                showProgressNotification(
                    notificationId,
                    title || 'Progress Update',
                    body || 'Task in progress...',
                    parseInt(progress || '0', 10)
                );
            } else {
                // Regular notification
                PushNotification.localNotification({
                    channelId: 'default_channel',
                    id: notificationId || Math.floor(Math.random() * 1000000),
                    title: title || remoteMessage.notification?.title || 'New Message',
                    message: body || remoteMessage.notification?.body || 'You have a new notification',
                    userInfo: remoteMessage.data,
                    // Add any other properties you need
                });
            }
        }
    });

    // When the application is in background and user taps on the notification
    const unsubscribeBackground = messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('Notification opened app from background state:', remoteMessage);
        // Navigate to appropriate screen based on notification data
    });

    // Check if app was opened from a notification when app was closed
    messaging()
        .getInitialNotification()
        .then(remoteMessage => {
            if (remoteMessage) {
                console.log('Notification opened app from quit state:', remoteMessage);
                // Navigate to appropriate screen based on notification data
            }
        });

    // Listen for FCM token refresh
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
        console.log('FCM token refreshed:', token);
        fcmToken = token;
        // Send to your backend
    });

    // Return unsubscribe functions to clean up listeners
    return () => {
        unsubscribeForeground();
        unsubscribeBackground();
        unsubscribeTokenRefresh();
    };
};

// Show a progress notification that can be updated
const showProgressNotification = (id, title, message, progress) => {
    PushNotification.localNotification({
        id: id,
        channelId: 'progress_channel',
        title: title,
        message: `${message} (${progress}%)`,
        ongoing: progress < 100, // Notification can't be dismissed until complete
        progress: progress, // Android only
        autoCancel: progress === 100, // Auto dismiss when complete
    });
};

// Update an existing notification with new content
const updateNotification = (id, title, message, data = {}) => {
    PushNotification.localNotification({
        id: id,
        channelId: 'default_channel',
        title: title,
        message: message,
        userInfo: data,
    });
};

export default {
    initialize: async () => {
        configurePushNotifications();
        const hasPermission = await requestUserPermission();
        if (hasPermission) {
            const token = await getFCMToken();
            console.log('FCM Token:', token);
            // Send this token to your backend
            return token;
        }
        return null;
    },
    registerHandlers: registerNotificationHandlers,
    updateNotification: updateNotification,
    showProgressNotification: showProgressNotification,
    getToken: getFCMToken,
};