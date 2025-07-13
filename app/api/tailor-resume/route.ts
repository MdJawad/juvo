import { NextResponse } from 'next/server';
import { TAILORING_PROMPT } from '@/lib/constants';
import { generateText } from '@/lib/ai-service';
import { v4 as uuidv4 } from 'uuid';

// Define types for the gap analysis response
interface Gap {
  id: string;
  category: 'technical_skills' | 'soft_skills' | 'experience' | 'education' | 'achievements' | 'summary';
  priority: 1 | 2 | 3; // 1=high, 2=medium, 3=low
  title: string;
  description: string;
  jobRequirement: string;
  currentResumeState: string;
  suggestedQuestion: string;
}

interface GapAnalysisResponse {
  gaps: Gap[];
  summary: {
    totalGaps: number;
    priorityBreakdown: {
      high: number;
      medium: number;
      low: number;
    };
    categoryBreakdown: Record<string, number>;
    overallMatch: number;
  };
}

export async function POST(req: Request) {
  // Create a timeout promise that rejects after 85 seconds
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('AI processing timeout')), 85000); // 85 seconds
  });

  try {
    const body = await req.json();
    const { resumeData, jobDescription } = body;

    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing resume data or job description' },
        { status: 400 }
      );
    }

    // Validate job description length to prevent very long processing times
    if (jobDescription.length > 10000) {
      return NextResponse.json(
        { error: 'Job description is too long. Please limit to 10,000 characters.' },
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

    // Race between the AI generation and the timeout
    const jsonString = await Promise.race([
      generateText(prompt, 'gemini-1.5-pro-latest'),
      timeoutPromise
    ]) as string;
    
    // The AI is instructed to return a JSON string. We need to parse it.
    const cleanedJsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    let gapAnalysis: GapAnalysisResponse;
    
    try {
      gapAnalysis = JSON.parse(cleanedJsonString);
      
      // Validate the response structure
      if (!gapAnalysis.gaps || !Array.isArray(gapAnalysis.gaps)) {
        throw new Error('Invalid gap analysis format: missing gaps array');
      }
      
      // Ensure each gap has an ID (use the provided one or generate a new one)
      gapAnalysis.gaps = gapAnalysis.gaps.map(gap => ({
        ...gap,
        id: gap.id || uuidv4()
      }));
      
      // Sort gaps by priority
      gapAnalysis.gaps.sort((a, b) => a.priority - b.priority);
      
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('Raw AI response:', jsonString);
      
      // Fallback: If we can't parse the response as expected, try to extract suggestions
      // This maintains backward compatibility with the old format
      try {
        const fallbackData = JSON.parse(cleanedJsonString);
        if (fallbackData.suggestions && Array.isArray(fallbackData.suggestions)) {
          // Convert old format to new format
          const gaps = fallbackData.suggestions.map((suggestion: string, index: number) => ({
            id: uuidv4(),
            category: 'experience' as const,
            priority: 2 as const,
            title: `Suggestion ${index + 1}`,
            description: suggestion,
            jobRequirement: 'Not specified',
            currentResumeState: 'Not specified',
            suggestedQuestion: 'Would you like to address this suggestion?'
          }));
          
          gapAnalysis = {
            gaps,
            summary: {
              totalGaps: gaps.length,
              priorityBreakdown: {
                high: 0,
                medium: gaps.length,
                low: 0
              },
              categoryBreakdown: {
                experience: gaps.length
              },
              overallMatch: 50 // Default value
            }
          };
        } else {
          throw new Error('Could not parse AI response in any supported format');
        }
      } catch (fallbackError) {
        throw new Error('Failed to parse AI response: ' + (parseError instanceof Error ? parseError.message : String(parseError)));
      }
    }

    return NextResponse.json(gapAnalysis);

  } catch (error) {
    console.error('Error in tailor-resume endpoint:', error);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'An internal server error occurred';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message === 'AI processing timeout') {
        errorMessage = 'The AI processing took too long. Please try again with a shorter job description.';
        statusCode = 408; // Request Timeout
      } else if (error.message.includes('Failed to parse')) {
        errorMessage = 'Failed to process the AI response. Please try again.';
        statusCode = 500;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: statusCode }
    );
  }
}
