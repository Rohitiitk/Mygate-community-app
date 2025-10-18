import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);
router.use(requireRole('admin'));

/**
 * GET /api/analytics/dashboard
 * Get dashboard statistics
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    // Get counts
    const [usersSnap, householdsSnap, visitorsSnap, eventsSnap] = await Promise.all([
      global.db.collection('users').count().get(),
      global.db.collection('households').count().get(),
      global.db.collection('visitors').count().get(),
      global.db.collection('events').count().get()
    ]);

    // Get visitors by status
    const visitorStatuses = await global.db.collection('visitors').get();
    const statusCounts = {
      pending: 0,
      approved: 0,
      denied: 0,
      checked_in: 0,
      checked_out: 0
    };

    visitorStatuses.docs.forEach(doc => {
      const status = doc.data().status;
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      }
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentVisitors = await global.db.collection('visitors')
      .where('createdAt', '>=', sevenDaysAgo)
      .count()
      .get();

    // Calculate average approval time (SLA metric)
    const approvedVisitors = await global.db.collection('visitors')
      .where('status', '==', 'approved')
      .limit(50)
      .get();

    let totalApprovalTime = 0;
    let approvalCount = 0;

    approvedVisitors.docs.forEach(doc => {
      const data = doc.data();
      if (data.createdAt && data.approvedAt) {
        const created = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const approved = data.approvedAt.toDate ? data.approvedAt.toDate() : new Date(data.approvedAt);
        const diffMinutes = (approved - created) / (1000 * 60);
        totalApprovalTime += diffMinutes;
        approvalCount++;
      }
    });

    const avgApprovalTime = approvalCount > 0 ? (totalApprovalTime / approvalCount).toFixed(2) : 0;

    res.json({
      summary: {
        totalUsers: usersSnap.data().count,
        totalHouseholds: householdsSnap.data().count,
        totalVisitors: visitorsSnap.data().count,
        totalEvents: eventsSnap.data().count,
        recentVisitors: recentVisitors.data().count
      },
      visitorsByStatus: statusCounts,
      metrics: {
        avgApprovalTimeMinutes: parseFloat(avgApprovalTime),
        approvalSLA: avgApprovalTime < 30 ? 'Good' : avgApprovalTime < 60 ? 'Fair' : 'Needs Improvement'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/visitors-trend
 * Get visitor trends over time
 */
router.get('/visitors-trend', async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const visitorsSnap = await global.db.collection('visitors')
      .where('createdAt', '>=', startDate)
      .orderBy('createdAt', 'asc')
      .get();

    // Group by date
    const trend = {};
    visitorsSnap.docs.forEach(doc => {
      const data = doc.data();
      const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!trend[dateKey]) {
        trend[dateKey] = { date: dateKey, count: 0, approved: 0, denied: 0 };
      }
      
      trend[dateKey].count++;
      if (data.status === 'approved') trend[dateKey].approved++;
      if (data.status === 'denied') trend[dateKey].denied++;
    });

    const trendArray = Object.values(trend).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    res.json({ trend: trendArray });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/alerts
 * Get alerts for long wait times
 */
router.get('/alerts', async (req, res, next) => {
  try {
    const alerts = [];

    // Check for visitors waiting too long (> 30 minutes)
    const pendingVisitors = await global.db.collection('visitors')
      .where('status', '==', 'pending')
      .get();

    const now = new Date();
    pendingVisitors.docs.forEach(doc => {
      const data = doc.data();
      const created = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      const waitTimeMinutes = (now - created) / (1000 * 60);

      if (waitTimeMinutes > 30) {
        alerts.push({
          type: 'long_wait',
          severity: waitTimeMinutes > 60 ? 'high' : 'medium',
          message: `Visitor ${data.name} waiting for ${Math.floor(waitTimeMinutes)} minutes`,
          visitorId: doc.id,
          waitTime: Math.floor(waitTimeMinutes)
        });
      }
    });

    res.json({ alerts });
  } catch (error) {
    next(error);
  }
});

export default router;