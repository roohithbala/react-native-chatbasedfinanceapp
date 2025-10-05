const admin = require('firebase-admin');
const User = require('../models/User');

// Initialize Firebase Admin SDK (you'll need to add your service account key)
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (!firebaseInitialized && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });

      firebaseInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
    }
  }
};

// Send push notification
const sendNotification = async ({ userId, title, body, data = {} }) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.fcmToken) {
      console.log('User not found or no FCM token for user:', userId);
      return false;
    }

    if (!firebaseInitialized) {
      initializeFirebase();
    }

    if (!firebaseInitialized) {
      console.log('Firebase not initialized, storing notification for later');
      // Store notification in database for later sending
      await storeOfflineNotification(userId, { title, body, data });
      return false;
    }

    const message = {
      token: user.fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        userId: userId.toString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);

    // If token is invalid, remove it
    if (error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token') {
      await User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } });
    }

    return false;
  }
};

// Store notification for offline users
const storeOfflineNotification = async (userId, notification) => {
  try {
    // You might want to create a Notification model for this
    // For now, we'll just log it
    console.log('Storing offline notification for user:', userId, notification);
  } catch (error) {
    console.error('Error storing offline notification:', error);
  }
};

// Send notification to multiple users
const sendBulkNotifications = async (notifications) => {
  const results = [];

  for (const notification of notifications) {
    const result = await sendNotification(notification);
    results.push(result);
  }

  return results;
};

// Update user's FCM token
const updateUserFCMToken = async (userId, fcmToken) => {
  try {
    await User.findByIdAndUpdate(userId, { fcmToken });
    return true;
  } catch (error) {
    console.error('Error updating FCM token:', error);
    return false;
  }
};

module.exports = {
  sendNotification,
  sendBulkNotifications,
  updateUserFCMToken
};