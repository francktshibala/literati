#!/usr/bin/env python3
"""
Production-ready EPUB chapter extraction service for Literati.
Handles EPUB parsing with proper error handling and validation.
"""

import zipfile
import xml.etree.ElementTree as ET
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
import tempfile
import shutil
from html.parser import HTMLParser

@dataclass
class Chapter:
    id: str
    title: str
    href: str
    order: int
    content: str
    word_count: int
    raw_html: str

@dataclass
class BookMetadata:
    title: str
    creator: str
    language: str
    identifier: Optional[str] = None
    description: Optional[str] = None
    published_date: Optional[str] = None

@dataclass
class EPUBResult:
    metadata: BookMetadata
    chapters: List[Chapter]
    total_chapters: int
    total_words: int
    processing_time: float

class HTMLFilter(HTMLParser):
    """Clean HTML content to extract plain text."""
    
    def __init__(self):
        super().__init__()
        self.text = ""
        self.skip_tags = {'script', 'style', 'meta', 'link'}
        self.skip_content = False

    def handle_starttag(self, tag, attrs):
        if tag.lower() in self.skip_tags:
            self.skip_content = True
        elif tag.lower() in ['p', 'br', 'div']:
            self.text += '\n'
        elif tag.lower() in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            self.text += '\n\n'

    def handle_endtag(self, tag):
        if tag.lower() in self.skip_tags:
            self.skip_content = False
        elif tag.lower() in ['p', 'div']:
            self.text += '\n'

    def handle_data(self, data):
        if not self.skip_content:
            self.text += data

class LiteratiEPUBProcessor:
    """
    Production EPUB processor optimized for literature analysis.
    Handles complex EPUB structures with proper error recovery.
    """
    
    def __init__(self):
        self.namespaces = {
            'container': 'urn:oasis:names:tc:opendocument:xmlns:container',
            'opf': 'http://www.idpf.org/2007/opf',
            'dc': 'http://purl.org/dc/elements/1.1/',
            'xhtml': 'http://www.w3.org/1999/xhtml'
        }

    def process_epub(self, epub_path: str) -> EPUBResult:
        """
        Process EPUB file and extract all chapters with metadata.
        
        Args:
            epub_path: Path to EPUB file
            
        Returns:
            EPUBResult with metadata and chapters
            
        Raises:
            ValueError: If EPUB is invalid or corrupted
            FileNotFoundError: If EPUB file doesn't exist
        """
        import time
        start_time = time.time()
        
        if not Path(epub_path).exists():
            raise FileNotFoundError(f"EPUB file not found: {epub_path}")
            
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                # Extract EPUB (it's a ZIP file)
                with zipfile.ZipFile(epub_path, 'r') as epub_zip:
                    epub_zip.extractall(temp_dir)
                
                # Find OPF file via container.xml
                opf_path = self._find_opf_file(temp_dir)
                
                # Extract metadata and spine
                metadata = self._extract_metadata(temp_dir, opf_path)
                chapters = self._extract_chapters(temp_dir, opf_path)
                
                # Calculate totals
                total_words = sum(chapter.word_count for chapter in chapters)
                processing_time = time.time() - start_time
                
                return EPUBResult(
                    metadata=metadata,
                    chapters=chapters,
                    total_chapters=len(chapters),
                    total_words=total_words,
                    processing_time=processing_time
                )
                
        except zipfile.BadZipFile:
            raise ValueError(f"Invalid ZIP/EPUB file: {epub_path}")
        except Exception as e:
            raise ValueError(f"Failed to process EPUB: {str(e)}")

    def _find_opf_file(self, temp_dir: str) -> str:
        """Find OPF file path from container.xml."""
        container_path = Path(temp_dir) / "META-INF" / "container.xml"
        
        if not container_path.exists():
            raise ValueError("Invalid EPUB: Missing META-INF/container.xml")
        
        try:
            tree = ET.parse(container_path)
            root = tree.getroot()
            
            # Try with namespace
            rootfile = root.find('.//container:rootfile', self.namespaces)
            if rootfile is not None:
                return rootfile.get('full-path')
            
            # Fallback: try without namespace
            for elem in root.iter():
                if elem.tag.endswith('rootfile'):
                    return elem.get('full-path')
                    
            raise ValueError("Cannot find OPF file path in container.xml")
            
        except ET.ParseError as e:
            raise ValueError(f"Invalid container.xml: {e}")

    def _extract_metadata(self, temp_dir: str, opf_path: str) -> BookMetadata:
        """Extract book metadata from OPF file."""
        opf_full_path = Path(temp_dir) / opf_path
        
        if not opf_full_path.exists():
            raise ValueError(f"OPF file not found: {opf_path}")
        
        try:
            tree = ET.parse(opf_full_path)
            root = tree.getroot()
            
            # Extract metadata with fallbacks
            metadata = {}
            
            # Try with namespaces first
            for field in ['title', 'creator', 'language', 'identifier', 'description', 'date']:
                elem = root.find(f'.//dc:{field}', self.namespaces)
                if elem is not None and elem.text:
                    metadata[field] = elem.text.strip()
                else:
                    # Fallback: try without namespace
                    for elem in root.iter():
                        if elem.tag.endswith(field) and elem.text:
                            metadata[field] = elem.text.strip()
                            break
            
            return BookMetadata(
                title=metadata.get('title', 'Unknown Title'),
                creator=metadata.get('creator', 'Unknown Author'),
                language=metadata.get('language', 'en'),
                identifier=metadata.get('identifier'),
                description=metadata.get('description'),
                published_date=metadata.get('date')
            )
            
        except ET.ParseError as e:
            raise ValueError(f"Invalid OPF file: {e}")

    def _extract_chapters(self, temp_dir: str, opf_path: str) -> List[Chapter]:
        """Extract all chapters in spine order."""
        opf_full_path = Path(temp_dir) / opf_path
        opf_dir = opf_full_path.parent
        
        try:
            tree = ET.parse(opf_full_path)
            root = tree.getroot()
            
            # Build manifest mapping
            manifest = {}
            manifest_elem = root.find('.//opf:manifest', self.namespaces)
            if manifest_elem is None:
                manifest_elem = root.find('.//*[local-name()="manifest"]')
            
            if manifest_elem is not None:
                for item in manifest_elem.findall('.//*[@id][@href]'):
                    manifest[item.get('id')] = {
                        'href': item.get('href'),
                        'media_type': item.get('media-type', '')
                    }
            
            # Extract spine order
            chapters = []
            spine_elem = root.find('.//opf:spine', self.namespaces)
            if spine_elem is None:
                spine_elem = root.find('.//*[local-name()="spine"]')
            
            if spine_elem is not None:
                order = 1
                for itemref in spine_elem.findall('.//*[@idref]'):
                    idref = itemref.get('idref')
                    
                    if idref in manifest:
                        item = manifest[idref]
                        href = item['href']
                        
                        # Only process HTML/XHTML files
                        if (href.endswith(('.html', '.xhtml')) or 
                            'html' in item['media_type']):
                            
                            chapter = self._process_chapter_file(
                                opf_dir / href, idref, href, order
                            )
                            if chapter:
                                chapters.append(chapter)
                                order += 1
            
            return chapters
            
        except ET.ParseError as e:
            raise ValueError(f"Invalid OPF file: {e}")

    def _process_chapter_file(self, file_path: Path, chapter_id: str, 
                            href: str, order: int) -> Optional[Chapter]:
        """Process individual chapter file."""
        if not file_path.exists():
            return None
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                raw_html = f.read()
            
            # Extract title
            title = self._extract_title(raw_html) or f"Chapter {order}"
            
            # Clean content
            filter_obj = HTMLFilter()
            filter_obj.feed(raw_html)
            clean_content = self._clean_text(filter_obj.text)
            
            # Count words
            word_count = len(clean_content.split()) if clean_content else 0
            
            return Chapter(
                id=chapter_id,
                title=title,
                href=href,
                order=order,
                content=clean_content,
                word_count=word_count,
                raw_html=raw_html
            )
            
        except Exception as e:
            print(f"Warning: Could not process chapter {href}: {e}")
            return None

    def _extract_title(self, html_content: str) -> Optional[str]:
        """Extract title from HTML content."""
        # Try title tag first
        title_match = re.search(r'<title[^>]*>([^<]+)</title>', html_content, re.IGNORECASE)
        if title_match:
            return title_match.group(1).strip()
        
        # Try heading tags
        for i in range(1, 7):
            heading_match = re.search(f'<h{i}[^>]*>([^<]+)</h{i}>', html_content, re.IGNORECASE)
            if heading_match:
                return heading_match.group(1).strip()
        
        return None

    def _clean_text(self, text: str) -> str:
        """Clean and normalize text content."""
        if not text:
            return ""
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove excessive newlines
        text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
        
        # Clean up common HTML entities
        text = text.replace('&nbsp;', ' ')
        text = text.replace('&amp;', '&')
        text = text.replace('&lt;', '<')
        text = text.replace('&gt;', '>')
        text = text.replace('&quot;', '"')
        text = text.replace('&apos;', "'")
        
        return text.strip()

def main():
    """CLI interface for testing."""
    if len(sys.argv) != 2:
        print("Usage: python epub_processor.py <path-to-epub>")
        sys.exit(1)
    
    epub_path = sys.argv[1]
    
    try:
        processor = LiteratiEPUBProcessor()
        result = processor.process_epub(epub_path)
        
        print(f"✅ Successfully processed: {result.metadata.title}")
        print(f"Author: {result.metadata.creator}")
        print(f"Language: {result.metadata.language}")
        print(f"Chapters: {result.total_chapters}")
        print(f"Total words: {result.total_words:,}")
        print(f"Processing time: {result.processing_time:.2f}s")
        
        # Show first few chapters
        print("\nChapters:")
        for chapter in result.chapters[:5]:
            print(f"{chapter.order}. {chapter.title} ({chapter.word_count} words)")
        
        if result.total_chapters > 5:
            print(f"... and {result.total_chapters - 5} more chapters")
        
        # Save result for testing
        output_file = epub_path.replace('.epub', '_extracted.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(asdict(result), f, indent=2, ensure_ascii=False, default=str)
        print(f"\n📁 Saved results to: {output_file}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()