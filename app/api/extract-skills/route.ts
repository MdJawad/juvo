import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai-service';

// Using default Node.js runtime for better compatibility with AI services

export async function POST(req: NextRequest) {
  try {
    const { text }: { text: string } = await req.json();
    
    if (!text || text.trim().length === 0) {
      return new NextResponse('Text content is required', { 
        status: 400,
        statusText: 'Bad Request'
      });
    }

    // Log incoming payload for debugging
    console.log('[EXTRACT_SKILLS_API] text length:', text.length);
    console.log('[EXTRACT_SKILLS_API] snippet:', text.slice(0, 120));

    // Create a prompt that asks the LLM to extract technical skills
    const prompt = `
Extract all technical skills, programming languages, frameworks, tools, and technologies mentioned in the following text.
Be comprehensive and include both explicitly mentioned technologies and those that are implied by the context.

Text: """
${text}
"""

Categorize the skills into these groups:
1. Programming Languages
2. Frameworks & Libraries
3. Tools & Platforms
4. Databases
5. Other Technologies

Return the result as a JSON object with the following structure:
{
  "programmingLanguages": ["Language1", "Language2"],
  "frameworksAndLibraries": ["Framework1", "Library1"],
  "toolsAndPlatforms": ["Tool1", "Platform1"],
  "databases": ["Database1"],
  "otherTechnologies": ["Technology1"]
}

### Few-shot Examples (follow these formats exactly)

Example 1 – Front-end stack:
Text: """
I built a responsive web application using React, TypeScript and Tailwind CSS. It communicated with a Node.js/Express API and was deployed on AWS Amplify. For state management I used Redux Toolkit and integrated Jest for testing.
"""
Expected JSON:
{
  "programmingLanguages": ["TypeScript"],
  "frameworksAndLibraries": ["React", "Redux Toolkit", "Express", "Tailwind CSS"],
  "toolsAndPlatforms": ["AWS Amplify", "Jest"],
  "databases": [],
  "otherTechnologies": []
}

Example 2 – Data/ML pipeline:
Text: """
Developed an end-to-end ML pipeline in Python leveraging TensorFlow and Docker. The models were served via a FastAPI service running on Kubernetes and stored artefacts in PostgreSQL.
"""
Expected JSON:
{
  "programmingLanguages": ["Python"],
  "frameworksAndLibraries": ["TensorFlow", "FastAPI"],
  "toolsAndPlatforms": ["Docker", "Kubernetes"],
  "databases": ["PostgreSQL"],
  "otherTechnologies": []
}

Use the patterns shown above when answering the real request below.

Ensure proper capitalization of technology names (e.g., "JavaScript", not "javascript").
If a category has no skills, return an empty array for that category.
`;

    // Generate response using the AI service
    const aiResponse = await generateText(prompt);
    
    // Log raw response for debugging
    console.log('[EXTRACT_SKILLS_API] raw LLM response snippet:', aiResponse.slice(0, 300));

    // Parse the JSON response
    try {
      // Find JSON content in the response (in case the LLM adds explanatory text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonContent = jsonMatch ? jsonMatch[0] : aiResponse;
      
      const parsedSkills = JSON.parse(jsonContent);
      
      // Flatten all skills into a single array for backward compatibility
      const allSkills = [
        ...(parsedSkills.programmingLanguages || []),
        ...(parsedSkills.frameworksAndLibraries || []),
        ...(parsedSkills.toolsAndPlatforms || []),
        ...(parsedSkills.databases || []),
        ...(parsedSkills.otherTechnologies || [])
      ];
      
      return NextResponse.json({
        categories: parsedSkills,
        skills: allSkills
      });
    } catch (parseError) {
      console.error('[EXTRACT_SKILLS_PARSE_ERROR]', parseError);
      // If JSON parsing fails, return the raw AI response
      return NextResponse.json({
        error: 'Failed to parse AI response',
        rawResponse: aiResponse,
        skills: []
      }, { status: 207 }); // 207 Multi-Status to indicate partial success
    }
  } catch (error) {
    console.error('[EXTRACT_SKILLS_API_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(`An internal error occurred: ${errorMessage}`, { 
      status: 500,
      statusText: 'Internal Server Error'
    });
  }
}
