import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { Buffer } from 'buffer';
import { UploadSecurity } from '../upload-security';
import { FileUploadError, EpubProcessingError } from '../errors';
import { db } from '../prisma';
import { pythonEPUBService, EPUBResult } from './python-epub-service';

export interface UploadResult {
  bookId: string;
  title: string;
  author: string;
  message: string;
  chaptersCount?: number;
  totalWords?: number;
  processingTime?: number;
  language?: string;
}

export class EpubService {
  private readonly uploadDir = process.env.NODE_ENV === 'production' 
    ? join(tmpdir(), 'uploads')
    : join(process.cwd(), 'uploads');

  async uploadAndProcess(file: File): Promise<UploadResult> {
    console.log(`📚 [HTTP API] Starting EPUB upload and processing: ${file.name}`);
    console.log(`🔄 [HTTP API] Fresh deployment - NO CLI commands used`);
    console.log(`🌐 [HTTP API] Using Railway FastAPI service for processing`);

    // 1. Validate file
    const validation = UploadSecurity.validateFile(file);
    if (!validation.valid) {
      throw new FileUploadError(validation.error!);
    }

    // 2. Convert file to buffer and validate structure
    const buffer = Buffer.from(await file.arrayBuffer());
    const isValidStructure = await UploadSecurity.validateFileStructure(buffer);
    if (!isValidStructure) {
      throw new FileUploadError('Invalid EPUB file structure');
    }

    // 3. Save file to disk
    const sanitizedFilename = UploadSecurity.sanitizeFilename(file.name);
    const filePath = await this.saveFile(buffer, sanitizedFilename);

    console.log(`💾 File saved to: ${filePath}`);

    // 4. Process EPUB with Python HTTP API service
    let epubResult: EPUBResult | null = null;
    let processingTime = 0;

    try {
      console.log(`🔧 Processing EPUB with Python HTTP API...`);
      console.log(`🔍 Python service API URL: ${pythonEPUBService.getCurrentApiUrl()}`);
      console.log(`🔍 Environment variable: ${process.env.NEXT_PUBLIC_EPUB_API_URL}`);
      console.log(`🔍 Server-side check: ${typeof window === 'undefined' ? 'SERVER' : 'CLIENT'}`);
      
      // Pass File object directly to HTTP API (no need to save to disk first)
      const processingResult = await pythonEPUBService.processEPUB(file);
      
      if (!processingResult.success) {
        console.warn(`⚠️ EPUB processing failed: ${processingResult.error}`);
        // Fall back to basic metadata if processing fails
        epubResult = null;
        processingTime = processingResult.processing_time;
      } else {
        epubResult = processingResult.data!;
        processingTime = processingResult.processing_time;
        console.log(`✅ EPUB processed successfully via API: ${epubResult.total_chapters} chapters, ${epubResult.total_words} words`);
      }
    } catch (error) {
      console.error(`❌ EPUB API processing error:`, error);
      // Continue with basic metadata extraction
    }

    // 5. Save to database with extracted content
    try {
      if (!db) {
        // Database not configured - return success for demo mode
        const demoResult: UploadResult = {
          bookId: 'demo-' + Date.now(),
          title: epubResult?.metadata.title || this.extractBasicMetadata(file.name).title,
          author: epubResult?.metadata.creator || this.extractBasicMetadata(file.name).author,
          message: 'EPUB uploaded successfully (demo mode - database not configured)',
          chaptersCount: epubResult?.total_chapters,
          totalWords: epubResult?.total_words,
          processingTime,
          language: epubResult?.metadata.language
        };
        
        console.log(`📊 Demo mode result:`, demoResult);
        return demoResult;
      }

      // Create book with extracted metadata
      const bookData = {
        title: epubResult?.metadata.title || this.extractBasicMetadata(file.name).title,
        author: epubResult?.metadata.creator || this.extractBasicMetadata(file.name).author,
        language: epubResult?.metadata.language || 'en',
        description: epubResult?.metadata.description,
        originalFileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/epub+zip',
        processingStatus: epubResult ? 'COMPLETED' : 'PARTIAL',
        userId: 'temp-user-id' // Temporary placeholder
      };

      console.log(`💾 Saving book to database:`, bookData);

      const book = await db.book.create({
        data: bookData
      });

      // Create chapters if we have them
      if (epubResult && epubResult.chapters.length > 0) {
        console.log(`📝 Creating ${epubResult.chapters.length} chapters...`);
        
        const chaptersData = epubResult.chapters.map(chapter => ({
          bookId: book.id,
          title: chapter.title,
          content: chapter.content,
          chapterNum: chapter.order,
          wordCount: chapter.word_count
        }));

        await db.chapter.createMany({
          data: chaptersData
        });

        console.log(`✅ Created ${chaptersData.length} chapters in database`);
      }

      if (!book) {
        throw new EpubProcessingError('Failed to save book to database');
      }

      const result: UploadResult = {
        bookId: book.id,
        title: book.title,
        author: book.author,
        message: epubResult 
          ? 'EPUB uploaded and processed successfully with full chapter extraction'
          : 'EPUB uploaded successfully with basic metadata (chapter extraction failed)',
        chaptersCount: epubResult?.total_chapters,
        totalWords: epubResult?.total_words,
        processingTime,
        language: book.language
      };

      console.log(`🎉 Upload complete:`, result);
      return result;

    } catch (error) {
      console.error(`❌ Database error:`, error);
      throw new EpubProcessingError(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async saveFile(buffer: Buffer, filename: string): Promise<string> {
    try {
      // Ensure upload directory exists
      await mkdir(this.uploadDir, { recursive: true });
      
      const filePath = join(this.uploadDir, filename);
      await writeFile(filePath, buffer);
      
      return filePath;
    } catch (error) {
      throw new FileUploadError(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractBasicMetadata(filename: string): { title: string; author: string } {
    // Simple metadata extraction from filename
    // This will be enhanced in FILE-001b with proper EPUB parsing
    const nameWithoutExt = filename.replace('.epub', '');
    const parts = nameWithoutExt.split('-');
    
    return {
      title: parts[0]?.trim() || 'Unknown Title',
      author: parts[1]?.trim() || 'Unknown Author'
    };
  }
}

export const epubService = new EpubService();