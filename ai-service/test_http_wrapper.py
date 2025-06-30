#!/usr/bin/env python3
"""
Test script to validate HTTP API approach for EPUB processing.
This simulates what the FastAPI service will do.
"""

import sys
import json
from pathlib import Path
from dataclasses import asdict
from epub_processor import LiteratiEPUBProcessor

def test_api_response(epub_path):
    """Test what the HTTP API response would look like."""
    try:
        print(f"🔧 Testing API response for: {epub_path}")
        
        processor = LiteratiEPUBProcessor()
        result = processor.process_epub(epub_path)
        
        # This is what the FastAPI endpoint will return
        api_response = {
            "success": True,
            "filename": Path(epub_path).name,
            "processing_time": result.processing_time,
            "data": asdict(result)
        }
        
        print(f"✅ API Response Preview:")
        print(f"   Success: {api_response['success']}")
        print(f"   Filename: {api_response['filename']}")
        print(f"   Processing Time: {api_response['processing_time']:.3f}s")
        print(f"   Chapters: {api_response['data']['total_chapters']}")
        print(f"   Words: {api_response['data']['total_words']}")
        print(f"   Title: {api_response['data']['metadata']['title']}")
        print(f"   Author: {api_response['data']['metadata']['creator']}")
        
        # Save sample response
        output_file = f"api_response_{Path(epub_path).stem}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(api_response, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"📁 Sample API response saved to: {output_file}")
        return True
        
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

if __name__ == "__main__":
    # Test with our sample files
    test_files = [
        "../test-samples/alice-wonderland.epub"
    ]
    
    print("🧪 Testing HTTP API approach...")
    
    success_count = 0
    for epub_file in test_files:
        if Path(epub_file).exists():
            if test_api_response(epub_file):
                success_count += 1
        else:
            print(f"⚠️ Test file not found: {epub_file}")
    
    print(f"\n📊 Test Results: {success_count}/{len(test_files)} successful")
    
    if success_count > 0:
        print("✅ HTTP API approach validated - ready for FastAPI implementation!")
    else:
        print("❌ HTTP API approach needs debugging")