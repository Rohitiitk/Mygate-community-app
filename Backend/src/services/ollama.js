import axios from 'axios';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

/**
 * AI Tools available to the copilot
 */
const tools = [
  {
    type: 'function',
    function: {
      name: 'approve_visitor',
      description: 'Approve a pending visitor for entry into the community',
      parameters: {
        type: 'object',
        properties: {
          visitorId: {
            type: 'string',
            description: 'The unique ID of the visitor to approve'
          },
          visitorName: {
            type: 'string',
            description: 'The name of the visitor (for context)'
          }
        },
        required: ['visitorId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'deny_visitor',
      description: 'Deny a pending visitor from entering the community',
      parameters: {
        type: 'object',
        properties: {
          visitorId: {
            type: 'string',
            description: 'The unique ID of the visitor to deny'
          },
          visitorName: {
            type: 'string',
            description: 'The name of the visitor (for context)'
          },
          reason: {
            type: 'string',
            description: 'The reason for denying the visitor'
          }
        },
        required: ['visitorId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'checkin_visitor',
      description: 'Check in an approved visitor at the gate (Guard only)',
      parameters: {
        type: 'object',
        properties: {
          visitorId: {
            type: 'string',
            description: 'The unique ID of the visitor to check in'
          },
          visitorName: {
            type: 'string',
            description: 'The name of the visitor (for context)'
          }
        },
        required: ['visitorId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'checkout_visitor',
      description: 'Check out a visitor who is currently inside the community (Guard only)',
      parameters: {
        type: 'object',
        properties: {
          visitorId: {
            type: 'string',
            description: 'The unique ID of the visitor to check out'
          },
          visitorName: {
            type: 'string',
            description: 'The name of the visitor (for context)'
          }
        },
        required: ['visitorId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_visitors',
      description: 'Get a list of visitors with optional status filter',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'approved', 'denied', 'checked_in', 'checked_out'],
            description: 'Filter visitors by status'
          }
        }
      }
    }
  }
];

/**
 * Get available tools for the AI
 */
export const getTools = () => tools;

/**
 * Parse tool calls from natural language using Ollama
 */
async function parseToolCall(userMessage, userContext) {
  const toolDescriptions = tools.map(t => 
    `- ${t.function.name}: ${t.function.description}`
  ).join('\n');

  const systemPrompt = `You are an AI assistant for a MyGate-style community management system.

Current user context:
- Role: ${userContext.roles?.join(', ') || 'unknown'}
- Household ID: ${userContext.householdId || 'none'}

Available functions:
${toolDescriptions}

When the user wants to perform an action, respond with a JSON object in this exact format:
{
  "tool_call": {
    "name": "function_name",
    "arguments": {
      "arg1": "value1"
    }
  }
}

If the user is just asking a question or chatting, respond normally without the JSON format.

Important rules:
- Only guards can check in/out visitors
- Residents can only approve/deny visitors for their household
- Always be helpful and professional

User message: ${userMessage}

Response:`;

  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: systemPrompt,
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.9
      }
    });

    const aiResponse = response.data.response.trim();
    
    // Try to extract JSON if present
    const jsonMatch = aiResponse.match(/\{[\s\S]*"tool_call"[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          content: null,
          toolCall: parsed.tool_call
        };
      } catch (e) {
        console.error('Failed to parse tool call JSON:', e);
        return {
          content: aiResponse,
          toolCall: null
        };
      }
    }

    return {
      content: aiResponse,
      toolCall: null
    };
  } catch (error) {
    console.error('Ollama API error:', error.message);
    throw new Error(`AI service error: ${error.message}`);
  }
}

/**
 * Generate follow-up response after tool execution
 */
async function generateFollowUp(originalMessage, toolResult, userContext) {
  const systemPrompt = `You are an AI assistant for a community management system.

User asked: "${originalMessage}"

Tool execution result: ${JSON.stringify(toolResult)}

Provide a brief, friendly response confirming what happened. Keep it under 2 sentences.

Response:`;

  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: systemPrompt,
      stream: false,
      options: {
        temperature: 0.7
      }
    });

    return response.data.response.trim();
  } catch (error) {
    console.error('Ollama follow-up error:', error);
    return toolResult.success ? 
      toolResult.message : 
      `Error: ${toolResult.error}`;
  }
}

/**
 * Main chat completion function
 */
export const getChatCompletion = async (messages, userContext = {}) => {
  // Get the last user message
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  
  if (!lastUserMessage) {
    throw new Error('No user message found');
  }

  // Parse for tool calls
  const result = await parseToolCall(lastUserMessage.content, userContext);

  return {
    content: result.content,
    toolCall: result.toolCall
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
          name: response.toolCall.name,
          arguments: JSON.stringify(response.toolCall.arguments || {})
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
export const generateToolFollowUp = generateFollowUp;