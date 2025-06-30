const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Simple EPUB parser using pure Node.js
 * EPUB files are ZIP archives, so we'll parse them as such
 */
class SimpleEpubParser {
  constructor(epubPath) {
    this.epubPath = epubPath;
    this.metadata = {};
    this.chapters = [];
    this.zipEntries = new Map();
  }

  async parse() {
    try {
      // Read the EPUB file as a buffer
      const epubBuffer = await fs.promises.readFile(this.epubPath);
      
      // Parse ZIP structure
      await this.parseZipFile(epubBuffer);
      
      // Read container.xml to find OPF file
      const containerContent = this.getFileContent('META-INF/container.xml');
      if (!containerContent) throw new Error('Could not find container.xml');
      
      // Extract OPF path
      const opfMatch = containerContent.match(/full-path="([^"]+)"/);
      if (!opfMatch) throw new Error('Could not find OPF file path');
      
      const opfPath = opfMatch[1];
      const opfContent = this.getFileContent(opfPath);
      if (!opfContent) throw new Error('Could not read OPF file');
      
      // Extract metadata
      this.extractMetadata(opfContent);
      
      // Extract chapter references
      await this.extractChapters(opfContent, path.dirname(opfPath));
      
      return {
        metadata: this.metadata,
        chapters: this.chapters
      };
      
    } catch (error) {
      console.error('Error parsing EPUB:', error);
      throw error;
    }
  }

  async parseZipFile(buffer) {
    // Simple ZIP file parser - just find central directory and extract file entries
    let pos = buffer.length - 22; // Start from end of central directory record
    
    // Find end of central directory signature
    while (pos >= 0) {
      if (buffer.readUInt32LE(pos) === 0x06054b50) {
        break;
      }
      pos--;
    }
    
    if (pos < 0) throw new Error('Invalid ZIP file - no central directory found');
    
    const centralDirOffset = buffer.readUInt32LE(pos + 16);
    const centralDirEntries = buffer.readUInt16LE(pos + 10);
    
    // Parse central directory entries
    let cdPos = centralDirOffset;
    for (let i = 0; i < centralDirEntries; i++) {
      if (buffer.readUInt32LE(cdPos) !== 0x02014b50) {
        throw new Error('Invalid central directory entry');
      }
      
      const filenameLength = buffer.readUInt16LE(cdPos + 28);
      const extraFieldLength = buffer.readUInt16LE(cdPos + 30);
      const commentLength = buffer.readUInt16LE(cdPos + 32);
      const localHeaderOffset = buffer.readUInt32LE(cdPos + 42);
      const compressedSize = buffer.readUInt32LE(cdPos + 20);
      const uncompressedSize = buffer.readUInt32LE(cdPos + 24);
      const compressionMethod = buffer.readUInt16LE(cdPos + 10);
      
      const filename = buffer.toString('utf8', cdPos + 46, cdPos + 46 + filenameLength);
      
      // Read local file header to get actual data offset
      const localFilenameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraFieldLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataOffset = localHeaderOffset + 30 + localFilenameLength + localExtraFieldLength;
      
      this.zipEntries.set(filename, {
        offset: dataOffset,
        compressedSize,
        uncompressedSize,
        compressionMethod,
        buffer: buffer
      });
      
      cdPos += 46 + filenameLength + extraFieldLength + commentLength;
    }
  }

  getFileContent(filename) {
    const entry = this.zipEntries.get(filename);
    if (!entry) return null;
    
    const data = entry.buffer.slice(entry.offset, entry.offset + entry.compressedSize);
    
    if (entry.compressionMethod === 0) {
      // No compression
      return data.toString('utf8');
    } else if (entry.compressionMethod === 8) {
      // Deflate compression
      try {
        const inflated = zlib.inflateRawSync(data);
        return inflated.toString('utf8');
      } catch (error) {
        console.warn(`Could not decompress ${filename}:`, error.message);
        return null;
      }
    } else {
      console.warn(`Unsupported compression method ${entry.compressionMethod} for ${filename}`);
      return null;
    }
  }

  extractMetadata(opfContent) {
    // Simple regex-based metadata extraction
    const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
    const creatorMatch = opfContent.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
    const languageMatch = opfContent.match(/<dc:language[^>]*>([^<]+)<\/dc:language>/i);
    
    this.metadata = {
      title: titleMatch ? titleMatch[1].trim() : 'Unknown Title',
      creator: creatorMatch ? creatorMatch[1].trim() : 'Unknown Author',
      language: languageMatch ? languageMatch[1].trim() : 'en'
    };
  }

  async extractChapters(opfContent, baseDir) {
    // Extract spine order
    const spineMatch = opfContent.match(/<spine[^>]*>(.*?)<\/spine>/s);
    if (!spineMatch) return;
    
    const itemrefMatches = spineMatch[1].match(/<itemref[^>]*idref="([^"]+)"/g) || [];
    
    // Extract manifest
    const manifestMatch = opfContent.match(/<manifest[^>]*>(.*?)<\/manifest>/s);
    if (!manifestMatch) return;
    
    const manifestItems = {};
    const itemMatches = manifestMatch[1].match(/<item[^>]*>/g) || [];
    
    itemMatches.forEach(item => {
      const idMatch = item.match(/id="([^"]+)"/);
      const hrefMatch = item.match(/href="([^"]+)"/);
      if (idMatch && hrefMatch) {
        manifestItems[idMatch[1]] = hrefMatch[1];
      }
    });
    
    // Process chapters in spine order
    for (let i = 0; i < itemrefMatches.length; i++) {
      const idrefMatch = itemrefMatches[i].match(/idref="([^"]+)"/);
      if (!idrefMatch) continue;
      
      const id = idrefMatch[1];
      const href = manifestItems[id];
      if (!href || (!href.endsWith('.html') && !href.endsWith('.xhtml'))) continue;
      
      try {
        // Construct file path relative to OPF directory
        const filePath = baseDir ? `${baseDir}/${href}` : href;
        const content = this.getFileContent(filePath);
        
        if (!content) {
          console.warn(`Could not read chapter file ${filePath}`);
          continue;
        }
        
        // Extract title from content
        const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i) || 
                          content.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
        const title = titleMatch ? titleMatch[1].trim() : `Chapter ${i + 1}`;
        
        this.chapters.push({
          id: id,
          title: title,
          href: href,
          content: content,
          order: i + 1
        });
        
      } catch (error) {
        console.warn(`Could not read chapter file ${href}:`, error.message);
      }
    }
  }

  async cleanup() {
    // No cleanup needed for pure Node.js approach
    return Promise.resolve();
  }
}

module.exports = SimpleEpubParser;