import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('Missing Google API key. Please set it in your .env.local file.');
}

// Initialize the Gemini client with configuration
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!.trim());

// Default model to use
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Default generation config - optimized for flash model
export const defaultGenerationConfig = {
  temperature: 0.7,
  topK: 1,
  topP: 0.8,
  maxOutputTokens: 1024, // Reduced for faster responses
};

export default genAI; 