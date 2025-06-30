#!/usr/bin/env python3
"""
FastAPI HTTP wrapper for Literati EPUB processor.
Converts our working CLI processor into a production-ready HTTP API.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
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
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Literati EPUB Processing API", 
    version="1.0.0",
    description="HTTP API for EPUB chapter extraction and literary analysis"
)

# CORS middleware for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "https://literati.vercel.app",  # Production frontend (update with your domain)
        "https://*.vercel.app",  # Vercel preview deployments
        "*"  # Allow all for testing (remove in production)
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
    uptime = time.time() - service_stats["uptime_start"]
    
    return {
        "service": "Literati EPUB Processing API",
        "version": "1.0.0", 
        "status": "healthy",
        "uptime_hours": round(uptime / 3600, 1),
        "stats": {
            "total_processed": service_stats["total_processed"],
            "success_rate": round(
                (service_stats["successful_extractions"] / max(1, service_stats["total_processed"])) * 100, 1
            ),
            "avg_processing_time": round(service_stats["average_processing_time"], 3)
        },
        "endpoints": {
            "process_epub": "POST /process-epub",
            "health": "GET /health", 
            "stats": "GET /stats"
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
        file: Uploaded EPUB file (multipart/form-data)
        
    Returns:
        JSON response with extraction results
        
    Example Response:
        {
            "success": true,
            "filename": "alice-wonderland.epub",
            "processing_time": 0.21,
            "data": {
                "metadata": {...},
                "chapters": [...],
                "total_chapters": 15,
                "total_words": 29650
            }
        }
    """
    start_time = time.time()
    temp_path = None
    
    logger.info(f"📚 Processing EPUB upload: {file.filename}")
    
    # 1. Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not file.filename.lower().endswith('.epub'):
        raise HTTPException(
            status_code=400, 
            detail="File must be an EPUB (.epub extension required)"
        )
    
    try:
        # 2. Read file content
        content = await file.read()
        file_size = len(content)
        
        # Check file size (50MB limit)
        if file_size > 50 * 1024 * 1024:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large: {file_size / 1024 / 1024:.1f}MB (max 50MB)"
            )
        
        logger.info(f"📁 File size: {file_size / 1024 / 1024:.2f}MB")
        
        # 3. Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.epub') as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name
        
        logger.info(f"💾 Saved to temp file: {temp_path}")
        
        # 4. Process with our existing EPUB processor
        logger.info(f"🔧 Starting EPUB processing...")
        result: EPUBResult = processor.process_epub(temp_path)
        
        processing_time = time.time() - start_time
        
        # 5. Update service statistics
        service_stats["total_processed"] += 1
        service_stats["successful_extractions"] += 1
        
        # Update average processing time
        prev_avg = service_stats["average_processing_time"]
        total_processed = service_stats["total_processed"]
        service_stats["average_processing_time"] = (
            (prev_avg * (total_processed - 1) + processing_time) / total_processed
        )
        
        logger.info(
            f"✅ Successfully processed {file.filename}: "
            f"{result.total_chapters} chapters, "
            f"{result.total_words} words in {processing_time:.2f}s"
        )
        
        # 6. Schedule cleanup in background
        background_tasks.add_task(cleanup_temp_file, temp_path)
        
        # 7. Return success response
        return {
            "success": True,
            "filename": file.filename,
            "file_size_mb": round(file_size / 1024 / 1024, 2),
            "processing_time": round(processing_time, 3),
            "data": asdict(result)
        }
        
    except ValueError as e:
        # EPUB processing error (invalid format, corrupted file, etc.)
        processing_time = time.time() - start_time
        service_stats["total_processed"] += 1
        service_stats["failed_extractions"] += 1
        
        logger.error(f"❌ EPUB processing failed for {file.filename}: {e}")
        
        if temp_path:
            background_tasks.add_task(cleanup_temp_file, temp_path)
        
        raise HTTPException(
            status_code=422, 
            detail=f"EPUB processing failed: {str(e)}"
        )
        
    except Exception as e:
        # Unexpected error
        processing_time = time.time() - start_time
        service_stats["total_processed"] += 1
        service_stats["failed_extractions"] += 1
        
        logger.error(f"💥 Unexpected error processing {file.filename}: {e}")
        
        if temp_path:
            background_tasks.add_task(cleanup_temp_file, temp_path)
        
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error during EPUB processing"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    uptime = time.time() - service_stats["uptime_start"]
    
    return {
        "status": "healthy",
        "service": "literati-epub-api",
        "version": "1.0.0",
        "uptime_seconds": round(uptime, 2),
        "processor_ready": True,
        "python_version": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}"
    }

@app.get("/stats")
async def get_service_stats():
    """Get detailed service processing statistics."""
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
        "average_processing_time_seconds": round(service_stats["average_processing_time"], 3),
        "uptime_seconds": round(uptime, 2),
        "uptime_hours": round(uptime / 3600, 1),
        "service_info": {
            "name": "Literati EPUB Processing API",
            "version": "1.0.0",
            "environment": os.getenv("ENVIRONMENT", "development")
        }
    }

@app.post("/test-local")
async def test_local_file(file_path: str):
    """
    Test endpoint for processing local EPUB files.
    Useful for development and debugging.
    
    Args:
        file_path: Absolute path to local EPUB file
    """
    if not Path(file_path).exists():
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    
    try:
        start_time = time.time()
        result: EPUBResult = processor.process_epub(file_path)
        processing_time = time.time() - start_time
        
        logger.info(f"✅ Test processed {file_path} in {processing_time:.2f}s")
        
        return {
            "success": True,
            "file_path": file_path,
            "processing_time": round(processing_time, 3),
            "data": asdict(result)
        }
        
    except Exception as e:
        logger.error(f"❌ Test processing failed for {file_path}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Test processing failed: {str(e)}"
        )

async def cleanup_temp_file(file_path: str):
    """Clean up temporary files in background."""
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
            logger.debug(f"🧹 Cleaned up temp file: {file_path}")
    except Exception as e:
        logger.warning(f"⚠️ Failed to cleanup temp file {file_path}: {e}")

@app.on_event("startup")
async def startup_event():
    """Application startup event."""
    logger.info("🚀 Literati EPUB Processing API starting up...")
    logger.info("📚 EPUB processor initialized successfully")
    logger.info(f"🌐 CORS enabled for development and production domains")

@app.on_event("shutdown") 
async def shutdown_event():
    """Application shutdown event."""
    logger.info("🛑 Literati EPUB Processing API shutting down...")

# For local development
if __name__ == "__main__":
    import uvicorn
    
    logger.info("🔧 Starting development server...")
    uvicorn.run(
        "api_main:app",
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )