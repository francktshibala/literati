import { NextRequest, NextResponse } from 'next/server';
import { epubService } from '@/lib/services/epub-service';
import { handleApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [API] Upload EPUB endpoint called');
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`📁 [API] File received: ${file.name}, size: ${file.size}`);
    console.log('🔗 [API] Calling epubService.uploadAndProcess...');

    // Process the upload
    const result = await epubService.uploadAndProcess(file);

    console.log('✅ [API] Upload processing completed successfully');
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('❌ [API] Upload processing failed:', error);
    return handleApiError(error);
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}