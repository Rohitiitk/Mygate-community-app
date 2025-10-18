import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { subscribeToTopic, unsubscribeFromTopic } from '../services/fcm.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * POST /api/notifications/token
 * Save user's FCM token and subscribe to relevant topics
 */
router.post('/token', async (req, res, next) => {
  try {
    const { token } = req.body;
    const { uid, roles, householdId } = req.user;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Save token to user document
    await global.db.collection('users').doc(uid).update({
      fcmTokens: global.admin.firestore.FieldValue.arrayUnion(token),
      lastTokenUpdate: global.admin.firestore.FieldValue.serverTimestamp()
    });

    // Subscribe to role-based topics
    const subscriptions = [];

    if (roles.includes('guard')) {
      subscriptions.push(subscribeToTopic([token], 'guards'));
    }

    if (roles.includes('admin')) {
      subscriptions.push(subscribeToTopic([token], 'admins'));
    }

    if (roles.includes('resident') && householdId) {
      subscriptions.push(subscribeToTopic([token], `household_${householdId}`));
    }

    // Subscribe to all users topic
    subscriptions.push(subscribeToTopic([token], 'all_users'));

    await Promise.all(subscriptions);

    console.log(`✅ Token saved and subscribed for user ${uid}`);

    res.json({ 
      success: true,
      message: 'Token saved and subscribed to topics',
      topics: subscriptions.length
    });
  } catch (error) {
    console.error('Save token error:', error);
    next(error);
  }
});

/**
 * POST /api/notifications/subscribe
 * Subscribe to a specific topic
 */
router.post('/subscribe', async (req, res, next) => {
  try {
    const { token, topic } = req.body;
    const { roles, householdId } = req.user;

    if (!token || !topic) {
      return res.status(400).json({ error: 'Token and topic are required' });
    }

    // Validate topic access
    const allowedTopics = ['all_users'];

    if (roles.includes('guard')) {
      allowedTopics.push('guards');
    }

    if (roles.includes('admin')) {
      allowedTopics.push('admins');
    }

    if (roles.includes('resident') && householdId) {
      allowedTopics.push(`household_${householdId}`);
    }

    if (!allowedTopics.includes(topic)) {
      return res.status(403).json({ error: 'Not authorized to subscribe to this topic' });
    }

    await subscribeToTopic([token], topic);

    res.json({ 
      success: true,
      message: `Subscribed to ${topic}`,
      topic
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    next(error);
  }
});

/**
 * POST /api/notifications/unsubscribe
 * Unsubscribe from a topic
 */
router.post('/unsubscribe', async (req, res, next) => {
  try {
    const { token, topic } = req.body;

    if (!token || !topic) {
      return res.status(400).json({ error: 'Token and topic are required' });
    }

    await unsubscribeFromTopic([token], topic);

    res.json({ 
      success: true,
      message: `Unsubscribed from ${topic}`,
      topic
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    next(error);
  }
});

/**
 * DELETE /api/notifications/token
 * Remove user's FCM token (on logout)
 */
router.delete('/token', async (req, res, next) => {
  try {
    const { token } = req.body;
    const { uid } = req.user;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Remove token from user document
    await global.db.collection('users').doc(uid).update({
      fcmTokens: global.admin.firestore.FieldValue.arrayRemove(token)
    });

    console.log(`✅ Token removed for user ${uid}`);

    res.json({ 
      success: true,
      message: 'Token removed'
    });
  } catch (error) {
    console.error('Remove token error:', error);
    next(error);
  }
});

export default router;