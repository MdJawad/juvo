import { NextResponse } from 'next/server';
import { TAILORING_PROMPT } from '@/lib/constants';
import { generateText } from '@/lib/ai-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { resumeData, jobDescription } = body;

    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing resume data or job description' },
        { status: 400 }
      );
    }

    const prompt = [
      TAILORING_PROMPT,
      'Resume Data:',
      JSON.stringify(resumeData, null, 2),
      'Job Description:',
      jobDescription,
    ].join('\n\n');

    const jsonString = await generateText(prompt, 'gemini-1.5-pro-latest');
    
    // The AI is instructed to return a JSON string. We need to parse it.
    const cleanedJsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    const suggestions = JSON.parse(cleanedJsonString);

    return NextResponse.json(suggestions);

  } catch (error) {
    console.error('Error in tailor-resume endpoint:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
