import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { sendNotification } from '../services/fcm.js';
import { createAuditEvent } from '../utils/audit.js';

const router = express.Router();

router.use(verifyToken);

/**
 * POST /api/broadcast
 * Send broadcast message to all residents (Admin only)
 */
router.post('/',
  requireRole('admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('category').optional().isIn(['maintenance', 'event', 'emergency', 'general'])
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, message, priority = 'medium', category = 'general' } = req.body;
      const { uid } = req.user;

      // Save broadcast to database
      const broadcast = {
        title,
        message,
        priority,
        category,
        createdBy: uid,
        createdAt: global.admin.firestore.FieldValue.serverTimestamp(),
        sentAt: new Date().toISOString()
      };

      const broadcastRef = await global.db.collection('broadcasts').add(broadcast);

      // Send FCM notification to all users
      await sendNotification({
        topic: 'all_users',
        title: `🔔 ${title}`,
        body: message,
        data: {
          type: 'broadcast',
          broadcastId: broadcastRef.id,
          priority,
          category
        }
      });

      // Create audit event
      await createAuditEvent({
        type: 'broadcast_sent',
        actorUserId: uid,
        subjectId: broadcastRef.id,
        payload: { title, priority, category }
      });

      res.status(201).json({
        success: true,
        message: 'Broadcast sent successfully',
        broadcastId: broadcastRef.id
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/broadcast
 * Get all broadcasts
 */
router.get('/', async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const snapshot = await global.db.collection('broadcasts')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .get();

    const broadcasts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
    }));

    res.json({ broadcasts });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/broadcast/emergency
 * Send emergency alert (Admin only)
 */
router.post('/emergency',
  requireRole('admin'),
  [
    body('message').trim().notEmpty().withMessage('Emergency message is required')
  ],
  async (req, res, next) => {
    try {
      const { message } = req.body;
      const { uid } = req.user;

      // Save to database
      const emergency = {
        title: '🚨 EMERGENCY ALERT',
        message,
        priority: 'critical',
        category: 'emergency',
        createdBy: uid,
        createdAt: global.admin.firestore.FieldValue.serverTimestamp()
      };

      const emergencyRef = await global.db.collection('broadcasts').add(emergency);

      // Send urgent notification
      await sendNotification({
        topic: 'all_users',
        title: '🚨 EMERGENCY ALERT',
        body: message,
        data: {
          type: 'emergency',
          broadcastId: emergencyRef.id,
          priority: 'critical'
        }
      });

      // Log
      await createAuditEvent({
        type: 'emergency_broadcast',
        actorUserId: uid,
        subjectId: emergencyRef.id,
        payload: { message }
      });

      res.status(201).json({
        success: true,
        message: 'Emergency alert sent',
        broadcastId: emergencyRef.id
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;