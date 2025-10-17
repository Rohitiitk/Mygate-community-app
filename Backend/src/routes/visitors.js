import express from 'express';
import { body, validationResult } from 'express-validator';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { createAuditEvent, AUDIT_EVENTS } from '../utils/audit.js';
import { sendNotification } from '../services/fcm.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * GET /api/visitors
 * Get visitors based on user role
 */
router.get('/', async (req, res, next) => {
  try {
    const { uid, roles, householdId } = req.user;
    const { status } = req.query;

    let query = global.db.collection('visitors');

    // Residents see only their household's visitors
    if (roles.includes('resident') && !roles.includes('admin')) {
      if (!householdId) {
        return res.status(400).json({ error: 'No household assigned' });
      }
      query = query.where('hostHouseholdId', '==', householdId);
    }

    // Filter by status if provided
    if (status) {
      query = query.where('status', '==', status);
    }

    // Order by created date
    query = query.orderBy('createdAt', 'desc').limit(100);

    const snapshot = await query.get();
    const visitors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ visitors });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/visitors
 * Create a new visitor (Residents only)
 */
router.post('/',
  requireRole('resident'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('purpose').trim().notEmpty().withMessage('Purpose is required'),
    body('scheduledTime').optional().isISO8601()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { uid, householdId } = req.user;
      
      if (!householdId) {
        return res.status(400).json({ error: 'No household assigned to user' });
      }

      const { name, phone, purpose, scheduledTime } = req.body;

      const visitor = {
        name,
        phone,
        purpose,
        scheduledTime: scheduledTime || null,
        hostHouseholdId: householdId,
        createdBy: uid,
        status: 'pending',
        approvedBy: null,
        approvedAt: null,
        checkedInAt: null,
        checkedOutAt: null,
        createdAt: global.admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await global.db.collection('visitors').add(visitor);

      // Create audit event
      await createAuditEvent({
        type: AUDIT_EVENTS.VISITOR_CREATED,
        actorUserId: uid,
        subjectId: docRef.id,
        payload: { name, phone, purpose }
      });

      // Notify guards about new pending visitor
      await sendNotification({
        topic: 'guards',
        title: 'New Visitor Pending',
        body: `${name} wants to visit. Waiting for approval.`,
        data: { 
          type: 'visitor_created',
          visitorId: docRef.id 
        }
      });

      res.status(201).json({ 
        id: docRef.id, 
        ...visitor,
        message: 'Visitor created successfully' 
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/visitors/:id/approve
 * Approve a visitor (Residents for their household, Admins for all)
 */
router.post('/:id/approve',
  requireRole('resident', 'admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { uid, roles, householdId } = req.user;

      const visitorRef = global.db.collection('visitors').doc(id);
      const visitorDoc = await visitorRef.get();

      if (!visitorDoc.exists) {
        return res.status(404).json({ error: 'Visitor not found' });
      }

      const visitor = visitorDoc.data();

      // Verify permission
      if (!roles.includes('admin') && visitor.hostHouseholdId !== householdId) {
        return res.status(403).json({ error: 'Cannot approve visitors for other households' });
      }

      // Check status
      if (visitor.status !== 'pending') {
        return res.status(400).json({ 
          error: `Visitor is already ${visitor.status}` 
        });
      }

      // Update visitor
      await visitorRef.update({
        status: 'approved',
        approvedBy: uid,
        approvedAt: global.admin.firestore.FieldValue.serverTimestamp()
      });

      // Create audit event
      await createAuditEvent({
        type: AUDIT_EVENTS.VISITOR_APPROVED,
        actorUserId: uid,
        subjectId: id,
        payload: { visitorName: visitor.name }
      });

      // Notify guards
      await sendNotification({
        topic: 'guards',
        title: 'Visitor Approved',
        body: `${visitor.name} has been approved for entry`,
        data: { 
          type: 'visitor_approved',
          visitorId: id 
        }
      });

      res.json({ 
        message: 'Visitor approved successfully',
        visitorId: id 
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/visitors/:id/deny
 * Deny a visitor
 */
router.post('/:id/deny',
  requireRole('resident', 'admin'),
  [body('reason').optional().trim()],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { uid, roles, householdId } = req.user;
      const { reason } = req.body;

      const visitorRef = global.db.collection('visitors').doc(id);
      const visitorDoc = await visitorRef.get();

      if (!visitorDoc.exists) {
        return res.status(404).json({ error: 'Visitor not found' });
      }

      const visitor = visitorDoc.data();

      if (!roles.includes('admin') && visitor.hostHouseholdId !== householdId) {
        return res.status(403).json({ error: 'Cannot deny visitors for other households' });
      }

      if (visitor.status !== 'pending') {
        return res.status(400).json({ 
          error: `Visitor is already ${visitor.status}` 
        });
      }

      await visitorRef.update({
        status: 'denied',
        deniedBy: uid,
        deniedAt: global.admin.firestore.FieldValue.serverTimestamp(),
        denialReason: reason || null
      });

      await createAuditEvent({
        type: AUDIT_EVENTS.VISITOR_DENIED,
        actorUserId: uid,
        subjectId: id,
        payload: { visitorName: visitor.name, reason }
      });

      await sendNotification({
        topic: 'guards',
        title: 'Visitor Denied',
        body: `${visitor.name} was denied entry`,
        data: { 
          type: 'visitor_denied',
          visitorId: id 
        }
      });

      res.json({ 
        message: 'Visitor denied',
        visitorId: id 
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/visitors/:id/checkin
 * Check in a visitor (Guards only)
 */
router.post('/:id/checkin',
  requireRole('guard', 'admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { uid } = req.user;

      const visitorRef = global.db.collection('visitors').doc(id);
      const visitorDoc = await visitorRef.get();

      if (!visitorDoc.exists) {
        return res.status(404).json({ error: 'Visitor not found' });
      }

      const visitor = visitorDoc.data();

      if (visitor.status !== 'approved') {
        return res.status(400).json({ 
          error: `Cannot check in visitor with status: ${visitor.status}. Must be approved first.` 
        });
      }

      await visitorRef.update({
        status: 'checked_in',
        checkedInBy: uid,
        checkedInAt: global.admin.firestore.FieldValue.serverTimestamp()
      });

      await createAuditEvent({
        type: AUDIT_EVENTS.VISITOR_CHECKED_IN,
        actorUserId: uid,
        subjectId: id,
        payload: { visitorName: visitor.name }
      });

      // Notify household
      await sendNotification({
        topic: `household_${visitor.hostHouseholdId}`,
        title: 'Visitor Checked In',
        body: `${visitor.name} has entered the premises`,
        data: { 
          type: 'visitor_checked_in',
          visitorId: id 
        }
      });

      res.json({ 
        message: 'Visitor checked in successfully',
        visitorId: id 
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/visitors/:id/checkout
 * Check out a visitor (Guards only)
 */
router.post('/:id/checkout',
  requireRole('guard', 'admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { uid } = req.user;

      const visitorRef = global.db.collection('visitors').doc(id);
      const visitorDoc = await visitorRef.get();

      if (!visitorDoc.exists) {
        return res.status(404).json({ error: 'Visitor not found' });
      }

      const visitor = visitorDoc.data();

      if (visitor.status !== 'checked_in') {
        return res.status(400).json({ 
          error: `Cannot check out visitor with status: ${visitor.status}` 
        });
      }

      await visitorRef.update({
        status: 'checked_out',
        checkedOutBy: uid,
        checkedOutAt: global.admin.firestore.FieldValue.serverTimestamp()
      });

      await createAuditEvent({
        type: AUDIT_EVENTS.VISITOR_CHECKED_OUT,
        actorUserId: uid,
        subjectId: id,
        payload: { visitorName: visitor.name }
      });

      await sendNotification({
        topic: `household_${visitor.hostHouseholdId}`,
        title: 'Visitor Checked Out',
        body: `${visitor.name} has left the premises`,
        data: { 
          type: 'visitor_checked_out',
          visitorId: id 
        }
      });

      res.json({ 
        message: 'Visitor checked out successfully',
        visitorId: id 
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;