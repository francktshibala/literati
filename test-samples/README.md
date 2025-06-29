# Test EPUB Files for Literati

This folder contains sample EPUB files for testing the Literati upload functionality.

## Files Available:

### simple-test-book.epub
- **Title**: "Simple Test Book"
- **Author**: "Test Author" 
- **Size**: ~2KB (very small for fast testing)
- **Content**: Basic single chapter with test content
- **Purpose**: Test basic upload, validation, and metadata extraction

## How to Use:

1. **Download**: Right-click any .epub file → "Save As" or "Download"
2. **Test Upload**: Go to https://literati-jade.vercel.app/
3. **Upload**: Use the file picker to select the downloaded .epub file
4. **Verify**: Check that upload succeeds and shows correct metadata

## Expected Results:

When uploading `simple-test-book.epub`, you should see:
- ✅ **Title**: "Simple Test Book"
- ✅ **Author**: "Test Author"
- ✅ **Success Message**: "EPUB uploaded and processed successfully"
- ✅ **Book ID**: Generated unique identifier

## Issues?

If upload fails, check:
- File is actually .epub format
- File size is under 50MB
- Browser allows file uploads
- Network connection is stable

---

*These files are created specifically for testing Literati's EPUB processing pipeline.*