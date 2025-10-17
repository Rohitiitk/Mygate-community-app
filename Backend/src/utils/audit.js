/**
 * Create an audit event in the events collection
 * All events are append-only and immutable
 */
export const createAuditEvent = async (eventData) => {
  const {
    type,           // e.g., 'visitor_approved', 'visitor_checked_in', 'role_changed'
    actorUserId,    // Who performed the action
    subjectId,      // What was acted upon (e.g., visitorId)
    payload = {},   // Additional data
    metadata = {}   // Extra context
  } = eventData;

  const event = {
    type,
    actorUserId,
    subjectId,
    payload,
    metadata,
    timestamp: global.admin.firestore.FieldValue.serverTimestamp(),
    createdAt: new Date().toISOString() // Client-readable timestamp
  };

  try {
    const docRef = await global.db.collection('events').add(event);
    console.log(`📝 Audit event created: ${type} (${docRef.id})`);
    return { id: docRef.id, ...event };
  } catch (error) {
    console.error('Failed to create audit event:', error);
    // Don't throw - audit should not block main operations
    return null;
  }
};

/**
 * Common audit event types
 */
export const AUDIT_EVENTS = {
  // Visitor events
  VISITOR_CREATED: 'visitor_created',
  VISITOR_APPROVED: 'visitor_approved',
  VISITOR_DENIED: 'visitor_denied',
  VISITOR_CHECKED_IN: 'visitor_checked_in',
  VISITOR_CHECKED_OUT: 'visitor_checked_out',
  
  // Role events
  ROLE_ASSIGNED: 'role_assigned',
  ROLE_REMOVED: 'role_removed',
  
  // System events
  USER_CREATED: 'user_created',
  HOUSEHOLD_CREATED: 'household_created',
  
  // AI events
  AI_ACTION_EXECUTED: 'ai_action_executed',
  AI_ACTION_FAILED: 'ai_action_failed'
};

/**
 * Get audit events with filters
 */
export const getAuditEvents = async (filters = {}) => {
  const {
    actorUserId,
    subjectId,
    type,
    limit = 100,
    startAfter = null
  } = filters;

  let query = global.db.collection('events')
    .orderBy('timestamp', 'desc')
    .limit(limit);

  if (actorUserId) {
    query = query.where('actorUserId', '==', actorUserId);
  }

  if (subjectId) {
    query = query.where('subjectId', '==', subjectId);
  }

  if (type) {
    query = query.where('type', '==', type);
  }

  if (startAfter) {
    const startDoc = await global.db.collection('events').doc(startAfter).get();
    query = query.startAfter(startDoc);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};