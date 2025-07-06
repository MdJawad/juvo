import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RESUME_PARSER_PROMPT } from '@/lib/constants';
import { ResumeData } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // --- Phase 3: Core Logic --- 

    // According to the Docling documentation, for file uploads we should use the /v1alpha/convert/file endpoint
    // which is specifically designed for multipart/form-data uploads
    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);

    // 1. Create a new FormData object for the file upload
    const doclingFormData = new FormData();
    
    // 2. Append the file to the FormData object with the field name 'files'
    // This is the field name expected by the Docling API for file uploads
    doclingFormData.append('files', file);
    
    // 3. Call the Docling service using the correct file upload endpoint
    const doclingResponse = await fetch('http://localhost:5001/v1alpha/convert/file', {
      method: 'POST',
      // No need to set Content-Type header as it will be automatically set with the boundary
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
    console.log('Docling response:', JSON.stringify(doclingResult, null, 2));

    // 3. Extract the text content from the Docling response.
    // According to the documentation, the response format is:
    // {
    //   "document": {
    //     "md_content": "",
    //     "json_content": {},
    //     "html_content": "",
    //     "text_content": "",
    //     "doctags_content": ""
    //   },
    //   "status": "<success|partial_success|skipped|failure>",
    //   "processing_time": 0.0,
    //   "timings": {},
    //   "errors": []
    // }
    
    // First check if the status is success
    if (doclingResult.status !== 'success' && doclingResult.status !== 'partial_success') {
      console.error('Docling processing failed:', doclingResult.errors);
      throw new Error(`Docling processing failed: ${doclingResult.errors?.join(', ') || 'Unknown error'}`);
    }

    // Try to extract text content from various formats, preferring text_content
    const extractedText = doclingResult.document?.text_content || 
                          doclingResult.document?.md_content || 
                          doclingResult.document?.html_content;

    if (!extractedText) {
      console.error('Could not extract text from Docling response:', JSON.stringify(doclingResult, null, 2));
      throw new Error('No text content found in the parsed document.');
    }

    // 4. Clean up the extracted text to remove artifacts like base64 image data.
    const cleanedText = extractedText
      // This regex removes markdown image tags like ![...](data:image/...)
      .replace(/!\[.*?\]\(data:image\/[a-zA-Z]+;base64,[\w+/=\s]+\)/g, '')
      // This removes any remaining standalone ![Image] tags
      .replace(/!\[Image\]/g, '');

    // 5. Use AI to structure the cleaned text into resume data
    console.log('Sending cleaned text to AI for structuring...');
    
    // Check if API key is available
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_API_KEY environment variable is not set');
      // Since the API key is missing, return the cleaned text without structured data
      return NextResponse.json({
        error: 'Google API key is not configured. Unable to structure resume data.',
        rawText: cleanedText.trim(),
      });
    }
    
    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the Gemini Pro model
    const model = genAI.getGenerativeModel({
      // model: 'gemini-pro',
      // model: 'gemini-2.5-pro'
      model: 'gemini-2.5-flash'
    });
    
    try {
      // Generate structured data from the cleaned text
      console.log('Sending request to Gemini API...');
      const result = await model.generateContent([
        RESUME_PARSER_PROMPT,
        `Here is the resume text to parse:\n\n${cleanedText.trim()}`,
      ]);
      
      const response = await result.response;
      const text = response.text();
      console.log('Received response from Gemini API');
      
      // Parse the AI's response as JSON
      try {
        // The AI might return markdown code blocks, so we need to extract just the JSON
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/) || 
                         text.match(/{[\s\S]+}/);  // Fallback to finding anything that looks like JSON
        
        if (!jsonMatch) {
          console.error('Could not identify JSON in the AI response');
          console.log('AI response content:', text.substring(0, 500) + '...');
          return NextResponse.json({
            error: 'Could not extract structured data from AI response',
            errorDetails: 'The AI response did not contain valid JSON',
            rawText: cleanedText.trim(),
            aiResponsePreview: text.substring(0, 200) + '...' // Include a preview of the AI response for debugging
          });
        }
        
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        console.log('Extracted JSON from AI response');
        
        try {
          const parsedData = JSON.parse(jsonStr) as Partial<ResumeData>;
          
          // Basic validation of the parsed data structure
          if (!parsedData || typeof parsedData !== 'object') {
            throw new Error('Parsed data is not a valid object');
          }
          
          // Return both the structured data and the raw text
          return NextResponse.json({
            structuredData: parsedData,
            rawText: cleanedText.trim(),
          });
        } catch (parseError) {
          console.error('JSON.parse error:', parseError);
          console.log('Attempted to parse this string as JSON:', jsonStr.substring(0, 500));
          
          return NextResponse.json({
            error: 'Invalid JSON structure in AI response',
            errorDetails: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
            rawText: cleanedText.trim(),
          });
        }
      } catch (jsonError) {
        console.error('Failed to extract or parse JSON from AI response:', jsonError);
        console.log('AI raw response:', text.substring(0, 300));
        
        // If parsing fails, return just the cleaned text
        return NextResponse.json({
          error: 'Failed to structure resume data',
          errorDetails: jsonError instanceof Error ? jsonError.message : 'Error extracting JSON from AI response',
          rawText: cleanedText.trim(),
        });
      }
    } catch (aiError) {
      console.error('AI processing error:', aiError);
      
      // Return detailed error information for debugging
      return NextResponse.json({
        error: 'AI processing failed',
        errorDetails: aiError instanceof Error ? aiError.message : 'Unknown AI processing error',
        rawText: cleanedText.trim(),
      });
    }

  } catch (error) {
    console.error('[PARSE_RESUME_API_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to process file: ${errorMessage}` }, { status: 500 });
  }
}
