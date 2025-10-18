// import axios from 'axios';

// const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
// const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

// /**
//  * AI Tools available to the copilot
//  */
// const tools = [
//   {
//     type: 'function',
//     function: {
//       name: 'approve_visitor',
//       description: 'Approve a pending visitor for entry into the community',
//       parameters: {
//         type: 'object',
//         properties: {
//           visitorId: {
//             type: 'string',
//             description: 'The unique ID of the visitor to approve'
//           },
//           visitorName: {
//             type: 'string',
//             description: 'The name of the visitor (for context)'
//           }
//         },
//         required: ['visitorId']
//       }
//     }
//   },
//   {
//     type: 'function',
//     function: {
//       name: 'deny_visitor',
//       description: 'Deny a pending visitor from entering the community',
//       parameters: {
//         type: 'object',
//         properties: {
//           visitorId: {
//             type: 'string',
//             description: 'The unique ID of the visitor to deny'
//           },
//           visitorName: {
//             type: 'string',
//             description: 'The name of the visitor (for context)'
//           },
//           reason: {
//             type: 'string',
//             description: 'The reason for denying the visitor'
//           }
//         },
//         required: ['visitorId']
//       }
//     }
//   },
//   {
//     type: 'function',
//     function: {
//       name: 'checkin_visitor',
//       description: 'Check in an approved visitor at the gate (Guard only)',
//       parameters: {
//         type: 'object',
//         properties: {
//           visitorId: {
//             type: 'string',
//             description: 'The unique ID of the visitor to check in'
//           },
//           visitorName: {
//             type: 'string',
//             description: 'The name of the visitor (for context)'
//           }
//         },
//         required: ['visitorId']
//       }
//     }
//   },
//   {
//     type: 'function',
//     function: {
//       name: 'checkout_visitor',
//       description: 'Check out a visitor who is currently inside the community (Guard only)',
//       parameters: {
//         type: 'object',
//         properties: {
//           visitorId: {
//             type: 'string',
//             description: 'The unique ID of the visitor to check out'
//           },
//           visitorName: {
//             type: 'string',
//             description: 'The name of the visitor (for context)'
//           }
//         },
//         required: ['visitorId']
//       }
//     }
//   },
//   {
//     type: 'function',
//     function: {
//       name: 'list_visitors',
//       description: 'Get a list of visitors with optional status filter',
//       parameters: {
//         type: 'object',
//         properties: {
//           status: {
//             type: 'string',
//             enum: ['pending', 'approved', 'denied', 'checked_in', 'checked_out'],
//             description: 'Filter visitors by status'
//           }
//         }
//       }
//     }
//   }
// ];

// /**
//  * Get available tools for the AI
//  */
// export const getTools = () => tools;

// /**
//  * Parse tool calls from natural language using Ollama
//  */
// async function parseToolCall(userMessage, userContext) {
//   const toolDescriptions = tools.map(t => 
//     `- ${t.function.name}: ${t.function.description}`
//   ).join('\n');

//   const systemPrompt = `You are an AI assistant for a MyGate-style community management system.

// Current user context:
// - Role: ${userContext.roles?.join(', ') || 'unknown'}
// - Household ID: ${userContext.householdId || 'none'}

// Available functions:
// ${toolDescriptions}

// When the user wants to perform an action, respond with a JSON object in this exact format:
// {
//   "tool_call": {
//     "name": "function_name",
//     "arguments": {
//       "arg1": "value1"
//     }
//   }
// }

// If the user is just asking a question or chatting, respond normally without the JSON format.

// Important rules:
// - Only guards can check in/out visitors
// - Residents can only approve/deny visitors for their household
// - Always be helpful and professional

// User message: ${userMessage}

// Response:`;

//   try {
//     const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
//       model: OLLAMA_MODEL,
//       prompt: systemPrompt,
//       stream: false,
//       options: {
//         temperature: 0.3,
//         top_p: 0.9
//       }
//     });

//     const aiResponse = response.data.response.trim();
    
//     // Try to extract JSON if present
//     const jsonMatch = aiResponse.match(/\{[\s\S]*"tool_call"[\s\S]*\}/);
    
//     if (jsonMatch) {
//       try {
//         const parsed = JSON.parse(jsonMatch[0]);
//         return {
//           content: null,
//           toolCall: parsed.tool_call
//         };
//       } catch (e) {
//         console.error('Failed to parse tool call JSON:', e);
//         return {
//           content: aiResponse,
//           toolCall: null
//         };
//       }
//     }

//     return {
//       content: aiResponse,
//       toolCall: null
//     };
//   } catch (error) {
//     console.error('Ollama API error:', error.message);
//     throw new Error(`AI service error: ${error.message}`);
//   }
// }

// /**
//  * Generate follow-up response after tool execution
//  */
// async function generateFollowUp(originalMessage, toolResult, userContext) {
//   const systemPrompt = `You are an AI assistant for a community management system.

// User asked: "${originalMessage}"

// Tool execution result: ${JSON.stringify(toolResult)}

// Provide a brief, friendly response confirming what happened. Keep it under 2 sentences.

// Response:`;

//   try {
//     const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
//       model: OLLAMA_MODEL,
//       prompt: systemPrompt,
//       stream: false,
//       options: {
//         temperature: 0.7
//       }
//     });

//     return response.data.response.trim();
//   } catch (error) {
//     console.error('Ollama follow-up error:', error);
//     return toolResult.success ? 
//       toolResult.message : 
//       `Error: ${toolResult.error}`;
//   }
// }

// /**
//  * Main chat completion function
//  */
// export const getChatCompletion = async (messages, userContext = {}) => {
//   // Get the last user message
//   const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  
//   if (!lastUserMessage) {
//     throw new Error('No user message found');
//   }

//   // Parse for tool calls
//   const result = await parseToolCall(lastUserMessage.content, userContext);

//   return {
//     content: result.content,
//     toolCall: result.toolCall
//   };
// };

// /**
//  * Parse tool calls from response
//  */
// export const parseToolCalls = (response) => {
//   if (response.toolCall) {
//     return {
//       content: response.content,
//       toolCalls: [{
//         id: `call_${Date.now()}`,
//         function: {
//           name: response.toolCall.name,
//           arguments: JSON.stringify(response.toolCall.arguments || {})
//         }
//       }],
//       finishReason: 'tool_calls'
//     };
//   }

//   return {
//     content: response.content,
//     toolCalls: [],
//     finishReason: 'stop'
//   };
// };

// /**
//  * Generate follow-up after tool execution
//  */
// export const generateToolFollowUp = generateFollowUp;

import axios from 'axios';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

/**
 * Get available tools
 */
export const getTools = () => [];

/**
 * Simple pattern-based command parser (faster than AI)
 */
function parseCommand(message, userContext) {
  const msg = message.toLowerCase().trim();
  
  // List visitors patterns
  if (msg.includes('list') || msg.includes('show') || msg.includes('get')) {
    if (msg.includes('pending')) {
      return { command: 'list_visitors', args: { status: 'pending' } };
    }
    if (msg.includes('approved')) {
      return { command: 'list_visitors', args: { status: 'approved' } };
    }
    if (msg.includes('checked in') || msg.includes('checked-in')) {
      return { command: 'list_visitors', args: { status: 'checked_in' } };
    }
    return { command: 'list_visitors', args: {} };
  }
  
  // Approve patterns
  if (msg.includes('approve')) {
    // Extract visitor name or ID
    const nameMatch = msg.match(/approve\s+([a-z]+(?:\s+[a-z]+)?)/i);
    if (nameMatch) {
      return { 
        command: 'approve_visitor', 
        args: { visitorName: nameMatch[1] }
      };
    }
  }
  
  // Deny patterns
  if (msg.includes('deny') || msg.includes('reject')) {
    const nameMatch = msg.match(/(?:deny|reject)\s+([a-z]+(?:\s+[a-z]+)?)/i);
    const reasonMatch = msg.match(/(?:because|reason|due to)\s+(.+)/i);
    if (nameMatch) {
      return { 
        command: 'deny_visitor', 
        args: { 
          visitorName: nameMatch[1],
          reason: reasonMatch ? reasonMatch[1] : undefined
        }
      };
    }
  }
  
  // Check in patterns
  if (msg.includes('check in') || msg.includes('checkin')) {
    const nameMatch = msg.match(/(?:check\s*in)\s+([a-z]+(?:\s+[a-z]+)?)/i);
    if (nameMatch) {
      return { 
        command: 'checkin_visitor', 
        args: { visitorName: nameMatch[1] }
      };
    }
  }
  
  // Check out patterns
  if (msg.includes('check out') || msg.includes('checkout')) {
    const nameMatch = msg.match(/(?:check\s*out)\s+([a-z]+(?:\s+[a-z]+)?)/i);
    if (nameMatch) {
      return { 
        command: 'checkout_visitor', 
        args: { visitorName: nameMatch[1] }
      };
    }
  }
  
  return null;
}

/**
 * Find visitor by name
 */
async function findVisitorByName(visitorName, userContext) {
  try {
    let query = global.db.collection('visitors');
    
    // Residents can only see their household's visitors
    if (userContext.roles.includes('resident') && !userContext.roles.includes('admin')) {
      if (!userContext.householdId) {
        return null;
      }
      query = query.where('hostHouseholdId', '==', userContext.householdId);
    }
    
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    // Case-insensitive search
    const searchName = visitorName.toLowerCase();
    const visitor = snapshot.docs.find(doc => 
      doc.data().name.toLowerCase().includes(searchName) ||
      searchName.includes(doc.data().name.toLowerCase())
    );
    
    if (visitor) {
      return {
        id: visitor.id,
        ...visitor.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error finding visitor:', error);
    return null;
  }
}

/**
 * Generate natural language response using Ollama
 */
async function generateResponse(userMessage, context) {
  try {
    const prompt = `You are a helpful assistant for a community management system. 

User said: "${userMessage}"
Context: ${context}

Provide a brief, friendly response (1-2 sentences max). Be conversational and helpful.

Response:`;

    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 50  // Limit response length for speed
        }
      },
      { timeout: 5000 }  // 5 second timeout
    );

    return response.data.response.trim();
  } catch (error) {
    console.error('Ollama generation error:', error.message);
    return context; // Fallback to just the context
  }
}

/**
 * Main chat completion function
 */
export const getChatCompletion = async (messages, userContext = {}) => {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  
  if (!lastUserMessage) {
    throw new Error('No user message found');
  }

  const message = lastUserMessage.content;
  
  // Try pattern-based parsing first (fast)
  const command = parseCommand(message, userContext);
  
  if (!command) {
    // No command detected, generate conversational response
    const response = await generateResponse(
      message,
      "I can help you manage visitors. Try: 'list pending visitors' or 'approve Ramesh'"
    );
    
    return {
      content: response,
      toolCall: null
    };
  }
  
  // If command requires a visitor name, find the visitor ID
  if (command.args.visitorName) {
    const visitor = await findVisitorByName(command.args.visitorName, userContext);
    
    if (!visitor) {
      const response = await generateResponse(
        message,
        `I couldn't find a visitor named "${command.args.visitorName}". Try listing visitors first.`
      );
      
      return {
        content: response,
        toolCall: null
      };
    }
    
    // Replace visitorName with visitorId
    command.args.visitorId = visitor.id;
    command.args.visitorName = visitor.name; // Keep name for context
  }
  
  return {
    content: null,
    toolCall: command
  };
};

/**
 * Parse tool calls from response
 */
export const parseToolCalls = (response) => {
  if (response.toolCall) {
    return {
      content: response.content,
      toolCalls: [{
        id: `call_${Date.now()}`,
        function: {
          name: response.toolCall.command,
          arguments: JSON.stringify(response.toolCall.args || {})
        }
      }],
      finishReason: 'tool_calls'
    };
  }

  return {
    content: response.content,
    toolCalls: [],
    finishReason: 'stop'
  };
};

/**
 * Generate follow-up after tool execution
 */
export const generateToolFollowUp = async (originalMessage, toolResult, userContext) => {
  if (toolResult.success) {
    return toolResult.message || 'Done!';
  } else {
    return toolResult.error || 'Something went wrong.';
  }
};