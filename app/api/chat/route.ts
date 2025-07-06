import { NextRequest, NextResponse } from 'next/server';
import { Message, InterviewStep } from '@/lib/types';
import { AI_SYSTEM_PROMPT } from '@/lib/constants';
import { generateText } from '@/lib/ai-service';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, currentStep }: { messages: Message[]; currentStep?: InterviewStep } = await req.json();

    // Build a single prompt string from the message history and system prompts
    const systemPrompt = AI_SYSTEM_PROMPT;
    const contextPrompt = currentStep 
      ? `CONTEXT: You are currently in the "${currentStep}" phase of the interview. Focus your questions on this topic.`
      : '';

    const history = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');

    const fullPrompt = [
      systemPrompt,
      contextPrompt,
      '---',
      'MESSAGE HISTORY:',
      history,
      '---',
      'assistant:' // Prompt the assistant to respond
    ].filter(Boolean).join('\n\n');


    const stream = await generateText(fullPrompt);
    return stream;

  } catch (error) {
    console.error('[CHAT_API_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(`An internal error occurred: ${errorMessage}`, { 
      status: 500,
      statusText: 'Internal Server Error'
    });
  }
}