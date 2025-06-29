import { NextRequest, NextResponse } from 'next/server';

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
      const errorText = await doclingResponse.text();
      console.error('Docling service error:', errorText);
      throw new Error(`Docling service failed with status ${doclingResponse.status}`);
    }

    const doclingResult = await doclingResponse.json();

    // 3. Extract the text content from the Docling response.
    // The response is an array of processed sources. We take the first document from the first source.
    const extractedText = doclingResult?.[0]?.documents?.[0]?.content;

    if (typeof extractedText !== 'string') {
      console.error('Could not extract text from Docling response:', JSON.stringify(doclingResult, null, 2));
      throw new Error('Failed to extract text from the parsed document. The format might have changed.');
    }

    // 4. For now, return the raw extracted text to the frontend for verification.
    // The next step will be to send this text to an AI for structuring.
    return NextResponse.json({ rawText: extractedText });

  } catch (error) {
    console.error('[PARSE_RESUME_API_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to process file: ${errorMessage}` }, { status: 500 });
  }
}
