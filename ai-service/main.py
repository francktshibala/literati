#!/usr/bin/env python3
"""
FastAPI service for Literati EPUB processing.
Provides RESTful API endpoints for EPUB chapter extraction.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tempfile
import os
import logging
from pathlib import Path
from epub_processor import LiteratiEPUBProcessor, EPUBResult
from dataclasses import asdict
import asyncio
from typing import Dict, Any
import aiofiles
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Literati AI Service", 
    version="1.0.0",
    description="AI-powered EPUB processing and literary analysis service"
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "https://literati.vercel.app",  # Production frontend
        "https://*.vercel.app"  # Vercel preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global processor instance
processor = LiteratiEPUBProcessor()

# Service statistics
service_stats = {
    "total_processed": 0,
    "successful_extractions": 0,
    "failed_extractions": 0,
    "average_processing_time": 0.0,
    "uptime_start": time.time()
}

@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": "Literati AI Service",
        "version": "1.0.0", 
        "status": "healthy",
        "endpoints": {
            "process_epub": "/process-epub",
            "health": "/health",
            "stats": "/stats"
        }
    }

@app.post("/process-epub")
async def process_epub(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
) -> Dict[str, Any]:
    """
    Process uploaded EPUB file and return extracted chapters with metadata.
    
    Args:
        file: Uploaded EPUB file
        
    Returns:
        JSON response with extraction results
        
    Raises:
        HTTPException: If file is invalid or processing fails
    """
    start_time = time.time()
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not file.filename.lower().endswith('.epub'):
        raise HTTPException(
            status_code=400, 
            detail="File must be an EPUB (.epub extension required)"
        )
    
    # Check file size (50MB limit)
    if hasattr(file, 'size') and file.size > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=413, 
            detail="File too large. Maximum size is 50MB"
        )
    
    temp_path = None
    
    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix='.epub') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        logger.info(f"Processing EPUB: {file.filename} ({len(content)} bytes)")
        
        # Process EPUB with our Python processor
        result: EPUBResult = processor.process_epub(temp_path)
        
        processing_time = time.time() - start_time
        
        # Update service statistics
        service_stats["total_processed"] += 1
        service_stats["successful_extractions"] += 1
        
        # Update average processing time
        prev_avg = service_stats["average_processing_time"]
        total_processed = service_stats["total_processed"]
        service_stats["average_processing_time"] = (
            (prev_avg * (total_processed - 1) + processing_time) / total_processed
        )
        
        logger.info(
            f"Successfully processed {file.filename}: "
            f"{result.total_chapters} chapters, "
            f"{result.total_words} words in {processing_time:.2f}s"
        )
        
        # Schedule cleanup in background
        background_tasks.add_task(cleanup_temp_file, temp_path)
        
        # Return success response
        return {
            "success": True,
            "filename": file.filename,
            "processing_time": processing_time,
            "data": asdict(result)
        }
        
    except ValueError as e:
        # EPUB processing error
        service_stats["total_processed"] += 1
        service_stats["failed_extractions"] += 1
        
        logger.error(f"EPUB processing failed for {file.filename}: {e}")
        
        if temp_path:
            background_tasks.add_task(cleanup_temp_file, temp_path)
        
        raise HTTPException(
            status_code=422, 
            detail=f"EPUB processing failed: {str(e)}"
        )
        
    except Exception as e:
        # Unexpected error
        service_stats["total_processed"] += 1
        service_stats["failed_extractions"] += 1
        
        logger.error(f"Unexpected error processing {file.filename}: {e}")
        
        if temp_path:
            background_tasks.add_task(cleanup_temp_file, temp_path)
        
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    uptime = time.time() - service_stats["uptime_start"]
    
    return {
        "status": "healthy",
        "service": "literati-ai",
        "uptime_seconds": round(uptime, 2),
        "version": "1.0.0",
        "processor_ready": True
    }

@app.get("/stats")
async def get_service_stats():
    """Get service processing statistics."""
    uptime = time.time() - service_stats["uptime_start"]
    
    success_rate = 0.0
    if service_stats["total_processed"] > 0:
        success_rate = (
            service_stats["successful_extractions"] / 
            service_stats["total_processed"] * 100
        )
    
    return {
        "total_processed": service_stats["total_processed"],
        "successful_extractions": service_stats["successful_extractions"], 
        "failed_extractions": service_stats["failed_extractions"],
        "success_rate_percent": round(success_rate, 1),
        "average_processing_time": round(service_stats["average_processing_time"], 3),
        "uptime_seconds": round(uptime, 2),
        "uptime_hours": round(uptime / 3600, 1)
    }

@app.post("/test-extract")
async def test_extraction(file_path: str = None):
    """
    Test endpoint for extracting from local EPUB files.
    Useful for development and testing.
    """
    if not file_path:
        raise HTTPException(status_code=400, detail="file_path parameter required")
    
    if not Path(file_path).exists():
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    
    try:
        result: EPUBResult = processor.process_epub(file_path)
        
        return {
            "success": True,
            "file_path": file_path,
            "data": asdict(result)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )

async def cleanup_temp_file(file_path: str):
    """Clean up temporary files in background."""
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
            logger.debug(f"Cleaned up temp file: {file_path}")
    except Exception as e:
        logger.warning(f"Failed to cleanup temp file {file_path}: {e}")

@app.on_event("startup")
async def startup_event():
    """Application startup event."""
    logger.info("Literati AI Service starting up...")
    logger.info("EPUB processor initialized successfully")

@app.on_event("shutdown") 
async def shutdown_event():
    """Application shutdown event."""
    logger.info("Literati AI Service shutting down...")

if __name__ == "__main__":
    import uvicorn
    
    # Development server
    uvicorn.run(
        "main:app",
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )