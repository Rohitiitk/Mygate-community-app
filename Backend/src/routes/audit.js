import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * GET /api/audit
 * Get audit events (Admin and Guard can see all, Residents see their household's events)
 */
router.get('/', async (req, res, next) => {
  try {
    const { roles, uid, householdId } = req.user;
    const { type, subjectId, limit = 100 } = req.query;

    let query = global.db.collection('events')
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit));

    // Residents can only see events related to their actions or household visitors
    if (roles.includes('resident') && !roles.includes('admin') && !roles.includes('guard')) {
      // Get visitor IDs for this household
      const visitorsSnapshot = await global.db.collection('visitors')
        .where('hostHouseholdId', '==', householdId)
        .select()
        .get();
      
      const visitorIds = visitorsSnapshot.docs.map(doc => doc.id);

      // Filter events: either actor is the user OR subject is a household visitor
      query = query.where('actorUserId', '==', uid);
      // Note: Firestore doesn't support OR queries easily, so we'll filter in memory
    }

    if (type) {
      query = query.where('type', '==', type);
    }

    if (subjectId) {
      query = query.where('subjectId', '==', subjectId);
    }

    const snapshot = await query.get();
    let events = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate().toISOString() || data.createdAt
      };
    });

    // Additional filtering for residents (client-side)
    if (roles.includes('resident') && !roles.includes('admin') && !roles.includes('guard')) {
      const visitorsSnapshot = await global.db.collection('visitors')
        .where('hostHouseholdId', '==', householdId)
        .select()
        .get();
      
      const visitorIds = new Set(visitorsSnapshot.docs.map(doc => doc.id));

      events = events.filter(event => 
        event.actorUserId === uid || visitorIds.has(event.subjectId)
      );
    }

    res.json({ events });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit/stats
 * Get audit statistics (Admin only)
 */
router.get('/stats', requireRole('admin'), async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let query = global.db.collection('events');

    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate));
    }

    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate));
    }

    const snapshot = await query.get();
    const events = snapshot.docs.map(doc => doc.data());

    // Calculate statistics
    const stats = {
      total: events.length,
      byType: {},
      byActor: {},
      recentActivity: []
    };

    events.forEach(event => {
      // Count by type
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
      
      // Count by actor
      stats.byActor[event.actorUserId] = (stats.byActor[event.actorUserId] || 0) + 1;
    });

    // Get recent activity (last 10 events)
    stats.recentActivity = snapshot.docs
      .slice(0, 10)
      .map(doc => ({
        id: doc.id,
        type: doc.data().type,
        actorUserId: doc.data().actorUserId,
        timestamp: doc.data().timestamp?.toDate().toISOString() || doc.data().createdAt
      }));

    res.json({ stats });
  } catch (error) {
    next(error);
  }
});

export default router;