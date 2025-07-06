import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const aiProvider = process.env.AI_PROVIDER || 'google';

let googleGenAI: GoogleGenerativeAI | undefined;
if (aiProvider === 'google') {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY is not defined for the Google provider.');
  }
  googleGenAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
}

let openai: OpenAI | undefined;
if (aiProvider === 'openai') {
  if (!process.env.OPENAI_API_BASE_URL || !process.env.OPENAI_MODEL_NAME) {
    throw new Error('OPENAI_API_BASE_URL or OPENAI_MODEL_NAME is not defined for the OpenAI provider.');
  }
  openai = new OpenAI({
    baseURL: process.env.OPENAI_API_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY || 'ollama', // Default to placeholder for local models
  });
}

async function generateWithGoogle(prompt: string, modelName: string) {
  if (!googleGenAI) {
    throw new Error('Google AI client is not initialized.');
  }
  const model = googleGenAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function generateWithOpenAI(prompt: string) {
  if (!openai) {
    throw new Error('OpenAI client is not initialized.');
  }
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: process.env.OPENAI_MODEL_NAME!,
  });
  return chatCompletion.choices[0].message.content || '';
}

/**
 * Generates content using the configured AI provider.
 * @param prompt The prompt to send to the AI.
 * @param googleModelName The specific Google model to use if the provider is 'google'.
 * @returns The AI-generated text content.
 */
export async function generateText(prompt: string, googleModelName: string = 'gemini-1.5-flash'): Promise<string> {
  if (aiProvider === 'google') {
    return generateWithGoogle(prompt, googleModelName);
  } else if (aiProvider === 'openai') {
    return generateWithOpenAI(prompt);
  } else {
    throw new Error(`Unsupported AI provider: ${aiProvider}`);
  }
}
