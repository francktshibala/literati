// HTTP-based Python EPUB service client
// Replaces CLI-based approach with Railway API calls

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
 * HTTP-based Python EPUB service client.
 * Calls Railway-hosted FastAPI service instead of local CLI.
 */
export class PythonEPUBService {
  private apiUrl: string;
  private maxProcessingTime: number = 30000; // 30 seconds timeout

  constructor() {
    // Use Railway API URL in production, localhost for development
    // In Next.js, environment variables need NEXT_PUBLIC_ prefix for client-side access
    const envApiUrl = typeof window !== 'undefined' 
      ? (window as any).process?.env?.NEXT_PUBLIC_EPUB_API_URL
      : process.env.NEXT_PUBLIC_EPUB_API_URL;
    
    this.apiUrl = envApiUrl || 'http://localhost:8000';
    
    console.log(`🔍 DEBUG: NEXT_PUBLIC_EPUB_API_URL =`, envApiUrl);
    console.log(`📡 Python EPUB Service initialized with API: ${this.apiUrl}`);
  }

  /**
   * Process EPUB file using HTTP API instead of CLI.
   * 
   * @param file - File object from frontend upload
   * @returns Promise with processing results
   */
  async processEPUB(file: File): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      console.log(`📚 Processing EPUB via API: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

      // 1. Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // 2. Call Railway FastAPI service
      const response = await fetch(`${this.apiUrl}/process-epub`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary
        signal: AbortSignal.timeout(this.maxProcessingTime)
      });

      const processingTime = Date.now() - startTime;

      // 3. Handle response
      if (!response.ok) {
        let errorMessage = `API error: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // Ignore JSON parse errors for error responses
        }
        
        console.error(`❌ API error in ${processingTime}ms:`, errorMessage);
        
        return {
          success: false,
          error: errorMessage,
          processing_time: processingTime
        };
      }

      // 4. Parse successful response
      const apiResponse = await response.json();
      
      if (!apiResponse.success || !apiResponse.data) {
        throw new Error('Invalid API response format');
      }

      const result: EPUBResult = apiResponse.data;

      console.log(
        `✅ EPUB processed successfully via API in ${processingTime}ms: ` +
        `${result.total_chapters} chapters, ${result.total_words} words`
      );

      return {
        success: true,
        data: result,
        processing_time: processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = `Processing timeout after ${this.maxProcessingTime}ms`;
        } else if (error.message.includes('fetch')) {
          errorMessage = `Cannot connect to EPUB processing service at ${this.apiUrl}`;
        } else {
          errorMessage = error.message;
        }
      }
      
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
   * @param file - File object to validate
   * @param maxSizeBytes - Maximum allowed file size (default 50MB)
   * @returns Validation result
   */
  validateEPUB(file: File, maxSizeBytes: number = 50 * 1024 * 1024): {
    valid: boolean;
    error?: string;
    size: number;
  } {
    try {
      // Check file size
      if (file.size > maxSizeBytes) {
        return {
          valid: false,
          error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max ${maxSizeBytes / 1024 / 1024}MB)`,
          size: file.size
        };
      }

      // Check file extension
      if (!file.name.toLowerCase().endsWith('.epub')) {
        return {
          valid: false,
          error: 'File must have .epub extension',
          size: file.size
        };
      }

      // Check file type (if available)
      if (file.type && !file.type.includes('epub') && !file.type.includes('zip')) {
        return {
          valid: false,
          error: `Invalid file type: ${file.type}`,
          size: file.size
        };
      }

      return {
        valid: true,
        size: file.size
      };

    } catch (error) {
      return {
        valid: false,
        error: `File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        size: file.size || 0
      };
    }
  }

  /**
   * Health check for Python API service.
   * 
   * @returns Promise indicating if API service is available
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string; apiUrl?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const healthData = await response.json();
        console.log(`✅ EPUB API health check passed:`, healthData);
        
        return { 
          healthy: true, 
          apiUrl: this.apiUrl 
        };
      } else {
        return { 
          healthy: false, 
          error: `API returned ${response.status}: ${response.statusText}`,
          apiUrl: this.apiUrl
        };
      }
    } catch (error) {
      return {
        healthy: false,
        error: `Cannot reach EPUB API at ${this.apiUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        apiUrl: this.apiUrl
      };
    }
  }

  /**
   * Get processing statistics from API service.
   * 
   * @returns Service statistics
   */
  async getStats(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/stats`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Stats API returned ${response.status}`);
      }
    } catch (error) {
      return {
        service: 'PythonEPUBService',
        api_url: this.apiUrl,
        max_processing_time: this.maxProcessingTime,
        max_file_size: '50MB',
        error: `Cannot fetch stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const pythonEPUBService = new PythonEPUBService();

// Default export
export default pythonEPUBService;