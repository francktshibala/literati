import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface Chapter {
  id: string;
  title: string;
  href: string;
  order: number;
  content: string;
  word_count: number;
  raw_html: string;
}

export interface BookMetadata {
  title: string;
  creator: string;
  language: string;
  identifier?: string;
  description?: string;
  published_date?: string;
}

export interface EPUBResult {
  metadata: BookMetadata;
  chapters: Chapter[];
  total_chapters: number;
  total_words: number;
  processing_time: number;
}

export interface ProcessingResult {
  success: boolean;
  data?: EPUBResult;
  error?: string;
  processing_time: number;
}

/**
 * Node.js service that integrates with Python EPUB processor.
 * Provides TypeScript interface for EPUB chapter extraction.
 */
export class PythonEPUBService {
  private pythonScriptPath: string;
  private maxProcessingTime: number = 30000; // 30 seconds timeout

  constructor() {
    // Path to our Python EPUB processor
    this.pythonScriptPath = path.join(process.cwd(), 'ai-service', 'epub_processor.py');
  }

  /**
   * Process EPUB file and extract chapters using Python service.
   * 
   * @param epubFilePath - Absolute path to EPUB file
   * @returns Promise with processing results
   */
  async processEPUB(epubFilePath: string): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // Validate file exists
      await readFile(epubFilePath);

      console.log(`Processing EPUB: ${epubFilePath}`);

      // Execute Python processor
      const command = `python3 "${this.pythonScriptPath}" "${epubFilePath}"`;
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: this.maxProcessingTime,
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large outputs
      });

      if (stderr && stderr.includes('❌ Error:')) {
        throw new Error(stderr.split('❌ Error: ')[1]?.split('\n')[0] || 'Python processing failed');
      }

      // Parse output to find JSON file path
      const outputMatch = stdout.match(/📁 Saved results to: (.+\.json)/);
      if (!outputMatch) {
        throw new Error('Could not find output JSON file path');
      }

      const jsonFilePath = outputMatch[1];
      
      // Read the generated JSON file
      const jsonContent = await readFile(jsonFilePath, 'utf-8');
      const result: EPUBResult = JSON.parse(jsonContent);

      const processingTime = Date.now() - startTime;

      console.log(`✅ EPUB processed successfully in ${processingTime}ms: ${result.total_chapters} chapters, ${result.total_words} words`);

      return {
        success: true,
        data: result,
        processing_time: processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ EPUB processing failed in ${processingTime}ms:`, errorMessage);

      return {
        success: false,
        error: errorMessage,
        processing_time: processingTime
      };
    }
  }

  /**
   * Validate EPUB file format and size.
   * 
   * @param filePath - Path to file to validate
   * @param maxSizeBytes - Maximum allowed file size (default 50MB)
   * @returns Validation result
   */
  async validateEPUB(filePath: string, maxSizeBytes: number = 50 * 1024 * 1024): Promise<{
    valid: boolean;
    error?: string;
    size?: number;
  }> {
    try {
      const stats = await readFile(filePath).then(buffer => ({
        size: buffer.length
      }));

      // Check file size
      if (stats.size > maxSizeBytes) {
        return {
          valid: false,
          error: `File too large: ${(stats.size / 1024 / 1024).toFixed(1)}MB (max ${maxSizeBytes / 1024 / 1024}MB)`,
          size: stats.size
        };
      }

      // Check file extension
      if (!filePath.toLowerCase().endsWith('.epub')) {
        return {
          valid: false,
          error: 'File must have .epub extension',
          size: stats.size
        };
      }

      return {
        valid: true,
        size: stats.size
      };

    } catch (error) {
      return {
        valid: false,
        error: `File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Health check for Python processor.
   * 
   * @returns Promise indicating if processor is available
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      const { stdout, stderr } = await execAsync('python3 --version', { timeout: 5000 });
      
      if (stderr && !stdout) {
        return { healthy: false, error: 'Python3 not available' };
      }

      // Check if our script exists
      await readFile(this.pythonScriptPath);

      return { healthy: true };

    } catch (error) {
      return {
        healthy: false,
        error: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get processing statistics.
   * 
   * @returns Service statistics
   */
  getStats() {
    return {
      service: 'PythonEPUBService',
      processor_path: this.pythonScriptPath,
      max_processing_time: this.maxProcessingTime,
      max_file_size: '50MB'
    };
  }
}

// Export singleton instance
export const pythonEPUBService = new PythonEPUBService();

// Default export
export default pythonEPUBService;