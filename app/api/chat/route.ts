import { NextRequest, NextResponse } from 'next/server';
import { Message, InterviewStep } from '@/lib/types';
import { AI_SYSTEM_PROMPT } from '@/lib/constants';
import genAI, { defaultGenerationConfig, GEMINI_MODEL } from '@/lib/gemini';

export const runtime = 'edge';

// Helper function to convert roles
function convertRole(role: 'user' | 'assistant' | 'system'): 'user' | 'model' {
  if (role === 'assistant') return 'model';
  return 'user'; // both 'user' and 'system' messages are treated as user input
}

export async function POST(req: NextRequest) {
  try {
    const { messages, currentStep }: { messages: Message[]; currentStep?: InterviewStep } = await req.json();

    // Convert messages to Gemini format
    const formattedMessages = messages.map(msg => ({
      role: convertRole(msg.role),
      parts: [{ text: msg.content }]
    }));

    // Add system prompts
    const systemPrompts = [
      { role: 'user' as const, parts: [{ text: AI_SYSTEM_PROMPT }] },
    ];
    if (currentStep) {
      systemPrompts.push({
        role: 'user' as const,
        parts: [{ text: `CONTEXT: You are currently in the "${currentStep}" phase of the interview. Focus your questions on this topic.` }]
      });
    }

    // Combine system prompts with message history
    const historyWithPrompts = [
      ...systemPrompts,
      ...formattedMessages
    ];

    // Get the chat model with configurations
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: defaultGenerationConfig,
    });

    // Start the chat
    const chat = model.startChat({
      history: historyWithPrompts,
    });

    // Generate response (non-streaming)
    const result = await chat.sendMessage('');
    const response = await result.response;
    
    return NextResponse.json({
      content: response.text(),
      role: 'assistant'
    });

  } catch (error) {
    console.error('[CHAT_API_ERROR]', error);

    // Handle specific error types
    if (error instanceof Error) {
      // Handle timeout errors
      if (error.name === 'TimeoutError') {
        return new NextResponse('The request timed out. Please try again.', { 
          status: 408,
          statusText: 'Request Timeout'
        });
      }

      // Handle Gemini API errors
      if ('status' in error) {
        const status = (error as any).status;
        let message = error.message;

        // Map common Gemini error codes to user-friendly messages
        switch (status) {
          case 400:
            message = 'Invalid request format. Please try again.';
            break;
          case 429:
            message = 'Rate limit exceeded. Please try again later.';
            break;
          case 500:
            message = 'An error occurred with the AI service. Please try again later.';
            break;
          default:
            message = 'An unexpected error occurred. Please try again.';
        }

        return new NextResponse(message, { 
          status: status,
          statusText: message
        });
      }
    }

    // Handle all other errors
    return new NextResponse('An internal error occurred. Please try again.', { 
      status: 500,
      statusText: 'Internal Server Error'
    });
  }
} 