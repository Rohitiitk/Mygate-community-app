// import { getMessaging, getToken, onMessage } from 'firebase/messaging';
// import { messaging } from '../config/firebase';
// import toast from 'react-hot-toast';
// import api from './api';

// /**
//  * Check if notifications are supported
//  */
// export const isNotificationSupported = () => {
//   return 'Notification' in window && 'serviceWorker' in navigator && messaging;
// };

// /**
//  * Request notification permission and get FCM token
//  */
// export const requestNotificationPermission = async () => {
//   if (!isNotificationSupported()) {
//     console.warn('Notifications not supported in this browser');
//     return null;
//   }

//   try {
//     // Check current permission
//     if (Notification.permission === 'denied') {
//       toast.error('Notifications are blocked. Please enable them in browser settings.');
//       return null;
//     }

//     // Request permission
//     const permission = await Notification.requestPermission();
    
//     if (permission !== 'granted') {
//       console.log('Notification permission not granted');
//       return null;
//     }

//     // Register service worker
//     const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
//     console.log('Service Worker registered:', registration);

//     // Get FCM token
//     const token = await getToken(messaging, {
//       vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
//       serviceWorkerRegistration: registration
//     });

//     if (token) {
//       console.log('FCM Token obtained:', token);
      
//       // Save token to backend for this user
//       await saveTokenToBackend(token);
      
//       toast.success('Notifications enabled!');
//       return token;
//     } else {
//       console.log('No registration token available');
//       return null;
//     }
//   } catch (error) {
//     console.error('Error getting notification permission:', error);
//     toast.error('Failed to enable notifications');
//     return null;
//   }
// };

// /**
//  * Save FCM token to backend
//  */
// async function saveTokenToBackend(token) {
//   try {
//     await api.post('/api/notifications/token', { token });
//     console.log('Token saved to backend');
//   } catch (error) {
//     console.error('Failed to save token:', error);
//   }
// }

// /**
//  * Subscribe to a topic
//  */
// export const subscribeToTopic = async (topic) => {
//   try {
//     const token = await getToken(messaging, {
//       vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
//     });

//     if (!token) {
//       console.error('No FCM token available');
//       return false;
//     }

//     await api.post('/api/notifications/subscribe', { token, topic });
//     console.log(`Subscribed to topic: ${topic}`);
//     return true;
//   } catch (error) {
//     console.error('Failed to subscribe to topic:', error);
//     return false;
//   }
// };

// /**
//  * Setup foreground message listener
//  */
// export const setupForegroundMessageListener = () => {
//   if (!messaging) {
//     console.warn('Messaging not available');
//     return () => {};
//   }

//   return onMessage(messaging, (payload) => {
//     console.log('📬 Foreground message received:', payload);
    
//     const { notification, data } = payload;
    
//     // Show custom toast notification
//     if (notification) {
//       const notificationType = data?.type || 'info';
//       const icon = getNotificationIcon(notificationType);
      
//       toast.custom(
//         (t) => (
//           <div
//             className={`${
//               t.visible ? 'animate-enter' : 'animate-leave'
//             } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
//           >
//             <div className="flex-1 w-0 p-4">
//               <div className="flex items-start">
//                 <div className="flex-shrink-0 pt-0.5">
//                   <span className="text-2xl">{icon}</span>
//                 </div>
//                 <div className="ml-3 flex-1">
//                   <p className="text-sm font-medium text-gray-900">
//                     {notification.title}
//                   </p>
//                   <p className="mt-1 text-sm text-gray-500">
//                     {notification.body}
//                   </p>
//                   {data?.visitorName && (
//                     <p className="mt-1 text-xs text-gray-400">
//                       Visitor: {data.visitorName}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             </div>
//             <div className="flex border-l border-gray-200">
//               <button
//                 onClick={() => toast.dismiss(t.id)}
//                 className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         ),
//         {
//           duration: 5000,
//           position: 'top-right'
//         }
//       );

//       // Play notification sound (optional)
//       playNotificationSound();
//     }

//     // Handle data-only messages
//     if (data) {
//       handleNotificationData(data);
//     }
//   });
// };

// /**
//  * Get notification icon based on type
//  */
// function getNotificationIcon(type) {
//   const icons = {
//     visitor_created: '🚶',
//     visitor_approved: '✅',
//     visitor_denied: '❌',
//     visitor_checked_in: '🚪',
//     visitor_checked_out: '👋',
//     alert: '⚠️',
//     info: '🔔',
//     success: '✨'
//   };
//   return icons[type] || '🔔';
// }

// /**
//  * Handle notification data (trigger actions)
//  */
// function handleNotificationData(data) {
//   console.log('Notification data:', data);
  
//   // Trigger custom events based on notification type
//   switch (data.type) {
//     case 'visitor_approved':
//     case 'visitor_checked_in':
//     case 'visitor_checked_out':
//       // Dispatch event to refresh visitor list
//       window.dispatchEvent(new CustomEvent('refresh-visitors'));
//       break;
    
//     case 'visitor_created':
//       // Could show a badge on visitors tab
//       window.dispatchEvent(new CustomEvent('new-visitor'));
//       break;
    
//     default:
//       console.log('Unknown notification type:', data.type);
//   }
// }

// /**
//  * Play notification sound
//  */
// function playNotificationSound() {
//   try {
//     const audio = new Audio('/notification.mp3');
//     audio.volume = 0.5;
//     audio.play().catch(e => console.log('Audio play failed:', e));
//   } catch (error) {
//     console.log('Failed to play notification sound:', error);
//   }
// }

// /**
//  * Get current notification permission status
//  */
// export const getNotificationPermission = () => {
//   if (!isNotificationSupported()) {
//     return 'unsupported';
//   }
//   return Notification.permission;
// };

// /**
//  * Show test notification
//  */
// export const showTestNotification = () => {
//   if (Notification.permission === 'granted') {
//     new Notification('MyGate Test', {
//       body: 'Notifications are working! 🎉',
//       icon: '/logo.png',
//       badge: '/badge.png'
//     });
//   } else {
//     toast.error('Please enable notifications first');
//   }
// };

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../config/firebase';
import toast from 'react-hot-toast';
import api from './api';

/**
 * Check if notifications are supported
 */
export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator && messaging;
};

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported in this browser');
    toast.error('Notifications not supported in this browser');
    return null;
  }

  try {
    // Check current permission
    if (Notification.permission === 'denied') {
      toast.error('Notifications are blocked. Please enable them in browser settings.');
      return null;
    }

    console.log('Requesting notification permission...');

    // Request permission first
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission not granted:', permission);
      toast.error('Notification permission denied');
      return null;
    }

    console.log('Permission granted, registering service worker...');

    // Register service worker
    let registration;
    try {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log('Service Worker registered:', registration);
      
      // Wait for service worker to be active
      if (registration.installing) {
        await new Promise((resolve) => {
          registration.installing.addEventListener('statechange', (e) => {
            if (e.target.state === 'activated') {
              resolve();
            }
          });
        });
      }
      
      await navigator.serviceWorker.ready;
      console.log('Service Worker is ready');
    } catch (swError) {
      console.error('Service Worker registration failed:', swError);
      toast.error('Failed to register service worker');
      return null;
    }

    // Small delay to ensure service worker is fully ready
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('Getting FCM token...');

    // Validate VAPID key
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey || vapidKey === 'undefined') {
      console.error('VAPID key is missing or invalid');
      toast.error('Push notification configuration error. Check VAPID key.');
      return null;
    }

    console.log('VAPID key found:', vapidKey.substring(0, 10) + '...');

    // Get FCM token with proper error handling
    let token;
    try {
      token = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });
    } catch (tokenError) {
      console.error('Error getting FCM token:', tokenError);
      
      // Specific error messages
      if (tokenError.code === 'messaging/permission-blocked') {
        toast.error('Notifications are blocked. Please enable them in browser settings.');
      } else if (tokenError.code === 'messaging/token-subscribe-failed') {
        toast.error('Failed to subscribe to push notifications. Please try again.');
      } else if (tokenError.message.includes('VAPID')) {
        toast.error('Invalid VAPID key configuration');
      } else {
        toast.error('Failed to enable notifications: ' + tokenError.message);
      }
      
      return null;
    }

    if (token) {
      console.log('FCM Token obtained:', token.substring(0, 20) + '...');
      
      // Save token to backend
      try {
        await saveTokenToBackend(token);
        toast.success('🔔 Notifications enabled!');
        return token;
      } catch (saveError) {
        console.error('Failed to save token to backend:', saveError);
        toast.error('Token obtained but failed to save');
        return token;
      }
    } else {
      console.log('No registration token available');
      toast.error('Failed to get notification token');
      return null;
    }
  } catch (error) {
    console.error('Error in requestNotificationPermission:', error);
    toast.error('Failed to enable notifications: ' + error.message);
    return null;
  }
};

/**
 * Save FCM token to backend
 */
async function saveTokenToBackend(token) {
  try {
    await api.post('/api/notifications/token', { token });
    console.log('Token saved to backend');
  } catch (error) {
    console.error('Failed to save token:', error);
    // Don't throw, notification can still work locally
  }
}

/**
 * Subscribe to a topic
 */
export const subscribeToTopic = async (topic) => {
  try {
    const token = localStorage.getItem('fcm_token');
    
    if (!token) {
      console.error('No FCM token available');
      return false;
    }

    await api.post('/api/notifications/subscribe', { token, topic });
    console.log(`Subscribed to topic: ${topic}`);
    return true;
  } catch (error) {
    console.error('Failed to subscribe to topic:', error);
    return false;
  }
};

/**
 * Setup foreground message listener
 */
export const setupForegroundMessageListener = () => {
  if (!messaging) {
    console.warn('Messaging not available');
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log('📬 Foreground message received:', payload);
    
    const { notification, data } = payload;
    
    // Show custom toast notification
    if (notification) {
      const notificationType = data?.type || 'info';
      const icon = getNotificationIcon(notificationType);
      
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <span className="text-2xl">{icon}</span>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {notification.body}
                  </p>
                  {data?.visitorName && (
                    <p className="mt-1 text-xs text-gray-400">
                      Visitor: {data.visitorName}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        ),
        {
          duration: 5000,
          position: 'top-right'
        }
      );

      // Play notification sound (optional)
      playNotificationSound();
    }

    // Handle data-only messages
    if (data) {
      handleNotificationData(data);
    }
  });
};

/**
 * Get notification icon based on type
 */
function getNotificationIcon(type) {
  const icons = {
    visitor_created: '🚶',
    visitor_approved: '✅',
    visitor_denied: '❌',
    visitor_checked_in: '🚪',
    visitor_checked_out: '👋',
    alert: '⚠️',
    info: '🔔',
    success: '✨'
  };
  return icons[type] || '🔔';
}

/**
 * Handle notification data (trigger actions)
 */
function handleNotificationData(data) {
  console.log('Notification data:', data);
  
  // Trigger custom events based on notification type
  switch (data.type) {
    case 'visitor_approved':
    case 'visitor_checked_in':
    case 'visitor_checked_out':
      // Dispatch event to refresh visitor list
      window.dispatchEvent(new CustomEvent('refresh-visitors'));
      break;
    
    case 'visitor_created':
      // Could show a badge on visitors tab
      window.dispatchEvent(new CustomEvent('new-visitor'));
      break;
    
    default:
      console.log('Unknown notification type:', data.type);
  }
}

/**
 * Play notification sound
 */
function playNotificationSound() {
  try {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio play failed:', e));
  } catch (error) {
    console.log('Failed to play notification sound:', error);
  }
}

/**
 * Get current notification permission status
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
};

/**
 * Show test notification
 */
export const showTestNotification = () => {
  if (Notification.permission === 'granted') {
    new Notification('MyGate Test', {
      body: 'Notifications are working! 🎉',
      icon: '/logo.png',
      badge: '/badge.png'
    });
    toast.success('Test notification sent!');
  } else {
    toast.error('Please enable notifications first');
  }
};