-- PostgreSQL setup script for Literati
-- Run this script to set up the local development database

-- Create database user
CREATE USER literati_user WITH PASSWORD 'literati_password';

-- Create database
CREATE DATABASE literati_dev OWNER literati_user;

-- Connect to the new database
\c literati_dev

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE literati_dev TO literati_user;
GRANT ALL ON SCHEMA public TO literati_user;

-- Show installed extensions
SELECT * FROM pg_extension WHERE extname = 'vector';