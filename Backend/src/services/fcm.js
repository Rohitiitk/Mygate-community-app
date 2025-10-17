/**
 * Firebase Cloud Messaging Service
 * Handles push notifications using FCM HTTP v1 API
 */

/**
 * Send notification to a topic
 * @param {Object} options - Notification options
 * @param {string} options.topic - FCM topic name (e.g., 'guards', 'household_123')
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {Object} options.data - Additional data payload
 */
export const sendNotification = async ({ topic, title, body, data = {} }) => {
  try {
    const message = {
      topic: topic,
      notification: {
        title,
        body
      },
      data: {
        ...data,
        timestamp: new Date().toISOString()
      },
      webpush: {
        notification: {
          title,
          body,
          icon: '/logo.png',
          badge: '/badge.png'
        }
      }
    };

    const response = await global.admin.messaging().send(message);
    console.log(`✉️  Notification sent to topic "${topic}":`, response);
    return response;
  } catch (error) {
    console.error(`Failed to send notification to topic "${topic}":`, error);
    // Don't throw - notifications should not block main operations
    return null;
  }
};

/**
 * Send notification to specific device token
 */
export const sendToDevice = async ({ token, title, body, data = {} }) => {
  try {
    const message = {
      token,
      notification: { title, body },
      data: {
        ...data,
        timestamp: new Date().toISOString()
      }
    };

    const response = await global.admin.messaging().send(message);
    console.log(`✉️  Notification sent to device:`, response);
    return response;
  } catch (error) {
    console.error('Failed to send notification to device:', error);
    return null;
  }
};

/**
 * Subscribe a device token to a topic
 */
export const subscribeToTopic = async (tokens, topic) => {
  try {
    const response = await global.admin.messaging().subscribeToTopic(tokens, topic);
    console.log(`📌 Subscribed ${tokens.length} device(s) to topic "${topic}"`);
    return response;
  } catch (error) {
    console.error(`Failed to subscribe to topic "${topic}":`, error);
    return null;
  }
};

/**
 * Unsubscribe a device token from a topic
 */
export const unsubscribeFromTopic = async (tokens, topic) => {
  try {
    const response = await global.admin.messaging().unsubscribeFromTopic(tokens, topic);
    console.log(`📌 Unsubscribed ${tokens.length} device(s) from topic "${topic}"`);
    return response;
  } catch (error) {
    console.error(`Failed to unsubscribe from topic "${topic}":`, error);
    return null;
  }
};