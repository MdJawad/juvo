import { NextRequest, NextResponse } from 'next/server';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import openai from '@/lib/openai';
import { AI_SYSTEM_PROMPT } from '@/lib/constants';
import { Message } from '@/lib/types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await req.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      stream: true,
      messages: [
        {
          role: 'system',
          content: AI_SYSTEM_PROMPT,
        },
        ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
      ],
    });

    const stream = OpenAIStream(response);

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('[CHAT_API_ERROR]', error);

    if (error instanceof Error && error.name === 'TimeoutError') {
      return new NextResponse('The request timed out. Please try again.', { status: 408 });
    }

    return new NextResponse('An internal error occurred. Please try again.', { status: 500 });
  }
} 