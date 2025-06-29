export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export class UploadSecurity {
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly ALLOWED_EXTENSIONS = ['.epub'];

  static validateFile(file: File): FileValidationResult {
    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = this.ALLOWED_EXTENSIONS.some(ext => 
      fileName.endsWith(ext)
    );
    
    if (!hasValidExtension) {
      return { valid: false, error: 'Only EPUB files are allowed' };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File size exceeds 50MB limit' };
    }

    // Check for empty file
    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    return { valid: true };
  }

  static sanitizeFilename(filename: string): string {
    // Remove dangerous characters and path traversal attempts
    const sanitized = filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.+/g, '.')
      .replace(/^\.+|\.+$/g, '');
    
    // Generate timestamp prefix to avoid conflicts
    const timestamp = Date.now();
    return `${timestamp}_${sanitized}`;
  }

  static async validateFileStructure(buffer: Buffer): Promise<boolean> {
    try {
      // Check for ZIP file signature (EPUB is a ZIP file)
      const zipSignature = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
      const fileHeader = buffer.subarray(0, 4);
      
      return zipSignature.equals(fileHeader);
    } catch {
      return false;
    }
  }
}