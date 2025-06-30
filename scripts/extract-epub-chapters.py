#!/usr/bin/env python3
"""
Simple EPUB chapter extraction script.
This will extract chapters from EPUB files and prepare them for database storage.
"""

import zipfile
import xml.etree.ElementTree as ET
import os
import re
import json
import sys
from pathlib import Path

class EPUBChapterExtractor:
    def __init__(self, epub_path):
        self.epub_path = epub_path
        self.metadata = {}
        self.chapters = []
        
    def extract_chapters(self):
        """Extract all chapters from the EPUB file."""
        try:
            with zipfile.ZipFile(self.epub_path, 'r') as epub_zip:
                # Read container.xml to find OPF file
                container_content = epub_zip.read('META-INF/container.xml').decode('utf-8')
                opf_path = self._extract_opf_path(container_content)
                
                # Read OPF file
                opf_content = epub_zip.read(opf_path).decode('utf-8')
                
                # Extract metadata
                self.metadata = self._extract_metadata(opf_content)
                
                # Extract chapter references
                chapters_info = self._extract_chapter_info(opf_content)
                
                # Extract actual content for each chapter
                base_dir = os.path.dirname(opf_path)
                for chapter_info in chapters_info:
                    chapter_path = os.path.join(base_dir, chapter_info['href']) if base_dir else chapter_info['href']
                    
                    try:
                        content = epub_zip.read(chapter_path).decode('utf-8')
                        
                        # Extract title and clean content
                        title = self._extract_title(content) or chapter_info.get('title', f"Chapter {len(self.chapters) + 1}")
                        cleaned_content = self._clean_html_content(content)
                        
                        self.chapters.append({
                            'id': chapter_info['id'],
                            'title': title,
                            'href': chapter_info['href'],
                            'order': chapter_info['order'],
                            'content': cleaned_content,
                            'raw_html': content
                        })
                        
                    except KeyError:
                        print(f"Warning: Could not read chapter file {chapter_path}")
                        continue
                        
            return {
                'metadata': self.metadata,
                'chapters': self.chapters
            }
            
        except Exception as e:
            print(f"Error extracting chapters: {e}")
            return None
    
    def _extract_opf_path(self, container_content):
        """Extract OPF file path from container.xml."""
        root = ET.fromstring(container_content)
        # Handle namespaces
        ns = {'container': 'urn:oasis:names:tc:opendocument:xmlns:container'}
        rootfile = root.find('.//container:rootfile', ns)
        if rootfile is not None:
            return rootfile.get('full-path')
        
        # Fallback: try without namespace
        match = re.search(r'full-path="([^"]+)"', container_content)
        if match:
            return match.group(1)
        
        raise ValueError("Could not find OPF file path in container.xml")
    
    def _extract_metadata(self, opf_content):
        """Extract metadata from OPF file."""
        try:
            root = ET.fromstring(opf_content)
            
            # Common namespaces
            ns = {
                'opf': 'http://www.idpf.org/2007/opf',
                'dc': 'http://purl.org/dc/elements/1.1/'
            }
            
            metadata = {}
            
            # Try with namespaces first
            title_elem = root.find('.//dc:title', ns)
            creator_elem = root.find('.//dc:creator', ns)
            language_elem = root.find('.//dc:language', ns)
            
            # Fallback: try without namespaces
            if title_elem is None:
                title_elem = root.find('.//title')
            if creator_elem is None:
                creator_elem = root.find('.//creator')
            if language_elem is None:
                language_elem = root.find('.//language')
            
            metadata['title'] = title_elem.text if title_elem is not None else 'Unknown Title'
            metadata['creator'] = creator_elem.text if creator_elem is not None else 'Unknown Author'
            metadata['language'] = language_elem.text if language_elem is not None else 'en'
            
            return metadata
            
        except Exception as e:
            print(f"Warning: Could not extract metadata: {e}")
            return {
                'title': 'Unknown Title',
                'creator': 'Unknown Author',
                'language': 'en'
            }
    
    def _extract_chapter_info(self, opf_content):
        """Extract chapter information from OPF file."""
        try:
            root = ET.fromstring(opf_content)
            
            # Extract manifest items
            manifest_items = {}
            for item in root.findall('.//*[@id][@href]'):
                manifest_items[item.get('id')] = {
                    'href': item.get('href'),
                    'media_type': item.get('media-type', '')
                }
            
            # Extract spine order
            chapters_info = []
            order = 1
            
            for itemref in root.findall('.//*[@idref]'):
                idref = itemref.get('idref')
                if idref in manifest_items:
                    item = manifest_items[idref]
                    # Only include HTML/XHTML files
                    if (item['href'].endswith(('.html', '.xhtml')) or 
                        'html' in item['media_type']):
                        chapters_info.append({
                            'id': idref,
                            'href': item['href'],
                            'order': order
                        })
                        order += 1
            
            return chapters_info
            
        except Exception as e:
            print(f"Warning: Could not extract chapter info: {e}")
            return []
    
    def _extract_title(self, html_content):
        """Extract title from HTML content."""
        # Try title tag first
        title_match = re.search(r'<title[^>]*>([^<]+)</title>', html_content, re.IGNORECASE)
        if title_match:
            return title_match.group(1).strip()
        
        # Try h1-h6 tags
        header_match = re.search(r'<h[1-6][^>]*>([^<]+)</h[1-6]>', html_content, re.IGNORECASE)
        if header_match:
            return header_match.group(1).strip()
        
        return None
    
    def _clean_html_content(self, html_content):
        """Clean HTML content to extract plain text."""
        # Remove script and style tags completely
        content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
        content = re.sub(r'<style[^>]*>.*?</style>', '', content, flags=re.DOTALL | re.IGNORECASE)
        
        # Convert common HTML entities
        content = content.replace('&nbsp;', ' ')
        content = content.replace('&amp;', '&')
        content = content.replace('&lt;', '<')
        content = content.replace('&gt;', '>')
        content = content.replace('&quot;', '"')
        content = content.replace('&apos;', "'")
        
        # Remove HTML tags but preserve line breaks
        content = re.sub(r'<br[^>]*>', '\n', content, flags=re.IGNORECASE)
        content = re.sub(r'<p[^>]*>', '\n\n', content, flags=re.IGNORECASE)
        content = re.sub(r'</p>', '', content, flags=re.IGNORECASE)
        content = re.sub(r'<[^>]+>', '', content)
        
        # Clean up whitespace
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)  # Multiple newlines to double
        content = re.sub(r'[ \t]+', ' ', content)  # Multiple spaces to single
        content = content.strip()
        
        return content

def main():
    if len(sys.argv) != 2:
        print("Usage: python extract-epub-chapters.py <path-to-epub>")
        sys.exit(1)
    
    epub_path = sys.argv[1]
    if not os.path.exists(epub_path):
        print(f"Error: EPUB file not found: {epub_path}")
        sys.exit(1)
    
    extractor = EPUBChapterExtractor(epub_path)
    result = extractor.extract_chapters()
    
    if result:
        print(f"✅ Successfully extracted {len(result['chapters'])} chapters from {epub_path}")
        print(f"Title: {result['metadata']['title']}")
        print(f"Author: {result['metadata']['creator']}")
        print(f"Language: {result['metadata']['language']}")
        
        print("\nChapters:")
        for i, chapter in enumerate(result['chapters'][:5], 1):  # Show first 5
            print(f"{i}. {chapter['title']} ({len(chapter['content'])} chars)")
        
        if len(result['chapters']) > 5:
            print(f"... and {len(result['chapters']) - 5} more chapters")
        
        # Save result to JSON file for testing
        output_file = epub_path.replace('.epub', '_chapters.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"\n📁 Saved extracted data to: {output_file}")
        
    else:
        print("❌ Failed to extract chapters")
        sys.exit(1)

if __name__ == "__main__":
    main()