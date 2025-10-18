// // import express from 'express';
// // import { verifyToken } from '../middleware/auth.js';
// // import { getChatCompletion, parseToolCalls } from '../services/openai.js';
// // import { createAuditEvent, AUDIT_EVENTS } from '../utils/audit.js';

// // const router = express.Router();

// // // All routes require authentication
// // router.use(verifyToken);

// // /**
// //  * Execute a tool call from the AI
// //  */
// // async function executeTool(toolName, args, user) {
// //   const { uid, roles, householdId } = user;

// //   switch (toolName) {
// //     case 'approve_visitor': {
// //       const { visitorId } = args;
// //       const visitorRef = global.db.collection('visitors').doc(visitorId);
// //       const visitorDoc = await visitorRef.get();

// //       if (!visitorDoc.exists) {
// //         return { success: false, error: 'Visitor not found' };
// //       }

// //       const visitor = visitorDoc.data();

// //       // Check permissions
// //       if (!roles.includes('admin') && visitor.hostHouseholdId !== householdId) {
// //         return { success: false, error: 'Cannot approve visitors for other households' };
// //       }

// //       if (visitor.status !== 'pending') {
// //         return { success: false, error: `Visitor is already ${visitor.status}` };
// //       }

// //       await visitorRef.update({
// //         status: 'approved',
// //         approvedBy: uid,
// //         approvedAt: global.admin.firestore.FieldValue.serverTimestamp()
// //       });

// //       await createAuditEvent({
// //         type: AUDIT_EVENTS.VISITOR_APPROVED,
// //         actorUserId: uid,
// //         subjectId: visitorId,
// //         payload: { visitorName: visitor.name, source: 'ai_copilot' }
// //       });

// //       return { 
// //         success: true, 
// //         message: `Visitor ${visitor.name} approved successfully` 
// //       };
// //     }

// //     case 'deny_visitor': {
// //       const { visitorId, reason } = args;
// //       const visitorRef = global.db.collection('visitors').doc(visitorId);
// //       const visitorDoc = await visitorRef.get();

// //       if (!visitorDoc.exists) {
// //         return { success: false, error: 'Visitor not found' };
// //       }

// //       const visitor = visitorDoc.data();

// //       if (!roles.includes('admin') && visitor.hostHouseholdId !== householdId) {
// //         return { success: false, error: 'Cannot deny visitors for other households' };
// //       }

// //       if (visitor.status !== 'pending') {
// //         return { success: false, error: `Visitor is already ${visitor.status}` };
// //       }

// //       await visitorRef.update({
// //         status: 'denied',
// //         deniedBy: uid,
// //         deniedAt: global.admin.firestore.FieldValue.serverTimestamp(),
// //         denialReason: reason || 'Denied via AI Copilot'
// //       });

// //       await createAuditEvent({
// //         type: AUDIT_EVENTS.VISITOR_DENIED,
// //         actorUserId: uid,
// //         subjectId: visitorId,
// //         payload: { visitorName: visitor.name, reason, source: 'ai_copilot' }
// //       });

// //       return { 
// //         success: true, 
// //         message: `Visitor ${visitor.name} denied` 
// //       };
// //     }

// //     case 'checkin_visitor': {
// //       if (!roles.includes('guard') && !roles.includes('admin')) {
// //         return { success: false, error: 'Only guards can check in visitors' };
// //       }

// //       const { visitorId } = args;
// //       const visitorRef = global.db.collection('visitors').doc(visitorId);
// //       const visitorDoc = await visitorRef.get();

// //       if (!visitorDoc.exists) {
// //         return { success: false, error: 'Visitor not found' };
// //       }

// //       const visitor = visitorDoc.data();

// //       if (visitor.status !== 'approved') {
// //         return { 
// //           success: false, 
// //           error: `Cannot check in visitor with status: ${visitor.status}` 
// //         };
// //       }

// //       await visitorRef.update({
// //         status: 'checked_in',
// //         checkedInBy: uid,
// //         checkedInAt: global.admin.firestore.FieldValue.serverTimestamp()
// //       });

// //       await createAuditEvent({
// //         type: AUDIT_EVENTS.VISITOR_CHECKED_IN,
// //         actorUserId: uid,
// //         subjectId: visitorId,
// //         payload: { visitorName: visitor.name, source: 'ai_copilot' }
// //       });

// //       return { 
// //         success: true, 
// //         message: `Visitor ${visitor.name} checked in successfully` 
// //       };
// //     }

// //     case 'checkout_visitor': {
// //       if (!roles.includes('guard') && !roles.includes('admin')) {
// //         return { success: false, error: 'Only guards can check out visitors' };
// //       }

// //       const { visitorId } = args;
// //       const visitorRef = global.db.collection('visitors').doc(visitorId);
// //       const visitorDoc = await visitorRef.get();

// //       if (!visitorDoc.exists) {
// //         return { success: false, error: 'Visitor not found' };
// //       }

// //       const visitor = visitorDoc.data();

// //       if (visitor.status !== 'checked_in') {
// //         return { 
// //           success: false, 
// //           error: `Cannot check out visitor with status: ${visitor.status}` 
// //         };
// //       }

// //       await visitorRef.update({
// //         status: 'checked_out',
// //         checkedOutBy: uid,
// //         checkedOutAt: global.admin.firestore.FieldValue.serverTimestamp()
// //       });

// //       await createAuditEvent({
// //         type: AUDIT_EVENTS.VISITOR_CHECKED_OUT,
// //         actorUserId: uid,
// //         subjectId: visitorId,
// //         payload: { visitorName: visitor.name, source: 'ai_copilot' }
// //       });

// //       return { 
// //         success: true, 
// //         message: `Visitor ${visitor.name} checked out successfully` 
// //       };
// //     }

// //     case 'list_visitors': {
// //       const { status } = args;
// //       let query = global.db.collection('visitors');

// //       // Residents see only their household's visitors
// //       if (roles.includes('resident') && !roles.includes('admin')) {
// //         if (!householdId) {
// //           return { success: false, error: 'No household assigned' };
// //         }
// //         query = query.where('hostHouseholdId', '==', householdId);
// //       }

// //       if (status) {
// //         query = query.where('status', '==', status);
// //       }

// //       query = query.orderBy('createdAt', 'desc').limit(20);

// //       const snapshot = await query.get();
// //       const visitors = snapshot.docs.map(doc => ({
// //         id: doc.id,
// //         name: doc.data().name,
// //         phone: doc.data().phone,
// //         status: doc.data().status,
// //         purpose: doc.data().purpose
// //       }));

// //       return { 
// //         success: true, 
// //         visitors,
// //         message: `Found ${visitors.length} visitor(s)` 
// //       };
// //     }

// //     default:
// //       return { success: false, error: `Unknown tool: ${toolName}` };
// //   }
// // }

// // /**
// //  * POST /api/chat
// //  * Process chat message with AI copilot
// //  */
// // router.post('/', async (req, res, next) => {
// //   try {
// //     const { messages } = req.body;

// //     if (!messages || !Array.isArray(messages)) {
// //       return res.status(400).json({ error: 'Messages array required' });
// //     }

// //     const userContext = {
// //       uid: req.user.uid,
// //       roles: req.user.roles,
// //       householdId: req.user.householdId
// //     };

// //     // Get AI response
// //     const completion = await getChatCompletion(messages, userContext);
// //     const { content, toolCalls, finishReason } = parseToolCalls(completion);

// //     // If no tool calls, just return the message
// //     if (!toolCalls || toolCalls.length === 0) {
// //       return res.json({
// //         message: content,
// //         toolCalls: [],
// //         finishReason
// //       });
// //     }

// //     // Execute tool calls
// //     const toolResults = [];
// //     for (const toolCall of toolCalls) {
// //       const { id, function: func } = toolCall;
// //       const args = JSON.parse(func.arguments);

// //       try {
// //         const result = await executeTool(func.name, args, req.user);
// //         toolResults.push({
// //           toolCallId: id,
// //           toolName: func.name,
// //           args,
// //           result
// //         });

// //         // Log AI action in audit
// //         await createAuditEvent({
// //           type: result.success ? AUDIT_EVENTS.AI_ACTION_EXECUTED : AUDIT_EVENTS.AI_ACTION_FAILED,
// //           actorUserId: req.user.uid,
// //           subjectId: args.visitorId || 'N/A',
// //           payload: {
// //             toolName: func.name,
// //             args,
// //             result
// //           }
// //         });
// //       } catch (error) {
// //         toolResults.push({
// //           toolCallId: id,
// //           toolName: func.name,
// //           args,
// //           result: { success: false, error: error.message }
// //         });
// //       }
// //     }

// //     // Get follow-up response from AI with tool results
// //     const followUpMessages = [
// //       ...messages,
// //       {
// //         role: 'assistant',
// //         content: content,
// //         tool_calls: toolCalls
// //       },
// //       ...toolResults.map(tr => ({
// //         role: 'tool',
// //         tool_call_id: tr.toolCallId,
// //         content: JSON.stringify(tr.result)
// //       }))
// //     ];

// //     const followUpCompletion = await getChatCompletion(followUpMessages, userContext);
// //     const finalResponse = parseToolCalls(followUpCompletion);

// //     res.json({
// //       message: finalResponse.content,
// //       toolCalls: toolResults,
// //       finishReason: finalResponse.finishReason
// //     });
// //   } catch (error) {
// //     next(error);
// //   }
// // });

// // export default router;

// import express from 'express';
// import { verifyToken } from '../middleware/auth.js';
// import { getChatCompletion, parseToolCalls, generateToolFollowUp } from '../services/ollama.js';
// import { createAuditEvent, AUDIT_EVENTS } from '../utils/audit.js';

// const router = express.Router();

// // All routes require authentication
// router.use(verifyToken);

// /**
//  * Execute a tool call from the AI
//  */
// async function executeTool(toolName, args, user) {
//   const { uid, roles, householdId } = user;

//   switch (toolName) {
//     case 'approve_visitor': {
//       const { visitorId } = args;
//       const visitorRef = global.db.collection('visitors').doc(visitorId);
//       const visitorDoc = await visitorRef.get();

//       if (!visitorDoc.exists) {
//         return { success: false, error: 'Visitor not found' };
//       }

//       const visitor = visitorDoc.data();

//       if (!roles.includes('admin') && visitor.hostHouseholdId !== householdId) {
//         return { success: false, error: 'Cannot approve visitors for other households' };
//       }

//       if (visitor.status !== 'pending') {
//         return { success: false, error: `Visitor is already ${visitor.status}` };
//       }

//       await visitorRef.update({
//         status: 'approved',
//         approvedBy: uid,
//         approvedAt: global.admin.firestore.FieldValue.serverTimestamp()
//       });

//       await createAuditEvent({
//         type: AUDIT_EVENTS.VISITOR_APPROVED,
//         actorUserId: uid,
//         subjectId: visitorId,
//         payload: { visitorName: visitor.name, source: 'ai_copilot' }
//       });

//       return { 
//         success: true, 
//         message: `Visitor ${visitor.name} approved successfully` 
//       };
//     }

//     case 'deny_visitor': {
//       const { visitorId, reason } = args;
//       const visitorRef = global.db.collection('visitors').doc(visitorId);
//       const visitorDoc = await visitorRef.get();

//       if (!visitorDoc.exists) {
//         return { success: false, error: 'Visitor not found' };
//       }

//       const visitor = visitorDoc.data();

//       if (!roles.includes('admin') && visitor.hostHouseholdId !== householdId) {
//         return { success: false, error: 'Cannot deny visitors for other households' };
//       }

//       if (visitor.status !== 'pending') {
//         return { success: false, error: `Visitor is already ${visitor.status}` };
//       }

//       await visitorRef.update({
//         status: 'denied',
//         deniedBy: uid,
//         deniedAt: global.admin.firestore.FieldValue.serverTimestamp(),
//         denialReason: reason || 'Denied via AI Copilot'
//       });

//       await createAuditEvent({
//         type: AUDIT_EVENTS.VISITOR_DENIED,
//         actorUserId: uid,
//         subjectId: visitorId,
//         payload: { visitorName: visitor.name, reason, source: 'ai_copilot' }
//       });

//       return { 
//         success: true, 
//         message: `Visitor ${visitor.name} denied` 
//       };
//     }

//     case 'checkin_visitor': {
//       if (!roles.includes('guard') && !roles.includes('admin')) {
//         return { success: false, error: 'Only guards can check in visitors' };
//       }

//       const { visitorId } = args;
//       const visitorRef = global.db.collection('visitors').doc(visitorId);
//       const visitorDoc = await visitorRef.get();

//       if (!visitorDoc.exists) {
//         return { success: false, error: 'Visitor not found' };
//       }

//       const visitor = visitorDoc.data();

//       if (visitor.status !== 'approved') {
//         return { 
//           success: false, 
//           error: `Cannot check in visitor with status: ${visitor.status}` 
//         };
//       }

//       await visitorRef.update({
//         status: 'checked_in',
//         checkedInBy: uid,
//         checkedInAt: global.admin.firestore.FieldValue.serverTimestamp()
//       });

//       await createAuditEvent({
//         type: AUDIT_EVENTS.VISITOR_CHECKED_IN,
//         actorUserId: uid,
//         subjectId: visitorId,
//         payload: { visitorName: visitor.name, source: 'ai_copilot' }
//       });

//       return { 
//         success: true, 
//         message: `Visitor ${visitor.name} checked in successfully` 
//       };
//     }

//     case 'checkout_visitor': {
//       if (!roles.includes('guard') && !roles.includes('admin')) {
//         return { success: false, error: 'Only guards can check out visitors' };
//       }

//       const { visitorId } = args;
//       const visitorRef = global.db.collection('visitors').doc(visitorId);
//       const visitorDoc = await visitorRef.get();

//       if (!visitorDoc.exists) {
//         return { success: false, error: 'Visitor not found' };
//       }

//       const visitor = visitorDoc.data();

//       if (visitor.status !== 'checked_in') {
//         return { 
//           success: false, 
//           error: `Cannot check out visitor with status: ${visitor.status}` 
//         };
//       }

//       await visitorRef.update({
//         status: 'checked_out',
//         checkedOutBy: uid,
//         checkedOutAt: global.admin.firestore.FieldValue.serverTimestamp()
//       });

//       await createAuditEvent({
//         type: AUDIT_EVENTS.VISITOR_CHECKED_OUT,
//         actorUserId: uid,
//         subjectId: visitorId,
//         payload: { visitorName: visitor.name, source: 'ai_copilot' }
//       });

//       return { 
//         success: true, 
//         message: `Visitor ${visitor.name} checked out successfully` 
//       };
//     }

//     case 'list_visitors': {
//       const { status } = args;
//       let query = global.db.collection('visitors');

//       if (roles.includes('resident') && !roles.includes('admin')) {
//         if (!householdId) {
//           return { success: false, error: 'No household assigned' };
//         }
//         query = query.where('hostHouseholdId', '==', householdId);
//       }

//       if (status) {
//         query = query.where('status', '==', status);
//       }

//       query = query.orderBy('createdAt', 'desc').limit(20);

//       const snapshot = await query.get();
//       const visitors = snapshot.docs.map(doc => ({
//         id: doc.id,
//         name: doc.data().name,
//         phone: doc.data().phone,
//         status: doc.data().status,
//         purpose: doc.data().purpose
//       }));

//       return { 
//         success: true, 
//         visitors,
//         message: `Found ${visitors.length} visitor(s)` 
//       };
//     }

//     default:
//       return { success: false, error: `Unknown tool: ${toolName}` };
//   }
// }

// /**
//  * POST /api/chat
//  * Process chat message with AI copilot (Ollama)
//  */
// router.post('/', async (req, res, next) => {
//   try {
//     const { messages } = req.body;

//     if (!messages || !Array.isArray(messages)) {
//       return res.status(400).json({ error: 'Messages array required' });
//     }

//     const userContext = {
//       uid: req.user.uid,
//       roles: req.user.roles,
//       householdId: req.user.householdId
//     };

//     // Get AI response
//     const completion = await getChatCompletion(messages, userContext);
//     const { content, toolCalls, finishReason } = parseToolCalls(completion);

//     // If no tool calls, just return the message
//     if (!toolCalls || toolCalls.length === 0) {
//       return res.json({
//         message: content,
//         toolCalls: [],
//         finishReason: finishReason || 'stop'
//       });
//     }

//     // Execute tool calls
//     const toolResults = [];
//     for (const toolCall of toolCalls) {
//       const { id, function: func } = toolCall;
//       const args = JSON.parse(func.arguments);

//       try {
//         const result = await executeTool(func.name, args, req.user);
//         toolResults.push({
//           toolCallId: id,
//           toolName: func.name,
//           args,
//           result
//         });

//         await createAuditEvent({
//           type: result.success ? AUDIT_EVENTS.AI_ACTION_EXECUTED : AUDIT_EVENTS.AI_ACTION_FAILED,
//           actorUserId: req.user.uid,
//           subjectId: args.visitorId || 'N/A',
//           payload: {
//             toolName: func.name,
//             args,
//             result
//           }
//         });
//       } catch (error) {
//         toolResults.push({
//           toolCallId: id,
//           toolName: func.name,
//           args,
//           result: { success: false, error: error.message }
//         });
//       }
//     }

//     // Generate follow-up message
//     const lastUserMessage = messages.filter(m => m.role === 'user').pop();
//     const followUpMessage = await generateToolFollowUp(
//       lastUserMessage.content,
//       toolResults[0].result,
//       userContext
//     );

//     res.json({
//       message: followUpMessage,
//       toolCalls: toolResults,
//       finishReason: 'tool_calls'
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// export default router;

import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getChatCompletion, parseToolCalls, generateToolFollowUp } from '../services/ollama.js';
import { createAuditEvent, AUDIT_EVENTS } from '../utils/audit.js';

const router = express.Router();

router.use(verifyToken);

/**
 * Execute a tool call from the AI
 */
async function executeTool(toolName, args, user) {
  const { uid, roles, householdId } = user;

  switch (toolName) {
    case 'approve_visitor': {
      const { visitorId } = args;
      
      if (!visitorId) {
        return { success: false, error: 'Visitor ID is required' };
      }
      
      const visitorRef = global.db.collection('visitors').doc(visitorId);
      const visitorDoc = await visitorRef.get();

      if (!visitorDoc.exists) {
        return { success: false, error: 'Visitor not found' };
      }

      const visitor = visitorDoc.data();

      if (!roles.includes('admin') && visitor.hostHouseholdId !== householdId) {
        return { success: false, error: 'Cannot approve visitors for other households' };
      }

      if (visitor.status !== 'pending') {
        return { success: false, error: `Visitor is already ${visitor.status}` };
      }

      await visitorRef.update({
        status: 'approved',
        approvedBy: uid,
        approvedAt: global.admin.firestore.FieldValue.serverTimestamp()
      });

      await createAuditEvent({
        type: AUDIT_EVENTS.VISITOR_APPROVED,
        actorUserId: uid,
        subjectId: visitorId,
        payload: { visitorName: visitor.name, source: 'ai_copilot' }
      });

      return { 
        success: true, 
        message: `✅ ${visitor.name} has been approved for entry` 
      };
    }

    case 'deny_visitor': {
      const { visitorId, reason } = args;
      
      if (!visitorId) {
        return { success: false, error: 'Visitor ID is required' };
      }
      
      const visitorRef = global.db.collection('visitors').doc(visitorId);
      const visitorDoc = await visitorRef.get();

      if (!visitorDoc.exists) {
        return { success: false, error: 'Visitor not found' };
      }

      const visitor = visitorDoc.data();

      if (!roles.includes('admin') && visitor.hostHouseholdId !== householdId) {
        return { success: false, error: 'Cannot deny visitors for other households' };
      }

      if (visitor.status !== 'pending') {
        return { success: false, error: `Visitor is already ${visitor.status}` };
      }

      await visitorRef.update({
        status: 'denied',
        deniedBy: uid,
        deniedAt: global.admin.firestore.FieldValue.serverTimestamp(),
        denialReason: reason || 'Denied via AI Copilot'
      });

      await createAuditEvent({
        type: AUDIT_EVENTS.VISITOR_DENIED,
        actorUserId: uid,
        subjectId: visitorId,
        payload: { visitorName: visitor.name, reason, source: 'ai_copilot' }
      });

      return { 
        success: true, 
        message: `❌ ${visitor.name} has been denied` 
      };
    }

    case 'checkin_visitor': {
      if (!roles.includes('guard') && !roles.includes('admin')) {
        return { success: false, error: 'Only guards can check in visitors' };
      }

      const { visitorId } = args;
      
      if (!visitorId) {
        return { success: false, error: 'Visitor ID is required' };
      }
      
      const visitorRef = global.db.collection('visitors').doc(visitorId);
      const visitorDoc = await visitorRef.get();

      if (!visitorDoc.exists) {
        return { success: false, error: 'Visitor not found' };
      }

      const visitor = visitorDoc.data();

      if (visitor.status !== 'approved') {
        return { 
          success: false, 
          error: `Cannot check in visitor with status: ${visitor.status}. Must be approved first.` 
        };
      }

      await visitorRef.update({
        status: 'checked_in',
        checkedInBy: uid,
        checkedInAt: global.admin.firestore.FieldValue.serverTimestamp()
      });

      await createAuditEvent({
        type: AUDIT_EVENTS.VISITOR_CHECKED_IN,
        actorUserId: uid,
        subjectId: visitorId,
        payload: { visitorName: visitor.name, source: 'ai_copilot' }
      });

      return { 
        success: true, 
        message: `🚪 ${visitor.name} has been checked in` 
      };
    }

    case 'checkout_visitor': {
      if (!roles.includes('guard') && !roles.includes('admin')) {
        return { success: false, error: 'Only guards can check out visitors' };
      }

      const { visitorId } = args;
      
      if (!visitorId) {
        return { success: false, error: 'Visitor ID is required' };
      }
      
      const visitorRef = global.db.collection('visitors').doc(visitorId);
      const visitorDoc = await visitorRef.get();

      if (!visitorDoc.exists) {
        return { success: false, error: 'Visitor not found' };
      }

      const visitor = visitorDoc.data();

      if (visitor.status !== 'checked_in') {
        return { 
          success: false, 
          error: `Cannot check out visitor with status: ${visitor.status}` 
        };
      }

      await visitorRef.update({
        status: 'checked_out',
        checkedOutBy: uid,
        checkedOutAt: global.admin.firestore.FieldValue.serverTimestamp()
      });

      await createAuditEvent({
        type: AUDIT_EVENTS.VISITOR_CHECKED_OUT,
        actorUserId: uid,
        subjectId: visitorId,
        payload: { visitorName: visitor.name, source: 'ai_copilot' }
      });

      return { 
        success: true, 
        message: `👋 ${visitor.name} has been checked out` 
      };
    }

    case 'list_visitors': {
      const { status } = args;
      let query = global.db.collection('visitors');

      if (roles.includes('resident') && !roles.includes('admin')) {
        if (!householdId) {
          return { success: false, error: 'No household assigned' };
        }
        query = query.where('hostHouseholdId', '==', householdId);
      }

      if (status) {
        query = query.where('status', '==', status);
      }

      query = query.orderBy('createdAt', 'desc').limit(20);

      const snapshot = await query.get();
      const visitors = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        phone: doc.data().phone,
        status: doc.data().status,
        purpose: doc.data().purpose
      }));

      if (visitors.length === 0) {
        return { 
          success: true, 
          visitors: [],
          message: `No ${status || ''} visitors found` 
        };
      }

      const visitorList = visitors.map(v => 
        `• ${v.name} (${v.status}) - ${v.purpose}`
      ).join('\n');

      return { 
        success: true, 
        visitors,
        message: `Found ${visitors.length} visitor(s):\n${visitorList}` 
      };
    }

    default:
      return { success: false, error: `Unknown command: ${toolName}` };
  }
}

/**
 * POST /api/chat
 */
router.post('/', async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    const userContext = {
      uid: req.user.uid,
      roles: req.user.roles,
      householdId: req.user.householdId
    };

    // Get AI response
    const completion = await getChatCompletion(messages, userContext);
    const { content, toolCalls, finishReason } = parseToolCalls(completion);

    // If no tool calls, just return the message
    if (!toolCalls || toolCalls.length === 0) {
      return res.json({
        message: content,
        toolCalls: [],
        finishReason: finishReason || 'stop'
      });
    }

    // Execute tool calls
    const toolResults = [];
    for (const toolCall of toolCalls) {
      const { id, function: func } = toolCall;
      const args = JSON.parse(func.arguments);

      try {
        const result = await executeTool(func.name, args, req.user);
        toolResults.push({
          toolCallId: id,
          toolName: func.name,
          args,
          result
        });

        await createAuditEvent({
          type: result.success ? AUDIT_EVENTS.AI_ACTION_EXECUTED : AUDIT_EVENTS.AI_ACTION_FAILED,
          actorUserId: req.user.uid,
          subjectId: args.visitorId || 'N/A',
          payload: {
            toolName: func.name,
            args,
            result: { success: result.success, message: result.message || result.error }
          }
        });
      } catch (error) {
        console.error('Tool execution error:', error);
        toolResults.push({
          toolCallId: id,
          toolName: func.name,
          args,
          result: { success: false, error: error.message }
        });
      }
    }

    // Generate follow-up message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const followUpMessage = await generateToolFollowUp(
      lastUserMessage.content,
      toolResults[0].result,
      userContext
    );

    res.json({
      message: followUpMessage,
      toolCalls: toolResults,
      finishReason: 'tool_calls'
    });
  } catch (error) {
    console.error('Chat error:', error);
    next(error);
  }
});

export default router;