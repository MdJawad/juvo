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

    // 5. Return the cleaned text to the frontend for verification.
    return NextResponse.json({ rawText: cleanedText.trim() });

  } catch (error) {
    console.error('[PARSE_RESUME_API_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to process file: ${errorMessage}` }, { status: 500 });
  }
}
