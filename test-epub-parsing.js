const SimpleEpubParser = require('./lib/epub-parser');

// Test EPUB parsing functionality
async function testEpubParsing() {
  console.log('Testing EPUB parsing with custom parser...');
  
  const epubPath = './sample-book.epub';
  
  try {
    const parser = new SimpleEpubParser(epubPath);
    const result = await parser.parse();
    
    console.log('✅ EPUB loaded successfully');
    console.log('Title:', result.metadata.title);
    console.log('Author:', result.metadata.creator);
    console.log('Language:', result.metadata.language);
    console.log('Number of chapters:', result.chapters.length);
    
    // List first few chapters
    console.log('\nFirst few chapters:');
    result.chapters.slice(0, 5).forEach((chapter, index) => {
      console.log(`${index + 1}. ${chapter.title} (${chapter.href})`);
    });
    
    // Show sample content from first chapter
    if (result.chapters.length > 0) {
      console.log('\nSample content from first chapter:');
      const firstChapter = result.chapters[0];
      const textContent = firstChapter.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(textContent.substring(0, 200) + '...');
    }
    
    // Cleanup
    await parser.cleanup();
    
    console.log('\n✅ EPUB parsing test completed successfully');
    
  } catch (error) {
    console.error('❌ EPUB parsing test failed:', error);
    process.exit(1);
  }
}

testEpubParsing();