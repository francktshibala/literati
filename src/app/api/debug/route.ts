import { NextResponse } from 'next/server';
import { pythonEPUBService } from '@/lib/services/python-epub-service';

export async function GET() {
  try {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_EPUB_API_URL: process.env.NEXT_PUBLIC_EPUB_API_URL,
        vercelUrl: process.env.VERCEL_URL,
        allNextPublicVars: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC'))
      },
      pythonService: {
        apiUrl: pythonEPUBService.getCurrentApiUrl(),
        className: pythonEPUBService.constructor.name
      },
      deployment: {
        platform: 'vercel',
        region: process.env.VERCEL_REGION,
        gitSha: process.env.VERCEL_GIT_COMMIT_SHA
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}