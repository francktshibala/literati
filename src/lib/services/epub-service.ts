import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { UploadSecurity } from '../upload-security';
import { FileUploadError, EpubProcessingError } from '../errors';
import { db } from '../prisma';

export interface UploadResult {
  bookId: string;
  title: string;
  author: string;
  message: string;
}

export class EpubService {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  async uploadAndProcess(file: File): Promise<UploadResult> {
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

    // 4. Extract basic metadata (simplified for now)
    const metadata = this.extractBasicMetadata(file.name);

    // 5. Save to database
    try {
      const book = await db?.book.create({
        data: {
          title: metadata.title,
          author: metadata.author,
          originalFileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/epub+zip',
          processingStatus: 'COMPLETED', // Simplified for FILE-001a
          // Note: userId will be added when auth is implemented
          userId: 'temp-user-id' // Temporary placeholder
        }
      });

      if (!book) {
        throw new EpubProcessingError('Failed to save book to database');
      }

      return {
        bookId: book.id,
        title: book.title,
        author: book.author,
        message: 'EPUB uploaded and processed successfully'
      };
    } catch (error) {
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