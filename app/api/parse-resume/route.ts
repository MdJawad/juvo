import { NextRequest, NextResponse } from 'next/server';
import { RESUME_PARSER_PROMPT } from '@/lib/constants';
import { generateText } from '@/lib/ai-service';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // 1. Create a new FormData object for the Docling file upload
    const doclingFormData = new FormData();
    doclingFormData.append('files', file);
    
    // 2. Call the Docling service
    const doclingResponse = await fetch('http://localhost:5001/v1alpha/convert/file', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
      },
      body: doclingFormData,
    });

    if (!doclingResponse.ok) {
      const errorBody = await doclingResponse.json().catch(() => doclingResponse.text());
      console.error('Docling service error:', errorBody);
      throw new Error(`Docling service failed with status ${doclingResponse.status}: ${JSON.stringify(errorBody)}`);
    }

    const doclingResult = await doclingResponse.json();

    // 3. Extract text content from the Docling response
    if (doclingResult.status !== 'success' && doclingResult.status !== 'partial_success') {
      console.error('Docling processing failed:', doclingResult.errors);
      throw new Error(`Docling processing failed: ${doclingResult.errors?.join(', ') || 'Unknown error'}`);
    }

    const extractedText = doclingResult.document?.text_content || 
                          doclingResult.document?.md_content || 
                          doclingResult.document?.html_content;

    if (!extractedText) {
      console.error('Could not extract text from Docling response:', JSON.stringify(doclingResult, null, 2));
      throw new Error('No text content found in the parsed document.');
    }

    // 4. Clean up the extracted text
    const cleanedText = extractedText
      // This regex removes markdown image tags like ![...](data:image/...)
      .replace(/!\[.*?\]\(data:image\/[a-zA-Z]+;base64,[\w+/=\s]+\)/g, '')
      // This removes any remaining standalone ![Image] tags
      .replace(/!\[Image\]/g, '');

    // 5. Use AI to structure the cleaned text
    try {
      const prompt = [
        RESUME_PARSER_PROMPT,
        `Here is the resume text to parse:\n\n${cleanedText.trim()}`,
      ].join('\n\n');

      const jsonString = await generateText(prompt, 'gemini-1.5-flash');
      
      const cleanedJsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
      const structuredData = JSON.parse(cleanedJsonString);

      return NextResponse.json({ structuredData });

    } catch (aiError) {
      console.error('Error parsing resume with AI:', aiError);
      return NextResponse.json(
        { error: 'AI parsing failed', errorDetails: (aiError as Error).message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[PARSE_RESUME_API_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to process file: ${errorMessage}` }, { status: 500 });
  }
}
